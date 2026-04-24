package org.erp.invera.dto.platform.abonnementdto;

import lombok.Data;

@Data
public class OffreAbonnementRequest {
    private String nom;
    private Integer dureeMois;    // 1 = mensuel, 12 = annuel, etc.
    private Double prix;
    private String devise;
    private String description;
    private Boolean active;
}