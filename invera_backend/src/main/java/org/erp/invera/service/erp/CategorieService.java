package org.erp.invera.service.erp;

import org.erp.invera.model.erp.Categorie;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.erp.invera.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class CategorieService {

    private static final Logger log = LoggerFactory.getLogger(CategorieService.class);
    private static final BigDecimal DEFAULT_TAUX_TVA = BigDecimal.valueOf(19);

    private final TenantAwareRepository tenantRepo;
    private final JwtTokenProvider jwtTokenProvider;

    public CategorieService(TenantAwareRepository tenantRepo,
                            JwtTokenProvider jwtTokenProvider) {
        this.tenantRepo = tenantRepo;
        this.jwtTokenProvider = jwtTokenProvider;
    }

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

    @Transactional
    public Categorie save(Categorie categorie, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        log.info("📝 Création catégorie pour clientId: {}", clientId);

        // ✅ Utiliser queryForObjectAuth avec RowMapper
        String checkSql = "SELECT COUNT(*) FROM categorie WHERE nom_categorie = ?";
        Integer count = tenantRepo.queryForObjectAuth(checkSql, (RowMapper<Integer>) (rs, rowNum) -> rs.getInt(1),
                clientId, authClientId, categorie.getNomCategorie().trim());

        log.info("📊 Vérification existence: count={}", count);

        if (count != null && count > 0) {
            throw new RuntimeException("Une catégorie avec ce nom existe déjà");
        }

        if (categorie.getTauxTVA() == null) {
            categorie.setTauxTVA(DEFAULT_TAUX_TVA);
        }

        String nom = categorie.getNomCategorie().trim();
        String description = categorie.getDescription() != null ? categorie.getDescription().trim() : null;
        BigDecimal tauxTVA = categorie.getTauxTVA();

        // ✅ Utiliser queryForObjectAuth pour l'ID
        String getIdSql = "SELECT nextval('categorie_id_categorie_seq')";
        Long generatedId = tenantRepo.queryForObjectAuth(getIdSql, (RowMapper<Long>) (rs, rowNum) -> rs.getLong(1),
                clientId, authClientId);

        log.info("📊 ID généré: {}", generatedId);

        if (generatedId == null) {
            throw new RuntimeException("Impossible de générer un ID");
        }

        // ✅ Insertion avec updateWithAuth
        String insertSql = """
            INSERT INTO categorie (id_categorie, nom_categorie, description, taux_tva, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """;

        int affectedRows = tenantRepo.updateWithAuth(insertSql, clientId, authClientId,
                generatedId.intValue(),
                nom,
                description,
                tauxTVA,
                "system",
                LocalDateTime.now());

        log.info("✅ INSERT exécuté, affectedRows={}", affectedRows);

        if (affectedRows == 0) {
            throw new RuntimeException("Erreur lors de la création");
        }

        categorie.setIdCategorie(generatedId.intValue());

        log.info("✅ Catégorie créée: ID={}, Nom={}", generatedId, nom);

        return categorie;
    }

    public List<Categorie> findAll(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT * FROM categorie ORDER BY nom_categorie ASC";
        // ✅ Utiliser queryWithAuth
        return tenantRepo.queryWithAuth(sql, categorieRowMapper(), clientId, authClientId);
    }

    public Categorie findById(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT * FROM categorie WHERE id_categorie = ?";
        // ✅ Utiliser queryForObjectAuth
        Categorie categorie = tenantRepo.queryForObjectAuth(sql, categorieRowMapper(), clientId, authClientId, id);

        if (categorie == null) {
            throw new RuntimeException("Catégorie non trouvée avec l'ID: " + id);
        }
        return categorie;
    }

    @Transactional
    public void deleteById(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // Vérifier si la catégorie a des produits associés
        String checkProduitsSql = "SELECT COUNT(*) FROM produit WHERE categorie_id = ?";
        // ✅ Utiliser queryForObjectAuth
        Integer countProduits = tenantRepo.queryForObjectAuth(checkProduitsSql, (RowMapper<Integer>) (rs, rowNum) -> rs.getInt(1),
                clientId, authClientId, id);

        if (countProduits != null && countProduits > 0) {
            throw new RuntimeException("Impossible de supprimer cette catégorie car elle contient " + countProduits + " produit(s)");
        }

        String deleteSql = "DELETE FROM categorie WHERE id_categorie = ?";
        // ✅ Utiliser updateWithAuth
        int deleted = tenantRepo.updateWithAuth(deleteSql, clientId, authClientId, id);

        if (deleted == 0) {
            throw new RuntimeException("Catégorie non trouvée avec l'ID: " + id);
        }

        log.info("✅ Catégorie supprimée: ID={}", id);
    }

    @Transactional
    public Categorie update(Integer id, Categorie categorieDetails, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        log.info("📝 Mise à jour catégorie ID: {} pour clientId: {}", id, clientId);

        // Récupérer la catégorie existante
        Categorie existingCategorie = findById(id, token);

        log.info("📊 Catégorie existante: id={}, nom={}, tauxTVA={}, description={}",
                existingCategorie.getIdCategorie(),
                existingCategorie.getNomCategorie(),
                existingCategorie.getTauxTVA(),
                existingCategorie.getDescription());

        // Vérifier si le nouveau nom n'est pas déjà utilisé
        if (!existingCategorie.getNomCategorie().equalsIgnoreCase(categorieDetails.getNomCategorie())) {
            String checkSql = "SELECT COUNT(*) FROM categorie WHERE nom_categorie = ? AND id_categorie != ?";
            // ✅ Utiliser queryForObjectAuth
            Integer count = tenantRepo.queryForObjectAuth(checkSql, (RowMapper<Integer>) (rs, rowNum) -> rs.getInt(1),
                    clientId, authClientId, categorieDetails.getNomCategorie().trim(), id);

            log.info("📊 Vérification nom: count={}", count);

            if (count != null && count > 0) {
                throw new RuntimeException("Une catégorie avec ce nom existe déjà");
            }
        }

        // Préparer les valeurs mises à jour
        String nom = categorieDetails.getNomCategorie().trim();
        String description = categorieDetails.getDescription() != null ? categorieDetails.getDescription().trim() : null;
        BigDecimal tauxTVA = categorieDetails.getTauxTVA() != null ?
                categorieDetails.getTauxTVA() : existingCategorie.getTauxTVA();

        log.info("📝 Nouvelles valeurs: nom='{}', description='{}', tauxTVA={}", nom, description, tauxTVA);

        // ✅ Exécuter l'UPDATE avec updateWithAuth
        String updateSql = """
            UPDATE categorie 
            SET nom_categorie = ?, description = ?, taux_tva = ?
            WHERE id_categorie = ?
            """;

        log.info("📝 SQL Update: {}", updateSql);
        log.info("📝 Paramètres: nom={}, description={}, tauxTVA={}, id={}", nom, description, tauxTVA, id);

        int updated = tenantRepo.updateWithAuth(updateSql, clientId, authClientId, nom, description, tauxTVA, id);

        log.info("✅ UPDATE exécuté, affectedRows={}", updated);

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

        // ✅ Utiliser queryWithAuth
        return tenantRepo.queryWithAuth(sql, categorieRowMapper(), clientId, authClientId, searchPattern);
    }
}