package org.erp.invera.repository.tenant;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.service.tenant.TenantDatabaseService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Repository
@RequiredArgsConstructor
public class TenantAwareRepository {

    private final TenantDatabaseService tenantDatabaseService;

    // ============================================================
    // MÉTHODES POUR L'AUTHENTIFICATION (avec authenticatedClientId)
    // ============================================================

    public JdbcTemplate getClientJdbcTemplate(Long clientId, String authenticatedClientId) {
        return tenantDatabaseService.getClientJdbcTemplate(clientId, authenticatedClientId);
    }

    // ✅ Pour l'authentification - RowMapper (RENOMMÉE pour éviter ambiguïté)
    public <T> T queryForObjectAuth(String sql, RowMapper<T> rowMapper, Long clientId, String authenticatedClientId, Object... args) {
        JdbcTemplate jdbc = getClientJdbcTemplate(clientId, authenticatedClientId);
        try {
            return jdbc.queryForObject(sql, rowMapper, args);
        } catch (Exception e) {
            log.debug("Aucun résultat trouvé pour la requête: {}", sql);
            return null;
        }
    }

    // Dans TenantAwareRepository.java, ajoutez cette méthode après updateAuth :

    // ✅ Pour l'authentification - Query avec RowMapper (pour les listes)
    public <T> List<T> queryWithAuth(String sql, RowMapper<T> rowMapper, Long clientId, String authenticatedClientId, Object... args) {
        JdbcTemplate jdbc = getClientJdbcTemplate(clientId, authenticatedClientId);
        log.info("🔧 [queryWithAuth] clientId: {}, sql: {}", clientId, sql);
        return jdbc.query(sql, rowMapper, args);
    }

    // Dans TenantAwareRepository.java, ajoutez cette méthode :

    // ✅ Pour l'authentification - UPDATE (pour les opérations d'écriture)
    public int updateWithAuth(String sql, Long clientId, String authenticatedClientId, Object... args) {
        JdbcTemplate jdbc = getClientJdbcTemplate(clientId, authenticatedClientId);
        log.info("🔧 [updateWithAuth] clientId: {}, sql: {}", clientId, sql);
        return jdbc.update(sql, args);
    }

    // ✅ Pour l'authentification - Class (RENOMMÉE)
    public <T> T queryForObjectAuth(String sql, Class<T> requiredType, Long clientId, String authenticatedClientId, Object... args) {
        JdbcTemplate jdbc = getClientJdbcTemplate(clientId, authenticatedClientId);
        try {
            return jdbc.queryForObject(sql, requiredType, args);
        } catch (Exception e) {
            log.debug("Aucun résultat trouvé pour la requête: {}", sql);
            return null;
        }
    }

    // ✅ Pour l'authentification - UPDATE (RENOMMÉE)
    public int updateAuth(String sql, Long clientId, String authenticatedClientId, Object... args) {
        JdbcTemplate jdbc = getClientJdbcTemplate(clientId, authenticatedClientId);
        log.info("🔧 [updateAuth] clientId: {}, sql: {}", clientId, sql);
        return jdbc.update(sql, args);
    }

    // ============================================================
    // MÉTHODES POUR LES SERVICES MULTI-TENANT (sans authenticatedClientId)
    // ============================================================

    public <T> List<T> query(String sql, RowMapper<T> rowMapper, Long clientId, Object... args) {
        JdbcTemplate jdbc = tenantDatabaseService.getClientJdbcTemplate(clientId, String.valueOf(clientId));
        return jdbc.query(sql, rowMapper, args);
    }

    public <T> T queryForObject(String sql, RowMapper<T> rowMapper, Long clientId, Object... args) {
        JdbcTemplate jdbc = tenantDatabaseService.getClientJdbcTemplate(clientId, String.valueOf(clientId));
        try {
            return jdbc.queryForObject(sql, rowMapper, args);
        } catch (Exception e) {
            log.debug("Aucun résultat trouvé pour la requête: {}", sql);
            return null;
        }
    }

    public <T> T queryForObject(String sql, Class<T> requiredType, Long clientId, Object... args) {
        JdbcTemplate jdbc = tenantDatabaseService.getClientJdbcTemplate(clientId, String.valueOf(clientId));
        try {
            return jdbc.queryForObject(sql, requiredType, args);
        } catch (Exception e) {
            log.debug("Aucun résultat trouvé pour la requête: {}", sql);
            return null;
        }
    }

    public int update(String sql, Long clientId, Object... args) {
        JdbcTemplate jdbc = tenantDatabaseService.getClientJdbcTemplate(clientId, String.valueOf(clientId));
        log.info("🔧 [UPDATE] clientId: {}, sql: {}", clientId, sql);
        log.info("🔧 [UPDATE] args: {}", Arrays.toString(args));
        return jdbc.update(sql, args);
    }

    public int execute(String sql, Long clientId) {
        JdbcTemplate jdbc = tenantDatabaseService.getClientJdbcTemplate(clientId, String.valueOf(clientId));
        jdbc.execute(sql);
        return 1;
    }

    public int[] batchUpdate(String sql, Long clientId, List<Object[]> batchArgs) {
        JdbcTemplate jdbc = tenantDatabaseService.getClientJdbcTemplate(clientId, String.valueOf(clientId));
        return jdbc.batchUpdate(sql, batchArgs);
    }

    public boolean tableExists(Long clientId, String tableName) {
        String sql = """
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = ?
        """;
        Integer count = queryForObject(sql, Integer.class, clientId, tableName);
        return count != null && count > 0;
    }

    public Long getNextSequenceValue(Long clientId, String sequenceName) {
        String sql = "SELECT nextval('" + sequenceName + "')";
        return queryForObject(sql, Long.class, clientId);
    }

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

    public int count(String sql, Long clientId, Object... args) {
        JdbcTemplate jdbc = tenantDatabaseService.getClientJdbcTemplate(clientId, String.valueOf(clientId));
        try {
            return jdbc.queryForObject(sql, Integer.class, args);
        } catch (Exception e) {
            log.debug("Erreur lors du comptage: {}", e.getMessage());
            return 0;
        }
    }

    public boolean exists(String sql, Long clientId, Object... args) {
        Integer count = queryForObject(sql, Integer.class, clientId, args);
        return count != null && count > 0;
    }
}