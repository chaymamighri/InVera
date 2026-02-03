
package org.erp.invera.model;

import jakarta.persistence.*;

@Entity
@Table(name = "produit")
public class Produit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idProduit;

    private String libelle;
    private Double prix;
    private Integer quantiteStock;
    private Integer seuilMinimum;
    private String uniteMesure;

    // Constructeur vide (obligatoire pour JPA)
    public Produit() {
    }

    // Constructeur complet
    public Produit(Integer idProduit, String libelle, Double prix, Integer quantiteStock, Integer seuilMinimum, String uniteMesure) {
        this.idProduit = idProduit;
        this.libelle = libelle;
        this.prix = prix;
        this.quantiteStock = quantiteStock;
        this.seuilMinimum = seuilMinimum;
        this.uniteMesure = uniteMesure;
    }

    // Getters et setters
    public Integer getIdProduit() {
        return idProduit;
    }

    public void setIdProduit(Integer idProduit) {
        this.idProduit = idProduit;
    }

    public String getLibelle() {
        return libelle;
    }

    public void setLibelle(String libelle) {
        this.libelle = libelle;
    }

    public Double getPrix() {
        return prix;
    }

    public void setPrix(Double prix) {
        this.prix = prix;
    }

    public Integer getQuantiteStock() {
        return quantiteStock;
    }

    public void setQuantiteStock(Integer quantiteStock) {
        this.quantiteStock = quantiteStock;
    }

    public Integer getSeuilMinimum() {
        return seuilMinimum;
    }

    public void setSeuilMinimum(Integer seuilMinimum) {
        this.seuilMinimum = seuilMinimum;
    }

    public String getUniteMesure() {
        return uniteMesure;
    }

    public void setUniteMesure(String uniteMesure) {
        this.uniteMesure = uniteMesure;
    }
}
