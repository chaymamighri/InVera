package org.erp.invera.model.erp;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.erp.Fournisseurs.Fournisseur;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "produit")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Produit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_produit")
    private Integer idProduit;

    @Column(name = "libelle", nullable = false)
    private String libelle;

    @Column(name = "prix_vente", nullable = false)
    private Double prixVente;

    @Column(name = "prix_achat", nullable = false)
    private BigDecimal prixAchat = BigDecimal.ZERO;  // ✅ Prix d'achat ici

    // ✅ Relation Many-to-One avec Fournisseur
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fournisseur_id")
    @JsonIgnoreProperties("produits")
    private Fournisseur fournisseur;

    @ManyToOne
    @JoinColumn(name = "categorie_id", nullable = false)
    private Categorie categorie;

    @Column(name = "quantite_stock", nullable = false)
    private Integer quantiteStock;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StockStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "unite_mesure", nullable = false)
    private UniteMesure uniteMesure;

    @Column(name = "is_active", nullable = false)
    private Boolean active = true;

    @Column(name = "seuil_minimum", nullable = false)
    private Integer seuilMinimum;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "remise_temporaire")
    private Double remiseTemporaire;

    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false)
    private String createdBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum StockStatus {
        EN_STOCK,
        RUPTURE,
        FAIBLE,
        CRITIQUE
    }

    public enum UniteMesure {
        PIECE,
        KILOGRAMME,
        GRAMME,
        LITRE,
        MILLILITRE,
        METRE
    }
}