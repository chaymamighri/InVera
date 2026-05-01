package org.erp.invera.service.erp;

import org.erp.invera.model.erp.Categorie;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.erp.invera.security.JwtTokenProvider;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

/**
 * Service de gestion des catégories de produits (multi-tenant)
 */
@Service
@Transactional
public class CategorieService {

    private static final BigDecimal DEFAULT_TAUX_TVA = BigDecimal.valueOf(19);

    private final TenantAwareRepository tenantRepo;
    private final JwtTokenProvider jwtTokenProvider;

    public CategorieService(TenantAwareRepository tenantRepo,
                            JwtTokenProvider jwtTokenProvider) {
        this.tenantRepo = tenantRepo;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    // ==================== ROW MAPPER ====================

    private RowMapper<Categorie> categorieRowMapper() {
        return (rs, rowNum) -> {
            Categorie categorie = new Categorie();
            categorie.setIdCategorie(rs.getInt("id_categorie"));
            categorie.setNomCategorie(rs.getString("nom_categorie"));
            categorie.setDescription(rs.getString("description"));
            categorie.setTauxTVA(rs.getBigDecimal("taux_tva") != null ?
                    rs.getBigDecimal("taux_tva") : DEFAULT_TAUX_TVA);

            return categorie;
        };
    }

    private Long getClientIdFromToken(String token) {
        return jwtTokenProvider.getClientIdFromToken(token);
    }

    // ==================== CRUD ====================

    public Categorie save(Categorie categorie, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // Vérifier si le nom existe déjà
        String checkSql = "SELECT COUNT(*) FROM categorie WHERE nom_categorie = ?";
        Integer count = tenantRepo.queryForObject(checkSql, Integer.class, clientId, authClientId,
                categorie.getNomCategorie().trim());

        if (count != null && count > 0) {
            throw new RuntimeException("Une catégorie avec ce nom existe déjà");
        }

        // Appliquer le taux TVA par défaut si non fourni
        if (categorie.getTauxTVA() == null) {
            categorie.setTauxTVA(DEFAULT_TAUX_TVA);
        }

        // Nettoyer les données
        String nom = categorie.getNomCategorie().trim();
        String description = categorie.getDescription() != null ? categorie.getDescription().trim() : null;
        BigDecimal tauxTVA = categorie.getTauxTVA();

        // Insertion
        String insertSql = """
            INSERT INTO categorie (nom_categorie, description, taux_tva, created_by, created_at)
            VALUES (?, ?, ?, ?, ?)
            RETURNING id_categorie
            """;

        Integer id = tenantRepo.queryForObject(insertSql, Integer.class, clientId, authClientId,
                nom, description, tauxTVA, "system", java.time.LocalDateTime.now());

        // Récupérer la catégorie créée
        String selectSql = "SELECT * FROM categorie WHERE id_categorie = ?";
        return tenantRepo.queryForObject(selectSql, categorieRowMapper(), clientId, authClientId, id);
    }

    public List<Categorie> findAll(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT * FROM categorie ORDER BY nom_categorie ASC";
        return tenantRepo.query(sql, categorieRowMapper(), clientId, authClientId);
    }

    public Categorie findById(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT * FROM categorie WHERE id_categorie = ?";
        Categorie categorie = tenantRepo.queryForObject(sql, categorieRowMapper(), clientId, authClientId, id);

        if (categorie == null) {
            throw new RuntimeException("Catégorie non trouvée avec l'ID: " + id);
        }
        return categorie;
    }

    public void deleteById(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // Vérifier si la catégorie a des produits associés
        String checkProduitsSql = "SELECT COUNT(*) FROM produit WHERE categorie_id = ?";
        Integer countProduits = tenantRepo.queryForObject(checkProduitsSql, Integer.class, clientId, authClientId, id);

        if (countProduits != null && countProduits > 0) {
            throw new RuntimeException("Impossible de supprimer cette catégorie car elle contient " + countProduits + " produit(s)");
        }

        String deleteSql = "DELETE FROM categorie WHERE id_categorie = ?";
        int deleted = tenantRepo.update(deleteSql, clientId, authClientId, id);

        if (deleted == 0) {
            throw new RuntimeException("Catégorie non trouvée avec l'ID: " + id);
        }
    }

    public Categorie update(Integer id, Categorie categorieDetails, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // Récupérer la catégorie existante
        Categorie existingCategorie = findById(id, token);

        // Vérifier si le nouveau nom n'est pas déjà utilisé par une autre catégorie
        if (!existingCategorie.getNomCategorie().equalsIgnoreCase(categorieDetails.getNomCategorie())) {
            String checkSql = "SELECT COUNT(*) FROM categorie WHERE nom_categorie = ? AND id_categorie != ?";
            Integer count = tenantRepo.queryForObject(checkSql, Integer.class, clientId, authClientId,
                    categorieDetails.getNomCategorie().trim(), id);

            if (count != null && count > 0) {
                throw new RuntimeException("Une catégorie avec ce nom existe déjà");
            }
        }

        // Préparer les valeurs mises à jour
        String nom = categorieDetails.getNomCategorie().trim();
        String description = categorieDetails.getDescription() != null ? categorieDetails.getDescription().trim() : null;
        BigDecimal tauxTVA = categorieDetails.getTauxTVA() != null ?
                categorieDetails.getTauxTVA() : existingCategorie.getTauxTVA();

        // Mettre à jour
        String updateSql = """
            UPDATE categorie 
            SET nom_categorie = ?, description = ?, taux_tva = ?
            WHERE id_categorie = ?
            """;

        int updated = tenantRepo.update(updateSql, clientId, authClientId, nom, description, tauxTVA, id);

        if (updated == 0) {
            throw new RuntimeException("Erreur lors de la mise à jour de la catégorie");
        }

        // Retourner la catégorie mise à jour
        return findById(id, token);
    }

    public List<Categorie> search(String keyword, String token) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return findAll(token);
        }

        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT * FROM categorie WHERE LOWER(nom_categorie) LIKE ? ORDER BY nom_categorie ASC";
        String searchPattern = "%" + keyword.toLowerCase().trim() + "%";

        return tenantRepo.query(sql, categorieRowMapper(), clientId, authClientId, searchPattern);
    }
}