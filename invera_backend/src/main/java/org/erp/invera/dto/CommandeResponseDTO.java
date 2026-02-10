package org.erp.invera.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.CommandeClient;
import org.erp.invera.model.Produit;
import org.erp.invera.service.ClientService;
import org.erp.invera.service.ProduitService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommandeResponseDTO {
    // Informations de base
    private Integer id;
    private String numeroCommande;

    // Informations client
    private ClientDTO client;

    // Statut et dates
    private String statut;
    private String statutDisplay; // Pour l'affichage
    private LocalDateTime dateCreation;
    private LocalDateTime dateLivraison;

    // Totaux financiers
    private BigDecimal sousTotal;
    private BigDecimal montantRemise;
    private BigDecimal tauxRemise;
    private BigDecimal total;

    // Informations supplémentaires
    private String notes;

    // Produits de la commande (avec détails)
    private List<ProduitCommandeDetailDTO> produits;

    // Informations de remise calculée
    private Map<String, Object> detailsRemises;

    // Méthode pour créer le DTO à partir de l'entité
    public static CommandeResponseDTO fromEntity(CommandeClient commande,
                                                 ClientService clientService,
                                                 ProduitService produitService) {
        CommandeResponseDTO dto = new CommandeResponseDTO();

        // Informations de base
        dto.setId(commande.getId());
        dto.setNumeroCommande(commande.getNumeroCommande());

        // Informations client
        if (commande.getClient() != null) {
            dto.setClient(ClientDTO.fromEntity(commande.getClient()));
        }

        // Statut
        dto.setStatut(commande.getStatut().name());
        dto.setStatutDisplay(commande.getStatut().getDisplayName());

        // Dates
        dto.setDateCreation(commande.getDateCreation());
        dto.setDateLivraison(commande.getDateLivraison());

        // Totaux
        dto.setSousTotal(commande.getSousTotal());
        dto.setMontantRemise(commande.getMontantRemise());
        dto.setTauxRemise(commande.getTauxRemise());
        dto.setTotal(commande.getTotal());

        // Notes
        dto.setNotes(commande.getNotes());


        // Produits avec détails
        if (commande.getProduits() != null && !commande.getProduits().isEmpty()) {
            System.out.println("📦 Commande " + commande.getId() + " - Produits Map: " + commande.getProduits());

            // DEBUG: Affichez le contenu de la Map
            System.out.println("🔍 Détails de la Map:");
            for (Map.Entry<Integer, Integer> entry : commande.getProduits().entrySet()) {
                System.out.println("  - Produit ID (clé): " + entry.getKey() +
                        ", Quantité (valeur): " + entry.getValue());

                // Testez si le produit existe
                try {
                    Optional<Produit> produitOpt = produitService.getProduitById(entry.getKey());
                    if (produitOpt.isPresent()) {
                        Produit p = produitOpt.get();
                        System.out.println("    ✅ Produit trouvé - idProduit: " + p.getIdProduit() +
                                ", libelle: " + p.getLibelle());
                    } else {
                        System.out.println("    ❌ Produit non trouvé en base pour ID: " + entry.getKey());
                    }
                } catch (Exception e) {
                    System.out.println("    ⚠️ Erreur recherche produit: " + e.getMessage());
                }
            }

            // Utilisez la méthode normale (pas debug)
            try {
                List<ProduitCommandeDetailDTO> produitsDTO = ProduitCommandeDetailDTO.fromMap(
                        commande.getProduits(),
                        produitService
                );

                System.out.println("✅ Produits DTO créés: " + produitsDTO.size());

                // Vérifiez le contenu des DTOs
                for (ProduitCommandeDetailDTO dtoProduit : produitsDTO) {
                    System.out.println("📋 DTO - ID: " + dtoProduit.getId() +
                            ", Libelle: " + dtoProduit.getLibelle() +
                            ", Quantité: " + dtoProduit.getQuantite() +
                            ", Prix: " + dtoProduit.getPrixUnitaire());
                }

                dto.setProduits(produitsDTO);

            } catch (Exception e) {
                System.out.println("❌ Erreur conversion produits: " + e.getMessage());
                e.printStackTrace();

                // Fallback: créer des DTOs vides
                dto.setProduits(new ArrayList<>());
            }
        } else {
            System.out.println("⚠️ Aucun produit dans la commande " + commande.getId());
            dto.setProduits(new ArrayList<>());
        }

// Détails des remises
        dto.setDetailsRemises(calculerDetailsRemises(commande, clientService));

        return dto;
    }

    private static Map<String, Object> calculerDetailsRemises(
            CommandeClient commande, ClientService clientService) {
        Map<String, Object> details = new HashMap<>();

        if (commande.getClient() != null) {
            // Remise client
            details.put("remiseClient", clientService.calculerRemiseParType(
                    commande.getClient().getType()
            ));
            details.put("typeClient", commande.getClient().getType().name());
        }

        // Remise volume
        details.put("tauxRemiseGlobal", commande.getTauxRemise());
        details.put("montantRemiseGlobal", commande.getMontantRemise());

        return details;
    }
}