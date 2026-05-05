package org.erp.invera.repository.tenant;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.service.tenant.TenantDatabaseService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Slf4j
@Repository
@RequiredArgsConstructor
public class TenantAwareRepository {

    private final TenantDatabaseService tenantDatabaseService;

    // ===== MÉTHODES AVEC authenticatedClientId (existant) =====

    public JdbcTemplate getClientJdbcTemplate(Long clientId, String authenticatedClientId) {
        return tenantDatabaseService.getClientJdbcTemplate(clientId, authenticatedClientId);
    }

    public <T> List<T> query(String sql, RowMapper<T> rowMapper, Long clientId, String authenticatedClientId, Object... args) {
        JdbcTemplate jdbc = getClientJdbcTemplate(clientId, authenticatedClientId);
        return jdbc.query(sql, rowMapper, args);
    }

    public <T> T queryForObject(String sql, RowMapper<T> rowMapper, Long clientId, String authenticatedClientId, Object... args) {
        JdbcTemplate jdbc = getClientJdbcTemplate(clientId, authenticatedClientId);
        try {
            return jdbc.queryForObject(sql, rowMapper, args);
        } catch (Exception e) {
            log.debug("Aucun résultat trouvé pour la requête: {}", sql);
            return null;
        }
    }

    // Méthode pour les requêtes avec authenticatedClientId explicite
    public <T> T queryForObjectWithAuth(String sql, RowMapper<T> rowMapper, Long clientId, String authenticatedClientId, Object... args) {
        JdbcTemplate jdbc = tenantDatabaseService.getClientJdbcTemplate(clientId, authenticatedClientId);
        try {
            return jdbc.queryForObject(sql, rowMapper, args);
        } catch (Exception e) {
            return null;
        }
    }

    // Méthode pour les requêtes sans authenticatedClientId
    public <T> T queryForObjectSimple(String sql, RowMapper<T> rowMapper, Long clientId, Object... args) {
        return queryForObjectWithAuth(sql, rowMapper, clientId, String.valueOf(clientId), args);
    }

    public <T> T queryForObject(String sql, Class<T> requiredType, Long clientId, String authenticatedClientId, Object... args) {
        JdbcTemplate jdbc = getClientJdbcTemplate(clientId, authenticatedClientId);
        try {
            return jdbc.queryForObject(sql, requiredType, args);
        } catch (Exception e) {
            log.debug("Aucun résultat trouvé pour la requête: {}", sql);
            return null;
        }
    }

    public int update(String sql, Long clientId, String authenticatedClientId, Object... args) {
        JdbcTemplate jdbc = getClientJdbcTemplate(clientId, authenticatedClientId);
        return jdbc.update(sql, args);
    }

    // ===== NOUVELLES MÉTHODES SANS authenticatedClientId (utilise le contexte) =====
    // À utiliser quand on a déjà le clientId dans le contexte (token JWT)

    /**
     * Exécute une requête SELECT et retourne une liste d'objets
     * Utilise le clientId du contexte (token JWT)
     */
    public <T> List<T> query(String sql, RowMapper<T> rowMapper, Long clientId, Object... args) {
        JdbcTemplate jdbc = tenantDatabaseService.getClientJdbcTemplate(clientId, String.valueOf(clientId));
        return jdbc.query(sql, rowMapper, args);
    }

    /**
     * Exécute une requête SELECT et retourne un seul objet (ou null si non trouvé)
     * Utilise le clientId du contexte (token JWT)
     */
    public <T> T queryForObject(String sql, RowMapper<T> rowMapper, Long clientId, Object... args) {
        JdbcTemplate jdbc = tenantDatabaseService.getClientJdbcTemplate(clientId, String.valueOf(clientId));
        try {
            return jdbc.queryForObject(sql, rowMapper, args);
        } catch (Exception e) {
            log.debug("Aucun résultat trouvé pour la requête: {}", sql);
            return null;
        }
    }

    /**
     * Exécute une requête SELECT et retourne un seul objet d'un type simple (String, Integer, etc.)
     * Utilise le clientId du contexte (token JWT)
     */
    public <T> T queryForObject(String sql, Class<T> requiredType, Long clientId, Object... args) {
        JdbcTemplate jdbc = tenantDatabaseService.getClientJdbcTemplate(clientId, String.valueOf(clientId));
        try {
            return jdbc.queryForObject(sql, requiredType, args);
        } catch (Exception e) {
            log.debug("Aucun résultat trouvé pour la requête: {}", sql);
            return null;
        }
    }

    /**
     * Exécute une requête UPDATE/INSERT/DELETE
     * Utilise le clientId du contexte (token JWT)
     */
    public int update(String sql, Long clientId, Object... args) {
        JdbcTemplate jdbc = tenantDatabaseService.getClientJdbcTemplate(clientId, String.valueOf(clientId));
        return jdbc.update(sql, args);
    }

    /**
     * Exécute une requête et retourne le nombre de lignes affectées
     */
    public int execute(String sql, Long clientId) {
        JdbcTemplate jdbc = tenantDatabaseService.getClientJdbcTemplate(clientId, String.valueOf(clientId));
        jdbc.execute(sql);
        return 1;
    }

    /**
     * Exécute une requête batch (plusieurs updates)
     */
    public int[] batchUpdate(String sql, Long clientId, List<Object[]> batchArgs) {
        JdbcTemplate jdbc = tenantDatabaseService.getClientJdbcTemplate(clientId, String.valueOf(clientId));
        return jdbc.batchUpdate(sql, batchArgs);
    }

    /**
     * Vérifie si une table existe
     */
    public boolean tableExists(Long clientId, String tableName) {
        String sql = """
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = ?
        """;
        Integer count = queryForObject(sql, Integer.class, clientId, tableName);
        return count != null && count > 0;
    }

    /**
     * Récupère le prochain ID d'une séquence (pour les insertions manuelles)
     */
    public Long getNextSequenceValue(Long clientId, String sequenceName) {
        String sql = "SELECT nextval('" + sequenceName + "')";
        return queryForObject(sql, Long.class, clientId);
    }

    /**
     * Exécute une requête avec gestion de pagination
     */
    public <T> List<T> queryWithPagination(String sql, RowMapper<T> rowMapper, Long clientId,
                                           int page, int size, Object... args) {
        int offset = page * size;
        String paginatedSql = sql + " LIMIT ? OFFSET ?";

        Object[] newArgs = new Object[args.length + 2];
        System.arraycopy(args, 0, newArgs, 0, args.length);
        newArgs[args.length] = size;
        newArgs[args.length + 1] = offset;

        return query(paginatedSql, rowMapper, clientId, newArgs);
    }

    /**
     * Compte le nombre de lignes d'une requête
     */
    public int count(String sql, Long clientId, Object... args) {
        JdbcTemplate jdbc = tenantDatabaseService.getClientJdbcTemplate(clientId, String.valueOf(clientId));
        try {
            return jdbc.queryForObject(sql, Integer.class, args);
        } catch (Exception e) {
            log.debug("Erreur lors du comptage: {}", e.getMessage());
            return 0;
        }
    }

    /**
     * Vérifie si une ligne existe
     */
    public boolean exists(String sql, Long clientId, Object... args) {
        Integer count = queryForObject(sql, Integer.class, clientId, args);
        return count != null && count > 0;
    }
}