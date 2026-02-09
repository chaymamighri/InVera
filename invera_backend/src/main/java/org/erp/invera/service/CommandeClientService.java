package org.erp.invera.service;

import org.erp.invera.dto.CommandeRequestDTO;
import org.erp.invera.dto.ProduitCommandeRequestDTO;
import org.erp.invera.model.CommandeClient;
import org.erp.invera.model.Client;
import org.erp.invera.model.Produit;
import org.erp.invera.repository.CommandeClientRepository;
import org.erp.invera.repository.ClientRepository;
import org.erp.invera.repository.ProduitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CommandeClientService {

    private final CommandeClientRepository commandeClientRepository;
    private final ClientRepository clientRepository;
    private final ProduitRepository produitRepository;
    private final ProduitService produitService;

    public CommandeClientService(CommandeClientRepository commandeClientRepository,
                                 ClientRepository clientRepository,
                                 ProduitRepository produitRepository,
                                 ProduitService produitService) {
        this.commandeClientRepository = commandeClientRepository;
        this.clientRepository = clientRepository;
        this.produitRepository = produitRepository;
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

        // 2. Convertir List<ProduitCommandeRequestDTO> en Map<Integer, Integer> pour vérification
        Map<Integer, Integer> produitsMap = new HashMap<>();
        if (commandeRequest.getProduits() != null) {
            for (ProduitCommandeRequestDTO produitDTO : commandeRequest.getProduits()) {
                produitsMap.put(produitDTO.getProduitId(), produitDTO.getQuantite());
            }
        }

        // 3. Vérifier la disponibilité
        boolean disponible = verifierDisponibilite(produitsMap);
        if (!disponible) {
            throw new RuntimeException("Stock insuffisant pour certains produits");
        }

        System.out.println("✅ Disponibilité vérifiée");

        // 4. Créer la commande
        CommandeClient commande = new CommandeClient();
        commande.setClient(client);
        commande.setStatut(CommandeClient.StatutCommande.EN_ATTENTE);
        commande.setDateCreation(LocalDateTime.now());
        commande.setNotes(commandeRequest.getNotes());

        // 5. Ajouter les produits et calculer les totaux
        BigDecimal sousTotal = BigDecimal.ZERO;

        // Convertir List<ProduitCommandeRequestDTO> en Map<Integer, Integer> pour l'entité
        Map<Integer, Integer> produitsCommande = new HashMap<>();

        for (ProduitCommandeRequestDTO produitDTO : commandeRequest.getProduits()) {
            // Vérifier que le produit existe
            Produit produit = produitRepository.findById(produitDTO.getProduitId())
                    .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'ID: " + produitDTO.getProduitId()));

            // Ajouter au Map pour l'entité
            produitsCommande.put(produitDTO.getProduitId(), produitDTO.getQuantite());

            // Calculer le sous-total
            BigDecimal prixUnitaire = produitDTO.getPrixUnitaire() != null ?
                    produitDTO.getPrixUnitaire() : BigDecimal.valueOf(produit.getPrixVente());

            BigDecimal quantite = BigDecimal.valueOf(produitDTO.getQuantite());
            BigDecimal sousTotalProduit = prixUnitaire.multiply(quantite);
            sousTotal = sousTotal.add(sousTotalProduit);

            // Mettre à jour le stock
            int nouveauStock = produit.getQuantiteStock() - produitDTO.getQuantite();
            produit.setQuantiteStock(nouveauStock);
            produitRepository.save(produit);

            System.out.println("📦 Produit ajouté: " + produit.getLibelle() +
                    ", Quantité: " + produitDTO.getQuantite() +
                    ", Prix: " + prixUnitaire);
        }

        // 6. Appliquer la remise globale
        BigDecimal tauxRemise = commandeRequest.getRemiseTotale() != null ?
                commandeRequest.getRemiseTotale() : BigDecimal.ZERO;

        BigDecimal montantRemise = sousTotal.multiply(
                tauxRemise.divide(BigDecimal.valueOf(100)));

        BigDecimal total = sousTotal.subtract(montantRemise);

        // 7. Définir les totaux
        commande.setProduits(produitsCommande);
        commande.setSousTotal(sousTotal);
        commande.setTauxRemise(tauxRemise);
        commande.setMontantRemise(montantRemise);
        commande.setTotal(total);

        System.out.println("💰 Totaux calculés:");
        System.out.println("  Sous-total: " + sousTotal);
        System.out.println("  Remise: " + montantRemise + " (" + tauxRemise + "%)");
        System.out.println("  Total: " + total);

        // 8. Sauvegarder
        CommandeClient savedCommande = commandeClientRepository.save(commande);
        System.out.println("✅ Commande créée avec ID: " + savedCommande.getId());

        return savedCommande;
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

    // Méthode pour calculer et ajouter les produits (alternative)
    private void calculerEtAjouterProduits(CommandeClient commande, List<ProduitCommandeRequestDTO> produitsDTO) {
        Map<Integer, Integer> produitsMap = new HashMap<>();
        BigDecimal sousTotal = BigDecimal.ZERO;

        for (ProduitCommandeRequestDTO produitDTO : produitsDTO) {
            // Ajouter au Map
            produitsMap.put(produitDTO.getProduitId(), produitDTO.getQuantite());

            // Calculer le sous-total
            BigDecimal prixUnitaire = produitDTO.getPrixUnitaire() != null ?
                    produitDTO.getPrixUnitaire() : BigDecimal.ZERO;

            BigDecimal sousTotalProduit = prixUnitaire.multiply(
                    BigDecimal.valueOf(produitDTO.getQuantite()));
            sousTotal = sousTotal.add(sousTotalProduit);

            // Mettre à jour le stock
            Produit produit = produitRepository.findById(produitDTO.getProduitId())
                    .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

            int nouveauStock = produit.getQuantiteStock() - produitDTO.getQuantite();
            produit.setQuantiteStock(nouveauStock);
            produitRepository.save(produit);
        }

        // Appliquer les remises
        BigDecimal tauxRemise = commande.getTauxRemise() != null ?
                commande.getTauxRemise() : BigDecimal.ZERO;

        BigDecimal montantRemise = sousTotal.multiply(
                tauxRemise.divide(BigDecimal.valueOf(100)));

        BigDecimal total = sousTotal.subtract(montantRemise);

        // Définir les valeurs
        commande.setProduits(produitsMap);
        commande.setSousTotal(sousTotal);
        commande.setMontantRemise(montantRemise);
        commande.setTotal(total);
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