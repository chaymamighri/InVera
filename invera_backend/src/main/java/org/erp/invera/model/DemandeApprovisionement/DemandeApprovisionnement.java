package org.erp.invera.model.DemandeApprovisionement;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.Fournisseurs.CommandeFournisseur;
import org.erp.invera.model.Fournisseurs.Fournisseur;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "demandes_approvisionnement")
@Data
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor
@AllArgsConstructor
public class DemandeApprovisionnement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idDemande;

    @Column(nullable = false)
    private LocalDateTime dateDemande;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private StatutDemande statut;

    // Fournisseur suggéré → recopié dans CommandeFournisseur.fournisseur
    @ManyToOne
    @JoinColumn(name = "fournisseur_id")
    private Fournisseur fournisseur;

    // Adresse → recopiée dans CommandeFournisseur.adresseLivraison
    @Column(name = "adresse_livraison", length = 500)
    private String adresseLivraison;

    // Date souhaitée → recopiée dans CommandeFournisseur.dateLivraisonPrevue
    private LocalDateTime dateLivraisonSouhaitee;

    // TVA → recopiée dans CommandeFournisseur.tauxTVA
    @Column(name = "taux_tva", precision = 5, scale = 2)
    private BigDecimal tauxTVA;

    // Montants estimés (calculés depuis les lignes)
    @Column(precision = 10, scale = 3)
    private BigDecimal totalEstimeHT;

    @Column(precision = 10, scale = 3)
    private BigDecimal totalEstimeTTC;

    // ======= Relations ================
    @OneToMany(mappedBy = "demande", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<LigneDemandeApprovisionnement> lignes = new ArrayList<>();

    // ===== Audit =====
    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // ================= Enums ===============
    public enum StatutDemande {
        SOUMISE("Soumise"),
        VALIDEE("Validée"),
        REJETEE("Rejetée");

        private String description;
        StatutDemande(String description) {
            this.description = description;
        }
    }

}