package org.erp.invera.model.Fournisseurs;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "commandes_fournisseurs")
@Data
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor
@AllArgsConstructor
public class CommandeFournisseur {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idCommandeFournisseur;

    @ManyToOne
    @JoinColumn(name = "fournisseur_id", nullable = false)
    private Fournisseur fournisseur;

    @Column(nullable = false)
    private LocalDateTime dateCommande;

    @Column(nullable = false)
    private LocalDateTime dateLivraisonPrevue;

    private LocalDateTime dateLivraisonReelle;

    //Adresse de livraison
    @Column(name = "adresse_livraison", length = 500)
    private String adresseLivraison;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutCommande statut;

    @Column(length = 50, unique = true)
    private String numeroCommande;

    //Passage à scale = 3 pour plus de précision
    @Column(precision = 10, scale = 3)
    private BigDecimal totalHT;

    @Column(precision = 10, scale = 3)
    private BigDecimal totalTVA;

    @Column(precision = 10, scale = 3)
    private BigDecimal totalTTC;

    //Taux de TVA appliqué à la commande
    @Column(name = "taux_tva", precision = 5, scale = 2)
    private BigDecimal tauxTVA;

    @Column(nullable = false)
    private Boolean actif = true;

    @Column(name = "notes", length = 1000)
    private String notes;

    @OneToMany(mappedBy = "commandeFournisseur", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LigneCommandeFournisseur> lignesCommande = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @CreatedBy
    @JoinColumn(name = "created_by", nullable = false, updatable = false)
    private String createdBy;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum StatutCommande {
        BROUILLON("Brouillon"),
        VALIDEE("Validée"),
        ENVOYEE("Envoyée au fournisseur"),
        RECUE("Reçue"),
        FACTUREE("Facturée"),
        ANNULEE("Annulée");

        private final String libelle;

        StatutCommande(String libelle) {
            this.libelle = libelle;
        }

        public String getLibelle() {
            return libelle;
        }
    }

    // ✅ METHODES UTILITAIRES

    /**
     * Calcule les totaux de la commande à partir des lignes
     */
    public void calculerTotaux() {
        if (lignesCommande != null && !lignesCommande.isEmpty()) {
            this.totalHT = lignesCommande.stream()
                    .map(LigneCommandeFournisseur::getSousTotalHT)
                    .filter(java.util.Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(3, BigDecimal.ROUND_HALF_UP);

            this.totalTVA = lignesCommande.stream()
                    .map(LigneCommandeFournisseur::getMontantTVA)
                    .filter(java.util.Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(3, BigDecimal.ROUND_HALF_UP);

            this.totalTTC = lignesCommande.stream()
                    .map(LigneCommandeFournisseur::getSousTotalTTC)
                    .filter(java.util.Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(3, BigDecimal.ROUND_HALF_UP);
        }
    }

    /**
     * Vérifie si la commande est modifiable
     */
    public boolean isModifiable() {
        return this.statut == StatutCommande.BROUILLON;
    }

    /**
     * Vérifie si la commande peut être annulée
     */
    public boolean isAnnulable() {
        return this.statut != StatutCommande.FACTUREE &&
                this.statut != StatutCommande.RECUE;
    }

    @Override
    public String toString() {
        return String.format("CommandeFournisseur{id=%d, numero='%s', fournisseur=%s, totalTTC=%s, statut=%s}",
                idCommandeFournisseur, numeroCommande,
                fournisseur != null ? fournisseur.getNomFournisseur() : "null",
                totalTTC, statut);
    }
}