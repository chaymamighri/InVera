package org.erp.invera.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "produit")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Produit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idProduit;

    @Column(name = "libelle", nullable = false)
    private String libelle;

    @Column(name = "prix_vente", nullable = false)
    private Double prixVente;

    @Column(name = "prix_achat", nullable = false)
    private Double prixAchat;

    @ManyToOne
    @JoinColumn(name = "categorie_id", nullable = false)
    private Categorie categorie;

    @Column(name = "quantite_stock", nullable = false)
    private Integer quantiteStock;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StockStatus status;

    @Column(name = "seuil_minimum", nullable = false)
    private Integer seuilMinimum;

    @Column(name = "unite_mesure", nullable = false)
    private String uniteMesure;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "remise_temporaire")
    private Double remiseTemporaire;

    public enum StockStatus {
        EN_STOCK,
        RUPTURE,
        FAIBLE,
        CRITIQUE
    }
}