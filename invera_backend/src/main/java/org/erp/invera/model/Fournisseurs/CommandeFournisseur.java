package org.erp.invera.model.Fournisseurs;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

    @Column(name = "numero_bon_livraison")
    private String numeroBonLivraison;

    @Column(name = "notes_reception", columnDefinition = "TEXT")
    private String notesReception;

    @OneToMany(mappedBy = "commandeFournisseur", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
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

    @Column(name = "motif_rejet" ,length = 500)
    private String motifRejet;

    // Optionnel : date du rejet pour traçabilité
    @Column(name = "date_rejet" )
    private LocalDateTime dateRejet;

    public enum StatutCommande {
        BROUILLON("Brouillon"),
        VALIDEE("Validée"),
        ENVOYEE("Envoyée au fournisseur"),
        RECUE("Reçue"),
        FACTUREE("Facturée"),
        REJETEE("Rejetée");

        private final String libelle;

        StatutCommande(String libelle) {
            this.libelle = libelle;
        }

    }
}