package org.erp.invera.dto.platform.abonnementdto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AbonnementResponse {
    private Long id;
    private Long clientId;
    private String clientNom;
    private String clientEmail;
    private Long offreId;
    private String offreNom;
    private Integer dureeMois;
    private String duree;          // "1 mois" ou "12 mois"
    private Double montant;
    private String devise;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private String statut;         // ACTIF, EXPIRE, SUSPENDU, ANNULE
}