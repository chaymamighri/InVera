package org.erp.invera.dto.FactureFournisseurDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.Fournisseurs.CommandeFournisseur;
import org.erp.invera.model.Fournisseurs.Fournisseur;
import org.erp.invera.model.Fournisseurs.LigneCommandeFournisseur;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO pour le détail complet d'une facture (avec lignes de commande)
 * Utilisé pour l'affichage détaillé et l'export PDF
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FactureDetailDTO {

    private Integer idFactureFournisseur;

    private String reference;

    private LocalDateTime dateFacture;

    private BigDecimal montantTotal;

    private String statut;

    private Fournisseur fournisseur;

    private CommandeFournisseur commande;

    private List<LigneCommandeFournisseur> lignes;

    private LocalDateTime createdAt;

    private String createdBy;
}