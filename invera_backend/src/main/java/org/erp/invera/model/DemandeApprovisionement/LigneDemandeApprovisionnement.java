package org.erp.invera.model.DemandeApprovisionement;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.Produit;

import java.math.BigDecimal;

@Entity
@Table(name = "lignes_demande_approvisionnement")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LigneDemandeApprovisionnement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idLigne;

    // Relation vers la DA parente
    @ManyToOne
    @JoinColumn(name = "demande_id", nullable = false)
    private DemandeApprovisionnement demande;

    // Produit concerné → même Produit que LigneCommandeFournisseur
    @ManyToOne
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @Column(nullable = false)
    private Integer quantiteDemandee;

    // Stock actuel au moment de la demande (snapshot)
    private Integer quantiteEnStock;

    // Prix unitaire estimé HT → recopié dans LigneCommandeFournisseur.prixUnitaire
    @Column(precision = 10, scale = 3)
    private BigDecimal prixUnitaireEstimeHT;

    // Calculé : quantiteDemandee * prixUnitaireEstimeHT
    @Column(precision = 10, scale = 3)
    private BigDecimal sousTotalHT;

}