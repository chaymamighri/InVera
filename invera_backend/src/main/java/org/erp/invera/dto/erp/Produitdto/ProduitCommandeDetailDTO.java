package org.erp.invera.dto.erp.Produitdto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.erp.client.LigneCommandeClient;
import org.erp.invera.model.erp.Produit;
import org.erp.invera.service.erp.ProduitService;

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

    private Integer categorieId;
    private String categorieNom;
    private Produit.UniteMesure uniteMesure;

    /**
     * Convertit une ligne de commande en DTO (AVEC TOKEN)
     */
    public static ProduitCommandeDetailDTO fromLigne(LigneCommandeClient ligne,
                                                     ProduitService produitService,
                                                     String token) {  // ← AJOUTER TOKEN
        if (ligne == null) {
            return null;
        }

        ProduitCommandeDetailDTO dto = new ProduitCommandeDetailDTO();
        Produit produit = ligne.getProduit();

        if (produit != null) {
            dto.setId(produit.getIdProduit());
            dto.setLibelle(produit.getLibelle());
            dto.setImageUrl(produit.getImageUrl());

            if (produit.getCategorie() != null) {
                dto.setCategorieId(produit.getCategorie().getIdCategorie());
                dto.setCategorieNom(produit.getCategorie().getNomCategorie());
            }

            dto.setUniteMesure(produit.getUniteMesure());
            dto.setPrixUnitaire(ligne.getPrixUnitaire());
            dto.setQuantiteStock(produit.getQuantiteStock());
            dto.setStatutStock(produit.getStatus() != null ?
                    produit.getStatus().name() : "INCONNU");
        } else if (produitService != null && ligne.getProduit() != null) {
            // ✅ Passer le token
            Optional<Produit> produitOpt = produitService.getProduitById(
                    ligne.getProduit().getIdProduit(), token);  // ← AJOUTER TOKEN

            if (produitOpt.isPresent()) {
                Produit p = produitOpt.get();
                dto.setId(p.getIdProduit());
                dto.setLibelle(p.getLibelle());
                dto.setImageUrl(p.getImageUrl());

                if (p.getCategorie() != null) {
                    dto.setCategorieId(p.getCategorie().getIdCategorie());
                    dto.setCategorieNom(p.getCategorie().getNomCategorie());
                }

                dto.setUniteMesure(p.getUniteMesure());
                dto.setQuantiteStock(p.getQuantiteStock());
                dto.setStatutStock(p.getStatus() != null ?
                        p.getStatus().name() : "INCONNU");
            }
        }

        dto.setQuantite(ligne.getQuantite());
        dto.setPrixUnitaire(ligne.getPrixUnitaire());
        dto.setSousTotal(ligne.getSousTotal());
        dto.setRemiseProduit(BigDecimal.ZERO);
        dto.setTotalLigne(ligne.getSousTotal());

        return dto;
    }

    /**
     * Convertit une ligne de commande en DTO (sans token - méthode dépréciée)
     */
    @Deprecated
    public static ProduitCommandeDetailDTO fromLigne(LigneCommandeClient ligne,
                                                     ProduitService produitService) {
        // ⚠️ Méthode dépréciée - utilisez fromLigne(ligne, produitService, token) à la place
        return fromLigne(ligne, produitService, null);
    }

    /**
     * Convertit une map de produits en DTO (AVEC TOKEN)
     */
    public static List<ProduitCommandeDetailDTO> fromMap(
            Map<Integer, Integer> produitsMap,
            ProduitService produitService,
            String token) {  // ← AJOUTER TOKEN

        List<ProduitCommandeDetailDTO> produits = new ArrayList<>();

        if (produitsMap == null || produitsMap.isEmpty()) {
            return produits;
        }

        for (Map.Entry<Integer, Integer> entry : produitsMap.entrySet()) {
            Integer produitId = entry.getKey();
            Integer quantite = entry.getValue();

            try {
                // ✅ Passer le token
                Optional<Produit> produitOpt = produitService.getProduitById(produitId, token);

                if (produitOpt.isPresent()) {
                    Produit produit = produitOpt.get();
                    ProduitCommandeDetailDTO dto = new ProduitCommandeDetailDTO();

                    dto.setId(produit.getIdProduit());
                    dto.setLibelle(produit.getLibelle());
                    dto.setImageUrl(produit.getImageUrl());

                    if (produit.getCategorie() != null) {
                        dto.setCategorieId(produit.getCategorie().getIdCategorie());
                        dto.setCategorieNom(produit.getCategorie().getNomCategorie());
                    } else {
                        dto.setCategorieId(null);
                        dto.setCategorieNom("Non catégorisé");
                    }

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
                    System.out.println("⚠️ Produit ID " + produitId + " non trouvé en base - ignoré");
                }
            } catch (Exception e) {
                System.out.println("❌ Erreur produit ID " + produitId + ": " + e.getMessage());
            }
        }

        return produits;
    }

    /**
     * Convertit une map de produits en DTO (sans token - méthode dépréciée)
     */
    @Deprecated
    public static List<ProduitCommandeDetailDTO> fromMap(
            Map<Integer, Integer> produitsMap,
            ProduitService produitService) {
        return fromMap(produitsMap, produitService, null);
    }

    public String getCategorieDisplay() {
        return categorieNom != null ? categorieNom : "Non catégorisé";
    }

    public boolean hasCategorie() {
        return categorieId != null && categorieNom != null;
    }
}