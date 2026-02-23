package org.erp.invera.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ligne_commande_client")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class LigneCommandeClient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idLigneCommandeClient;

    @ManyToOne
    @JoinColumn(name = "commande_client_id", nullable = false)
    private CommandeClient commandeClient;

    @ManyToOne
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @Column(name = "quantite", nullable = false)
    private Integer quantite;

    @Column(name = "sous_total", nullable = false, precision = 19, scale = 2)
    private BigDecimal sousTotal;

    @Column(name = "prix_unitaire", nullable = false, precision = 19, scale = 2)
    private BigDecimal prixUnitaire;

    // --- Nouveaux champs d'audit ---
    @CreatedBy
    @JoinColumn(name = "created_by", nullable = true,  updatable = false)
    private String createdBy;

    @CreatedDate
    @Column(name = "created_at", nullable = true,  updatable = false)
    private LocalDateTime createdAt;
    // ------------------------------

    // Méthode pour calculer le sous-total
    @PrePersist
    @PreUpdate
    public void calculerSousTotal() {
        if (prixUnitaire != null && quantite != null) {
            this.sousTotal = prixUnitaire.multiply(BigDecimal.valueOf(quantite));
        }
    }
}