package org.erp.invera.service;

import org.erp.invera.dto.commandeClientdto.CommandeRequestDTO;
import org.erp.invera.dto.commandeClientdto.CommandeUpdateRequestDTO;
import org.erp.invera.dto.Produitdto.ProduitCommandeRequestDTO;
import org.erp.invera.dto.Produitdto.ProduitCommandeUpdateDTO;
import org.erp.invera.model.client.CommandeClient;
import org.erp.invera.model.client.Client;
import org.erp.invera.model.client.LigneCommandeClient;
import org.erp.invera.model.Produit;
import org.erp.invera.model.stock.StockMovement;
import org.erp.invera.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


/**
 * Service de gestion des commandes clients (ventes).
 *
 * Ce fichier gère tout le cycle de vie d'une commande client :
 *
 * 1. CRÉATION D'UNE COMMANDE (statut EN_ATTENTE) :
 *    - Vérifie la disponibilité des produits
 *    - Calcule les totaux (sous-total, remise, total)
 *    - Génère une référence unique (ex: CMD-20250412-143052-123)
 *
 * 2. MODIFICATION D'UNE COMMANDE (uniquement en EN_ATTENTE) :
 *    - Ajouter/supprimer/modifier des produits
 *    - Recalcule automatiquement les totaux
 *    - Met à jour l'adresse de livraison si besoin
 *
 * 3. CONFIRMATION DE COMMANDE (EN_ATTENTE → CONFIRMEE) :
 *    - Vérifie le stock une dernière fois
 *    - Déduit les quantités du stock
 *    - Crée des mouvements de stock (SORTIE)
 *    - La commande est maintenant validée pour expédition
 *
 * 4. REJET/ANNULATION :
 *    - Si commande confirmée : restitue le stock
 *    - Passe le statut à ANNULEE
 *
 * Règles métier importantes :
 * - Une commande en attente peut être modifiée
 * - La confirmation est irréversible (sauf annulation)
 * - La confirmation déclenche automatiquement la sortie de stock
 * - Une commande annulée après confirmation remet le stock
 */
@Service
public class CommandeClientService {

    private final CommandeClientRepository commandeClientRepository;
    private final ClientRepository clientRepository;
    private final ProduitRepository produitRepository;
    private final LigneCommandeClientRepository ligneCommandeClientRepository;
    private final ProduitService produitService;
    private final StockMovementRepository stockMovementRepository;

    public CommandeClientService(CommandeClientRepository commandeClientRepository,
                                 ClientRepository clientRepository,
                                 ProduitRepository produitRepository,
                                 LigneCommandeClientRepository ligneCommandeClientRepository,
                                 ProduitService produitService,
                                 StockMovementRepository stockMovementRepository) {
        this.commandeClientRepository = commandeClientRepository;
        this.clientRepository = clientRepository;
        this.produitRepository = produitRepository;
        this.ligneCommandeClientRepository = ligneCommandeClientRepository;
        this.produitService = produitService;
        this.stockMovementRepository = stockMovementRepository;
    }

    // Méthode pour vérifier la disponibilité (format Map)
    public boolean verifierDisponibilite(Map<Integer, Integer> produits) {
        if (produits == null || produits.isEmpty()) {
            return false;
        }

        for (Map.Entry<Integer, Integer> entry : produits.entrySet()) {
            Integer produitId = entry.getKey();
            Integer quantiteDemandee = entry.getValue();

            if (!produitService.verifierDisponibilite(produitId, quantiteDemandee)) {
                return false;
            }
        }
        return true;
    }

