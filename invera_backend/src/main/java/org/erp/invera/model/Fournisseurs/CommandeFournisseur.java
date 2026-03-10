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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutCommande statut;

    @Column(length = 50)
    private String numeroCommande; // Généré automatiquement

    @Column(precision = 10, scale = 2)
    private BigDecimal totalHT;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalTVA;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalTTC;

    @Column(nullable = false)
    private Boolean actif = true;

    @OneToMany(mappedBy = "commandeFournisseur", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LigneCommandeFournisseur> lignesCommande = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @CreatedBy
    @JoinColumn(name = "created_by", nullable = false,  updatable = false)
    private String createdBy;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void calculerTotaux() {
        this.totalHT = lignesCommande.stream()
                .map(LigneCommandeFournisseur::getSousTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Exemple avec TVA 20% (à adapter selon votre logique)
        this.totalTVA = totalHT.multiply(new BigDecimal("0.20"));
        this.totalTTC = totalHT.add(totalTVA);
    }

    public void validerCommande() {
        if (statut == StatutCommande.BROUILLON) {
            this.statut = StatutCommande.VALIDEE;
        }
    }

    public void envoyerCommande() {
        if (statut == StatutCommande.VALIDEE) {
            this.statut = StatutCommande.ENVOYEE;
        }
    }

    public void enregistrerReception() {
        if (statut == StatutCommande.ENVOYEE) {
            this.statut = StatutCommande.RECUE;
            this.dateLivraisonReelle = LocalDateTime.now();
        }
    }

    public void annulerCommande() {
        if (statut != StatutCommande.RECUE && statut != StatutCommande.FACTUREE) {
            this.statut = StatutCommande.ANNULEE;
        }
    }

    public enum StatutCommande {
        BROUILLON("Brouillon"),
        VALIDEE("Validée"),
        ENVOYEE("Envoyée au fournisseur"),
        RECUE("Reçue"),
        FACTUREE("Facturée"),
        ANNULEE("Annulée"),
        REJETEE("Rejetée");

        private final String libelle;

        StatutCommande(String libelle) {
            this.libelle = libelle;
        }

        public String getLibelle() {
            return libelle;
        }
    }
}