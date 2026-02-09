package org.erp.invera.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.CommandeClient;
import org.erp.invera.service.ClientService;
import org.erp.invera.service.ProduitService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
            dto.setProduits(ProduitCommandeDetailDTO.fromMap(
                    commande.getProduits(),
                    produitService
            ));
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