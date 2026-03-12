package org.erp.invera.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.dto.clientdto.ClientDTO;
import org.erp.invera.dto.commandeClientdto.CommandeSimpleResponseDTO;
import org.erp.invera.model.client.FactureClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FactureDTO {
    private Integer idFactureClient;
    private String referenceFactureClient;
    private String dateFactureFormatted;
    private LocalDateTime dateFacture;
    private BigDecimal montantTotal;
    private String statut;
    private String statutDisplay;

    // Réutilisation de vos DTOs existants
    private ClientDTO client;
    private CommandeSimpleResponseDTO commande;

    public static FactureDTO fromEntity(FactureClient facture) {
        if (facture == null) {
            return null;
        }

        FactureDTO dto = new FactureDTO();

        dto.setIdFactureClient(facture.getIdFactureClient());
        dto.setReferenceFactureClient(facture.getReferenceFactureClient());
        dto.setDateFacture(facture.getDateFacture());
        dto.setMontantTotal(facture.getMontantTotal());

        // Formatage de la date
        if (facture.getDateFacture() != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            dto.setDateFactureFormatted(facture.getDateFacture().format(formatter));
        }

        // Statut
        if (facture.getStatut() != null) {
            dto.setStatut(facture.getStatut().name());
            dto.setStatutDisplay(facture.getStatut() == FactureClient.StatutFacture.PAYE ? "Payée" : "Non payée");
        }

        // Réutilisation des DTOs existants
        dto.setClient(ClientDTO.fromEntity(facture.getClient()));
        dto.setCommande(CommandeSimpleResponseDTO.fromEntity(facture.getCommande()));

        return dto;
    }

    // Méthode utilitaire pour obtenir le nom complet du client
    public String getClientNomComplet() {
        if (client != null) {
            return client.getNomComplet();
        }
        return null;
    }

    // Méthode utilitaire pour obtenir le numéro de commande
    public String getCommandeReference() {
        if (commande != null) {
            return commande.getReferenceCommandeClient();
        }
        return null;
    }
}