package org.erp.invera.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.CommandeClient;
import org.erp.invera.service.ClientService;
import org.erp.invera.service.ProduitService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommandeResponseDTO {
    // Informations de base
    private Integer id;
    private String numero;
    private String numeroCommande;

    // Informations client
    private ClientDTO client;

    // Statut et dates
    private String statut;
    private String statutDisplay;
    private LocalDateTime dateCreation;
    private String dateCreationFormatted;
    private LocalDateTime dateLivraisonPrevue;
    private String dateLivraisonPrevueFormatted;

    // Totaux financiers
    private BigDecimal sousTotal;
    private BigDecimal montantRemise;
    private BigDecimal remise;
    private BigDecimal tauxRemise;
    private BigDecimal total;

    // Informations supplémentaires
    private String remarques;
    private String notes;

    // ✅ PRODUITS - Utilise votre DTO existant
    private List<ProduitCommandeDetailDTO> produits;

    // Informations de remise calculée
    private Map<String, Object> detailsRemises;

    // ✅ MÉTHODE SIMPLIFIÉE
    public static CommandeResponseDTO fromEntity(CommandeClient commande) {
        CommandeResponseDTO dto = new CommandeResponseDTO();

        dto.setId(commande.getId());
        dto.setNumero(commande.getNumeroCommande());
        dto.setNumeroCommande(commande.getNumeroCommande());

        if (commande.getClient() != null) {
            dto.setClient(ClientDTO.fromEntity(commande.getClient()));
        }

        dto.setStatut(commande.getStatut() != null ? commande.getStatut().name() : null);
        dto.setStatutDisplay(commande.getStatut() != null ? commande.getStatut().getDisplayName() : null);

        dto.setDateCreation(commande.getDateCreation());
        if (commande.getDateCreation() != null) {
            dto.setDateCreationFormatted(
                    commande.getDateCreation().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
            );
        }

        dto.setDateLivraisonPrevue(commande.getDateLivraison());
        if (commande.getDateLivraison() != null) {
            dto.setDateLivraisonPrevueFormatted(
                    commande.getDateLivraison().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
            );
        }

        dto.setSousTotal(commande.getSousTotal());
        dto.setMontantRemise(commande.getMontantRemise());
        dto.setRemise(commande.getMontantRemise());
        dto.setTauxRemise(commande.getTauxRemise());
        dto.setTotal(commande.getTotal());

        dto.setRemarques(commande.getNotes());
        dto.setNotes(commande.getNotes());

        dto.setProduits(new ArrayList<>());
        dto.setDetailsRemises(new HashMap<>());

        return dto;
    }

    // ✅ MÉTHODE AVEC SERVICES - UTILISE VOTRE DTO EXISTANT
    public static CommandeResponseDTO fromEntity(
            CommandeClient commande,
            ClientService clientService,
            ProduitService produitService) {

        CommandeResponseDTO dto = fromEntity(commande);

        // ✅ ENRICHIR LES PRODUITS - UTILISE VOTRE MÉTHODE fromMap
        if (commande.getProduits() != null && !commande.getProduits().isEmpty() && produitService != null) {
            try {
                List<ProduitCommandeDetailDTO> produitsDTO = ProduitCommandeDetailDTO.fromMap(
                        commande.getProduits(),
                        produitService
                );
                dto.setProduits(produitsDTO);
                System.out.println("✅ " + produitsDTO.size() + " produits enrichis avec détails");

                // DEBUG: Afficher le premier produit pour vérification
                if (!produitsDTO.isEmpty()) {
                    ProduitCommandeDetailDTO p = produitsDTO.get(0);
                    System.out.println("📦 Premier produit - ID: " + p.getId() +
                            ", Libellé: " + p.getLibelle() +
                            ", Image: " + (p.getImageUrl() != null ? "✓" : "✗") +
                            ", Catégorie: " + p.getCategorie());
                }
            } catch (Exception e) {
                System.err.println("❌ Erreur enrichissement produits: " + e.getMessage());
                e.printStackTrace();
            }
        }

        // ✅ ENRICHIR LES REMISES
        if (commande.getClient() != null && clientService != null) {
            Map<String, Object> details = new HashMap<>();
            details.put("remiseClient", clientService.calculerRemiseParType(
                    commande.getClient().getType()
            ));
            details.put("typeClient", commande.getClient().getType().name());
            details.put("tauxRemiseGlobal", commande.getTauxRemise());
            details.put("montantRemiseGlobal", commande.getMontantRemise());
            dto.setDetailsRemises(details);
        }

        return dto;
    }
}