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

    @Column(precision = 10, scale = 2)
    private BigDecimal prixUnitaire;

    @Column(precision = 10, scale = 2)
    private BigDecimal sousTotal;

    private Integer quantiteRecue = 0;

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
        calculerSousTotal();
    }

    // Méthodes métier
    public void calculerSousTotal() {
        if (prixUnitaire != null && quantite != null) {
            this.sousTotal = prixUnitaire.multiply(BigDecimal.valueOf(quantite));

        }
    }

    public void mettreAJourPrix(BigDecimal nouveauPrix) {
        this.prixUnitaire = nouveauPrix;
        calculerSousTotal();
    }

    public void mettreAJourQuantite(Integer nouvelleQuantite) {
        this.quantite = nouvelleQuantite;
        calculerSousTotal();
    }

    public void enregistrerReceptionPartielle(Integer quantiteRecue) {
        this.quantiteRecue = quantiteRecue;
    }
}
