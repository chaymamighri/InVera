package org.erp.invera.service.tenant;

import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Client;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.erp.invera.service.platform.CredentialService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantDatabaseService {

    private final ClientPlatformRepository clientRepository;
    private final CredentialService credentialService;

    @Value("${spring.datasource.driver-class-name:org.postgresql.Driver}")
    private String driverClassName;

    // Cache des connexions par client
    private final ConcurrentHashMap<Long, JdbcTemplate> clientJdbcTemplateCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, DataSource> clientDataSourceCache = new ConcurrentHashMap<>();

    /**
     * Récupère la connexion à la base du client
     */
    public JdbcTemplate getClientJdbcTemplate(Long clientId, String authenticatedClientId) {
        // ✅ Vérification : l'utilisateur ne peut accéder qu'à SA propre base
        if (authenticatedClientId == null) {
            throw new SecurityException("Authentification requise");
        }

        try {
            Long authClientId = Long.parseLong(authenticatedClientId);
            if (!clientId.equals(authClientId)) {
                log.warn("⚠️ Tentative d'accès non autorisé: clientId={}, authenticatedClientId={}",
                        clientId, authenticatedClientId);
                throw new SecurityException("Accès non autorisé à la base d'un autre client");
            }
        } catch (NumberFormatException e) {
            throw new SecurityException("ID client invalide: " + authenticatedClientId);
        }

        return clientJdbcTemplateCache.computeIfAbsent(clientId, id -> {
            log.info("🔌 Création nouvelle connexion pour client {}", clientId);

            Client client = clientRepository.findById(clientId)
                    .orElseThrow(() -> new RuntimeException("Client non trouvé: " + clientId));

            // ✅ Valider le nom de la base
            String dbName = client.getNomBaseDonnees();
            log.info("🔥 DATABASE UTILISÉE: {}", dbName);
            if (dbName == null || dbName.trim().isEmpty()) {
                throw new RuntimeException("Nom de base de données non configuré pour client " + clientId);
            }

            // ✅ Éviter les injections SQL
            if (!dbName.matches("^[a-zA-Z][a-zA-Z0-9_]*$")) {
                throw new RuntimeException("Nom de base de données invalide: " + dbName);
            }

            // ✅ Récupérer les credentials stockés pour ce client
            CredentialService.Credentials creds;
            try {
                creds = credentialService.getCredentials(clientId);
                log.debug("✅ Credentials récupérés pour client {}", clientId);
            } catch (Exception e) {
                log.error("❌ Impossible de récupérer les credentials pour client {}: {}", clientId, e.getMessage());
                throw new RuntimeException("Erreur de récupération des credentials", e);
            }

            // ✅ Utiliser DriverManagerDataSource au lieu de SingleConnectionDataSource
            // (ferme les connexions correctement)
            DriverManagerDataSource dataSource = new DriverManagerDataSource();
            dataSource.setDriverClassName(driverClassName);
            dataSource.setUrl(String.format("jdbc:postgresql://localhost:5432/%s", dbName));
            dataSource.setUsername(creds.username());
            dataSource.setPassword(creds.password());

            // Tester la connexion
            try (Connection testConn = dataSource.getConnection()) {
                if (!testConn.isValid(5)) {
                    throw new RuntimeException("Connexion invalide à la base " + dbName);
                }
                log.info("✅ Test de connexion réussi pour client {} - Base: {}", clientId, dbName);
            } catch (SQLException e) {
                log.error("❌ Échec de connexion à la base {}: {}", dbName, e.getMessage());
                throw new RuntimeException("Impossible de se connecter à la base du client: " + dbName, e);
            }

            clientDataSourceCache.put(clientId, dataSource);
            return new JdbcTemplate(dataSource);
        });
    }

    /**
     * Exécute une requête sur la base du client avec gestion d'erreur
     */
    public <T> T executeInTenantContext(Long clientId, String authenticatedClientId,
                                        TenantDatabaseCallback<T> callback) {
        JdbcTemplate jdbcTemplate = getClientJdbcTemplate(clientId, authenticatedClientId);
        try {
            return callback.doInConnection(jdbcTemplate);
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'exécution sur la base du client {}: {}", clientId, e.getMessage());
            throw new RuntimeException("Erreur d'accès à la base client", e);
        }
    }

    /**
     * Récupère le DataSource du client (pour transactions)
     */
    public DataSource getClientDataSource(Long clientId, String authenticatedClientId) {
        // Forcer l'initialisation du JdbcTemplate pour avoir le DataSource
        getClientJdbcTemplate(clientId, authenticatedClientId);
        return clientDataSourceCache.get(clientId);
    }

    /**
     * Invalide le cache pour un client
     */
    public void invalidateCache(Long clientId) {
        DataSource ds = clientDataSourceCache.remove(clientId);
        if (ds instanceof DriverManagerDataSource) {
            // DriverManagerDataSource n'a pas de close explicite
            log.debug("DataSource supprimé du cache pour client {}", clientId);
        }
        clientJdbcTemplateCache.remove(clientId);
        log.info("✅ Cache invalidé pour client {}", clientId);
    }

    /**
     * Nettoie toutes les connexions (appelé à l'arrêt)
     */
    @PreDestroy
    public void cleanup() {
        log.info("🧹 Nettoyage de toutes les connexions client...");
        int cacheSize = clientJdbcTemplateCache.size();
        clientJdbcTemplateCache.clear();
        clientDataSourceCache.clear();
        log.info("✅ {} connexions client fermées", cacheSize);
    }

    /**
     * Vérifie si une connexion existe pour un client
     */
    public boolean hasConnection(Long clientId) {
        return clientJdbcTemplateCache.containsKey(clientId);
    }

    /**
     * Interface pour callbacks tenant-aware
     */
    @FunctionalInterface
    public interface TenantDatabaseCallback<T> {
        T doInConnection(JdbcTemplate jdbcTemplate);
    }
}