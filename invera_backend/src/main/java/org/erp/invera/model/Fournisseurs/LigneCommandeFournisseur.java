package org.erp.invera.model.Fournisseurs;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.Produit;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "lignes_commande_fournisseurs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LigneCommandeFournisseur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idLigneCommandeFournisseur;

    @ManyToOne
    @JoinColumn(name = "commande_fournisseur_id", nullable = false)
    private CommandeFournisseur commandeFournisseur;

    @ManyToOne
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @Column(nullable = false)
    private Integer quantite;

    @Column(precision = 10, scale = 3)
    private BigDecimal prixUnitaire;

    // ✅ AJOUTER CES CHAMPS MANQUANTS
    @Column(name = "sous_total_ht", precision = 10, scale = 3)
    private BigDecimal sousTotalHT;

    @Column(name = "montant_tva", precision = 10, scale = 3)
    private BigDecimal montantTVA;

    @Column(name = "sous_total_ttc", precision = 10, scale = 3)
    private BigDecimal sousTotalTTC;

    // Ancien champ sousTotal (à garder pour compatibilité ou supprimer)
    @Column(precision = 10, scale = 2)
    private BigDecimal sousTotal;

    private Integer quantiteRecue = 0;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(nullable = false)
    private Boolean actif = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructeurs
    public LigneCommandeFournisseur(Produit produit, Integer quantite, BigDecimal prixUnitaire) {
        this.produit = produit;
        this.quantite = quantite;
        this.prixUnitaire = prixUnitaire;
        this.actif = true;
    }

    // Méthode pour calculer tous les totaux
    public void calculerTotaux(BigDecimal tauxTVA) {
        if (prixUnitaire != null && quantite != null) {
            // Calculs avec 3 décimales
            this.sousTotalHT = prixUnitaire.multiply(BigDecimal.valueOf(quantite))
                    .setScale(3, BigDecimal.ROUND_HALF_UP);

            this.montantTVA = sousTotalHT.multiply(tauxTVA)
                    .divide(new BigDecimal("100"), 3, BigDecimal.ROUND_HALF_UP);

            this.sousTotalTTC = sousTotalHT.add(montantTVA)
                    .setScale(3, BigDecimal.ROUND_HALF_UP);

            // Pour compatibilité avec l'ancien champ
            this.sousTotal = sousTotalHT.setScale(2, BigDecimal.ROUND_HALF_UP);
        }
    }


}