package org.erp.invera.dto.platform.abonnementdto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class OffreAbonnementResponse {
    private Long id;
    private String nom;
    private String typeOffre;
    private String typeOffreLabel;
    private String duree;
    private Integer dureeMois;
    private Double prix;
    private String devise;
    private String description;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long abonnementsAssocies;
}
