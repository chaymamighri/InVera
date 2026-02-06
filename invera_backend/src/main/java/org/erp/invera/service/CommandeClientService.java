package org.erp.invera.service;

import org.erp.invera.dto.CommandeRequestDTO;
import org.erp.invera.model.*;
import org.erp.invera.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@Transactional
public class CommandeClientService {

    private final CommandeClientRepository commandeClientRepository;
    private final ClientRepository clientRepository;
    private final ProduitRepository produitRepository;

    public CommandeClientService(
            CommandeClientRepository commandeClientRepository,
            ClientRepository clientRepository,
            ProduitRepository produitRepository) {
        this.commandeClientRepository = commandeClientRepository;
        this.clientRepository = clientRepository;
        this.produitRepository = produitRepository;
    }

    // ====================
    // Création de Commande
    // ====================

    /**
     * Créer une nouvelle commande
     */
    public CommandeClient createCommande(CommandeRequestDTO commandeRequest) {
        // 1. Vérifier et récupérer le client
        Client client = clientRepository.findById(commandeRequest.getClientId())
                .orElseThrow(() -> new RuntimeException("Client non trouvé avec l'ID: " + commandeRequest.getClientId()));

        // 2. Vérifier la disponibilité des produits
        verifierDisponibiliteProduits(commandeRequest.getProduits());

        // 3. Créer la commande
        CommandeClient commande = new CommandeClient();
        commande.setClient(client);
        commande.setStatut(CommandeClient.StatutCommande.EN_ATTENTE);
        commande.setNotes(commandeRequest.getNotes());

        // 4. Ajouter les produits et calculer les totaux
        calculerEtAjouterProduits(commande, commandeRequest.getProduits());

        // 5. Sauvegarder la commande
        return commandeClientRepository.save(commande);
    }

    /**
     * Vérifier la disponibilité des produits
     */
    private void verifierDisponibiliteProduits(Map<Integer, Integer> produits) {
        for (Map.Entry<Integer, Integer> entry : produits.entrySet()) {
            Integer produitId = entry.getKey();
            Integer quantite = entry.getValue();

            Produit produit = produitRepository.findById(produitId)
                    .orElseThrow(() -> new RuntimeException("Produit non trouvé: " + produitId));

            if (produit.getQuantiteStock() < quantite) {
                throw new RuntimeException("Stock insuffisant pour: " + produit.getLibelle() +
                        ". Disponible: " + produit.getQuantiteStock() + ", Demandé: " + quantite);
            }
        }
    }

    /**
     * Calculer et ajouter les produits à la commande
     */
    private void calculerEtAjouterProduits(CommandeClient commande, Map<Integer, Integer> produits) {
        BigDecimal sousTotal = BigDecimal.ZERO;

        for (Map.Entry<Integer, Integer> entry : produits.entrySet()) {
            Integer produitId = entry.getKey();
            Integer quantite = entry.getValue();

            // Ajouter au Map de produits
            commande.getProduits().put(produitId, quantite);

            // Calculer le prix du produit avec remise
            Produit produit = produitRepository.findById(produitId)
                    .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

            BigDecimal prixProduit = BigDecimal.valueOf(produit.getPrixVente());
            BigDecimal tauxRemiseProduit = calculerRemisePourProduit(
                    produit, commande.getClient().getType(), quantite);

            BigDecimal sousTotalProduit = prixProduit.multiply(BigDecimal.valueOf(quantite));
            BigDecimal remiseProduit = sousTotalProduit.multiply(tauxRemiseProduit)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            sousTotal = sousTotal.add(sousTotalProduit.subtract(remiseProduit));

            // Diminuer le stock
            produit.setQuantiteStock(produit.getQuantiteStock() - quantite);
            produitRepository.save(produit);
        }

        // Calculer les totaux finaux avec remise globale
        commande.setSousTotal(sousTotal);

        BigDecimal tauxRemiseGlobal = calculerRemiseGlobale(
                commande.getClient().getType(), sousTotal);
        commande.setTauxRemise(tauxRemiseGlobal);

        BigDecimal montantRemiseGlobal = sousTotal.multiply(tauxRemiseGlobal)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        commande.setMontantRemise(montantRemiseGlobal);

        BigDecimal total = sousTotal.subtract(montantRemiseGlobal);
        commande.setTotal(total);
    }

