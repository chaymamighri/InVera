package org.erp.invera.service;

import org.erp.invera.dto.CommandeRequestDTO;
import org.erp.invera.dto.ProduitCommandeRequestDTO;
import org.erp.invera.model.CommandeClient;
import org.erp.invera.model.Client;
import org.erp.invera.model.LigneCommandeClient;
import org.erp.invera.model.Produit;
import org.erp.invera.repository.CommandeClientRepository;
import org.erp.invera.repository.ClientRepository;
import org.erp.invera.repository.LigneCommandeClientRepository;
import org.erp.invera.repository.ProduitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CommandeClientService {

    private final CommandeClientRepository commandeClientRepository;
    private final ClientRepository clientRepository;
    private final ProduitRepository produitRepository;
    private final LigneCommandeClientRepository ligneCommandeClientRepository;
    private final ProduitService produitService;

    public CommandeClientService(CommandeClientRepository commandeClientRepository,
                                 ClientRepository clientRepository,
                                 ProduitRepository produitRepository,
                                 LigneCommandeClientRepository ligneCommandeClientRepository,
                                 ProduitService produitService) {
        this.commandeClientRepository = commandeClientRepository;
        this.clientRepository = clientRepository;
        this.produitRepository = produitRepository;
        this.ligneCommandeClientRepository = ligneCommandeClientRepository;
        this.produitService = produitService;
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
                    produitDTO.getPrixUnitaire() : BigDecimal.valueOf(produit.getPrixVente());

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

            // Mettre à jour le stock
            int nouveauStock = produit.getQuantiteStock() - produitDTO.getQuantite();
            produit.setQuantiteStock(nouveauStock);
            produitRepository.save(produit);

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

        // Note: montantRemise n'existe pas dans l'entité, on utilise tauxRemise

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

    // Méthode pour générer une référence de commande unique
    private String genererReferenceCommande() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        String timestamp = LocalDateTime.now().format(formatter);
        return "CMD-" + timestamp + "-" + (int)(Math.random() * 1000);
    }

    // Nouvelle méthode pour vérifier la disponibilité avec List<ProduitCommandeRequestDTO>
    private void verifierDisponibiliteProduits(List<ProduitCommandeRequestDTO> produits) {
        if (produits == null || produits.isEmpty()) {
            throw new RuntimeException("Aucun produit spécifié");
        }

        for (ProduitCommandeRequestDTO produitDTO : produits) {
            Integer produitId = produitDTO.getProduitId();
            Integer quantiteDemandee = produitDTO.getQuantite();

            if (!produitService.verifierDisponibilite(produitId, quantiteDemandee)) {
                throw new RuntimeException("Stock insuffisant pour le produit ID: " + produitId);
            }
        }
    }

    // Méthode pour obtenir la remise par type de client
    public Double getRemiseForClientType(String typeClient) {
        if (typeClient == null) return 0.0;

        switch (typeClient.toUpperCase()) {
            case "VIP":
                return 15.0;
            case "ENTREPRISE":
                return 10.0;
            case "PROFESSIONNEL":
                return 8.0;
            case "FIDELE":
                return 5.0;
            default:
                return 0.0;
        }
    }
}