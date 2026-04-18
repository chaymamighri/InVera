package org.erp.invera.dto.erp.Produitdto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.erp.Produit;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProduitDTO {
    private Integer idProduit;
    private String libelle;
    private Double prixVente;
    private BigDecimal prixAchat;
    private Integer quantiteStock;
    private String uniteMesure;
    private Boolean active;
    private Integer seuilMinimum;
    private String imageUrl;
    private Double remiseTemporaire;
    private String status;

    // ✅ Catégorie
    private Integer categorieId;
    private String categorieNom;
    private BigDecimal categorieTauxTVA;

    // ✅ Fournisseur (One-to-Many - un seul fournisseur)
    private Integer fournisseurId;
    private String fournisseurNom;
    private String fournisseurEmail;
    private String fournisseurTelephone;
    private String fournisseurAdresse;

    /**
     * Convertit un Produit en ProduitDTO
     */
    public static ProduitDTO fromEntity(Produit produit) {
        ProduitDTO dto = new ProduitDTO();
        dto.setIdProduit(produit.getIdProduit());
        dto.setLibelle(produit.getLibelle());
        dto.setPrixVente(produit.getPrixVente());
        dto.setPrixAchat(produit.getPrixAchat());  // ✅ Prix d'achat
        dto.setQuantiteStock(produit.getQuantiteStock());
        dto.setUniteMesure(produit.getUniteMesure() != null ? produit.getUniteMesure().name() : null);
        dto.setActive(produit.getActive());
        dto.setSeuilMinimum(produit.getSeuilMinimum());
        dto.setImageUrl(produit.getImageUrl());
        dto.setRemiseTemporaire(produit.getRemiseTemporaire());
        dto.setStatus(produit.getStatus() != null ? produit.getStatus().name() : null);

        // Catégorie
        if (produit.getCategorie() != null) {
            dto.setCategorieId(produit.getCategorie().getIdCategorie());
            dto.setCategorieNom(produit.getCategorie().getNomCategorie());
            dto.setCategorieTauxTVA(produit.getCategorie().getTauxTVA());
        }

        // ✅ Fournisseur (One-to-Many - un seul)
        if (produit.getFournisseur() != null) {
            dto.setFournisseurId(produit.getFournisseur().getIdFournisseur());
            dto.setFournisseurNom(produit.getFournisseur().getNomFournisseur());
            dto.setFournisseurEmail(produit.getFournisseur().getEmail());
            dto.setFournisseurTelephone(produit.getFournisseur().getTelephone());
            dto.setFournisseurAdresse(produit.getFournisseur().getAdresse());
        }

        return dto;
    }
}