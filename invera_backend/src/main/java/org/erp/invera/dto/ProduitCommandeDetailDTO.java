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
                    dto.setLibelle(produit.getLibelle());
                    dto.setImageUrl(produit.getImageUrl());
                    dto.setCategorie(produit.getCategorie());
                    dto.setUniteMesure(produit.getUniteMesure());

                    // Prix
                    dto.setPrixUnitaire(BigDecimal.valueOf(
                            produit.getPrixVente() != null ? produit.getPrixVente() : 0.0));

                    // Quantité
                    dto.setQuantite(quantite != null && quantite > 0 ? quantite : 1);

                    // Stock
                    dto.setQuantiteStock(produit.getQuantiteStock());
                    dto.setStatutStock(produit.getStatus() != null ?
                            produit.getStatus().name() : "INCONNU");

                    // Calculs
                    BigDecimal sousTotal = dto.getPrixUnitaire()
                            .multiply(BigDecimal.valueOf(dto.getQuantite()));
                    dto.setSousTotal(sousTotal);
                    dto.setRemiseProduit(BigDecimal.ZERO); // Pour l'instant
                    dto.setTotalLigne(sousTotal);

                    produits.add(dto);
                } else {
                    // Produit non trouvé - créez un DTO avec l'ID
                    ProduitCommandeDetailDTO dto = new ProduitCommandeDetailDTO();
                    dto.setId(produitId);
                    dto.setLibelle("Produit ID: " + produitId);
                    dto.setQuantite(quantite != null ? quantite : 1);
                    dto.setPrixUnitaire(BigDecimal.ZERO);
                    dto.setSousTotal(BigDecimal.ZERO);
                    produits.add(dto);
                }
            } catch (Exception e) {
                System.out.println("Erreur produit ID " + produitId + ": " + e.getMessage());
            }
        }

        return produits;
    }
}