    /**
     * Calculer la remise pour un produit spécifique
     */
    private BigDecimal calculerRemisePourProduit(Produit produit, Client.TypeClient typeClient, Integer quantite) {
        BigDecimal meilleureRemise = BigDecimal.ZERO;

        // Remise par type de client
        switch (typeClient) {
            case VIP:
                if (produit.getRemiseVIP() != null) {
                    meilleureRemise = BigDecimal.valueOf(produit.getRemiseVIP());
                }
                break;
            case PROFESSIONNEL:
            case ENTREPRISE:
                if (produit.getRemiseProfessionnelle() != null) {
                    meilleureRemise = BigDecimal.valueOf(produit.getRemiseProfessionnelle());
                }
                break;
            case FIDELE:
                if (produit.getRemiseParticulier() != null) {
                    meilleureRemise = BigDecimal.valueOf(produit.getRemiseParticulier());
                }
                break;
            default:
                if (produit.getRemiseParticulier() != null) {
                    meilleureRemise = BigDecimal.valueOf(produit.getRemiseParticulier());
                }
        }

        // Remise temporaire
        if (produit.getRemiseTemporaire() != null) {
            BigDecimal remiseTemp = BigDecimal.valueOf(produit.getRemiseTemporaire());
            if (remiseTemp.compareTo(meilleureRemise) > 0) {
                meilleureRemise = remiseTemp;
            }
        }

        // Remise sur volume
        if (produit.getRemiseVolumeMin() != null && produit.getTauxRemiseVolume() != null
                && quantite >= produit.getRemiseVolumeMin()) {
            BigDecimal remiseVolume = BigDecimal.valueOf(produit.getTauxRemiseVolume());
            if (remiseVolume.compareTo(meilleureRemise) > 0) {
                meilleureRemise = remiseVolume;
            }
        }

        return meilleureRemise;
    }

    /**
     * Calculer la remise globale
     */
    private BigDecimal calculerRemiseGlobale(Client.TypeClient typeClient, BigDecimal montant) {
        BigDecimal tauxRemise = BigDecimal.ZERO;

        switch (typeClient) {
            case VIP:
                tauxRemise = new BigDecimal("10.00");
                break;
            case ENTREPRISE:
                tauxRemise = new BigDecimal("8.00");
                break;
            case PROFESSIONNEL:
                tauxRemise = new BigDecimal("5.00");
                break;
            case FIDELE:
                tauxRemise = new BigDecimal("3.00");
                break;
            default:
                // Pas de remise supplémentaire
        }

        // Remise supplémentaire pour les grosses commandes
        if (montant.compareTo(new BigDecimal("1000.00")) > 0) {
            tauxRemise = tauxRemise.add(new BigDecimal("2.00"));
        }

        return tauxRemise;
    }

    // ====================
    // Méthodes utilitaires
    // ====================

    /**
     * Vérifier la disponibilité des produits (pour le frontend)
     */
    public boolean verifierDisponibilite(Map<Integer, Integer> produits) {
        for (Map.Entry<Integer, Integer> entry : produits.entrySet()) {
            Integer produitId = entry.getKey();
            Integer quantite = entry.getValue();

            Produit produit = produitRepository.findById(produitId)
                    .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

            if (produit.getQuantiteStock() < quantite) {
                return false;
            }
        }
        return true;
    }

    /**
     * Calculer la remise pour un type de client
     */
    public Double getRemiseForClientType(String typeClient) {
        try {
            Client.TypeClient type = Client.TypeClient.valueOf(typeClient);
            switch (type) {
                case VIP: return 10.0;
                case ENTREPRISE: return 8.0;
                case PROFESSIONNEL: return 5.0;
                case FIDELE: return 3.0;
                default: return 0.0;
            }
        } catch (IllegalArgumentException e) {
            return 0.0;
        }
    }
}