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

    public JdbcTemplate getClientJdbcTemplate(Long clientId, String authenticatedClientId) {
        return tenantDatabaseService.getClientJdbcTemplate(clientId, authenticatedClientId);
    }

    /**
     * Exécute une requête SELECT et retourne une liste d'objets
     */
    public <T> List<T> query(String sql, RowMapper<T> rowMapper, Long clientId, String authenticatedClientId, Object... args) {
        JdbcTemplate jdbc = getClientJdbcTemplate(clientId, authenticatedClientId);
        return jdbc.query(sql, rowMapper, args);
    }

    /**
     * Exécute une requête SELECT et retourne un seul objet (ou null si non trouvé)
     */
    public <T> T queryForObject(String sql, RowMapper<T> rowMapper, Long clientId, String authenticatedClientId, Object... args) {
        JdbcTemplate jdbc = getClientJdbcTemplate(clientId, authenticatedClientId);
        try {
            return jdbc.queryForObject(sql, rowMapper, args);
        } catch (Exception e) {
            log.debug("Aucun résultat trouvé pour la requête: {}", sql);
            return null;
        }
    }

    /**
     * Exécute une requête SELECT et retourne un seul objet d'un type simple (String, Integer, etc.)
     */
    public <T> T queryForObject(String sql, Class<T> requiredType, Long clientId, String authenticatedClientId, Object... args) {
        JdbcTemplate jdbc = getClientJdbcTemplate(clientId, authenticatedClientId);
        try {
            return jdbc.queryForObject(sql, requiredType, args);
        } catch (Exception e) {
            log.debug("Aucun résultat trouvé pour la requête: {}", sql);
            return null;
        }
    }

    /**
     * Exécute une requête UPDATE/INSERT/DELETE
     */
    public int update(String sql, Long clientId, String authenticatedClientId, Object... args) {
        JdbcTemplate jdbc = getClientJdbcTemplate(clientId, authenticatedClientId);
        return jdbc.update(sql, args);
    }
}