package org.erp.invera.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.CommandeClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommandeSimpleResponseDTO {
    private Integer id;
    private String numeroCommande;
    private String clientNom;
    private String clientTelephone;
    private String statut;
    private String dateCreationFormatted;
    private BigDecimal total;
    private Integer nombreProduits;

    public static CommandeSimpleResponseDTO fromEntity(CommandeClient commande) {
        CommandeSimpleResponseDTO dto = new CommandeSimpleResponseDTO();

        dto.setId(commande.getId());
        dto.setNumeroCommande(commande.getNumeroCommande());

        if (commande.getClient() != null) {
            dto.setClientNom(commande.getClient().getNom());
            dto.setClientTelephone(commande.getClient().getTelephone());
        }

        dto.setStatut(commande.getStatut().getDisplayName());

        // Formatage de la date
        if (commande.getDateCreation() != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            dto.setDateCreationFormatted(commande.getDateCreation().format(formatter));
        }

        dto.setTotal(commande.getTotal());

        // Nombre de produits
        if (commande.getProduits() != null) {
            dto.setNombreProduits(commande.getProduits().size());
        } else {
            dto.setNombreProduits(0);
        }

        return dto;
    }
}