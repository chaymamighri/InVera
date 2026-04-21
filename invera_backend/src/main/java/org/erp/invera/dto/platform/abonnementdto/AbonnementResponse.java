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
    private String typeOffre;
    private String duree;
    private Integer dureeMois;
    private String periodType;
    private Double montant;
    private String devise;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private LocalDateTime dateProchainRenouvellement;
    private String statut;
    private Boolean autoRenouvellement;
    private Boolean offreToujoursActive;
}
