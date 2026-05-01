package org.erp.invera.service.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Client;
import org.erp.invera.model.erp.Utilisateur;
import org.erp.invera.service.tenant.TenantDatabaseService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserSyncService {

    private final TenantDatabaseService tenantDatabaseService;

    /**
     * Crée la table users dans la base client si elle n'existe pas
     */
    public void createUserTableIfNotExists(Client client) {
        try {
            JdbcTemplate clientDb = tenantDatabaseService.getClientJdbcTemplate(
                    client.getId(), String.valueOf(client.getId())
            );

            // ✅ CHANGEMENT : 'users' au lieu de 'utilisateur'
            String createTableSql = """
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    tenant_id VARCHAR(50) NOT NULL,
                    central_user_id INTEGER NOT NULL UNIQUE,
                    nom VARCHAR(100),
                    prenom VARCHAR(100),
                    email VARCHAR(255) NOT NULL UNIQUE,
                    role VARCHAR(50) NOT NULL,
                    est_actif BOOLEAN DEFAULT TRUE,
                    created_by INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """;

            clientDb.execute(createTableSql);

            // Créer les index
            clientDb.execute("CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id)");
            clientDb.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
            clientDb.execute("CREATE INDEX IF NOT EXISTS idx_users_central_user_id ON users(central_user_id)");

            log.info("✅ Table users créée/vérifiée dans la base client {}", client.getNomBaseDonnees());

        } catch (Exception e) {
            log.error("❌ Erreur création table users: {}", e.getMessage());
        }
    }

    /**
     * Synchronise un utilisateur de la plateforme vers la base client
     */
    public void syncUserToClientDatabase(Client client, Utilisateur utilisateur) {
        try {
            // Vérifier que la table existe
            createUserTableIfNotExists(client);

            JdbcTemplate clientDb = tenantDatabaseService.getClientJdbcTemplate(
                    client.getId(), String.valueOf(client.getId())
            );

            String role = mapRoleToString(utilisateur.getRole());
            String tenantId = client.getNomBaseDonnees() != null ? client.getNomBaseDonnees() : "client_" + client.getId();

            // ✅ CHANGEMENT : Insert dans 'users' avec tenant_id et central_user_id
            String sql = """
                INSERT INTO users (tenant_id, central_user_id, email, nom, prenom, role, est_actif, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ON CONFLICT (central_user_id) DO UPDATE SET
                    email = EXCLUDED.email,
                    nom = EXCLUDED.nom,
                    prenom = EXCLUDED.prenom,
                    role = EXCLUDED.role,
                    est_actif = EXCLUDED.est_actif,
                    updated_at = NOW()
                """;

            int affected = clientDb.update(sql,
                    tenantId,
                    utilisateur.getId(),
                    utilisateur.getEmail(),
                    utilisateur.getNom(),
                    utilisateur.getPrenom(),
                    role,
                    utilisateur.getActive()
            );

            log.info("✅ Utilisateur {} synchronisé vers client {} ({} lignes affectées)",
                    utilisateur.getEmail(), client.getNomBaseDonnees(), affected);

            // ❌ Supprimer l'ancienne table utilisateur si elle existe
            try {
                clientDb.execute("DROP TABLE IF EXISTS utilisateur CASCADE");
                log.info("🗑️ Ancienne table utilisateur supprimée dans {}", client.getNomBaseDonnees());
            } catch (Exception e) {
                // La table n'existait pas, c'est normal
            }

        } catch (Exception e) {
            log.error("❌ Erreur synchronisation utilisateur {}: {}", utilisateur.getEmail(), e.getMessage());
        }
    }

    /**
     * Supprime un utilisateur de la base client
     */
    public void deleteUserFromClientDatabase(Client client, String email) {
        try {
            JdbcTemplate clientDb = tenantDatabaseService.getClientJdbcTemplate(
                    client.getId(), String.valueOf(client.getId())
            );

            String sql = "DELETE FROM users WHERE email = ?";
            int deleted = clientDb.update(sql, email);

            log.info("🗑️ Utilisateur {} supprimé de la base client {} ({} lignes supprimées)",
                    email, client.getNomBaseDonnees(), deleted);

        } catch (Exception e) {
            log.error("❌ Erreur suppression utilisateur {}: {}", email, e.getMessage());
        }
    }

    /**
     * Met à jour le statut d'un utilisateur dans la base client
     */
    public void updateUserActiveStatus(Client client, String email, boolean active) {
        try {
            JdbcTemplate clientDb = tenantDatabaseService.getClientJdbcTemplate(
                    client.getId(), String.valueOf(client.getId())
            );

            String sql = "UPDATE users SET est_actif = ?, updated_at = NOW() WHERE email = ?";
            int updated = clientDb.update(sql, active, email);

            log.info("🔄 Statut utilisateur {} mis à jour (actif={}) dans base client {}",
                    email, active, client.getNomBaseDonnees());

        } catch (Exception e) {
            log.error("❌ Erreur mise à jour statut: {}", e.getMessage());
        }
    }

    /**
     * Synchronise tous les utilisateurs d'un client
     */
    public void syncAllUsersForClient(Client client, List<Utilisateur> users) {
        log.info("🔄 Synchronisation de {} utilisateurs pour client {}", users.size(), client.getNomBaseDonnees());

        for (Utilisateur user : users) {
            syncUserToClientDatabase(client, user);
        }
    }

    private String mapRoleToString(Utilisateur.RoleUtilisateur role) {
        switch (role) {
            case ADMIN_CLIENT: return "ADMIN_CLIENT";
            case COMMERCIAL: return "COMMERCIAL";
            case RESPONSABLE_ACHAT: return "RESPONSABLE_ACHAT";
            default: return "COMMERCIAL";
        }
    }
}