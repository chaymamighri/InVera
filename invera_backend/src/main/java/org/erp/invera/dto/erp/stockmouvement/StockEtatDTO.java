package org.erp.invera.dto.erp.stockmouvement;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class StockEtatDTO {
    private Integer produitId;
    private String reference;
    private String libelle;
    private Integer categorieId;
    private String categorieNom;
    private Integer quantiteActuelle;
    private String unite;
    private BigDecimal prixUnitaire;
    private BigDecimal valeurStock;
    private String emplacement;
    private Integer seuilAlerte;
    private String statutStock;
}