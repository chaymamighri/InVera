package org.erp.invera.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProduitCommandeUpdateDTO {
    private Integer id;           // ID de la ligne de commande (pour mise à jour)
    private Integer produitId;    // ID du produit
    private BigDecimal quantite;
    private BigDecimal remiseProduit;
    private BigDecimal prixUnitaire;
}