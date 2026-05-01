package org.erp.invera.service.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Client;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DatabaseCreationService {

    @Qualifier("platformJdbcTemplate")
    private final JdbcTemplate platformJdbcTemplate;

    private final ClientPlatformRepository clientRepository;
    private final CredentialService credentialService;
    private final PasswordEncoder passwordEncoder;

    private static final String TEMPLATE_DB = "template_invera";
    private static final String POSTGRES_PASSWORD = "chayma";
    private static final SecureRandom random = new SecureRandom();

    private static final String CHECK_DB_EXISTS = "SELECT 1 FROM pg_database WHERE datname = ?";
    private static final String TERMINATE_CONNECTIONS = """
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE datname = ? AND pid <> pg_backend_pid()
        """;
    private static final String CHECK_USER_EXISTS = "SELECT 1 FROM pg_roles WHERE rolname = ?";

    // ============================================================
    // CRÉATION DE BASE AVEC ADMIN
    // ============================================================

    public DatabaseInfo createClientDatabaseWithAdmin(Long clientId, String plainPassword) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client non trouvé: " + clientId));

        String dbName = generateDatabaseName(clientId);
        String userName = generateUsername(clientId);
        String dbPassword = generateSecurePassword();

        log.info("🚀 Création base pour client {} ({})", clientId, client.getEmail());
        log.info("   Database: {}", dbName);
        log.info("   User dédié: {}", userName);

        try {
            // Nettoyage préventif
            log.info("🧹 Nettoyage préventif des objets existants...");

            if (userExists(userName)) {
                log.warn("⚠️ Utilisateur {} existe déjà, suppression préventive", userName);
                platformJdbcTemplate.execute(String.format("DROP USER IF EXISTS %s", sanitizeIdentifier(userName)));
            }

            if (databaseExists(dbName)) {
                log.warn("⚠️ Base {} existe déjà, suppression préventive", dbName);
                terminateConnections(dbName);
                platformJdbcTemplate.execute(String.format("DROP DATABASE IF EXISTS %s", sanitizeIdentifier(dbName)));
                Thread.sleep(200);
            }

            terminateConnections(TEMPLATE_DB);
            Thread.sleep(200);

            // Créer la base
            String createDbSql = String.format(
                    "CREATE DATABASE %s WITH TEMPLATE %s OWNER postgres",
                    sanitizeIdentifier(dbName), sanitizeIdentifier(TEMPLATE_DB)
            );
            platformJdbcTemplate.execute(createDbSql);
            log.info("✅ Base créée: {}", dbName);

            // Créer l'utilisateur dédié
            String createUserSql = String.format(
                    "CREATE USER %s WITH PASSWORD '%s'",
                    sanitizeIdentifier(userName), dbPassword
            );
            platformJdbcTemplate.execute(createUserSql);
            log.info("✅ Utilisateur dédié créé: {}", userName);

            // Donner les droits
            String grantDbSql = String.format(
                    "GRANT CONNECT ON DATABASE %s TO %s",
                    sanitizeIdentifier(dbName), sanitizeIdentifier(userName)
            );
            platformJdbcTemplate.execute(grantDbSql);
            log.info("✅ Droits de connexion accordés");

            grantSchemaPrivileges(dbName, userName);

            // Créer l'utilisateur admin dans la nouvelle base
            createAdminUserInDatabase(dbName, client, plainPassword);

            // Stocker les credentials
            credentialService.storeCredentials(clientId, userName, dbPassword);

            // Mettre à jour le client
            updateClientWithDatabaseInfo(clientId, dbName);

            log.info("🎉 Base créée avec succès - Client {} a son propre compte {}", clientId, userName);

            return new DatabaseInfo(dbName, userName, dbPassword, getConnectionUrl(dbName));

        } catch (Exception e) {
            log.error("❌ Erreur création base: {}", e.getMessage());
            cleanupFailedCreation(dbName, userName);
            throw new RuntimeException("Erreur création base client: " + e.getMessage(), e);
        }
    }

    /**
     * Crée l'utilisateur admin directement dans la base du client
     */
    private void createAdminUserInDatabase(String dbName, Client client, String plainPassword) {
        String url = getConnectionUrl(dbName);
        String encodedPassword = passwordEncoder.encode(plainPassword);

        // ✅ SQL corrigé : retiré created_at car NOW() et la colonne a une valeur par défaut
        String sql = """
            INSERT INTO users (active, client_id, email, mot_de_passe, nom, prenom, role, preferred_language)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """;

        log.info("👤 Création utilisateur admin dans la base {} pour {}", dbName, client.getEmail());

        try (Connection conn = DriverManager.getConnection(url, "postgres", POSTGRES_PASSWORD)) {
            try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                pstmt.setBoolean(1, true);
                pstmt.setLong(2, client.getId());
                pstmt.setString(3, client.getEmail());
                pstmt.setString(4, encodedPassword);
                pstmt.setString(5, client.getNom() != null ? client.getNom() : "");
                pstmt.setString(6, client.getPrenom() != null ? client.getPrenom() : "");
                pstmt.setString(7, "ADMIN_CLIENT");
                pstmt.setString(8, "FR");
                pstmt.executeUpdate();

                log.info("✅ Utilisateur admin créé dans la base {}: {}", dbName, client.getEmail());
            }
        } catch (SQLException e) {
            log.error("❌ Erreur création admin dans {}: {}", dbName, e.getMessage());
            throw new RuntimeException("Erreur création utilisateur admin: " + e.getMessage(), e);
        }
    }

    // ============================================================
    // MÉTHODES UTILITAIRES
    // ============================================================

    public boolean databaseExists(String dbName) {
        try {
            Integer result = platformJdbcTemplate.queryForObject(CHECK_DB_EXISTS, Integer.class, dbName);
            return result != null && result == 1;
        } catch (EmptyResultDataAccessException e) {
            return false;
        } catch (Exception e) {
            log.warn("Erreur vérification base {}: {}", dbName, e.getMessage());
            return false;
        }
    }

    public boolean userExists(String userName) {
        try {
            Integer result = platformJdbcTemplate.queryForObject(CHECK_USER_EXISTS, Integer.class, userName);
            return result != null && result == 1;
        } catch (EmptyResultDataAccessException e) {
            return false;
        } catch (Exception e) {
            log.warn("Erreur vérification utilisateur {}: {}", userName, e.getMessage());
            return false;
        }
    }

    // ============================================================
    // MÉTHODES PRIVÉES
    // ============================================================

    private void grantSchemaPrivileges(String dbName, String userName) {
        log.info("🔐 Configuration des droits sur le schéma public pour {}", userName);

        try (var conn = DriverManager.getConnection(getConnectionUrl(dbName), "postgres", POSTGRES_PASSWORD)) {
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

    private void terminateConnections(String dbName) {
        try {
            List<Boolean> terminated = platformJdbcTemplate.queryForList(TERMINATE_CONNECTIONS, Boolean.class, dbName);
            long count = terminated != null ? terminated.stream().filter(Boolean::booleanValue).count() : 0;
            if (count > 0) log.info("✅ {} connexions terminées sur {}", count, dbName);
        } catch (Exception e) {
            log.warn("⚠️ Impossible de terminer les connexions: {}", e.getMessage());
        }
    }

    private void cleanupFailedCreation(String dbName, String userName) {
        log.info("🧹 Nettoyage après échec - Base: {}, User: {}", dbName, userName);

        try {
            if (userExists(userName)) {
                platformJdbcTemplate.execute(String.format("DROP USER IF EXISTS %s", sanitizeIdentifier(userName)));
                log.info("✅ Utilisateur {} supprimé", userName);
            }

            if (databaseExists(dbName)) {
                terminateConnections(dbName);
                platformJdbcTemplate.execute(String.format("DROP DATABASE IF EXISTS %s", sanitizeIdentifier(dbName)));
                log.info("✅ Base {} supprimée", dbName);
            }
        } catch (Exception e) {
            log.error("❌ Erreur lors du nettoyage: {}", e.getMessage());
        }
    }

    private String sanitizeIdentifier(String identifier) {
        return identifier.replaceAll("[^a-zA-Z0-9_]", "");
    }

    private String generateDatabaseName(Long clientId) {
        return "client_" + clientId;
    }

    private String generateUsername(Long clientId) {
        return "user_c" + clientId;
    }

    private String generateSecurePassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder password = new StringBuilder();
        for (int i = 0; i < 20; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }
        return password.toString();
    }

    private String getConnectionUrl(String dbName) {
        return String.format("jdbc:postgresql://localhost:5432/%s", dbName);
    }

    private void updateClientWithDatabaseInfo(Long clientId, String dbName) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));

        client.setNomBaseDonnees(dbName);
        client.setDateActivation(LocalDateTime.now());
        client.setIsActive(true);
        clientRepository.save(client);
        log.info("✅ Client mis à jour: {} - Statut: {}", client.getEmail(), client.getStatut());
    }

    // ============================================================
    // CLASSE INTERNE DTO
    // ============================================================

    public static class DatabaseInfo {
        public final String dbName;
        public final String username;
        public final String password;
        public final String connectionUrl;

        public DatabaseInfo(String dbName, String username, String password, String connectionUrl) {
            this.dbName = dbName;
            this.username = username;
            this.password = password;
            this.connectionUrl = connectionUrl;
        }
    }
}