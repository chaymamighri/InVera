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

    private String libelle;

    @Column(name = "prix_vente")
    private Double prixVente;

    @Column(name = "prix_achat")
    private Double prixAchat;

    @Column(name = "categorie")
    private String categorie;

    @Column(name = "quantite_stock")
    private Integer quantiteStock;

    @Enumerated(EnumType.STRING)
    private StockStatus status;

    @Column(name = "seuil_minimum")
    private Integer seuilMinimum;

    @Column(name = "unite_mesure")
    private String uniteMesure;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "remise_temporaire")
    private Double remiseTemporaire;

    @Column(name = "remise_particulier")
    private Double remiseParticulier;

    @Column(name = "remise_vip")
    private Double remiseVIP;

    @Column(name = "remise_professionnelle")
    private Double remiseProfessionnelle;


    public enum StockStatus {
        EN_STOCK,
        RUPTURE,
        FAIBLE,
        CRITIQUE
    }


     ///  doit etre dans un classe séparé
    public enum CategorieProduit {
        ELECTRONIQUE,
        ELECTROMENAGER,
        MEUBLE,
        ALIMENTAIRE,
        BUREAUTIQUE,
        VETEMENT,
        AUTRE
    }
}