    @Transactional
    public CommandeClient createCommande(CommandeRequestDTO commandeRequest) {
        System.out.println("🛠️ Création de commande en cours...");

        // 1. Vérifier et récupérer le client
        Client client = clientRepository.findById(commandeRequest.getClientId())
                .orElseThrow(() -> new RuntimeException("Client non trouvé avec l'ID: " + commandeRequest.getClientId()));

        System.out.println("✅ Client trouvé: " + client.getNom());

        // 2. Générer la référence de commande
        String reference = genererReferenceCommande();

        // 3. Vérifier la disponibilité
        Map<Integer, Integer> produitsMap = new HashMap<>();
        for (ProduitCommandeRequestDTO produitDTO : commandeRequest.getProduits()) {
            produitsMap.put(produitDTO.getProduitId(), produitDTO.getQuantite());
        }

        boolean disponible = verifierDisponibilite(produitsMap);
        if (!disponible) {
            throw new RuntimeException("Stock insuffisant pour certains produits");
        }

        System.out.println("✅ Disponibilité vérifiée");

        // 4. Créer la commande
        CommandeClient commande = new CommandeClient();
        commande.setReferenceCommandeClient(reference);
        commande.setClient(client);
        commande.setStatut(CommandeClient.StatutCommande.EN_ATTENTE);
        commande.setDateCommande(LocalDateTime.now());

        // 5. Calculer les totaux et créer les lignes de commande
        BigDecimal sousTotal = BigDecimal.ZERO;
        List<LigneCommandeClient> lignesCommande = new ArrayList<>();

        for (ProduitCommandeRequestDTO produitDTO : commandeRequest.getProduits()) {
            // Récupérer le produit
            Produit produit = produitRepository.findById(produitDTO.getProduitId())
                    .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'ID: " + produitDTO.getProduitId()));

            // Déterminer le prix unitaire
            BigDecimal prixUnitaire = produitDTO.getPrixUnitaire() != null ?
                    produitDTO.getPrixUnitaire() : safeToBigDecimal(produit.getPrixVente());

            // Calculer le sous-total pour cette ligne
            BigDecimal quantite = BigDecimal.valueOf(produitDTO.getQuantite());
            BigDecimal sousTotalLigne = prixUnitaire.multiply(quantite);

            // Créer la ligne de commande
            LigneCommandeClient ligne = new LigneCommandeClient();
            ligne.setCommandeClient(commande);
            ligne.setProduit(produit);
            ligne.setQuantite(produitDTO.getQuantite());
            ligne.setPrixUnitaire(prixUnitaire);
            ligne.setSousTotal(sousTotalLigne);

            lignesCommande.add(ligne);
            sousTotal = sousTotal.add(sousTotalLigne);
            // Stock is moved only when the order is confirmed.

            System.out.println("📦 Produit ajouté: " + produit.getLibelle() +
                    ", Quantité: " + produitDTO.getQuantite() +
                    ", Prix unitaire: " + prixUnitaire +
                    ", Sous-total: " + sousTotalLigne);
        }

        // 6. Appliquer la remise
        BigDecimal tauxRemise = commandeRequest.getRemiseTotale() != null ?
                commandeRequest.getRemiseTotale() : BigDecimal.ZERO;

        BigDecimal montantRemise = sousTotal.multiply(
                tauxRemise.divide(BigDecimal.valueOf(100)));

        BigDecimal total = sousTotal.subtract(montantRemise);

        // 7. Définir les totaux sur la commande
        commande.setSousTotal(sousTotal);
        commande.setTauxRemise(tauxRemise);
        commande.setTotal(total);

        System.out.println("💰 Totaux calculés:");
        System.out.println("  Sous-total: " + sousTotal);
        System.out.println("  Remise: " + montantRemise + " (" + tauxRemise + "%)");
        System.out.println("  Total: " + total);

        // 8. Sauvegarder la commande d'abord
        CommandeClient savedCommande = commandeClientRepository.save(commande);

        // 9. Associer les lignes à la commande et les sauvegarder
        for (LigneCommandeClient ligne : lignesCommande) {
            ligne.setCommandeClient(savedCommande);
            ligneCommandeClientRepository.save(ligne);
        }

        // 10. Mettre à jour la commande avec ses lignes
        savedCommande.setLignesCommande(lignesCommande);

        System.out.println("✅ Commande créée avec ID: " + savedCommande.getIdCommandeClient() +
                " et référence: " + savedCommande.getReferenceCommandeClient());

        return savedCommande;
    }



