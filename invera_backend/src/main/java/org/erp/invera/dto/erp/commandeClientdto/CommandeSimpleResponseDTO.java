package org.erp.invera.dto.erp.commandeClientdto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.erp.client.CommandeClient;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommandeSimpleResponseDTO {
    private Integer idCommandeClient;           // Changé de id à idCommandeClient
    private String referenceCommandeClient;     // Changé de numeroCommande à referenceCommandeClient
    private String clientNom;
    private String clientPrenom;                 // Ajout du prénom
    private String clientTelephone;
    private String statut;
    private String statutDisplay;                 // Ajout pour l'affichage
    private String dateCommandeFormatted;        // Changé de dateCreationFormatted à dateCommandeFormatted
    private BigDecimal total;
    private Integer nombreProduits;

    public static CommandeSimpleResponseDTO fromEntity(CommandeClient commande) {
        if (commande == null) {
            return null;
        }

        CommandeSimpleResponseDTO dto = new CommandeSimpleResponseDTO();

        dto.setIdCommandeClient(commande.getIdCommandeClient());
        dto.setReferenceCommandeClient(commande.getReferenceCommandeClient());

        // Informations du client
        if (commande.getClient() != null) {
            dto.setClientNom(commande.getClient().getNom());
            dto.setClientPrenom(commande.getClient().getPrenom());
            dto.setClientTelephone(commande.getClient().getTelephone());
        }

        // Statut
        if (commande.getStatut() != null) {
            dto.setStatut(commande.getStatut().name());
            dto.setStatutDisplay(commande.getStatut().getDisplayName());
        }

        // Formatage de la date
        if (commande.getDateCommande() != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            dto.setDateCommandeFormatted(commande.getDateCommande().format(formatter));
        }

        dto.setTotal(commande.getTotal());

        // Nombre de produits (via les lignes de commande)
        if (commande.getLignesCommande() != null) {
            dto.setNombreProduits(commande.getLignesCommande().size());
        } else {
            dto.setNombreProduits(0);
        }

        return dto;
    }

    // Méthode utilitaire pour obtenir le nom complet du client
    public String getClientNomComplet() {
        if (clientPrenom != null && !clientPrenom.isEmpty()) {
            return clientPrenom + " " + clientNom;
        }
        return clientNom;
    }
}