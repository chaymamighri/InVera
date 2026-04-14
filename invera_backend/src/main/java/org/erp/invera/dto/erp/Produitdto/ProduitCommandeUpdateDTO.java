package org.erp.invera.dto.erp.Produitdto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProduitCommandeUpdateDTO {
    private Integer id;
    private Integer produitId;
    private BigDecimal quantite;
    private BigDecimal remiseProduit;
    private BigDecimal prixUnitaire;
}