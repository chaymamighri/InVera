package org.erp.invera.dto.commandeFornisseurdto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Data
public class LigneCommandeDTO {
    private Integer idLigneCommandeFournisseur;

    // Produit du catalogue uniquement (obligatoire)
    private Integer produitId;

    // Informations produit (en lecture seule)
    private String produitLibelle;
    private String categorie;

    // Quantités et prix
    private Integer quantite;
    private BigDecimal prixUnitaire;

    // Totaux calculés
    private BigDecimal sousTotalHT;
    private BigDecimal tauxTVA;
    private BigDecimal montantTVA;
    private BigDecimal sousTotalTTC;

    // Suivi de réception
    private Integer quantiteRecue;
    private String notes;

    private Boolean estInactif;
}