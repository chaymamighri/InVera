package org.erp.invera.dto.commandeFornisseurdto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class LigneCommandeDTO {
    private Integer idLigneCommandeFournisseur;
    private Integer produitId;
    private ProduitManuelDTO produitManuel;
    private String produitLibelle;
    private String produitReference;
    private Integer quantite;
    private BigDecimal prixUnitaire;
    private BigDecimal sousTotal;
    private BigDecimal remise;
    private Integer quantiteRecue;
    private String notes;
}
