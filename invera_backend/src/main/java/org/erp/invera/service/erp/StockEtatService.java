package org.erp.invera.service.erp;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.erp.stockmouvement.StockEtatDTO;
import org.erp.invera.model.erp.Produit;
import org.erp.invera.model.erp.Produit.StockStatus;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.erp.invera.security.JwtTokenProvider;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service d'état des stocks - MULTI-TENANT.
 * Architecture : 1 base = 1 client → Pas besoin de tenant_id dans les requêtes
 */
@Service
@RequiredArgsConstructor
public class StockEtatService {

    private final TenantAwareRepository tenantRepo;
    private final JwtTokenProvider jwtTokenProvider;

    // ==================== ROW MAPPER ====================

    private RowMapper<Produit> produitRowMapper() {
        return (rs, rowNum) -> {
            Produit produit = new Produit();
            produit.setIdProduit(rs.getInt("id_produit"));
            produit.setLibelle(rs.getString("libelle"));
            produit.setPrixVente(rs.getDouble("prix_vente"));
            produit.setQuantiteStock(rs.getInt("quantite_stock"));
            produit.setSeuilMinimum(rs.getInt("seuil_minimum"));
            produit.setActive(rs.getBoolean("is_active"));

            String status = rs.getString("status");
            if (status != null) {
                produit.setStatus(StockStatus.valueOf(status));
            }

            String uniteMesure = rs.getString("unite_mesure");
            if (uniteMesure != null) {
                produit.setUniteMesure(Produit.UniteMesure.valueOf(uniteMesure));
            }

            // Catégorie
            if (rs.getObject("categorie_id") != null) {
                org.erp.invera.model.erp.Categorie categorie = new org.erp.invera.model.erp.Categorie();
                categorie.setIdCategorie(rs.getInt("categorie_id"));
                categorie.setNomCategorie(rs.getString("categorie_nom"));
                produit.setCategorie(categorie);
            }

            return produit;
        };
    }

    private Long getClientIdFromToken(String token) {
        return jwtTokenProvider.getClientIdFromToken(token);
    }

    // ==================== MÉTHODES ====================

    /**
     * Obtenir l'état de stock complet avec filtres
     */
    public List<StockEtatDTO> getEtatStock(Integer categorieId, Boolean seuilAlerte, Boolean rupture, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // ✅ PAS de tenant_id dans la requête (1 base = 1 client)
        StringBuilder sql = new StringBuilder("""
            SELECT p.*, 
                   c.id_categorie as categorie_id, 
                   c.nom_categorie as categorie_nom
            FROM produit p
            LEFT JOIN categorie c ON p.categorie_id = c.id_categorie
            WHERE p.is_active = true
            """);

        if (categorieId != null) {
            sql.append(" AND p.categorie_id = ").append(categorieId);
        }
        sql.append(" ORDER BY p.libelle");

        List<Produit> produits = tenantRepo.query(sql.toString(), produitRowMapper(), clientId, authClientId);

        return produits.stream()
                .map(produit -> {
                    Integer quantiteActuelle = produit.getQuantiteStock() != null ? produit.getQuantiteStock() : 0;
                    String statutStock = determinerStatut(produit, quantiteActuelle).name();
                    return convertToDTO(produit, quantiteActuelle, statutStock);
                })
                .filter(dto -> appliquerFiltres(dto, categorieId, seuilAlerte, rupture))
                .sorted(Comparator.comparing(StockEtatDTO::getLibelle))
                .collect(Collectors.toList());
    }

    /**
     * Déterminer le statut en fonction de la quantité et du seuil
     */
    private StockStatus determinerStatut(Produit produit, Integer quantiteActuelle) {
        Integer seuilMinimum = produit.getSeuilMinimum();

        if (quantiteActuelle == null || quantiteActuelle == 0) {
            return StockStatus.RUPTURE;
        }

        if (seuilMinimum != null && seuilMinimum > 0) {
            int seuilCritique = Math.max(1, seuilMinimum / 5);
            if (quantiteActuelle <= seuilCritique) {
                return StockStatus.CRITIQUE;
            }
            if (quantiteActuelle <= seuilMinimum) {
                return StockStatus.FAIBLE;
            }
        }

        return StockStatus.EN_STOCK;
    }

    /**
     * Convertir Produit en StockEtatDTO
     */
    private StockEtatDTO convertToDTO(Produit produit, Integer quantiteActuelle, String statutStock) {
        StockEtatDTO dto = new StockEtatDTO();
        dto.setProduitId(produit.getIdProduit());
        dto.setReference(String.valueOf(produit.getIdProduit()));
        dto.setLibelle(produit.getLibelle());
        dto.setQuantiteActuelle(quantiteActuelle);
        dto.setUnite(produit.getUniteMesure() != null ? produit.getUniteMesure().name() : "PIECE");

        BigDecimal prixUnitaire = BigDecimal.valueOf(produit.getPrixVente());
        dto.setPrixUnitaire(prixUnitaire);
        dto.setSeuilAlerte(produit.getSeuilMinimum());
        dto.setStatutStock(statutStock);

        if (prixUnitaire != null && quantiteActuelle != null) {
            dto.setValeurStock(prixUnitaire.multiply(BigDecimal.valueOf(quantiteActuelle)));
        }

        if (produit.getCategorie() != null) {
            dto.setCategorieId(produit.getCategorie().getIdCategorie());
            dto.setCategorieNom(produit.getCategorie().getNomCategorie());
        }

        return dto;
    }

    /**
     * Appliquer les filtres
     */
    private boolean appliquerFiltres(StockEtatDTO dto, Integer categorieId, Boolean seuilAlerte, Boolean rupture) {
        if (categorieId != null && !categorieId.equals(dto.getCategorieId())) {
            return false;
        }

        if (seuilAlerte != null && seuilAlerte &&
                !"FAIBLE".equals(dto.getStatutStock()) &&
                !"CRITIQUE".equals(dto.getStatutStock())) {
            return false;
        }

        if (rupture != null && rupture && !"RUPTURE".equals(dto.getStatutStock())) {
            return false;
        }

        return true;
    }

    /**
     * Obtenir les produits en rupture de stock
     */
    public List<StockEtatDTO> getProduitsEnRupture(String token) {
        return getEtatStock(null, null, true, token);
    }
}