package org.erp.invera.service.erp;

import lombok.RequiredArgsConstructor;

import org.erp.invera.dto.erp.commandeFornisseurdto.CommandeFournisseurDTO;
import org.erp.invera.dto.erp.commandeFornisseurdto.LigneCommandeDTO;
import org.erp.invera.dto.erp.commandeFornisseurdto.ReceptionDTO;
import org.erp.invera.dto.erp.fournisseurdto.FournisseurDTO;

import org.erp.invera.model.erp.Fournisseurs.CommandeFournisseur;
import org.erp.invera.model.erp.Fournisseurs.Fournisseur;
import org.erp.invera.model.erp.Fournisseurs.LigneCommandeFournisseur;
import org.erp.invera.model.erp.Produit;
import org.erp.invera.model.erp.stock.StockMovement;
import org.erp.invera.model.erp.Notification;
import org.erp.invera.model.erp.Role;
import org.erp.invera.model.erp.User;

import org.erp.invera.repository.erp.*;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;


/**
 * Service de gestion des commandes fournisseurs (achats).
 *
 * Ce fichier gère tout le cycle de vie d'une commande d'achat :
 *
 * 1. CRÉATION (BROUILLON) :
 *    - Génère un numéro unique (ex: BC-202504-0001)
 *    - Calcule les totaux (HT, TVA, TTC)
 *    - Statut initial : BROUILLON
 *
 * 2. MODIFICATION (uniquement en brouillon) :
 *    - Modifier produits, quantités, prix
 *    - Recalcule automatiquement les totaux
 *
 * 3. VALIDATION (BROUILLON → VALIDEE)
 *
 * 4. ENVOI AU FOURNISSEUR (VALIDEE → ENVOYEE)
 *
 * 5. RÉCEPTION DE LA MARCHANDISE (ENVOYEE → RECUE) :
 *    - Enregistre le bon de livraison
 *    - Crée des mouvements de stock (entrées)
 *    - Met à jour les quantités des produits
 *    - Peut réactiver des produits inactifs
 *
 * 6. FACTURATION (RECUE → FACTUREE)
 *
 * 7. ANNULATION (possible avant réception/facturation)
 *
 * 8. ARCHIVAGE (soft delete)
 *
 * Règles métier importantes :
 * - Une commande ne peut être modifiée qu'en BROUILLON
 * - La réception met automatiquement à jour le stock
 * - Les totaux sont calculés automatiquement
 * - Une commande facturée ne peut plus être annulée
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CommandeFournisseurService {

    private final CommandeFournisseurRepository commandeRepository;
    private final FournisseurRepository fournisseurRepository;
    private final ProduitRepository produitRepository;
    private final LigneCommandeFournisseurRepository ligneRepository;
    private final StockMovementRepository stockMovementRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    private final BonCommandePdfService bonCommandePdfService;
    private final EmailService emailService;


    private static final BigDecimal TVA_PAR_DEFAUT = new BigDecimal("20");

    public List<CommandeFournisseurDTO> getAll() {
        return commandeRepository.findByActifTrue()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public CommandeFournisseurDTO creerCommande(CommandeFournisseurDTO dto) {
        Fournisseur fournisseur = fournisseurRepository.findById(dto.getFournisseur().getIdFournisseur())
                .orElseThrow(() -> new RuntimeException("Fournisseur non trouvé"));

        CommandeFournisseur commande = new CommandeFournisseur();
        commande.setNumeroCommande(genererNumeroCommande());
        commande.setDateCommande(LocalDateTime.now());
        commande.setDateLivraisonPrevue(dto.getDateLivraisonPrevue());
        commande.setAdresseLivraison(dto.getAdresseLivraison());
        commande.setFournisseur(fournisseur);
        commande.setStatut(CommandeFournisseur.StatutCommande.BROUILLON);
        commande.setActif(true);

        List<LigneCommandeFournisseur> lignes = dto.getLignesCommande()
                .stream()
                .map(ligneDTO -> {
                    if (ligneDTO.getProduitId() == null) {
                        throw new RuntimeException("L'ID du produit est obligatoire");
                    }

                    Produit produit = produitRepository.findById(ligneDTO.getProduitId())
                            .orElseThrow(() -> new RuntimeException(
                                    "Produit non trouvé avec l'ID: " + ligneDTO.getProduitId()));

                    if (ligneDTO.getQuantite() <= 0) {
                        throw new RuntimeException("La quantité doit être supérieure à 0");
                    }
                    if (ligneDTO.getPrixUnitaire() == null || ligneDTO.getPrixUnitaire().compareTo(BigDecimal.ZERO) <= 0) {
                        throw new RuntimeException("Le prix unitaire doit être supérieur à 0");
                    }

                    LigneCommandeFournisseur ligne = new LigneCommandeFournisseur();
                    ligne.setCommandeFournisseur(commande);
                    ligne.setProduit(produit);
                    ligne.setQuantite(ligneDTO.getQuantite());
                    ligne.setPrixUnitaire(ligneDTO.getPrixUnitaire());

                    // Récupérer le taux TVA (priorité: DTO → Produit → 19%)
                    BigDecimal tauxTVA;
                    if (ligneDTO.getTauxTVA() != null) {
                        tauxTVA = ligneDTO.getTauxTVA();
                    } else if (produit.getCategorie() != null && produit.getCategorie().getTauxTVA() != null) {
                        tauxTVA = produit.getCategorie().getTauxTVA();  // De la catégorie
                    } else {
                        tauxTVA = new BigDecimal("19");  // Par défaut
                    }

                    ligne.setTauxTVA(tauxTVA);  //Stocker le taux individuel

                    // Calcul avec le taux individuel
                    BigDecimal sousTotalHT = ligneDTO.getPrixUnitaire()
                            .multiply(BigDecimal.valueOf(ligneDTO.getQuantite()))
                            .setScale(3, RoundingMode.HALF_UP);

                    BigDecimal montantTVA = sousTotalHT
                            .multiply(tauxTVA)  // ← Taux individuel, pas global !
                            .divide(new BigDecimal("100"), 3, RoundingMode.HALF_UP);

                    BigDecimal sousTotalTTC = sousTotalHT.add(montantTVA)
                            .setScale(3, RoundingMode.HALF_UP);

                    ligne.setSousTotalHT(sousTotalHT);
                    ligne.setMontantTVA(montantTVA);
                    ligne.setSousTotalTTC(sousTotalTTC);

                    if (ligneDTO.getNotes() != null && !ligneDTO.getNotes().isEmpty()) {
                        ligne.setNotes(ligneDTO.getNotes());
                    }

                    return ligne;
                }).toList();

        commande.setLignesCommande(lignes);

        //  Calcul des totaux (inchangé)
        BigDecimal totalHT = lignes.stream()
                .map(LigneCommandeFournisseur::getSousTotalHT)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);

        BigDecimal totalTVA = lignes.stream()
                .map(LigneCommandeFournisseur::getMontantTVA)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);

        BigDecimal totalTTC = lignes.stream()
                .map(LigneCommandeFournisseur::getSousTotalTTC)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);

        commande.setTotalHT(totalHT);
        commande.setTotalTVA(totalTVA);
        commande.setTotalTTC(totalTTC);

        CommandeFournisseur saved = commandeRepository.save(commande);
        notifierAdminNouvelleDemande(saved);
        return convertToDTO(saved);
    }

    public CommandeFournisseurDTO getCommandeById(Integer id) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id: " + id));
        return convertToDTO(commande);
    }

    public CommandeFournisseurDTO modifierCommande(Integer id, CommandeFournisseurDTO dto) {

        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id: " + id));

        // Seules les commandes REJETEE peuvent être modifiées
        if (commande.getStatut() != CommandeFournisseur.StatutCommande.REJETEE) {
            throw new RuntimeException("Seules les commandes rejetées peuvent être modifiées. Statut actuel: " + commande.getStatut());
        }

        // ✅ 1. MODIFICATION DU FOURNISSEUR (AJOUT)
        if (dto.getFournisseur() != null && dto.getFournisseur().getIdFournisseur() != null) {
            Fournisseur nouveauFournisseur = fournisseurRepository
                    .findById(dto.getFournisseur().getIdFournisseur())
                    .orElseThrow(() -> new RuntimeException("Fournisseur non trouvé avec l'id: " + dto.getFournisseur().getIdFournisseur()));
            commande.setFournisseur(nouveauFournisseur);
        }

        // ✅ 2. MODIFICATION DES AUTRES CHAMPS
        commande.setDateLivraisonPrevue(dto.getDateLivraisonPrevue());
        commande.setAdresseLivraison(dto.getAdresseLivraison());

        // ✅ 3. MODIFICATION DES LIGNES (déjà existant)
        Map<Integer, LigneCommandeFournisseur> lignesExistantes = commande.getLignesCommande()
                .stream()
                .collect(Collectors.toMap(LigneCommandeFournisseur::getIdLigneCommandeFournisseur, l -> l));

        List<LigneCommandeFournisseur> nouvellesLignes = new ArrayList<>();

        for (LigneCommandeDTO ligneDTO : dto.getLignesCommande()) {

            LigneCommandeFournisseur ligne;

            if (ligneDTO.getIdLigneCommandeFournisseur() != null &&
                    lignesExistantes.containsKey(ligneDTO.getIdLigneCommandeFournisseur())) {
                ligne = lignesExistantes.get(ligneDTO.getIdLigneCommandeFournisseur());
            } else {
                ligne = new LigneCommandeFournisseur();
                ligne.setCommandeFournisseur(commande);
            }

            Produit produit = produitRepository.findById(ligneDTO.getProduitId())
                    .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

            ligne.setProduit(produit);
            ligne.setQuantite(ligneDTO.getQuantite());
            ligne.setPrixUnitaire(ligneDTO.getPrixUnitaire());

            BigDecimal tauxTVA;
            if (ligneDTO.getTauxTVA() != null) {
                tauxTVA = ligneDTO.getTauxTVA();
            } else if (produit.getCategorie() != null && produit.getCategorie().getTauxTVA() != null) {
                tauxTVA = produit.getCategorie().getTauxTVA();
            } else {
                tauxTVA = new BigDecimal("19");
            }

            ligne.setTauxTVA(tauxTVA);
            ligne.calculerTotaux(tauxTVA);

            nouvellesLignes.add(ligne);
        }

        commande.getLignesCommande().clear();
        commande.getLignesCommande().addAll(nouvellesLignes);

        // ✅ 4. RECALCUL DES TOTAUX
        BigDecimal totalHT = nouvellesLignes.stream()
                .map(LigneCommandeFournisseur::getSousTotalHT)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);

        BigDecimal totalTVA = nouvellesLignes.stream()
                .map(LigneCommandeFournisseur::getMontantTVA)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);

        BigDecimal totalTTC = nouvellesLignes.stream()
                .map(LigneCommandeFournisseur::getSousTotalTTC)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);

        commande.setTotalHT(totalHT);
        commande.setTotalTVA(totalTVA);
        commande.setTotalTTC(totalTTC);

        CommandeFournisseur saved = commandeRepository.save(commande);
        return convertToDTO(saved);
    }


    public CommandeFournisseurDTO validerCommande(Integer id) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        if (commande.getStatut() != CommandeFournisseur.StatutCommande.BROUILLON) {
            throw new RuntimeException("Seules les commandes en brouillon peuvent être validées");
        }

        commande.setStatut(CommandeFournisseur.StatutCommande.VALIDEE);
        return convertToDTO(commandeRepository.save(commande));
    }

    public CommandeFournisseurDTO envoyerCommande(Integer id) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        if (commande.getStatut() != CommandeFournisseur.StatutCommande.VALIDEE) {
            throw new RuntimeException("Seules les commandes validées peuvent être envoyées");
        }

        commande.setStatut(CommandeFournisseur.StatutCommande.ENVOYEE);
        CommandeFournisseur savedCommande = commandeRepository.save(commande);

        final CommandeFournisseur commandeFinale = savedCommande;
        new Thread(() -> {
            try {
                System.out.println("📧 [1] Début thread pour: " + commandeFinale.getNumeroCommande());
                System.out.println("📧 [2] Email fournisseur: " + commandeFinale.getFournisseur().getEmail());
                System.out.println("📧 [3] Nom fournisseur: " + commandeFinale.getFournisseur().getNomFournisseur());

                if (bonCommandePdfService == null) {
                    System.err.println("❌ bonCommandePdfService est NULL !");
                    return;
                }
                System.out.println("📧 [4] bonCommandePdfService OK");

                byte[] pdfContent = bonCommandePdfService.genererBonCommandePdf(commandeFinale);
                System.out.println("📧 [5] PDF généré, taille: " + pdfContent.length + " bytes");

                if (emailService == null) {
                    System.err.println("❌ emailService est NULL !");
                    return;
                }
                System.out.println("📧 [6] emailService OK, appel en cours...");

                emailService.envoyerBonCommande(
                        commandeFinale.getFournisseur().getEmail(),
                        commandeFinale.getFournisseur().getNomFournisseur(),
                        commandeFinale.getNumeroCommande(),
                        pdfContent
                );

                System.out.println("📧 [7] Retour de emailService.envoyerBonCommande");
                System.out.println("✅ Email envoyé pour commande: " + commandeFinale.getNumeroCommande());

            } catch (Exception e) {
                System.err.println("❌ Erreur détaillée: " + e.getMessage());
                e.printStackTrace();
            }
        }).start();

        System.out.println("⚡ Réponse immédiate pour commande: " + savedCommande.getNumeroCommande());
        return convertToDTO(savedCommande);
    }

    public CommandeFournisseurDTO recevoirCommande(Integer id, ReceptionDTO receptionData) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        if (commande.getStatut() != CommandeFournisseur.StatutCommande.ENVOYEE) {
            throw new RuntimeException("Seules les commandes envoyées peuvent être reçues");
        }

        // Mettre à jour les informations de réception
        commande.setNumeroBonLivraison(receptionData.getNumeroBL());
        commande.setNotesReception(receptionData.getNotes());
        commande.setDateLivraisonReelle(LocalDateTime.now());
        commande.setStatut(CommandeFournisseur.StatutCommande.RECUE);

        // ✅ Récupérer les maps en sécurité
        Map<Integer, Integer> quantitesRecues = receptionData.getQuantitesRecues() != null
                ? receptionData.getQuantitesRecues() : new HashMap<>();
        Map<Integer, Boolean> produitsAReactiver = receptionData.getProduitsAReactiver() != null
                ? receptionData.getProduitsAReactiver() : new HashMap<>();

        // ✅ Liste pour stocker les mouvements créés
        List<StockMovement> mouvements = new ArrayList<>();
        int totalProduitsReactives = 0;

        for (LigneCommandeFournisseur ligne : commande.getLignesCommande()) {
            Integer ligneId = ligne.getIdLigneCommandeFournisseur();

            // Récupérer la quantité reçue pour cette ligne
            Integer quantiteRecue = quantitesRecues.get(ligneId);

            // Si la ligne n'est pas dans la map ou quantité = 0, on passe
            if (quantiteRecue == null || quantiteRecue <= 0) {
                System.out.println("📦 Ligne " + ligneId + ": quantité reçue = 0 ou non spécifiée");
                continue;
            }

            // ✅ Vérifier que la quantité reçue ne dépasse pas la quantité commandée
            Integer quantiteCommandee = ligne.getQuantite();
            if (quantiteCommandee != null && quantiteRecue > quantiteCommandee) {
                System.err.println("⚠️ Ligne " + ligneId + ": quantité reçue (" + quantiteRecue +
                        ") supérieure à la quantité commandée (" + quantiteCommandee + ")");
                throw new RuntimeException("Quantité reçue supérieure à la quantité commandée");
            }

            // Enregistrer la quantité reçue
            ligne.setQuantiteRecue(quantiteRecue);

            Produit produit = ligne.getProduit();

            if (produit != null) {
                int stockAvant = produit.getQuantiteStock() != null ? produit.getQuantiteStock() : 0;
                int nouvelleQuantite = stockAvant + quantiteRecue;
                produit.setQuantiteStock(nouvelleQuantite);

                // ✅ CRÉATION DU MOUVEMENT DE STOCK - ENTRÉE
                StockMovement mouvement = new StockMovement();
                mouvement.setProduit(produit);
                mouvement.setTypeMouvement(StockMovement.MovementType.ENTREE);
                mouvement.setQuantite(quantiteRecue);
                mouvement.setStockAvant(stockAvant);
                mouvement.setStockApres(nouvelleQuantite);
                mouvement.setTypeDocument("COMMANDE_FOURNISSEUR");
                mouvement.setCommentaire("Réception commande " + commande.getNumeroCommande() +
                        " - BL: " + receptionData.getNumeroBL());
                mouvement.setDateMouvement(LocalDateTime.now());
                mouvements.add(mouvement);

                // ✅ Récupérer si le produit doit être réactivé (avec gestion null)
                Boolean doitReactiver = produitsAReactiver.get(ligneId);
                boolean reactiver = doitReactiver != null && doitReactiver;

                // ✅ Vérifier si le produit est inactif et doit être réactivé
                boolean estInactif = produit.getActive() == null || !produit.getActive();

                if (estInactif && reactiver && quantiteRecue > 0) {
                    produit.setActive(true);
                    totalProduitsReactives++;
                    System.out.println("✅ Produit réactivé: " + produit.getLibelle()
                            + " (ID: " + produit.getIdProduit()
                            + ") suite à réception commande " + commande.getNumeroCommande());
                } else if (estInactif && quantiteRecue > 0 && !reactiver) {
                    System.out.println("ℹ️ Produit inactif conservé: " + produit.getLibelle()
                            + " (non réactivé)");
                }

                produitRepository.save(produit);
            } else {
                System.err.println("❌ Ligne " + ligne.getIdLigneCommandeFournisseur()
                        + " sans produit associé");
            }

            ligneRepository.save(ligne);
        }

        // ✅ SAUVEGARDER TOUS LES MOUVEMENTS EN BATCH
        if (!mouvements.isEmpty()) {
            stockMovementRepository.saveAll(mouvements);
            System.out.println("📊 " + mouvements.size() + " mouvement(s) de stock créé(s)");
        }

        CommandeFournisseur savedCommande = commandeRepository.save(commande);

        // ✅ Log récapitulatif détaillé
        System.out.println("📦 Commande " + commande.getNumeroCommande() + " réceptionnée");
        System.out.println("   - " + mouvements.size() + " produit(s) reçu(s)");
        System.out.println("   - " + totalProduitsReactives + " produit(s) réactivé(s)");
        System.out.println("   - BL: " + receptionData.getNumeroBL());

        return convertToDTO(savedCommande);
    }


// ==================== MÉTHODES POUR LE REJET ====================

    /**
     * Rejeter une commande (BROUILLON → REJETEE)
     * Écrase l'ancien motif s'il existe
     *
     * @param id ID de la commande
     * @param motifRejet Motif du rejet (obligatoire)
     * @return CommandeFournisseurDTO mis à jour
     */
    @Transactional
    public CommandeFournisseurDTO rejeterCommande(Integer id, String motifRejet) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id: " + id));

        // Vérifier que la commande est en BROUILLON (en attente)
        if (commande.getStatut() != CommandeFournisseur.StatutCommande.BROUILLON) {
            throw new RuntimeException("Seules les commandes en attente (BROUILLON) peuvent être rejetées. Statut actuel: " + commande.getStatut());
        }

        // Vérifier que le motif n'est pas vide
        if (motifRejet == null || motifRejet.trim().isEmpty()) {
            throw new RuntimeException("Le motif de rejet est obligatoire");
        }

        // Mettre à jour la commande (ÉCRASE l'ancien motif)
        commande.setStatut(CommandeFournisseur.StatutCommande.REJETEE);
        commande.setMotifRejet(motifRejet);
        commande.setDateRejet(LocalDateTime.now());

        CommandeFournisseur saved = commandeRepository.save(commande);
        System.out.println("❌ Commande " + commande.getNumeroCommande() + " rejetée. Motif: " + motifRejet);

        return convertToDTO(saved);
    }

    /**
     * Renvoyer une commande rejetée en attente (REJETEE → BROUILLON)
     * Efface le motif de rejet
     *
     * @param id ID de la commande
     * @return CommandeFournisseurDTO mis à jour
     */
    @Transactional
    public CommandeFournisseurDTO renvoyerAttente(Integer id) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id: " + id));

        // Vérifier que la commande est en REJETEE
        if (commande.getStatut() != CommandeFournisseur.StatutCommande.REJETEE) {
            throw new RuntimeException("Seules les commandes rejetées peuvent être renvoyées en attente. Statut actuel: " + commande.getStatut());
        }

        // Retour en BROUILLON et EFFACE le motif
        commande.setStatut(CommandeFournisseur.StatutCommande.BROUILLON);
        commande.setMotifRejet(null);  // ← Efface le motif comme demandé
        commande.setDateRejet(null);

        CommandeFournisseur saved = commandeRepository.save(commande);
        notifierAdminDemandeRenvoyee(saved);
        System.out.println("🔄 Commande " + commande.getNumeroCommande() + " renvoyée en attente après correction");

        return convertToDTO(saved);
    }

    public void supprimerCommande(Integer id) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        // ✅ Correction : ajout de la parenthèse fermante manquante et gestion du REJETEE
        if (commande.getStatut() != CommandeFournisseur.StatutCommande.BROUILLON
                && commande.getStatut() != CommandeFournisseur.StatutCommande.REJETEE) {
            throw new RuntimeException("Seules les commandes en brouillon ou rejetées peuvent être supprimées");
        }

        commandeRepository.delete(commande);
    }

    // Récupérer les commandes archivées (actif = false)
    public List<CommandeFournisseurDTO> getArchivedCommandes() {
        // Mettre à jour le statut des commandes de plus de 5 ans avant de les retourner
        mettreAJourCommandesAnciennes();

        return commandeRepository.findByActifFalse()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Méthode pour mettre à jour le statut des commandes de plus de 5 ans
    @Transactional
    public void mettreAJourCommandesAnciennes() {
        LocalDateTime dateLimite = LocalDateTime.now().minusYears(5);

        // Récupérer les commandes actives de plus de 5 ans
        List<CommandeFournisseur> commandesASupprimer = commandeRepository.findByActifTrue()
                .stream()
                .filter(commande -> commande.getDateCommande().isBefore(dateLimite))
                .collect(Collectors.toList());

        for (CommandeFournisseur commande : commandesASupprimer) {
            commande.setActif(false);
            commandeRepository.save(commande);
        }

        if (!commandesASupprimer.isEmpty()) {
            System.out.println(commandesASupprimer.size() + " commande(s) de plus de 5 ans ont été archivées");
        }
    }


    public CommandeFournisseurDTO getCommandeByNumero(String numero) {
        CommandeFournisseur commande = commandeRepository.findByNumeroCommande(numero)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec le numéro: " + numero));
        return convertToDTO(commande);
    }

    public List<CommandeFournisseurDTO> getCommandesByPeriode(LocalDateTime debut, LocalDateTime fin) {
        return commandeRepository.findByDateCommandeBetweenOrderByDateCommandeDesc(debut, fin)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private void notifierAdminNouvelleDemande(CommandeFournisseur commande) {
        creerNotificationAdminPourCommande(commande, "PROCUREMENT_REQUEST_CREATED");
    }

    private void notifierAdminDemandeRenvoyee(CommandeFournisseur commande) {
        creerNotificationAdminPourCommande(commande, "PROCUREMENT_REQUEST_RESUBMITTED");
    }

    private void creerNotificationAdminPourCommande(CommandeFournisseur commande, String notificationType) {
        User currentUser = getCurrentUser();
        if (currentUser == null || currentUser.getRole() != Role.RESPONSABLE_ACHAT) {
            return;
        }

        String reference = commande.getNumeroCommande() != null
                ? commande.getNumeroCommande()
                : "CMD-" + commande.getIdCommandeFournisseur();
        String fournisseurNom = commande.getFournisseur() != null && commande.getFournisseur().getNomFournisseur() != null
                ? commande.getFournisseur().getNomFournisseur()
                : "fournisseur non specifie";
        String userFullName = buildUserFullName(currentUser);

        String message = "PROCUREMENT_REQUEST_RESUBMITTED".equals(notificationType)
                ? String.format(
                        "%s a renvoye la demande d'approvisionnement %s pour %s. Elle attend de nouveau votre validation.",
                        userFullName, reference, fournisseurNom)
                : String.format(
                        "%s a cree la demande d'approvisionnement %s pour %s. Elle attend votre validation.",
                        userFullName, reference, fournisseurNom);

        notificationRepository.save(new Notification(
                notificationType,
                message,
                currentUser.getEmail(),
                userFullName,
                "ADMIN",
                "COMMANDE_FOURNISSEUR",
                Long.valueOf(commande.getIdCommandeFournisseur()),
                reference
        ));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return null;
        }

        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    private String buildUserFullName(User user) {
        String fullName = Stream.of(user.getPrenom(), user.getNom())
                .filter(value -> value != null && !value.isBlank())
                .collect(Collectors.joining(" "))
                .trim();

        return fullName.isBlank() ? user.getEmail() : fullName;
    }

    private String genererNumeroCommande() {
        LocalDateTime now = LocalDateTime.now();
        String anneeMois = now.format(DateTimeFormatter.ofPattern("yyyyMM"));
        Long count = commandeRepository.countByNumeroCommandeStartingWith("BC-" + anneeMois);
        int nextNum = count != null ? count.intValue() + 1 : 1;
        return String.format("BC-%s-%04d", anneeMois, nextNum);
    }

    private CommandeFournisseurDTO convertToDTO(CommandeFournisseur commande) {
        CommandeFournisseurDTO dto = new CommandeFournisseurDTO();

        dto.setIdCommandeFournisseur(commande.getIdCommandeFournisseur());
        dto.setNumeroCommande(commande.getNumeroCommande());
        dto.setDateCommande(commande.getDateCommande());
        dto.setDateLivraisonPrevue(commande.getDateLivraisonPrevue());
        dto.setDateLivraisonReelle(commande.getDateLivraisonReelle());
        dto.setAdresseLivraison(commande.getAdresseLivraison());
        dto.setStatut(commande.getStatut());
        dto.setTotalHT(commande.getTotalHT());
        dto.setTotalTVA(commande.getTotalTVA());
        dto.setTotalTTC(commande.getTotalTTC());
        dto.setTauxTVA(commande.getTauxTVA());
        dto.setActif(commande.getActif());
        dto.setMotifRejet(commande.getMotifRejet());
        dto.setDateRejet(commande.getDateRejet());

        if (commande.getFournisseur() != null) {
            dto.setFournisseur(new FournisseurDTO(commande.getFournisseur()));
        }

        if (commande.getLignesCommande() != null) {
            dto.setLignesCommande(commande.getLignesCommande()
                    .stream()
                    .map(this::convertLigneToDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    private LigneCommandeDTO convertLigneToDTO(LigneCommandeFournisseur ligne) {
        LigneCommandeDTO dto = new LigneCommandeDTO();

        dto.setIdLigneCommandeFournisseur(ligne.getIdLigneCommandeFournisseur());
        dto.setProduitId(ligne.getProduit().getIdProduit());
        dto.setProduitLibelle(ligne.getProduit().getLibelle());
        dto.setQuantite(ligne.getQuantite());
        dto.setPrixUnitaire(ligne.getPrixUnitaire());
        dto.setSousTotalHT(ligne.getSousTotalHT());
        dto.setMontantTVA(ligne.getMontantTVA());
        dto.setSousTotalTTC(ligne.getSousTotalTTC());
        dto.setQuantiteRecue(ligne.getQuantiteRecue());
        dto.setNotes(ligne.getNotes());

        // ✅ AJOUTER LA CATÉGORIE
        if (ligne.getProduit().getCategorie() != null) {
            dto.setCategorie(ligne.getProduit().getCategorie().getNomCategorie());
        }

        // ✅ AJOUTER LE STATUT D'INACTIVITÉ
        // Récupérer le produit et vérifier s'il est actif
        Produit produit = ligne.getProduit();
        if (produit != null) {
            // Selon comment vous stockez l'état du produit
            // Option 1: si vous avez un champ 'active'
            boolean estActif = produit.getActive() != null ? produit.getActive() : true;
            dto.setEstInactif(!estActif);

            // Option 2: si vous avez un champ 'estActif'
            // dto.setEstInactif(!produit.getEstActif());
        } else {
            dto.setEstInactif(false);
        }

        return dto;
    }
}