    @Transactional
    public CommandeClient updateCommande(Integer commandeId, CommandeUpdateRequestDTO request) {

        // Récupérer la commande existante
        CommandeClient commande = commandeClientRepository.findByIdWithDetails(commandeId)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        // Vérifier que la commande est en attente
        if (commande.getStatut() != CommandeClient.StatutCommande.EN_ATTENTE) {
            throw new RuntimeException("Impossible de modifier une commande qui n'est pas en attente");
        }

        // Mettre à jour le statut si fourni
        if (request.getStatut() != null) {
            commande.setStatut(CommandeClient.StatutCommande.valueOf(request.getStatut()));
        }

        // Mettre à jour l'adresse du client si fournie
        if (request.getClientAdresse() != null && commande.getClient() != null) {
            Client client = commande.getClient();
            client.setAdresse(request.getClientAdresse());
            if (request.getClientTelephone() != null) {
                client.setTelephone(request.getClientTelephone());
            }
            if (request.getClientEmail() != null) {
                client.setEmail(request.getClientEmail());
            }
            clientRepository.save(client);
        }

        // Mettre à jour les lignes de commande
        updateLignesCommande(commande, request.getProduits());

        // Calculer les nouveaux totaux
        BigDecimal sousTotal = calculerSousTotal(commande.getLignesCommande());
        commande.setSousTotal(sousTotal);

        // Recalculer le total avec la remise existante
        BigDecimal montantRemise = sousTotal.multiply(
                commande.getTauxRemise().divide(BigDecimal.valueOf(100)));
        BigDecimal total = sousTotal.subtract(montantRemise);
        commande.setTotal(total);

        // Sauvegarder
        return commandeClientRepository.save(commande);
    }



    private void updateLignesCommande(CommandeClient commande, List<ProduitCommandeUpdateDTO> produitsDTO) {

        System.out.println("🔄 Mise à jour des lignes de commande:");
        System.out.println("   Produits reçus: " + produitsDTO.size());

        // Créer une liste des IDs des lignes à conserver
        List<Integer> idsAConserver = produitsDTO.stream()
                .filter(p -> p.getId() != null)
                .map(ProduitCommandeUpdateDTO::getId)
                .collect(Collectors.toList());

        // Supprimer les lignes qui ne sont plus dans la nouvelle liste
        List<LigneCommandeClient> lignesASupprimer = new ArrayList<>();
        for (LigneCommandeClient ligneExistante : commande.getLignesCommande()) {
            if (!idsAConserver.contains(ligneExistante.getIdLigneCommandeClient())) {
                lignesASupprimer.add(ligneExistante);
            }
        }

        for (LigneCommandeClient ligne : lignesASupprimer) {
            commande.removeLigneCommande(ligne);
            ligneCommandeClientRepository.delete(ligne);
        }

        // Mettre à jour ou ajouter les lignes
        for (ProduitCommandeUpdateDTO produitDTO : produitsDTO) {
            try {
                if (produitDTO.getId() != null) {
                    // Mise à jour d'une ligne existante
                    updateExistingLigne(commande, produitDTO);
                } else {
                    // Ajout d'une nouvelle ligne
                    addNewLigne(commande, produitDTO);
                }
            } catch (Exception e) {
                System.err.println("❌ Erreur lors du traitement du produit: " + e.getMessage());
                throw new RuntimeException("Erreur lors de la mise à jour des produits: " + e.getMessage());
            }
        }
    }


