package org.erp.invera.dto.commandeFornisseurdto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Data
@Getter
@Setter
public class LigneCommandeDTO {
    private Integer idLigneCommandeFournisseur;
    private Integer produitId;
    private Boolean isManual;
    private String produitLibelle;
    private String produitReference;
    private Integer quantite;
    private BigDecimal prixUnitaire;
    private BigDecimal sousTotal;
    private BigDecimal remise;
    private Integer quantiteRecue;
    private String notes;
}
