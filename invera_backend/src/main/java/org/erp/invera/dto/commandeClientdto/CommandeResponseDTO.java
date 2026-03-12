package org.erp.invera.dto.commandeClientdto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.dto.clientdto.ClientDTO;
import org.erp.invera.dto.Produitdto.ProduitCommandeDetailDTO;
import org.erp.invera.model.client.CommandeClient;
import org.erp.invera.service.ClientService;
import org.erp.invera.service.ProduitService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommandeResponseDTO {

    // Informations de base
    private Integer idCommandeClient;
    private String referenceCommandeClient;

    // Client
    private ClientDTO client;

    // Statut
    private String statut;
    private String statutDisplay;

    // Dates
    private LocalDateTime dateCommande;
    private String dateCommandeFormatted;

    // Totaux financiers
    private BigDecimal sousTotal;
    private BigDecimal tauxRemise;
    private BigDecimal total;

    // Lignes de commande
    private List<LigneCommandeClientDTO> lignesCommande;

    // Produits (pour compatibilité avec l'ancien code)
    private List<ProduitCommandeDetailDTO> produits;

    // ==========================
    // MÉTHODES DE CONVERSION
    // ==========================

    // Méthode avec 1 paramètre (sans services)
    public static CommandeResponseDTO fromEntity(CommandeClient commande) {
        return fromEntity(commande, null, null);
    }

    // Méthode avec 3 paramètres (avec services)
    public static CommandeResponseDTO fromEntity(CommandeClient commande,
                                                 ClientService clientService,
                                                 ProduitService produitService) {
        if (commande == null) {
            return null;
        }

        CommandeResponseDTO dto = new CommandeResponseDTO();

        dto.setIdCommandeClient(commande.getIdCommandeClient());
        dto.setReferenceCommandeClient(commande.getReferenceCommandeClient());

        // Client
        if (commande.getClient() != null) {
            dto.setClient(ClientDTO.fromEntity(commande.getClient()));
        }

        // Statut
        if (commande.getStatut() != null) {
            dto.setStatut(commande.getStatut().name());
            dto.setStatutDisplay(commande.getStatut().getDisplayName());
        }

        // Date
        dto.setDateCommande(commande.getDateCommande());
        if (commande.getDateCommande() != null) {
            dto.setDateCommandeFormatted(
                    commande.getDateCommande()
                            .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
            );
        }

        // Totaux
        dto.setSousTotal(commande.getSousTotal());
        dto.setTauxRemise(commande.getTauxRemise());
        dto.setTotal(commande.getTotal());

        // Lignes de commande
        if (commande.getLignesCommande() != null && !commande.getLignesCommande().isEmpty()) {
            dto.setLignesCommande(
                    commande.getLignesCommande()
                            .stream()
                            .map(ligne -> LigneCommandeClientDTO.fromEntity(ligne, produitService))
                            .collect(Collectors.toList()
                            )
            );

            // Pour compatibilité avec l'ancien code qui utilise "produits"
            dto.setProduits(
                    commande.getLignesCommande()
                            .stream()
                            .map(ligne -> ProduitCommandeDetailDTO.fromLigne(ligne, produitService))
                            .collect(Collectors.toList()
                            )
            );
        }

        return dto;
    }
}