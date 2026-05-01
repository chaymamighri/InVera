package org.erp.invera.service.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Client;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service de création et gestion des bases de données clients
 *
 * <p>Rôle : Créer une base PostgreSQL dédiée pour chaque client</p>
 * <p>Principe : 1 client = 1 base = 1 compte utilisateur = 1 ERP indépendant</p>
 *
 * @author Invera Team
 * @version 2.0 (avec isolation totale)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DatabaseCreationService {

    @Qualifier("platformJdbcTemplate")
    private final JdbcTemplate platformJdbcTemplate;

    private final ClientPlatformRepository clientRepository;
    private final CredentialService credentialService;

    // ============================================================
    // CONSTANTES
    // ============================================================

    /** Base template servant de modèle pour créer les bases clients */
    private static final String TEMPLATE_DB = "template_invera";

    /** Génération de mots de passe sécurisés */
    private static final SecureRandom random = new SecureRandom();

    // ============================================================
    // REQUÊTES SQL PRÉPARÉES (protection injection SQL)
    // ============================================================

    private static final String CHECK_DB_EXISTS = "SELECT 1 FROM pg_database WHERE datname = ?";
    private static final String LIST_CLIENT_DBS = "SELECT datname FROM pg_database WHERE datname LIKE 'client_%'";
    private static final String TERMINATE_CONNECTIONS = """
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE datname = ? AND pid <> pg_backend_pid()
        """;
    private static final String CHECK_USER_EXISTS = "SELECT 1 FROM pg_roles WHERE rolname = ?";



    // ============================================================
    // CRÉATION DE BASE (avec isolation totale)
    // ============================================================

    /**
     * Crée une base dédiée pour un client avec son propre compte PostgreSQL
     *
     * @param clientId ID du client
     * @return Informations de connexion à la base créée (UNIQUEMENT pour ce client)
     * @throws RuntimeException si client non trouvé ou erreur création
     */
    public DatabaseInfo createClientDatabase(Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client non trouvé: " + clientId));

        String dbName = generateDatabaseName(clientId);
        String userName = generateUsername(clientId);
        String password = generateSecurePassword();

        log.info("🚀 Création base pour client {} ({})", clientId, client.getEmail());
        log.info("   Database: {}", dbName);
        log.info("   User dédié: {}", userName);

        try {
            // 1. Vérifier si la base existe déjà
            if (databaseExists(dbName)) {
                log.warn("⚠️ Base {} existe déjà", dbName);
                return new DatabaseInfo(dbName, userName, password, getConnectionUrl(dbName));
            }
            terminateConnections(TEMPLATE_DB);

            // Attendre un peu
            Thread.sleep(200);

            // 2. Créer la base à partir du template
            String createDbSql = String.format(
                    "CREATE DATABASE %s WITH TEMPLATE %s OWNER postgres",
                    sanitizeIdentifier(dbName), sanitizeIdentifier(TEMPLATE_DB)
            );
            platformJdbcTemplate.execute(createDbSql);
            log.info("✅ Base créée: {}", dbName);

            // 3. Créer l'utilisateur DÉDIÉ à CE client
            String createUserSql = String.format(
                    "CREATE USER %s WITH PASSWORD '%s'",
                    sanitizeIdentifier(userName), password
            );
            platformJdbcTemplate.execute(createUserSql);
            log.info("✅ Utilisateur dédié créé: {}", userName);

            // 4. Donner les droits sur la base
            String grantDbSql = String.format(
                    "GRANT CONNECT ON DATABASE %s TO %s",
                    sanitizeIdentifier(dbName), sanitizeIdentifier(userName)
            );
            platformJdbcTemplate.execute(grantDbSql);
            log.info("✅ Droits de connexion accordés");

            // 5. Donner les droits sur le schéma public
            grantSchemaPrivileges(dbName, userName);

            // 6. Stocker les credentials de manière SÉCURISÉE
            credentialService.storeCredentials(clientId, userName, password);

            // 7. Mettre à jour le client
            updateClientWithDatabaseInfo(clientId, dbName);

            log.info("🎉 Base créée avec succès - Client {} a son propre compte {}", clientId, userName);

            return new DatabaseInfo(dbName, userName, password, getConnectionUrl(dbName));

        } catch (Exception e) {
            log.error("❌ Erreur création base: {}", e.getMessage());
            cleanupFailedCreation(dbName, userName);
            throw new RuntimeException("Erreur création base client: " + e.getMessage(), e);
        }
    }

    /**
     * Applique les limites de connexions selon le plan
     */
    private void applyPlanLimits(Long clientId, String planType) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));

        switch (planType.toUpperCase()) {
            case "BASIC":
                client.setConnexionsMax(5);
                client.setConnexionsRestantes(5);
                break;
            case "PRO":
                client.setConnexionsMax(50);
                client.setConnexionsRestantes(50);
                break;
            case "ENTERPRISE":
                client.setConnexionsMax(999999);
                client.setConnexionsRestantes(999999);
                break;
            default:
                client.setConnexionsMax(30);
                client.setConnexionsRestantes(30);
        }

        clientRepository.save(client);
        log.info("📊 Plan {} appliqué - {} connexions max", planType, client.getConnexionsMax());
    }

    // ============================================================
    // MÉTHODES UTILITAIRES
    // ============================================================

    /**
     * Vérifie si une base existe
     */
    public boolean databaseExists(String dbName) {
        try {
            Integer result = platformJdbcTemplate.queryForObject(CHECK_DB_EXISTS, Integer.class, dbName);
            return result != null && result == 1;
        } catch (EmptyResultDataAccessException e) {
            return false;
        }
    }
    /**
     * Vérifie si un utilisateur existe dans PostgreSQL
     */
    public boolean userExists(String userName) {
        try {
            Integer result = platformJdbcTemplate.queryForObject(CHECK_USER_EXISTS, Integer.class, userName);
            return result != null && result == 1;
        } catch (EmptyResultDataAccessException e) {
            return false;
        }
    }

    // ============================================================
    // MÉTHODES PRIVÉES
    // ============================================================

    /**
     * Accorde les droits sur le schéma public à l'utilisateur dédié
     */
    private void grantSchemaPrivileges(String dbName, String userName) {
        log.info("🔐 Configuration des droits sur le schéma public pour {}", userName);

        try (var conn = DriverManager.getConnection(getConnectionUrl(dbName), "postgres", "chayma")) {
            try (var stmt = conn.createStatement()) {
                stmt.execute(String.format("GRANT ALL ON SCHEMA public TO %s", userName));
                stmt.execute(String.format("GRANT ALL ON ALL TABLES IN SCHEMA public TO %s", userName));
                stmt.execute(String.format("GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO %s", userName));
                stmt.execute(String.format("GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO %s", userName));
                stmt.execute(String.format("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO %s", userName));
                stmt.execute(String.format("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO %s", userName));
            }
            log.info("✅ Droits accordés à {} sur {}", userName, dbName);
        } catch (SQLException e) {
            log.error("❌ Erreur lors de l'octroi des droits: {}", e.getMessage());
            throw new RuntimeException("Impossible de configurer les droits sur la base " + dbName, e);
        }
    }

    /**
     * Termine toutes les connexions actives sur une base
     */
    private void terminateConnections(String dbName) {
        try {
            List<Integer> terminated = platformJdbcTemplate.queryForList(TERMINATE_CONNECTIONS, Integer.class, dbName);
            int count = terminated != null ? terminated.size() : 0;
            if (count > 0) log.info("✅ {} connexions terminées sur {}", count, dbName);
        } catch (Exception e) {
            log.warn("⚠️ Impossible de terminer les connexions: {}", e.getMessage());
        }
    }

    /**
     * Nettoie après un échec de création (supprime base + utilisateur)
     */
    private void cleanupFailedCreation(String dbName, String userName) {
        try {
            if (databaseExists(dbName)) {
                terminateConnections(dbName);
                platformJdbcTemplate.execute(String.format("DROP DATABASE IF EXISTS %s", sanitizeIdentifier(dbName)));
                log.info("🧹 Base {} supprimée après échec", dbName);
            }
            if (userExists(userName)) {
                platformJdbcTemplate.execute(String.format("DROP USER IF EXISTS %s", sanitizeIdentifier(userName)));
                log.info("🧹 Utilisateur {} supprimé après échec", userName);
            }
        } catch (Exception e) {
            log.error("❌ Erreur lors du nettoyage: {}", e.getMessage());
        }
    }

    /**
     * Nettoie un identifiant (anti-injection SQL)
     */
    private String sanitizeIdentifier(String identifier) {
        return identifier.replaceAll("[^a-zA-Z0-9_]", "");
    }

    /**
     * Génère le nom de la base : client_123
     */
    private String generateDatabaseName(Long clientId) {
        return "client_" + clientId;
    }

    /**
     * Génère le nom d'utilisateur DÉDIÉ : user_c123
     */
    private String generateUsername(Long clientId) {
        return "user_c" + clientId;
    }

    /**
     * Génère un mot de passe sécurisé UNIQUE
     */
    private String generateSecurePassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        StringBuilder password = new StringBuilder();
        for (int i = 0; i < 20; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }
        return password.toString();
    }

    /**
     * Construit l'URL JDBC pour une base
     */
    private String getConnectionUrl(String dbName) {
        return String.format("jdbc:postgresql://localhost:5432/%s", dbName);
    }

    /**
     * Met à jour le client avec les infos de sa base
     */
    private void updateClientWithDatabaseInfo(Long clientId, String dbName) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));

        client.setNomBaseDonnees(dbName);
        // client.setStatut(Client.StatutClient.valueOf("ACTIF"));

        // Garder le statut actuel (EN_ATTENTE pour DEFINITIF, ACTIF pour ESSAI)
        client.setDateActivation(LocalDateTime.now());
        client.setIsActive(true);
        clientRepository.save(client);
        log.info("✅ Client mis à jour: {} - Statut inchangé: {}", client.getEmail(), client.getStatut());
    }

    // ============================================================
    // CLASSE INTERNE DTO
    // ============================================================

    /**
     * Informations de connexion à une base client
     * ⚠️ Ces informations sont UNIQUES et ne doivent être transmises qu'au client concerné
     */
    public static class DatabaseInfo {
        public final String dbName;           // Nom de la base (ex: client_42)
        public final String username;         // Nom d'utilisateur DÉDIÉ (ex: user_c42)
        public final String password;         // Mot de passe UNIQUE
        public final String connectionUrl;    // URL JDBC complète

        public DatabaseInfo(String dbName, String username, String password, String connectionUrl) {
            this.dbName = dbName;
            this.username = username;
            this.password = password;
            this.connectionUrl = connectionUrl;
        }
    }
}