    private void updateExistingLigne(CommandeClient commande, ProduitCommandeUpdateDTO produitDTO) {
        LigneCommandeClient ligne = commande.getLignesCommande().stream()
                .filter(l -> l.getIdLigneCommandeClient().equals(produitDTO.getId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Ligne de commande non trouvée: " + produitDTO.getId()));

        // Récupérer l'ancienne quantité pour ajuster le stock
        int ancienneQuantite = ligne.getQuantite();
        int nouvelleQuantite = produitDTO.getQuantite().intValue();

        // Mise à jour de la quantité
        ligne.setQuantite(nouvelleQuantite);

        // Mise à jour du prix unitaire si fourni
        if (produitDTO.getPrixUnitaire() != null) {
            ligne.setPrixUnitaire(produitDTO.getPrixUnitaire());
        }

        // Recalculer le sous-total (sera fait automatiquement par @PreUpdate)
        // Mais on peut le forcer pour être sûr
        ligne.calculerSousTotal();

        // Ajuster le stock
        Produit produit = ligne.getProduit();
        int differenceStock = ancienneQuantite - nouvelleQuantite; // Positif si on retire moins, négatif si on ajoute plus

        System.out.println("✅ Ligne mise à jour: " + ligne.getIdLigneCommandeClient() +
                " | Ancienne qté: " + ancienneQuantite +
                " | Nouvelle qté: " + nouvelleQuantite +
                " | Ajustement stock: " + differenceStock);
    }

    private void addNewLigne(CommandeClient commande, ProduitCommandeUpdateDTO produitDTO) {
        // Récupérer le produit
        Produit produit = produitRepository.findById(produitDTO.getProduitId())
                .orElseThrow(() -> new RuntimeException("Produit non trouvé: " + produitDTO.getProduitId()));

        // Vérifier le stock
        int quantiteDemandee = produitDTO.getQuantite().intValue();
        if (produit.getQuantiteStock() < quantiteDemandee) {
            throw new RuntimeException("Stock insuffisant pour le produit: " + produit.getLibelle() +
                    " (Disponible: " + produit.getQuantiteStock() + ", Demandé: " + quantiteDemandee + ")");
        }

        // Créer la nouvelle ligne
        LigneCommandeClient nouvelleLigne = new LigneCommandeClient();
        nouvelleLigne.setProduit(produit);
        nouvelleLigne.setQuantite(quantiteDemandee);

        // Gestion sécurisée du prix unitaire
        BigDecimal prixUnitaire;
        if (produitDTO.getPrixUnitaire() != null) {
            prixUnitaire = produitDTO.getPrixUnitaire();
        } else {
            prixUnitaire = safeToBigDecimal(produit.getPrixVente());
        }
        nouvelleLigne.setPrixUnitaire(prixUnitaire);

        // Calculer le sous-total
        nouvelleLigne.calculerSousTotal();

        // Ajouter à la commande
        commande.addLigneCommande(nouvelleLigne);

        // Mettre à jour le stock
        int nouveauStock = produit.getQuantiteStock() - quantiteDemandee;

        System.out.println("➕ Nouvelle ligne ajoutée: " + produit.getLibelle() +
                " | Quantité: " + quantiteDemandee +
                " | Prix: " + prixUnitaire +
                " | Stock restant: " + nouveauStock);
    }

    @Transactional
    public CommandeClient confirmerCommande(Integer commandeId) {
        System.out.println("🔍 === DÉBUT confirmerCommande ===");
        System.out.println("🔍 commandeId reçu: " + commandeId);

        try {
            CommandeClient commande = commandeClientRepository.findByIdWithDetails(commandeId)
                    .orElseThrow(() -> {
                        System.err.println("❌ Commande non trouvée avec l'ID: " + commandeId);
                        return new RuntimeException("Commande non trouvée avec l'ID: " + commandeId);
                    });

            System.out.println("✅ Commande trouvée: " + commande.getIdCommandeClient());
            System.out.println("📊 Statut actuel: " + commande.getStatut());
            System.out.println("📊 Nombre de lignes: " + (commande.getLignesCommande() != null ? commande.getLignesCommande().size() : 0));

            // Vérifier le statut
            if (commande.getStatut() != CommandeClient.StatutCommande.EN_ATTENTE) {
                System.err.println("❌ Statut invalide: " + commande.getStatut() + " - Attendu: EN_ATTENTE");
                throw new RuntimeException("Seules les commandes en attente peuvent être confirmées. Statut actuel: " + commande.getStatut());
            }

            System.out.println("✅ Statut OK (EN_ATTENTE)");

            // Vérifier les lignes de commande
            if (commande.getLignesCommande() == null || commande.getLignesCommande().isEmpty()) {
                System.err.println("❌ La commande ne contient aucun produit");
                throw new RuntimeException("La commande ne contient aucun produit");
            }

            System.out.println("✅ " + commande.getLignesCommande().size() + " ligne(s) de commande trouvée(s)");

            // Vérifier le stock
            for (LigneCommandeClient ligne : commande.getLignesCommande()) {
                Produit produit = ligne.getProduit();
                if (produit == null) {
                    System.err.println("❌ Produit null pour une ligne");
                    throw new RuntimeException("Produit non trouvé pour une ligne de commande");
                }

                System.out.println("📦 Produit: " + produit.getLibelle() +
                        " | Stock: " + produit.getQuantiteStock() +
                        " | Demandé: " + ligne.getQuantite());

                if (produit.getQuantiteStock() < ligne.getQuantite()) {
                    System.err.println("❌ Stock insuffisant pour: " + produit.getLibelle());
                    throw new RuntimeException("Stock insuffisant pour le produit: " + produit.getLibelle());
                }
            }

            System.out.println("✅ Vérification stock OK");

            // Liste des mouvements
            List<StockMovement> mouvements = new ArrayList<>();

            // Traitement de chaque ligne
            for (LigneCommandeClient ligne : commande.getLignesCommande()) {
                Produit produit = ligne.getProduit();

                int stockAvant = produit.getQuantiteStock();
                int nouvelleQuantite = stockAvant - ligne.getQuantite();

                System.out.println("🔄 Mise à jour stock: " + produit.getLibelle() +
                        " " + stockAvant + " → " + nouvelleQuantite);

                // Mise à jour du stock
                produit.setQuantiteStock(nouvelleQuantite);
                produitRepository.save(produit);

                // Création du mouvement
                StockMovement mouvement = new StockMovement();
                mouvement.setProduit(produit);
                mouvement.setTypeMouvement(StockMovement.MovementType.SORTIE);
                mouvement.setQuantite(ligne.getQuantite());
                mouvement.setStockAvant(stockAvant);
                mouvement.setStockApres(nouvelleQuantite);
                mouvement.setTypeDocument("COMMANDE_CLIENT");
                mouvement.setCommentaire("Vente - Commande client " + commande.getReferenceCommandeClient());
                mouvement.setDateMouvement(LocalDateTime.now());

                mouvements.add(mouvement);
            }

            // Sauvegarde des mouvements
            if (!mouvements.isEmpty()) {
                stockMovementRepository.saveAll(mouvements);
                System.out.println("📊 " + mouvements.size() + " mouvement(s) de stock SORTIE créé(s)");
            }

            // Mise à jour du statut
            commande.setStatut(CommandeClient.StatutCommande.CONFIRMEE);

            CommandeClient saved = commandeClientRepository.save(commande);
            System.out.println("✅ Commande " + saved.getIdCommandeClient() + " confirmée avec succès");
            System.out.println("🔍 === FIN confirmerCommande ===");

            return saved;

        } catch (Exception e) {
            System.err.println("❌ EXCEPTION dans confirmerCommande: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }


    @Transactional
    public CommandeClient rejeterCommande(Integer commandeId) {
        CommandeClient commande = commandeClientRepository.findByIdWithDetails(commandeId)
                .orElseThrow(() -> new RuntimeException("Commande non trouvee"));

        if (commande.getStatut() == CommandeClient.StatutCommande.ANNULEE) {
            throw new RuntimeException("La commande est deja annulee");
        }

        if (commande.getStatut() == CommandeClient.StatutCommande.CONFIRMEE) {
            for (LigneCommandeClient ligne : commande.getLignesCommande()) {
                Integer produitId = ligne.getProduit().getIdProduit();
                Produit produit = produitRepository.findById(produitId)
                        .orElseThrow(() -> new RuntimeException("Produit non trouve: " + produitId));

                int restoredQuantity = produit.getQuantiteStock() + ligne.getQuantite();
                produitService.updateStock(produit.getIdProduit(), restoredQuantity);
            }
        }

        commande.setStatut(CommandeClient.StatutCommande.ANNULEE);
        return commandeClientRepository.save(commande);
    }

    private BigDecimal safeToBigDecimal(Double value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        try {
            return BigDecimal.valueOf(value);
        } catch (Exception e) {
            System.err.println("⚠️ Erreur conversion Double -> BigDecimal: " + e.getMessage());
            return BigDecimal.ZERO;
        }
    }



    // Méthode pour calculer le sous-total
    private BigDecimal calculerSousTotal(List<LigneCommandeClient> lignes) {
        return lignes.stream()
                .map(LigneCommandeClient::getSousTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // Méthode pour calculer le total des remises (si jamais vous ajoutez ce champ)
    private BigDecimal calculerTotalRemises(List<LigneCommandeClient> lignes) {
        // Pour l'instant, retourne ZERO car pas de champ remise dans LigneCommandeClient
        return BigDecimal.ZERO;
    }

    // Méthode pour générer une référence de commande unique
    private String genererReferenceCommande() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");
        String timestamp = LocalDateTime.now().format(formatter);
        return "CMD-" + timestamp + "-" + (int)(Math.random() * 1000);
    }

}
