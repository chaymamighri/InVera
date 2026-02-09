package org.erp.invera.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProduitCommandeRequestDTO {
    private Integer produitId;
    private Integer quantite;
    private BigDecimal prixUnitaire;
    private BigDecimal remisePourcentage;
}