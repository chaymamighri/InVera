package org.erp.invera.service.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Client;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DatabaseCreationService {

    @Qualifier("platformJdbcTemplate")
    private final JdbcTemplate platformJdbcTemplate;

    private final ClientPlatformRepository clientRepository;

    private static final String TEMPLATE_DB = "template_invera";
    private static final SecureRandom random = new SecureRandom();

    /**
     * Crée une base de données dédiée pour un client
     */
    @Transactional
    public DatabaseInfo createClientDatabase(Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client non trouvé: " + clientId));

        String dbName = generateDatabaseName(clientId);
        String userName = generateUsername(clientId);
        String password = generateSecurePassword();

        log.info("🚀 Création base pour client {} ({})", clientId, client.getEmail());
        log.info("   Database: {}", dbName);
        log.info("   User: {}", userName);

        try {
            // 1. Vérifier si la base existe déjà
            if (databaseExists(dbName)) {
                log.warn("⚠️ Base {} existe déjà", dbName);
                return new DatabaseInfo(dbName, userName, password, getConnectionUrl(dbName));
            }

            // 2. Créer la base à partir du template
            String createDbSql = String.format(
                    "CREATE DATABASE %s WITH TEMPLATE %s OWNER postgres",
                    dbName, TEMPLATE_DB
            );
            platformJdbcTemplate.execute(createDbSql);
            log.info("✅ Base créée: {}", dbName);

            // 3. Créer l'utilisateur dédié
            String createUserSql = String.format(
                    "CREATE USER %s WITH PASSWORD '%s'",
                    userName, password
            );
            platformJdbcTemplate.execute(createUserSql);
            log.info("✅ Utilisateur créé: {}", userName);

            // 4. Donner tous les droits sur la base
            String grantSql = String.format(
                    "GRANT ALL PRIVILEGES ON DATABASE %s TO %s",
                    dbName, userName
            );
            platformJdbcTemplate.execute(grantSql);
            log.info("✅ Droits accordés sur {}", dbName);

            // 5. Donner les droits sur le schéma public
            String grantSchemaSql = String.format(
                    "GRANT ALL PRIVILEGES ON SCHEMA public TO %s",
                    userName
            );
            try {
                platformJdbcTemplate.execute(String.format("\\c %s", dbName));
                platformJdbcTemplate.execute(grantSchemaSql);
            } catch (Exception e) {
                log.warn("Impossible de donner les droits sur le schéma: {}", e.getMessage());
            }

            // 6. Mettre à jour le client
            updateClientWithDatabaseInfo(clientId, dbName);

            // 7. Stocker les identifiants (à sécuriser en production)
            storeCredentialsSecurely(clientId, userName, password);

            log.info("🎉 Base créée avec succès pour client {} ({})", clientId, client.getEmail());

            return new DatabaseInfo(dbName, userName, password, getConnectionUrl(dbName));

        } catch (Exception e) {
            log.error("❌ Erreur création base pour client {}: {}", clientId, e.getMessage());
            throw new RuntimeException("Erreur lors de la création de la base client: " + e.getMessage(), e);
        }
    }

    /**
     * Crée une base avec plan d'abonnement spécifique
     */
    @Transactional
    public DatabaseInfo createClientDatabaseWithPlan(Long clientId, String planType) {
        DatabaseInfo dbInfo = createClientDatabase(clientId);

        // Appliquer les limites selon le plan
        applyPlanLimits(clientId, planType);

        return dbInfo;
    }

    /**
     * Applique les limites selon le plan d'abonnement
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
                // Plan ESSAI ou non spécifié
                client.setConnexionsMax(30);
                client.setConnexionsRestantes(30);
        }

        clientRepository.save(client);
        log.info("📊 Plan {} appliqué au client {} ({} connexions max)",
                planType, clientId, client.getConnexionsMax());
    }

    /**
     * Supprime une base de données client
     */
    @Transactional
    public void dropClientDatabase(Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client non trouvé: " + clientId));

        String dbName = client.getNomBaseDonnees();
        String userName = generateUsername(clientId);

        if (dbName == null) {
            log.warn("Client {} n'a pas de base associée", clientId);
            return;
        }

        log.info("🗑️ Suppression base pour client {} ({})", clientId, client.getEmail());

        try {
            // 1. Terminer toutes les connexions actives
            String terminateSql = String.format(
                    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '%s'",
                    dbName
            );
            platformJdbcTemplate.execute(terminateSql);
            log.info("✅ Connexions terminées sur {}", dbName);

            // 2. Supprimer la base
            String dropDbSql = String.format("DROP DATABASE IF EXISTS %s", dbName);
            platformJdbcTemplate.execute(dropDbSql);
            log.info("✅ Base supprimée: {}", dbName);

            // 3. Supprimer l'utilisateur
            String dropUserSql = String.format("DROP USER IF EXISTS %s", userName);
            platformJdbcTemplate.execute(dropUserSql);
            log.info("✅ Utilisateur supprimé: {}", userName);

            // 4. Mettre à jour le client
            client.setNomBaseDonnees(null);
            client.setStatut("INACTIF");
            client.setIsActive(false);
            clientRepository.save(client);

        } catch (Exception e) {
            log.error("❌ Erreur suppression base pour client {}: {}", clientId, e.getMessage());
            throw new RuntimeException("Erreur lors de la suppression: " + e.getMessage(), e);
        }
    }

    /**
     * Vérifie si une base existe
     */
    public boolean databaseExists(String dbName) {
        String checkSql = "SELECT 1 FROM pg_database WHERE datname = '" + dbName + "'";
        try {
            Integer result = platformJdbcTemplate.queryForObject(checkSql, Integer.class);
            return result != null;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Teste la connexion à la base client
     */
    public boolean testConnection(Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));

        String dbName = client.getNomBaseDonnees();
        if (dbName == null) {
            return false;
        }

        try {
            String testSql = String.format("SELECT 1 FROM pg_database WHERE datname = '%s'", dbName);
            platformJdbcTemplate.queryForObject(testSql, Integer.class);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Renvoie la taille de la base en Mo
     */
    public double getDatabaseSize(Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));

        String dbName = client.getNomBaseDonnees();
        if (dbName == null) {
            return 0;
        }

        String sql = String.format(
                "SELECT pg_database_size('%s') / 1024.0 / 1024.0", dbName
        );
        try {
            return platformJdbcTemplate.queryForObject(sql, Double.class);
        } catch (Exception e) {
            log.warn("Impossible d'obtenir la taille de {}: {}", dbName, e.getMessage());
            return 0;
        }
    }

    /**
     * Liste toutes les bases clients
     */
    public List<String> listAllClientDatabases() {
        String sql = "SELECT datname FROM pg_database WHERE datname LIKE 'client_%'";
        try {
            return platformJdbcTemplate.queryForList(sql, String.class);
        } catch (Exception e) {
            log.error("Erreur lors de la liste des bases: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Sauvegarde une base client
     */
    public String backupDatabase(Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));

        String dbName = client.getNomBaseDonnees();
        if (dbName == null) {
            throw new RuntimeException("Client sans base associée");
        }

        String backupName = String.format("%s_backup_%s", dbName,
                LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")));

        String backupSql = String.format(
                "CREATE DATABASE %s WITH TEMPLATE %s OWNER postgres",
                backupName, dbName
        );

        try {
            platformJdbcTemplate.execute(backupSql);
            log.info("✅ Backup créé: {}", backupName);
            return backupName;
        } catch (Exception e) {
            log.error("❌ Erreur backup: {}", e.getMessage());
            throw new RuntimeException("Erreur lors du backup: " + e.getMessage());
        }
    }

    // ========== MÉTHODES PRIVÉES ==========

    private String generateDatabaseName(Long clientId) {
        return "client_" + clientId;
    }

    private String generateUsername(Long clientId) {
        return "user_c" + clientId;
    }

    private String generateSecurePassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
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
        client.setStatut("ACTIF");
        client.setDateActivation(LocalDateTime.now());
        client.setIsActive(true);

        clientRepository.save(client);
        log.info("✅ Client mis à jour: {}", client.getEmail());
    }

    private void storeCredentialsSecurely(Long clientId, String userName, String password) {
        // TODO: Implémenter le stockage sécurisé (encryption)
        // Pour l'instant, on log (à ne pas faire en production)
        log.warn("📝 CREDENTIALS À SÉCURISER:");
        log.warn("   Client ID: {}", clientId);
        log.warn("   Username: {}", userName);
        log.warn("   Password: {}", password);

        // Idéalement, stocker dans une table credentials avec AES encryption
        // INSERT INTO client_credentials (client_id, username, password_encrypted) VALUES (...)
    }

    // ========== CLASSE INTERNE ==========

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