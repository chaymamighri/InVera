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
public class ProduitCommandeDetailDTO { // Renommé
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

    // Méthode pour créer une liste de DTOs à partir du Map
    public static List<ProduitCommandeDetailDTO> fromMap( // Renommé
                                                          Map<Integer, Integer> produitsMap,
                                                          ProduitService produitService) {

        List<ProduitCommandeDetailDTO> produits = new ArrayList<>();

        if (produitsMap == null || produitsMap.isEmpty()) {
            return produits;
        }

        for (Map.Entry<Integer, Integer> entry : produitsMap.entrySet()) {
            Integer produitId = entry.getKey();
            Integer quantite = entry.getValue();

            Optional<Produit> produitOpt = produitService.getProduitById(produitId);

            if (produitOpt.isPresent()) {
                Produit produit = produitOpt.get();

                ProduitCommandeDetailDTO dto = new ProduitCommandeDetailDTO(); // Renommé
                dto.setId(produitId);
                dto.setLibelle(produit.getLibelle());
                dto.setImageUrl(produit.getImageUrl());
                dto.setPrixUnitaire(BigDecimal.valueOf(
                        produit.getPrixVente() != null ? produit.getPrixVente() : 0.0));
                dto.setQuantite(quantite);
                dto.setQuantiteStock(produit.getQuantiteStock());
                dto.setStatutStock(produit.getStatus() != null ?
                        produit.getStatus().name() : "INCONNU");

                BigDecimal sousTotal = dto.getPrixUnitaire()
                        .multiply(BigDecimal.valueOf(quantite));
                dto.setSousTotal(sousTotal);
                dto.setRemiseProduit(BigDecimal.ZERO);
                dto.setTotalLigne(sousTotal.subtract(dto.getRemiseProduit()));

                produits.add(dto);
            } else {
                ProduitCommandeDetailDTO dto = new ProduitCommandeDetailDTO(); // Renommé
                dto.setId(produitId);
                dto.setLibelle("Produit non trouvé (ID: " + produitId + ")");
                dto.setImageUrl(null);
                dto.setPrixUnitaire(BigDecimal.ZERO);
                dto.setQuantite(quantite);
                dto.setSousTotal(BigDecimal.ZERO);
                dto.setRemiseProduit(BigDecimal.ZERO);
                dto.setTotalLigne(BigDecimal.ZERO);
                produits.add(dto);
            }
        }

        return produits;
    }
}