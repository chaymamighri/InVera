package org.erp.invera.dto.erp.fournisseurdto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.dto.erp.Produitdto.ProduitDTO;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LigneDetailDTO {
    private Integer idLigneCommandeFournisseur;
    private Integer quantite;
    private BigDecimal prixUnitaire;
    private BigDecimal sousTotalHT;
    private BigDecimal montantTVA;
    private BigDecimal sousTotalTTC;
    private ProduitDTO produit;
}