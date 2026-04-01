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
 * DTO pour les données de facture fournisseur (sans persistance)
 * Utilisé pour la génération de PDF côté backend ou frontend
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FactureFournisseurDTO {

    private String reference;

    private LocalDateTime dateFacture;

    private Fournisseur fournisseur;

    private CommandeFournisseur commande;

    private BigDecimal montantTotal;

    private List<LigneCommandeFournisseur> lignes;
}