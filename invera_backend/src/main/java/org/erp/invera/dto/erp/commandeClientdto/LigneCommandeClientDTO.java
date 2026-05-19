package org.erp.invera.dto.erp.commandeClientdto;

import java.math.BigDecimal;

public class LigneCommandeClientDTO {

    // Champs de base
    private Integer idLigneCommandeClient;
    private Integer quantite;
    private Double prixUnitaire;
    private Double sousTotal;

    // Champs produit
    private Integer produitId;
    private String produitLibelle;
    private Double prixVente;
    private String imageUrl;
    private String categorieNom;

    // ✅ AJOUTER CES CHAMPS POUR LA REMISE ET LA TVA
    private Double remiseStandard;      // Remise standard de la catégorie (%)
    private BigDecimal tauxTVA;          // Taux de TVA de la catégorie (%)

    // Constructeur par défaut
    public LigneCommandeClientDTO() {}

    // Constructeur avec tous les paramètres
    public LigneCommandeClientDTO(Integer idLigneCommandeClient, Integer quantite,
                                  Double prixUnitaire, Double sousTotal,
                                  Integer produitId, String produitLibelle,
                                  Double prixVente, String imageUrl, String categorieNom,
                                  Double remiseStandard, BigDecimal tauxTVA) {
        this.idLigneCommandeClient = idLigneCommandeClient;
        this.quantite = quantite;
        this.prixUnitaire = prixUnitaire;
        this.sousTotal = sousTotal;
        this.produitId = produitId;
        this.produitLibelle = produitLibelle;
        this.prixVente = prixVente;
        this.imageUrl = imageUrl;
        this.categorieNom = categorieNom;
        this.remiseStandard = remiseStandard;
        this.tauxTVA = tauxTVA;
    }

    // Getters et Setters pour idLigneCommandeClient
    public Integer getIdLigneCommandeClient() {
        return idLigneCommandeClient;
    }

    public void setIdLigneCommandeClient(Integer idLigneCommandeClient) {
        this.idLigneCommandeClient = idLigneCommandeClient;
    }

    // Getters et Setters pour quantite
    public Integer getQuantite() {
        return quantite;
    }

    public void setQuantite(Integer quantite) {
        this.quantite = quantite;
    }

    // Setter pour prixUnitaire avec conversion BigDecimal → Double
    public Double getPrixUnitaire() {
        return prixUnitaire;
    }

    public void setPrixUnitaire(BigDecimal prixUnitaire) {
        this.prixUnitaire = prixUnitaire != null ? prixUnitaire.doubleValue() : null;
    }

    // Overload pour accepter Double directement
    public void setPrixUnitaire(Double prixUnitaire) {
        this.prixUnitaire = prixUnitaire;
    }

    // Setter pour sousTotal avec conversion BigDecimal → Double
    public Double getSousTotal() {
        return sousTotal;
    }

    public void setSousTotal(BigDecimal sousTotal) {
        this.sousTotal = sousTotal != null ? sousTotal.doubleValue() : null;
    }

    // Overload pour accepter Double directement
    public void setSousTotal(Double sousTotal) {
        this.sousTotal = sousTotal;
    }

    // Getters et Setters pour produitId
    public Integer getProduitId() {
        return produitId;
    }

    public void setProduitId(Integer produitId) {
        this.produitId = produitId;
    }

    // Getters et Setters pour produitLibelle
    public String getProduitLibelle() {
        return produitLibelle;
    }

    public void setProduitLibelle(String produitLibelle) {
        this.produitLibelle = produitLibelle;
    }

    // Setter pour prixVente avec conversion BigDecimal → Double
    public Double getPrixVente() {
        return prixVente;
    }

    public void setPrixVente(BigDecimal prixVente) {
        this.prixVente = prixVente != null ? prixVente.doubleValue() : null;
    }

    // Overload pour accepter Double directement
    public void setPrixVente(Double prixVente) {
        this.prixVente = prixVente;
    }

    // Getters et Setters pour imageUrl
    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    // Getters et Setters pour categorieNom
    public String getCategorieNom() {
        return categorieNom;
    }

    public void setCategorieNom(String categorieNom) {
        this.categorieNom = categorieNom;
    }

    // ✅ GETTERS ET SETTERS POUR remiseStandard
    public Double getRemiseStandard() {
        return remiseStandard;
    }

    public void setRemiseStandard(Double remiseStandard) {
        this.remiseStandard = remiseStandard;
    }

    // ✅ GETTERS ET SETTERS POUR tauxTVA
    public BigDecimal getTauxTVA() {
        return tauxTVA;
    }

    public void setTauxTVA(BigDecimal tauxTVA) {
        this.tauxTVA = tauxTVA;
    }
}