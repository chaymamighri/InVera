// dto/platform/PaiementResponseDTO.java
package org.erp.invera.dto.platform;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.erp.invera.model.platform.Paiement;
import org.erp.invera.model.platform.Abonnement;
import org.erp.invera.model.platform.Client;
import org.erp.invera.model.platform.OffreAbonnement;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaiementResponseDTO {
    private Long id;
    private Double montant;
    private String devise;
    private String statut;
    private LocalDateTime dateDemande;
    private LocalDateTime dateConfirmation;

    // Données client
    private String clientNom;
    private String clientPrenom;
    private String clientEmail;

    // Données offre
    private String offreNom;
    private Double offrePrix;
    private String offreDevise;
    private Integer dureeMois;
    private String offreDescription;

    public static PaiementResponseDTO fromEntity(Paiement paiement) {
        if (paiement == null) {
            return null;
        }

        PaiementResponseDTO dto = new PaiementResponseDTO();
        dto.setId(paiement.getId());
        dto.setMontant(paiement.getMontant());
        dto.setDevise(paiement.getDevise());
        dto.setStatut(paiement.getStatut() != null ? paiement.getStatut().name() : null);
        dto.setDateDemande(paiement.getDateDemande());
        dto.setDateConfirmation(paiement.getDateConfirmation());

        // VÉRIFICATION: Afficher les logs pour déboguer
        System.out.println("=== DEBUG Paiement ID: " + paiement.getId() + " ===");
        System.out.println("Abonnement présent: " + (paiement.getAbonnement() != null));

        if (paiement.getAbonnement() != null) {
            Abonnement abonnement = paiement.getAbonnement();
            System.out.println("Client présent: " + (abonnement.getClient() != null));
            System.out.println("Offre présente: " + (abonnement.getOffreAbonnement() != null));

            // Client
            if (abonnement.getClient() != null) {
                Client client = abonnement.getClient();
                dto.setClientNom(client.getNom());
                dto.setClientPrenom(client.getPrenom());
                dto.setClientEmail(client.getEmail());
                System.out.println("Client chargé: " + client.getNom() + " " + client.getPrenom());
            } else {
                System.out.println("⚠️ Client est NULL pour ce paiement!");
            }

            // Offre
            if (abonnement.getOffreAbonnement() != null) {
                OffreAbonnement offre = abonnement.getOffreAbonnement();
                dto.setOffreNom(offre.getNom());
                dto.setOffrePrix(offre.getPrix());
                dto.setOffreDevise(offre.getDevise());
                dto.setDureeMois(offre.getDureeMois());
                dto.setOffreDescription(offre.getDescription());
                System.out.println("Offre chargée: " + offre.getNom());
            } else {
                System.out.println("⚠️ Offre est NULL pour ce paiement!");
            }
        } else {
            System.out.println("⚠️ Abonnement est NULL pour ce paiement!");
        }

        return dto;
    }
}