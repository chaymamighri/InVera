package org.erp.invera.service.erp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.erp.Utilisateur;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.erp.invera.repository.tenant.TenantRowMapper;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private final TenantAwareRepository tenantRepo;
    private final TenantRowMapper rowMapper;  // ✅ Injection du TenantRowMapper
    private final BCryptPasswordEncoder passwordEncoder;

    // ==================== AUTHENTIFICATION ====================
    public Map<String, Object> authenticate(Long clientId, String email, String password) {
        log.info("🔐 Authentification de {} pour clientId: {}", email, clientId);

        String sql = "SELECT id, email, mot_de_passe, nom, prenom, role, active, client_id FROM users WHERE email = ?";

        try {
            // ✅ CORRECTION : 5 paramètres au lieu de 4
            // clientId, authenticatedClientId, args...
            Map<String, Object> user = tenantRepo.queryForObject(sql, rowMapper.userAuthRowMapper(),
                    clientId, String.valueOf(clientId), email);  // ← Ajout de String.valueOf(clientId)

            if (user == null) {
                throw new RuntimeException("Email ou mot de passe incorrect");
            }

            String encodedPassword = (String) user.get("mot_de_passe");
            if (!passwordEncoder.matches(password, encodedPassword)) {
                throw new RuntimeException("Email ou mot de passe incorrect");
            }

            boolean active = (Boolean) user.get("active");
            if (!active) {
                throw new RuntimeException("Compte désactivé. Contactez votre administrateur.");
            }

            // Mettre à jour last_login
            String updateSql = "UPDATE users SET last_login = ? WHERE email = ?";
            // ✅ Aussi pour update
            tenantRepo.update(updateSql, clientId, String.valueOf(clientId), LocalDateTime.now(), email);

            Map<String, Object> result = new HashMap<>();
            result.put("userId", user.get("id"));
            result.put("email", user.get("email"));
            result.put("role", user.get("role"));
            result.put("nom", user.get("nom") != null ? user.get("nom") : "");
            result.put("prenom", user.get("prenom") != null ? user.get("prenom") : "");
            result.put("clientId", user.get("client_id"));

            log.info("✅ Authentification réussie: {}", email);
            return result;

        } catch (Exception e) {
            log.error("❌ Erreur authentification: {}", e.getMessage());
            throw new RuntimeException("Email ou mot de passe incorrect");
        }
    }

    // ==================== CRÉATION ====================
    public Utilisateur createEmployee(Long clientId, String email, String password,
                                      String nom, String prenom, String role) {

        // ✅ CORRECTION 1 : Ajouter String.valueOf(clientId) pour le COUNT
        String checkSql = "SELECT COUNT(*) FROM users WHERE email = ?";
        Integer count = tenantRepo.queryForObject(checkSql, Integer.class, clientId, String.valueOf(clientId), email);

        if (count != null && count > 0) {
            throw new RuntimeException("Email déjà utilisé: " + email);
        }

        // Vérifier le rôle
        Utilisateur.RoleUtilisateur roleEnum;
        try {
            roleEnum = Utilisateur.RoleUtilisateur.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Rôle invalide. Valeurs possibles: ADMIN_CLIENT, COMMERCIAL, RESPONSABLE_ACHAT");
        }

        // ✅ CORRECTION 2 : SQL simplifié (sans created_at et updated_at)
        String insertSql = """
        INSERT INTO users (active, client_id, email, mot_de_passe, nom, prenom, role, preferred_language)
        VALUES (false, ?, ?, ?, ?, ?, ?, 'FR')
        RETURNING id
        """;

        // ✅ CORRECTION 3 : Ajouter String.valueOf(clientId) et adapter les paramètres
        Long id = tenantRepo.queryForObject(insertSql, Long.class, clientId, String.valueOf(clientId),
                clientId, email, passwordEncoder.encode(password), nom, prenom, roleEnum.name());

        log.info("✅ Employé créé: {} pour clientId: {}", email, clientId);
        return findById(clientId, id);
    }
    // ==================== RECHERCHE / LECTURE ====================

    public List<Map<String, Object>> getAllUsers(Long clientId) {
        String sql = "SELECT id, email, nom, prenom, role, active, client_id, created_at, last_login FROM users ORDER BY id";

        // ✅ Utiliser userListRowMapper depuis TenantRowMapper
        List<Map<String, Object>> users = tenantRepo.query(sql, rowMapper.userListRowMapper(), clientId);
        return users != null ? users : new ArrayList<>();
    }

    public Utilisateur findById(Long clientId, Long userId) {
        String sql = "SELECT * FROM users WHERE id = ?";

        // ✅ Utiliser utilisateurRowMapper depuis TenantRowMapper
        Utilisateur user = tenantRepo.queryForObject(sql, rowMapper.utilisateurRowMapper(), clientId, userId);

        if (user == null) {
            throw new RuntimeException("Utilisateur non trouvé: " + userId);
        }
        return user;
    }

    public Utilisateur findByEmail(Long clientId, String email) {
        String sql = "SELECT * FROM users WHERE email = ?";

        // ✅ CORRECTION : 5 paramètres (ajout de authenticatedClientId)
        Utilisateur user = tenantRepo.queryForObject(sql, rowMapper.utilisateurRowMapper(),
                clientId, String.valueOf(clientId), email);

        if (user == null) {
            throw new RuntimeException("Utilisateur non trouvé: " + email);
        }
        return user;
    }

    public List<Utilisateur> getEmployeesByClient(Long clientId) {
        String sql = "SELECT * FROM users ORDER BY id";

        // ✅ Pour query (liste), pas besoin de authenticatedClientId
        // La méthode query sans authenticatedClientId existe déjà
        List<Utilisateur> users = tenantRepo.query(sql, rowMapper.utilisateurRowMapper(), clientId);
        return users != null ? users : new ArrayList<>();
    }

    // ==================== MODIFICATION ====================

    public void updateEmployee(Long clientId, Long userId, String nom, String prenom, String email, String role, Boolean active) {
        // ✅ Convertir le rôle frontend en backend
        String backendRole = role;
        if (role != null) {
            switch (role.toLowerCase()) {
                case "sales":
                    backendRole = "COMMERCIAL";
                    break;
                case "procurement":
                    backendRole = "RESPONSABLE_ACHAT";
                    break;
                case "admin":
                    backendRole = "ADMIN_CLIENT";
                    break;
                default:
                    backendRole = role.toUpperCase();
                    break;
            }
        }

        // ✅ Récupérer l'utilisateur existant pour avoir les valeurs par défaut
        Utilisateur existingUser = findById(clientId, userId);

        // ✅ Utiliser les valeurs existantes si les nouvelles sont nulles
        String finalNom = (nom != null && !nom.trim().isEmpty()) ? nom : existingUser.getNom();
        String finalPrenom = (prenom != null && !prenom.trim().isEmpty()) ? prenom : existingUser.getPrenom();
        String finalEmail = (email != null && !email.trim().isEmpty()) ? email : existingUser.getEmail();  // ✅ Ajouter l'email
        String finalRole = (backendRole != null && !backendRole.trim().isEmpty()) ? backendRole : existingUser.getRole().name();
        Boolean finalActive = (active != null) ? active : existingUser.getActive();

        // ✅ Ajouter email dans la requête SQL
        String sql = "UPDATE users SET nom = ?, prenom = ?, email = ?, role = ?, active = ?, updated_at = ? WHERE id = ? AND client_id = ?";

        int updated = tenantRepo.update(sql, clientId, String.valueOf(clientId),
                finalNom, finalPrenom, finalEmail, finalRole, finalActive, LocalDateTime.now(), userId, clientId);

        if (updated == 0) {
            throw new RuntimeException("Erreur lors de la modification de l'utilisateur");
        }

        log.info("✅ Employé modifié: userId={}", userId);
    }

    public void toggleEmployeeStatus(Long clientId, Long userId, boolean active) {
        String sql = "UPDATE users SET active = ?, updated_at = ? WHERE id = ? AND client_id = ?";

        int updated = tenantRepo.update(sql, clientId, String.valueOf(clientId),
                active, LocalDateTime.now(), userId, clientId);  // ✅ Ajouter String.valueOf(clientId)

        if (updated == 0) {
            throw new RuntimeException("Erreur lors du changement de statut");
        }

        log.info("✅ Statut employé modifié: userId={}, active={}", userId, active);
    }

    public void updatePassword(Long clientId, Long userId, String newPassword) {
        String sql = "UPDATE users SET mot_de_passe = ?, updated_at = ? WHERE id = ? AND client_id = ?";

        int updated = tenantRepo.update(sql, clientId, String.valueOf(clientId),
                passwordEncoder.encode(newPassword), LocalDateTime.now(), userId, clientId);

        if (updated == 0) {
            throw new RuntimeException("Erreur lors du changement de mot de passe");
        }

        log.info("🔑 Mot de passe mis à jour pour userId={}", userId);
    }

    public void deleteEmployee(Long clientId, Long userId) {
        String sql = "DELETE FROM users WHERE id = ? AND client_id = ?";

        int deleted = tenantRepo.update(sql, clientId, String.valueOf(clientId), userId, clientId);

        if (deleted == 0) {
            throw new RuntimeException("Utilisateur non trouvé");
        }

        log.info("✅ Employé supprimé: userId={}", userId);
    }
    // ==================== MÉTHODES UTILITAIRES ====================

    public boolean userExists(Long clientId, String email) {
        String sql = "SELECT COUNT(*) FROM users WHERE email = ?";

        // ✅ Forcer l'utilisation de la bonne méthode en passant explicitement authenticatedClientId
        Integer count = tenantRepo.queryForObject(sql, Integer.class, clientId, String.valueOf(clientId), email);

        return count != null && count > 0;
    }
}