package org.erp.invera.dto.commandeFornisseurDTO;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class LigneCommandeDTO {
    private Integer idLigneCommandeFournisseur;
    private Integer produitId;
    private String produitLibelle;
    private String produitReference;
    private Integer quantite;
    private BigDecimal prixUnitaire;
    private BigDecimal sousTotal;
    private BigDecimal remise;
    private Integer quantiteRecue;
    private String notes;
}
