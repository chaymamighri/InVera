package org.erp.invera.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.Produit;
import org.erp.invera.service.ProduitService;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProduitCommandeDetailDTO {
    private Integer id;
    private String libelle;
    private String imageUrl;
    private BigDecimal prixUnitaire;
    private Integer quantite;
    private BigDecimal sousTotal;
    private BigDecimal remiseProduit;
    private BigDecimal totalLigne;
    private Integer quantiteStock;
    private String statutStock;
    private String categorie;
    private String uniteMesure;

    public static List<ProduitCommandeDetailDTO> fromMap(
            Map<Integer, Integer> produitsMap,
            ProduitService produitService) {

        List<ProduitCommandeDetailDTO> produits = new ArrayList<>();

        if (produitsMap == null || produitsMap.isEmpty()) {
            return produits;
        }

        for (Map.Entry<Integer, Integer> entry : produitsMap.entrySet()) {
            Integer produitId = entry.getKey();
            Integer quantite = entry.getValue();

            try {
                Optional<Produit> produitOpt = produitService.getProduitById(produitId);

                if (produitOpt.isPresent()) {
                    Produit produit = produitOpt.get();
                    ProduitCommandeDetailDTO dto = new ProduitCommandeDetailDTO();

                    dto.setId(produit.getIdProduit());
                    dto.setLibelle(produit.getLibelle());  // ✅ Vrai libellé
                    dto.setImageUrl(produit.getImageUrl());
                    dto.setCategorie(produit.getCategorie());
                    dto.setUniteMesure(produit.getUniteMesure());
                    dto.setPrixUnitaire(BigDecimal.valueOf(
                            produit.getPrixVente() != null ? produit.getPrixVente() : 0.0));
                    dto.setQuantite(quantite != null && quantite > 0 ? quantite : 1);
                    dto.setQuantiteStock(produit.getQuantiteStock());
                    dto.setStatutStock(produit.getStatus() != null ?
                            produit.getStatus().name() : "INCONNU");

                    BigDecimal sousTotal = dto.getPrixUnitaire()
                            .multiply(BigDecimal.valueOf(dto.getQuantite()));
                    dto.setSousTotal(sousTotal);
                    dto.setRemiseProduit(BigDecimal.ZERO);
                    dto.setTotalLigne(sousTotal);

                    produits.add(dto);
                } else {
                    // ❌ PRODUIT NON TROUVÉ - NE PAS AJOUTER
                    System.out.println("⚠️ Produit ID " + produitId + " non trouvé en base - ignoré");
                    // continue; - Ne rien ajouter
                }
            } catch (Exception e) {
                System.out.println("❌ Erreur produit ID " + produitId + ": " + e.getMessage());
            }
        }

        System.out.println("✅ fromMap retourne " + produits.size() + " produits trouvés");
        return produits;
    }
}