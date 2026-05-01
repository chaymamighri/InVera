package org.erp.invera.controller.platform;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Client;
import org.erp.invera.model.platform.Utilisateur;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.erp.invera.repository.platform.utilisateurRepository;
import org.erp.invera.security.JwtTokenProvider;
import org.erp.invera.service.erp.EmailService;
import org.erp.invera.service.platform.InvitationService;
import org.erp.invera.service.platform.SessionManagementService;
import org.erp.invera.service.tenant.TenantDatabaseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final utilisateurRepository utilisateurRepository;
    private final ClientPlatformRepository clientRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final InvitationService invitationService;
    private final SessionManagementService sessionManagementService;
    private final EmailService emailService;
    private final TenantDatabaseService tenantDatabaseService;

    // ==================== MÉTHODES UTILITAIRES ====================

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }

    private String extractEmailFromAuthentication(Authentication authentication) {
        return authentication != null ? authentication.getName() : null;
    }

    private String extractTokenFromAuthentication(Authentication authentication) {
        if (authentication != null && authentication.getCredentials() instanceof String) {
            return (String) authentication.getCredentials();
        }
        return null;
    }

    private String mapRoleToFrontend(Utilisateur.RoleUtilisateur role) {
        switch (role) {
            case ADMIN_CLIENT: return "admin";
            case COMMERCIAL: return "sales";
            case RESPONSABLE_ACHAT: return "procurement";
            default: return "sales";
        }
    }

    private Utilisateur.RoleUtilisateur mapRoleFromFrontend(String role) {
        switch (role.toLowerCase()) {
            case "admin": return Utilisateur.RoleUtilisateur.ADMIN_CLIENT;
            case "sales": return Utilisateur.RoleUtilisateur.COMMERCIAL;
            case "procurement": return Utilisateur.RoleUtilisateur.RESPONSABLE_ACHAT;
            default: return Utilisateur.RoleUtilisateur.COMMERCIAL;
        }
    }

    private String extractEmailDomain(String email) {
        if (email == null || !email.contains("@")) return "";
        return email.substring(email.indexOf("@") + 1).toLowerCase();
    }

    /**
     * Crée la table utilisateur dans la base client si elle n'existe pas
     */
    private void createUserTableIfNotExists(Client client) {
        try {
            JdbcTemplate clientDb = tenantDatabaseService.getClientJdbcTemplate(
                    client.getId(), String.valueOf(client.getId())
            );

            String createTableSql = """
                CREATE TABLE IF NOT EXISTS utilisateur (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    nom VARCHAR(100),
                    prenom VARCHAR(100),
                    role VARCHAR(50) NOT NULL,
                    est_actif BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
                """;
            clientDb.execute(createTableSql);

            clientDb.execute("CREATE INDEX IF NOT EXISTS idx_utilisateur_email ON utilisateur(email)");
            clientDb.execute("CREATE INDEX IF NOT EXISTS idx_utilisateur_role ON utilisateur(role)");

        } catch (Exception e) {
            log.warn("⚠️ Erreur création table utilisateur: {}", e.getMessage());
        }
    }

    /**
     * Synchronise un utilisateur vers la base client
     */
    private void syncUserToClientDatabase(Client client, Utilisateur utilisateur, String role) {
        try {
            createUserTableIfNotExists(client);

            JdbcTemplate clientDb = tenantDatabaseService.getClientJdbcTemplate(
                    client.getId(), String.valueOf(client.getId())
            );

            String sql = """
                INSERT INTO utilisateur (email, nom, prenom, role, est_actif, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                ON CONFLICT (email) DO UPDATE SET
                    nom = EXCLUDED.nom,
                    prenom = EXCLUDED.prenom,
                    role = EXCLUDED.role,
                    est_actif = EXCLUDED.est_actif,
                    updated_at = NOW()
                """;

            clientDb.update(sql,
                    utilisateur.getEmail(),
                    utilisateur.getNom(),
                    utilisateur.getPrenom() != null ? utilisateur.getPrenom() : "",
                    role.toUpperCase(),
                    utilisateur.getEstActif()
            );
            log.info("✅ Utilisateur {} synchronisé dans base client {}", utilisateur.getEmail(), client.getNomBaseDonnees());

        } catch (Exception e) {
            log.warn("⚠️ Erreur synchronisation base client: {}", e.getMessage());
        }
    }

    /**
     * Supprime un utilisateur de la base client
     */
    private void deleteUserFromClientDatabase(Client client, String email) {
        try {
            JdbcTemplate clientDb = tenantDatabaseService.getClientJdbcTemplate(
                    client.getId(), String.valueOf(client.getId())
            );
            clientDb.update("DELETE FROM utilisateur WHERE email = ?", email);
            log.info("🗑️ Utilisateur {} supprimé de la base client", email);
        } catch (Exception e) {
            log.warn("⚠️ Erreur suppression base client: {}", e.getMessage());
        }
    }

    /**
     * Met à jour le statut d'un utilisateur dans la base client
     */
    private void updateUserStatusInClientDatabase(Client client, String email, boolean active) {
        try {
            JdbcTemplate clientDb = tenantDatabaseService.getClientJdbcTemplate(
                    client.getId(), String.valueOf(client.getId())
            );
            clientDb.update("UPDATE utilisateur SET est_actif = ?, updated_at = NOW() WHERE email = ?", active, email);
            log.info("🔄 Statut utilisateur {} mis à jour (actif={}) dans base client", email, active);
        } catch (Exception e) {
            log.warn("⚠️ Erreur mise à jour statut base client: {}", e.getMessage());
        }
    }

    // ==================== LOGIN ====================

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            if (!utilisateur.getEstActif()) {
                return ResponseEntity.status(403).body(Map.of("error", "Compte désactivé"));
            }

            Client client = utilisateur.getClient();
            Long clientId = client.getId();
            String authenticatedClientId = String.valueOf(clientId);

            // Vérification de l'accès à la base du client
            try {
                JdbcTemplate clientJdbcTemplate = tenantDatabaseService.getClientJdbcTemplate(
                        clientId, authenticatedClientId
                );
                clientJdbcTemplate.queryForObject("SELECT 1", Integer.class);
                log.info("✅ Base du client accessible: {}", client.getNomBaseDonnees());
            } catch (SecurityException e) {
                log.error("❌ Erreur sécurité: {}", e.getMessage());
                return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
            } catch (Exception e) {
                log.error("❌ Erreur accès base client {}: {}", client.getNomBaseDonnees(), e.getMessage());
                return ResponseEntity.status(500).body(Map.of(
                        "error", "Erreur d'accès à la base de données du client"
                ));
            }

            // Gestion des connexions (période d'essai)
            boolean hasActiveSubscription = client.getAbonnementActif() != null;

            if (!hasActiveSubscription) {
                if (client.getConnexionsRestantes() <= 0) {
                    return ResponseEntity.status(403).body(Map.of(
                            "error", "❌ Période d'essai expirée. Veuillez souscrire un abonnement.",
                            "code", "ESSAI_EXPIRE"
                    ));
                }

                int anciennesConnexions = client.getConnexionsRestantes();
                client.setConnexionsRestantes(anciennesConnexions - 1);
                clientRepository.save(client);

                log.info("🔐 Période d'essai - Client: {} - Connexions restantes: {}/{}",
                        client.getEmail(), client.getConnexionsRestantes(), client.getConnexionsMax());
            } else {
                log.info("🔐 Abonnement actif - Client: {} - Connexions illimitées", client.getEmail());
            }

            // Génération du token
            String token = jwtTokenProvider.generateToken(
                    utilisateur.getEmail(),
                    utilisateur.getRole().name(),
                    client.getId(),
                    client.getNomBaseDonnees()
            );

            boolean wasOtherSessionActive = sessionManagementService.registerSession(email, token);

            // Construction de la réponse
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("email", utilisateur.getEmail());
            response.put("role", utilisateur.getRole().name());
            response.put("type", "CLIENT");
            response.put("clientId", client.getId());
            response.put("clientName", client.getNom());
            response.put("nom", utilisateur.getNom());
            response.put("prenom", utilisateur.getPrenom());
            response.put("database", client.getNomBaseDonnees());
            response.put("tenantId", client.getId());
            response.put("connexionsRestantes", client.getConnexionsRestantes());
            response.put("connexionsMax", client.getConnexionsMax());
            response.put("typeInscription", client.getTypeInscription().name());
            response.put("statut", client.getStatut().getLabel());
            response.put("hasActiveSubscription", hasActiveSubscription);

            if (!hasActiveSubscription && client.getConnexionsRestantes() <= 5 && client.getConnexionsRestantes() > 0) {
                response.put("warning", "⚠️ Attention : Il vous reste " + client.getConnexionsRestantes() +
                        " connexion(s) avant la fin de votre période d'essai.");
            }

            if (!wasOtherSessionActive) {
                response.put("sessionWarning", "Une autre session a été fermée suite à cette connexion");
            }

            utilisateur.setLastLogin(LocalDateTime.now());
            utilisateurRepository.save(utilisateur);

            log.info("✅ Login réussi - Client: {} - Base: {} - Rôle: {} - Connexions restantes: {}",
                    client.getEmail(), client.getNomBaseDonnees(), utilisateur.getRole(), client.getConnexionsRestantes());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Erreur login: {}", e.getMessage());
            return ResponseEntity.status(401).body(Map.of("error", "Email ou mot de passe incorrect"));
        }
    }

    // ==================== INSCRIPTION UTILISATEUR ====================

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> request, Authentication authentication) {
        try {
            String currentUserEmail = authentication.getName();
            Utilisateur currentUser = utilisateurRepository.findByEmail(currentUserEmail)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Client client = currentUser.getClient();
            Long clientId = client.getId();

            // Vérifier que la base du client est accessible
            try {
                JdbcTemplate clientDb = tenantDatabaseService.getClientJdbcTemplate(
                        clientId, String.valueOf(clientId)
                );
                clientDb.queryForObject("SELECT 1", Integer.class);
                log.info("✅ Base client accessible pour création utilisateur");
            } catch (Exception e) {
                return ResponseEntity.status(500).body(Map.of("error", "Base de données client inaccessible"));
            }

            String nom = request.get("nom");
            String prenom = request.get("prenom");
            String email = request.get("email");
            String role = request.get("role");

            if (nom == null || nom.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Le nom est requis"));
            }
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "L'email est requis"));
            }

            if (utilisateurRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cet email est déjà utilisé"));
            }

            String adminDomain = extractEmailDomain(currentUserEmail);
            String newEmailDomain = extractEmailDomain(email);
            if (!newEmailDomain.equalsIgnoreCase(adminDomain)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "L'email doit utiliser le domaine: @" + adminDomain,
                        "expectedDomain", adminDomain
                ));
            }

            if ("admin".equalsIgnoreCase(role)) {
                boolean adminExists = utilisateurRepository.findByClientId(client.getId())
                        .stream()
                        .anyMatch(u -> u.getRole() == Utilisateur.RoleUtilisateur.ADMIN_CLIENT);
                if (adminExists) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "error", "Un administrateur existe déjà pour ce client"
                    ));
                }
            }

            String activationToken = jwtTokenProvider.generateActivationToken(email, 24);

            Utilisateur newUser = Utilisateur.builder()
                    .nom(nom.trim())
                    .prenom(prenom != null ? prenom.trim() : "")
                    .email(email.toLowerCase().trim())
                    .motDePasse(null)
                    .role(mapRoleFromFrontend(role))
                    .client(client)
                    .estActif(false)
                    .build();

            utilisateurRepository.save(newUser);

            // ✅ SYNC : Créer dans la base client
            syncUserToClientDatabase(client, newUser, role);

            emailService.sendActivationLinkEmail(email, activationToken);

            log.info("📧 Email d'activation envoyé à {}", email);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Utilisateur créé avec succès. Un email d'activation lui a été envoyé.");
            response.put("id", newUser.getId());
            response.put("email", newUser.getEmail());
            response.put("role", role);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Erreur registerUser: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== UTILISATEUR COURANT ====================

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        log.info("🔍 getCurrentUser client: {}", email);

        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        Client client = utilisateur.getClient();

        Map<String, Object> response = new HashMap<>();
        response.put("id", utilisateur.getId());
        response.put("email", utilisateur.getEmail());
        response.put("nom", utilisateur.getNom());
        response.put("prenom", utilisateur.getPrenom());
        response.put("role", utilisateur.getRole().name());
        response.put("type", "CLIENT");
        response.put("clientId", client.getId());
        response.put("clientName", client.getNom());
        response.put("active", utilisateur.getEstActif());
        response.put("memberSince", client.getDateInscription());
        response.put("lastLogin", utilisateur.getLastLogin());

        return ResponseEntity.ok(response);
    }

    // ==================== DÉCONNEXION ====================

    @PostMapping("/logout")
    public ResponseEntity<?> logout(Authentication authentication) {
        if (authentication != null) {
            String email = authentication.getName();
            sessionManagementService.removeSession(email);
            log.info("🔓 Déconnexion - Session supprimée pour {}", email);
        }
        return ResponseEntity.ok(Map.of("message", "Déconnecté avec succès"));
    }

    // ==================== ACTIVATION COMPTE ====================

    @GetMapping("/activation-link-info")
    public ResponseEntity<?> getActivationLinkInfo(@RequestParam String token) {
        try {
            log.info("🔐 Vérification du token d'activation: {}", token);

            if (!jwtTokenProvider.validateToken(token)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Lien d'activation invalide ou expiré."));
            }

            String email = jwtTokenProvider.getEmailFromToken(token);
            log.info("📧 Token valide pour: {}", email);

            Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            if (utilisateur.getEstActif()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ce compte est déjà activé. Vous pouvez vous connecter."));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("email", utilisateur.getEmail());
            response.put("nom", utilisateur.getNom());
            response.put("prenom", utilisateur.getPrenom());
            response.put("hasPassword", utilisateur.getMotDePasse() != null);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Erreur lors de la vérification: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la vérification: " + e.getMessage()));
        }
    }

    @PostMapping("/activate-account")
    public ResponseEntity<?> activateAccountWithPassword(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            String newPassword = request.get("newPassword");

            log.info("🔐 Activation du compte avec création de mot de passe");

            if (!jwtTokenProvider.validateToken(token)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Lien d'activation invalide ou expiré."));
            }

            if (newPassword == null || newPassword.length() < 8) {
                return ResponseEntity.badRequest().body(Map.of("error", "Le mot de passe doit contenir au moins 8 caractères."));
            }

            String email = jwtTokenProvider.getEmailFromToken(token);
            log.info("📧 Activation du compte pour: {}", email);

            Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            if (utilisateur.getEstActif()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ce compte est déjà activé. Vous pouvez vous connecter."));
            }

            utilisateur.setEstActif(true);
            utilisateur.setMotDePasse(passwordEncoder.encode(newPassword));
            utilisateurRepository.save(utilisateur);

            // ✅ SYNC : Mettre à jour le statut dans la base client
            Client client = utilisateur.getClient();
            updateUserStatusInClientDatabase(client, email, true);

            log.info("✅ Compte activé avec succès: {}", email);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Votre compte a été activé avec succès !");
            response.put("email", email);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Erreur lors de l'activation: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de l'activation: " + e.getMessage()));
        }
    }

    // ==================== RÉINITIALISATION MOT DE PASSE ====================

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");

            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email requis"));
            }

            Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Aucun compte associé à cet email"));

            String otpCode = String.format("%06d", new Random().nextInt(999999));

            emailService.sendResetPasswordEmail(email, otpCode);

            log.info("📧 Code de réinitialisation envoyé à {}", email);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Un code de réinitialisation a été envoyé à votre email"
            ));

        } catch (Exception e) {
            log.error("Erreur forgotPassword: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String code = request.get("code");
            String newPassword = request.get("newPassword");

            boolean isValid = true; // À remplacer par la vraie vérification OTP

            if (!isValid) {
                return ResponseEntity.badRequest().body(Map.of("error", "Code invalide ou expiré"));
            }

            if (newPassword == null || newPassword.length() < 8) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Le mot de passe doit contenir au moins 8 caractères"
                ));
            }

            Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            utilisateur.setMotDePasse(passwordEncoder.encode(newPassword));
            utilisateurRepository.save(utilisateur);

            log.info("🔑 Mot de passe réinitialisé pour {}", email);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Votre mot de passe a été réinitialisé avec succès"
            ));

        } catch (Exception e) {
            log.error("Erreur resetPassword: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== GESTION DES UTILISATEURS ====================

    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers(Authentication authentication) {
        try {
            String email = authentication.getName();
            Utilisateur currentUser = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Client client = currentUser.getClient();
            List<Utilisateur> users = utilisateurRepository.findByClientId(client.getId());

            List<Map<String, Object>> userList = users.stream()
                    .map(user -> {
                        Map<String, Object> userMap = new HashMap<>();
                        userMap.put("id", user.getId());
                        userMap.put("name", (user.getNom() + " " + (user.getPrenom() != null ? user.getPrenom() : "")).trim());
                        userMap.put("email", user.getEmail());
                        userMap.put("role", mapRoleToFrontend(user.getRole()));
                        userMap.put("active", user.getEstActif());
                        userMap.put("nom", user.getNom());
                        userMap.put("prenom", user.getPrenom());
                        return userMap;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(userList);

        } catch (Exception e) {
            log.error("Erreur getAllUsers: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/filter")
    public ResponseEntity<?> filterUsers(
            @RequestParam(required = false) String nom,
            @RequestParam(required = false) String prenom,
            @RequestParam(required = false) String role,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            Utilisateur currentUser = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Client client = currentUser.getClient();
            List<Utilisateur> users = utilisateurRepository.findByClientId(client.getId());

            List<Map<String, Object>> filteredUsers = users.stream()
                    .filter(user -> {
                        if (nom != null && !nom.isEmpty() && !user.getNom().toLowerCase().contains(nom.toLowerCase())) {
                            return false;
                        }
                        if (prenom != null && !prenom.isEmpty() && user.getPrenom() != null &&
                                !user.getPrenom().toLowerCase().contains(prenom.toLowerCase())) {
                            return false;
                        }
                        if (role != null && !role.isEmpty()) {
                            String userRole = mapRoleToFrontend(user.getRole());
                            if (!userRole.equalsIgnoreCase(role)) {
                                return false;
                            }
                        }
                        return true;
                    })
                    .map(user -> {
                        Map<String, Object> userMap = new HashMap<>();
                        userMap.put("id", user.getId());
                        userMap.put("name", user.getNom() + " " + (user.getPrenom() != null ? user.getPrenom() : ""));
                        userMap.put("email", user.getEmail());
                        userMap.put("role", mapRoleToFrontend(user.getRole()));
                        userMap.put("active", user.getEstActif());
                        return userMap;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(filteredUsers);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateUserById(
            @PathVariable Long id,
            @RequestBody Map<String, Object> userData,
            Authentication authentication) {
        try {
            String currentUserEmail = authentication.getName();
            Utilisateur currentUser = utilisateurRepository.findByEmail(currentUserEmail)
                    .orElseThrow(() -> new RuntimeException("Utilisateur courant non trouvé"));

            Utilisateur userToUpdate = utilisateurRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec ID: " + id));

            if (!userToUpdate.getClient().getId().equals(currentUser.getClient().getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Non autorisé"));
            }

            boolean isOwnAccount = userToUpdate.getId().equals(currentUser.getId());

            String name = (String) userData.get("name");
            if (name != null && !name.isEmpty()) {
                String[] nameParts = name.split(" ", 2);
                userToUpdate.setNom(nameParts[0]);
                userToUpdate.setPrenom(nameParts.length > 1 ? nameParts[1] : "");
            }

            String newEmail = (String) userData.get("email");
            if (newEmail != null && !newEmail.isEmpty()) {
                String oldEmail = userToUpdate.getEmail();

                if (isOwnAccount && !oldEmail.equals(newEmail)) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "error", "Pour des raisons de sécurité, vous ne pouvez pas modifier votre propre adresse email."
                    ));
                }

                String adminDomain = extractEmailDomain(currentUserEmail);
                String newEmailDomain = extractEmailDomain(newEmail);
                if (!newEmailDomain.equalsIgnoreCase(adminDomain)) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "error", "L'email doit utiliser le domaine: @" + adminDomain,
                            "expectedDomain", adminDomain
                    ));
                }

                boolean emailExists = utilisateurRepository.findByEmail(newEmail)
                        .map(existingUser -> !existingUser.getId().equals(id))
                        .orElse(false);

                if (emailExists) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Cet email est déjà utilisé"));
                }
                userToUpdate.setEmail(newEmail);
            }

            String role = (String) userData.get("role");
            if (role != null && !role.isEmpty()) {
                userToUpdate.setRole(mapRoleFromFrontend(role));
            }

            utilisateurRepository.save(userToUpdate);

            // ✅ SYNC : Mettre à jour dans la base client
            syncUserToClientDatabase(currentUser.getClient(), userToUpdate, role);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Utilisateur mis à jour avec succès");
            response.put("id", userToUpdate.getId());
            response.put("email", userToUpdate.getEmail());
            response.put("name", userToUpdate.getNom() + " " + userToUpdate.getPrenom());
            response.put("role", mapRoleToFrontend(userToUpdate.getRole()));
            response.put("active", userToUpdate.getEstActif());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Erreur updateUserById: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/delete/{email}")
    public ResponseEntity<?> deleteUser(@PathVariable String email, Authentication authentication) {
        try {
            String currentUserEmail = authentication.getName();
            Utilisateur currentUser = utilisateurRepository.findByEmail(currentUserEmail)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Utilisateur userToDelete = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            if (!userToDelete.getClient().getId().equals(currentUser.getClient().getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Non autorisé"));
            }

            if (userToDelete.getEmail().equals(currentUserEmail)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Vous ne pouvez pas supprimer votre propre compte"));
            }

            utilisateurRepository.delete(userToDelete);

            // ✅ SYNC : Supprimer de la base client
            deleteUserFromClientDatabase(currentUser.getClient(), email);

            return ResponseEntity.ok(Map.of("message", "Utilisateur supprimé avec succès"));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/activate/{email}")
    public ResponseEntity<?> setUserActiveStatus(
            @PathVariable String email,
            @RequestParam boolean active,
            Authentication authentication) {
        try {
            String currentUserEmail = authentication.getName();
            Utilisateur currentUser = utilisateurRepository.findByEmail(currentUserEmail)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Utilisateur userToUpdate = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            if (!userToUpdate.getClient().getId().equals(currentUser.getClient().getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Non autorisé"));
            }

            userToUpdate.setEstActif(active);
            utilisateurRepository.save(userToUpdate);

            // ✅ SYNC : Mettre à jour le statut dans la base client
            updateUserStatusInClientDatabase(currentUser.getClient(), email, active);

            return ResponseEntity.ok(Map.of(
                    "message", active ? "Utilisateur activé" : "Utilisateur désactivé",
                    "active", active
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> request,
                                           Authentication authentication) {
        try {
            String email = authentication.getName();
            Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            String nom = request.get("nom");
            String prenom = request.get("prenom");

            if (nom != null && !nom.isEmpty()) utilisateur.setNom(nom);
            if (prenom != null && !prenom.isEmpty()) utilisateur.setPrenom(prenom);

            utilisateurRepository.save(utilisateur);

            return ResponseEntity.ok(Map.of("message", "Profil mis à jour avec succès"));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request,
                                            Authentication authentication) {
        try {
            String email = authentication.getName();
            String oldPassword = request.get("oldPassword");
            String newPassword = request.get("newPassword");

            Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            if (!passwordEncoder.matches(oldPassword, utilisateur.getMotDePasse())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Mot de passe actuel incorrect"));
            }

            if (newPassword.length() < 8) {
                return ResponseEntity.badRequest().body(Map.of("error", "Le mot de passe doit contenir au moins 8 caractères"));
            }

            utilisateur.setMotDePasse(passwordEncoder.encode(newPassword));
            utilisateurRepository.save(utilisateur);

            return ResponseEntity.ok(Map.of("message", "Mot de passe modifié avec succès"));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/create-password")
    public ResponseEntity<?> createPassword(@RequestBody CreatePasswordRequest request) {
        if (!invitationService.verifyCode(request.getEmail(), request.getCode())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Code invalide ou expiré"));
        }

        Client client = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Client non trouvé")).getClient();

        Utilisateur utilisateur = Utilisateur.builder()
                .email(client.getEmail())
                .motDePasse(passwordEncoder.encode(request.getNewPassword()))
                .role(Utilisateur.RoleUtilisateur.ADMIN_CLIENT)
                .client(client)
                .estActif(true)
                .build();

        utilisateurRepository.save(utilisateur);

        return ResponseEntity.ok(Map.of("message", "Mot de passe créé avec succès. Vous pouvez maintenant vous connecter."));
    }
}