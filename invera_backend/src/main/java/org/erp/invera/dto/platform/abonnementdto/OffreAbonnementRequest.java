package org.erp.invera.dto.platform.abonnementdto;

import lombok.Data;
import org.erp.invera.model.platform.OffreAbonnement;

@Data
public class OffreAbonnementRequest {
    private String nom;
    private OffreAbonnement.TypeOffre typeOffre;
    private Integer dureeMois;
    private Double prix;
    private String devise;
    private String description;
    private Boolean active;
}
