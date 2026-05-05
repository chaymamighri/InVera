package org.erp.invera.controller.erp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.erp.invera.model.erp.Utilisateur;
import org.erp.invera.model.platform.Client;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.erp.invera.security.JwtTokenProvider;
import org.erp.invera.service.erp.EmailService;
import org.erp.invera.service.erp.UtilisateurService;
import org.erp.invera.service.platform.ClientPlatformService;
import org.erp.invera.service.platform.SessionManagementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UtilisateurService utilisateurService;
    private final ClientPlatformRepository clientRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final SessionManagementService sessionManagementService;
    private final EmailService emailService;
    private final ClientPlatformService clientPlatformService;

    // ==================== LOGIN ====================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        log.info(" Tentative de login: {}", email);

        try {
            Long clientId = null;
            Map<String, Object> authResult = null;
            Client client = null;
            String dbName = null;

            // 1. Recherche du client
            client = findClientByUserEmail(email);

            if (client != null) {
                clientId = client.getId();
                dbName = client.getNomBaseDonnees();

                if (dbName == null || dbName.isEmpty()) {
                    return ResponseEntity.status(401).body(Map.of("error", "Configuration base de données manquante"));
                }

                authResult = utilisateurService.authenticate(clientId, email, password);

            } else {
                // 2. Recherche dans toutes les bases ERP
                List<Client> allClients = clientRepository.findAll();

                for (Client c : allClients) {
                    try {
                        Map<String, Object> result = utilisateurService.authenticate(c.getId(), email, password);
                        if (result != null && !result.isEmpty()) {
                            client = c;
                            clientId = c.getId();
                            dbName = c.getNomBaseDonnees();
                            authResult = result;
                            break;
                        }
                    } catch (Exception e) {
                        // Silencieux
                    }
                }
            }

            if (authResult == null || client == null) {
                log.warn(" Login échoué: {}", email);
                return ResponseEntity.status(401).body(Map.of("error", "Email ou mot de passe incorrect"));
            }

            // 3. Enregistrer la connexion (recordLogin gère tout)
            Client updatedClient = clientPlatformService.recordLogin(email);
            client = updatedClient;

            boolean hasActiveSubscription = client.getAbonnementActif() != null;

            // 4. Génération du token
            String token = jwtTokenProvider.generateToken(email, (String) authResult.get("role"), clientId, dbName);

            if (token == null || token.isEmpty()) {
                return ResponseEntity.status(500).body(Map.of("error", "Erreur lors de la génération du token"));
            }

            // 5. Gestion de session
            boolean wasOtherSessionActive = sessionManagementService.registerSession(email, token);

            // 6. Construction de la réponse
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("email", email);
            response.put("role", authResult.get("role"));
            response.put("type", "CLIENT");
            response.put("clientId", clientId);
            response.put("clientName", client.getNom());
            response.put("nom", authResult.get("nom"));
            response.put("prenom", authResult.get("prenom"));
            response.put("database", dbName);
            response.put("tenantId", clientId);
            response.put("connexionsRestantes", client.getConnexionsRestantes());
            response.put("connexionsMax", client.getConnexionsMax());
            response.put("typeInscription", client.getTypeInscription().name());
            response.put("statut", client.getStatut().getLabel());
            response.put("hasActiveSubscription", hasActiveSubscription);

            // Avertissement si connexions faibles
            if (!hasActiveSubscription && client.getConnexionsRestantes() <= 5 && client.getConnexionsRestantes() > 0) {
                response.put("warning", " Il vous reste " + client.getConnexionsRestantes() +
                        " connexion(s) avant la fin de votre période d'essai.");
            }

            if (!wasOtherSessionActive) {
                response.put("sessionWarning", "Une autre session a été fermée suite à cette connexion");
            }

            log.info("✅ Login réussi: {} - Rôle: {}", email, authResult.get("role"));

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.warn("❌ Login échoué: {} - {}", email, e.getMessage());
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Erreur login: {}", e.getMessage());
            return ResponseEntity.status(401).body(Map.of("error", "Email ou mot de passe incorrect"));
        }
    }
    // ==================== UTILITAIRE ====================

    private Client findClientByUserEmail(String email) {
        return clientRepository.findByEmail(email).orElse(null);
    }

    private String generateTempPassword() {
        return UUID.randomUUID().toString().substring(0, 12);
    }

// ==================== INSCRIPTION UTILISATEUR ====================

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> request, Authentication authentication) {
        try {
            log.info("=== registerUser START ===");
            log.info("Request body: {}", request);
            log.info("Authentication: {}", authentication);
            log.info("Authentication name: {}", authentication != null ? authentication.getName() : "null");

            String currentUserEmail = authentication.getName();
            log.info("currentUserEmail: {}", currentUserEmail);

            Client currentClient = findClientByUserEmail(currentUserEmail);
            log.info("currentClient: {}", currentClient);

            if (currentClient == null) {
                log.error("Client non trouvé pour email: {}", currentUserEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "Client non trouvé"));
            }

            Long clientId = currentClient.getId();
            log.info("clientId: {}", clientId);

            String nom = request.get("nom");
            String prenom = request.get("prenom");
            String email = request.get("email");
            String role = request.get("role");

            log.info("nom: {}, prenom: {}, email: {}, role: {}", nom, prenom, email, role);

            // Validation
            if (nom == null || nom.trim().isEmpty()) {
                log.error("Nom manquant");
                return ResponseEntity.badRequest().body(Map.of("error", "Le nom est requis"));
            }
            if (email == null || email.trim().isEmpty()) {
                log.error("Email manquant");
                return ResponseEntity.badRequest().body(Map.of("error", "L'email est requis"));
            }

            // Vérifier si l'email existe déjà
            boolean exists = utilisateurService.userExists(clientId, email);
            log.info("Email exists: {}", exists);

            if (exists) {
                log.warn("Email déjà utilisé: {}", email);
                return ResponseEntity.badRequest().body(Map.of("error", "Cet email est déjà utilisé"));
            }

            String backendRole = mapFrontendRoleToBackend(role);
            log.info("backendRole: {}", backendRole);

            String tempPassword = generateTempPassword();
            log.info("tempPassword: {}", tempPassword);

            Utilisateur newUser = utilisateurService.createEmployee(
                    clientId,
                    email,
                    tempPassword,
                    nom.trim(),
                    prenom != null ? prenom.trim() : "",
                    backendRole
            );

            log.info("newUser created: {}", newUser != null ? newUser.getId() : "null");

            // Désactiver le compte jusqu'à activation
            utilisateurService.toggleEmployeeStatus(clientId, newUser.getId(), false);

            // ✅ AJOUTER L'ENVOI D'EMAIL D'ACTIVATION
            String activationToken = jwtTokenProvider.generateActivationToken(email, 24);
            emailService.sendActivationLinkEmail(email, activationToken, nom, prenom);
            log.info(" Email d'activation envoyé à {}", email);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Utilisateur créé avec succès. Un email d'activation lui a été envoyé.");
            response.put("id", newUser.getId());
            response.put("email", newUser.getEmail());
            response.put("role", role);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Erreur registerUser: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private String mapFrontendRoleToBackend(String role) {
        switch (role.toLowerCase()) {
            case "admin":
                return "ADMIN_CLIENT";
            case "procurement":
                return "RESPONSABLE_ACHAT";
            case "sales":
            default:
                return "COMMERCIAL";
        }
    }

    // ==================== RÉCUPÉRER TOUS LES UTILISATEURS ====================

    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers(@RequestHeader("Authorization") String token) {
        try {
            // Extraire le clientId du token
            String jwt = token.replace("Bearer ", "");
            Long clientId = jwtTokenProvider.getClientIdFromToken(jwt);

            log.info(" Récupération de tous les utilisateurs pour clientId: {}", clientId);

            // Récupérer les utilisateurs depuis la base ERP du client
            List<Map<String, Object>> users = utilisateurService.getAllUsers(clientId);

            log.info("{} utilisateur(s) trouvé(s) pour clientId: {}", users.size(), clientId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "users", users,
                    "count", users.size()
            ));

        } catch (Exception e) {
            log.error("Erreur récupération utilisateurs: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", e.getMessage(),
                    "users", List.of()
            ));
        }
    }

    // ==================== UPDATE UTILISATEUR ====================

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id,
                                        @RequestBody Map<String, String> request,
                                        Authentication authentication) {
        try {
            log.info("=== Update user ===");
            log.info("ID utilisateur à modifier: {}", id);

            String currentUserEmail = authentication.getName();
            log.info("Utilisateur courant: {}", currentUserEmail);

            Client currentClient = findClientByUserEmail(currentUserEmail);
            if (currentClient == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Client non trouvé"));
            }

            Long clientId = currentClient.getId();

            // Récupérer l'utilisateur à modifier
            Utilisateur userToUpdate = utilisateurService.findById(clientId, id);
            if (userToUpdate == null) {
                return ResponseEntity.notFound().build();
            }

            // ✅ EMPÊCHER la modification d'un compte admin
            if (userToUpdate.getRole().name().equals("ADMIN_CLIENT")) {
                return ResponseEntity.status(403).body(Map.of("error", "Vous ne pouvez pas modifier un compte administrateur."));
            }

            // ✅ EMPÊCHER la modification de son propre compte
            if (userToUpdate.getEmail().equals(currentUserEmail)) {
                return ResponseEntity.status(403).body(Map.of("error", "Vous ne pouvez pas modifier votre propre compte via cette interface."));
            }

            // Récupérer les données
            String nom = request.get("nom");
            String prenom = request.get("prenom");
            String email = request.get("email");
            String role = request.get("role");
            String activeStr = request.get("active");

            Boolean active = activeStr != null ? Boolean.parseBoolean(activeStr) : null;

            // Valider l'email
            if (email != null && !email.equals(userToUpdate.getEmail())) {
                boolean emailExists = utilisateurService.userExists(clientId, email);
                if (emailExists) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Cet email est déjà utilisé par un autre utilisateur."));
                }
            }

            // Mettre à jour
            String backendRole = null;
            if (role != null) {
                backendRole = mapFrontendRoleToBackend(role);
            }

            utilisateurService.updateEmployee(clientId, id, nom, prenom, email, backendRole, active);

            log.info(" Utilisateur {} mis à jour avec succès", id);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Utilisateur modifié avec succès",
                    "id", id
            ));

        } catch (Exception e) {
            log.error("Erreur update user: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.replace("Bearer ", "");
            String email = jwtTokenProvider.getEmailFromToken(jwt);
            Long clientId = jwtTokenProvider.getClientIdFromToken(jwt);
            String role = jwtTokenProvider.getRoleFromToken(jwt);

            log.info("📌 GetCurrentUser - email: {}, clientId: {}, role: {}", email, clientId, role);

            Client client = findClientByUserEmail(email);
            if (client == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Client non trouvé"));
            }

            Utilisateur user = utilisateurService.findByEmail(clientId, email);

            if (user == null) {
                log.warn("⚠️ Utilisateur non trouvé dans la base client_{}", clientId);
                return ResponseEntity.status(404).body(Map.of("error", "Utilisateur non trouvé"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("email", user.getEmail());
            response.put("nom", user.getNom() != null ? user.getNom() : "");
            response.put("prenom", user.getPrenom() != null ? user.getPrenom() : "");
            response.put("role", user.getRole().name());
            response.put("active", user.getActive());
            response.put("clientId", clientId);
            response.put("database", "client_" + clientId);

            // Dates
            response.put("memberSince", user.getCreatedAt());
            response.put("lastLogin", user.getLastLogin());
            response.put("sessionsThisWeek", 0);

            // Infos client (abonnement)
            response.put("connexionsRestantes", client.getConnexionsRestantes());
            response.put("connexionsMax", client.getConnexionsMax());
            response.put("typeInscription", client.getTypeInscription().name());
            response.put("hasActiveSubscription", client.getAbonnementActif() != null);
            response.put("statut", client.getStatut().getLabel());

            // ✅ AJOUTER LES CHAMPS MANQUANTS POUR LE PROFIL
            response.put("typeCompte", client.getTypeCompte() != null ? client.getTypeCompte().name() : "PARTICULIER");
            response.put("raisonSociale", client.getRaisonSociale() != null ? client.getRaisonSociale() : "");
            response.put("matriculeFiscal", client.getMatriculeFiscal() != null ? client.getMatriculeFiscal() : "");
            response.put("logoUrl", client.getLogoUrl() != null ? client.getLogoUrl() : "");

            log.info("✅ Infos client retournées - typeCompte: {}, raisonSociale: {}, logoUrl: {}",
                    client.getTypeCompte(),
                    client.getRaisonSociale(),
                    client.getLogoUrl() != null ? "Présent" : "Absent");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Erreur getCurrentUser: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== DÉCONNEXION ====================

    @PostMapping("/logout")
    public ResponseEntity<?> logout(Authentication authentication) {
        if (authentication != null) {
            String email = authentication.getName();
            sessionManagementService.removeSession(email);
            log.info(" Déconnexion - Session supprimée pour {}", email);
        }
        return ResponseEntity.ok(Map.of("message", "Déconnecté avec succès"));
    }

    // ==================== ACTIVATION/DÉSACTIVATION UTILISATEUR ====================

    @PatchMapping("/activate/{email}")
    public ResponseEntity<?> activateUser(@PathVariable String email, @RequestParam boolean active, Authentication authentication) {
        try {
            log.info("=== Toggle user status ===");
            log.info("Email: {}, active: {}", email, active);

            String currentUserEmail = authentication.getName();
            log.info("Current user: {}", currentUserEmail);

            Client currentClient = findClientByUserEmail(currentUserEmail);
            if (currentClient == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Client non trouvé"));
            }

            Long clientId = currentClient.getId();

            // Récupérer l'utilisateur
            Utilisateur user = utilisateurService.findByEmail(clientId, email);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }

            // Changer le statut
            utilisateurService.toggleEmployeeStatus(clientId, user.getId(), active);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Statut modifié avec succès",
                    "active", active
            ));

        } catch (Exception e) {
            log.error("Erreur activation: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

// ==================== UPDATE PROFILE ====================
@PutMapping("/update-profile")
public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> request,
                                       @RequestHeader("Authorization") String token) {
    try {
        String jwt = token.replace("Bearer ", "");
        String email = jwtTokenProvider.getEmailFromToken(jwt);
        Long clientId = jwtTokenProvider.getClientIdFromToken(jwt);

        String nom = request.get("nom");
        String prenom = request.get("prenom");

        // Aller directement à l'utilisateur
        Utilisateur user = utilisateurService.findByEmail(clientId, email);
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Utilisateur non trouvé"));
        }

        utilisateurService.updateEmployee(clientId, user.getId(), nom, prenom, null, null, null);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Profil mis à jour avec succès",
                "nom", nom,
                "prenom", prenom
        ));

    } catch (Exception e) {
        log.error("Erreur update-profile: {}", e.getMessage(), e);
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}

// ==================== CHANGE PASSWORD ====================

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request,
                                            @RequestHeader("Authorization") String token) {
        try {
            String jwt = token.replace("Bearer ", "");
            String email = jwtTokenProvider.getEmailFromToken(jwt);
            Long clientId = jwtTokenProvider.getClientIdFromToken(jwt);

            String oldPassword = request.get("oldPassword");
            String newPassword = request.get("newPassword");

            // Vérifier l'ancien mot de passe
            Map<String, Object> authResult = utilisateurService.authenticate(clientId, email, oldPassword);
            if (authResult == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Mot de passe actuel incorrect"));
            }

            // Mettre à jour le mot de passe
            Utilisateur user = utilisateurService.findByEmail(clientId, email);
            utilisateurService.updatePassword(clientId, user.getId(), newPassword);

            return ResponseEntity.ok(Map.of("success", true, "message", "Mot de passe modifié avec succès"));

        } catch (Exception e) {
            log.error("Erreur change-password: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

// ==================== SUPPRESSION UTILISATEUR ====================

    @DeleteMapping("/delete/{email}")
    public ResponseEntity<?> deleteUser(@PathVariable String email, Authentication authentication) {
        try {
            log.info("=== Delete user ===");
            log.info("Email: {}", email);

            String currentUserEmail = authentication.getName();
            Client currentClient = findClientByUserEmail(currentUserEmail);
            if (currentClient == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Client non trouvé"));
            }

            Long clientId = currentClient.getId();

            // Vérifier que l'utilisateur existe
            Utilisateur user = utilisateurService.findByEmail(clientId, email);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }

            // Vérifier qu'on ne supprime pas son propre compte
            if (user.getEmail().equals(currentUserEmail)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Vous ne pouvez pas supprimer votre propre compte"));
            }

            // Supprimer l'utilisateur
            utilisateurService.deleteEmployee(clientId, user.getId());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Utilisateur supprimé avec succès"
            ));

        } catch (Exception e) {
            log.error("Erreur delete user: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== ACTIVATION COMPTE ====================

    @GetMapping("/activation-link-info")
    public ResponseEntity<?> getActivationLinkInfo(@RequestParam String token) {
        try {
            log.info(" Vérification du token d'activation: {}", token);

            if (!jwtTokenProvider.validateToken(token)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Lien d'activation invalide ou expiré."));
            }

            String email = jwtTokenProvider.getEmailFromToken(token);
            log.info(" Token valide pour: {}", email);

            Client client = findClientByUserEmail(email);
            if (client == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Utilisateur non trouvé"));
            }

            Utilisateur utilisateur = utilisateurService.findByEmail(client.getId(), email);
            if (utilisateur == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Utilisateur non trouvé"));
            }

            if (utilisateur.getActive()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ce compte est déjà activé. Vous pouvez vous connecter."));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("email", utilisateur.getEmail());
            response.put("nom", utilisateur.getNom());
            response.put("prenom", utilisateur.getPrenom());
            response.put("hasPassword", utilisateur.getMotDePasse() != null);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error(" Erreur lors de la vérification: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la vérification: " + e.getMessage()));
        }
    }

    @PostMapping("/activate-account")
    public ResponseEntity<?> activateAccountWithPassword(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            String newPassword = request.get("newPassword");

            log.info(" Activation du compte avec création de mot de passe");

            if (!jwtTokenProvider.validateToken(token)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Lien d'activation invalide ou expiré."));
            }

            if (newPassword == null || newPassword.length() < 8) {
                return ResponseEntity.badRequest().body(Map.of("error", "Le mot de passe doit contenir au moins 8 caractères."));
            }

            String email = jwtTokenProvider.getEmailFromToken(token);
            log.info(" Activation du compte pour: {}", email);

            Client client = findClientByUserEmail(email);
            if (client == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Utilisateur non trouvé"));
            }

            Utilisateur utilisateur = utilisateurService.findByEmail(client.getId(), email);
            if (utilisateur == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Utilisateur non trouvé"));
            }

            if (utilisateur.getActive()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ce compte est déjà activé. Vous pouvez vous connecter."));
            }

            // Activer le compte
            utilisateurService.toggleEmployeeStatus(client.getId(), utilisateur.getId(), true);

            // Mettre à jour le mot de passe
            utilisateurService.updatePassword(client.getId(), utilisateur.getId(), newPassword);

            log.info(" Compte activé avec succès: {}", email);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Votre compte a été activé avec succès !");
            response.put("email", email);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error(" Erreur lors de l'activation: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de l'activation: " + e.getMessage()));
        }
    }

    // ==================== MOT DE PASSE OUBLIÉ ====================

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            log.info(" Demande de réinitialisation pour: {}", email);

            // 1. Vérifier que le client existe
            Client client = findClientByUserEmail(email);
            if (client == null) {
                // Pour sécurité, on ne dit pas que l'email n'existe pas
                log.warn("Email non trouvé: {}", email);
                return ResponseEntity.ok(Map.of("message", "Si cet email existe, un code de réinitialisation vous a été envoyé."));
            }

            // 2. Vérifier que l'utilisateur existe dans la base client
            Utilisateur user = utilisateurService.findByEmail(client.getId(), email);
            if (user == null) {
                log.warn("Utilisateur non trouvé dans la base client: {}", email);
                return ResponseEntity.ok(Map.of("message", "Si cet email existe, un code de réinitialisation vous a été envoyé."));
            }

            // 3. Générer un code à 6 chiffres
            String resetCode = String.format("%06d", new Random().nextInt(999999));

            // 4. Stocker le code en base ou en cache (exemple: en base)
            // Pour simplifier, on peut le stocker dans une table reset_password
            // Ou utiliser un token JWT court
            String resetToken = jwtTokenProvider.generateResetPasswordToken(email, 10); // 10 minutes

            // 5. Envoyer l'email avec le code
            emailService.sendResetPasswordEmail(email, resetCode);

            log.info("📧 Code de réinitialisation envoyé à: {}", email);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Un code de réinitialisation a été envoyé à votre adresse email.",
                    "resetToken", resetToken // Optionnel: à retourner au frontend
            ));

        } catch (Exception e) {
            log.error("Erreur forgot-password: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Erreur lors de l'envoi du code"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String code = request.get("code");
            String newPassword = request.get("newPassword");

            log.info(" Réinitialisation du mot de passe pour: {}", email);

            // 2. Vérifier que le client existe
            Client client = findClientByUserEmail(email);
            if (client == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email non trouvé"));
            }

            // 3. Vérifier que l'utilisateur existe
            Utilisateur user = utilisateurService.findByEmail(client.getId(), email);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Utilisateur non trouvé"));
            }

            // 4. Valider le nouveau mot de passe
            if (newPassword == null || newPassword.length() < 8) {
                return ResponseEntity.badRequest().body(Map.of("error", "Le mot de passe doit contenir au moins 8 caractères."));
            }

            // 5. Mettre à jour le mot de passe
            utilisateurService.updatePassword(client.getId(), user.getId(), newPassword);

            log.info(" Mot de passe réinitialisé pour: {}", email);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Votre mot de passe a été réinitialisé avec succès."
            ));

        } catch (Exception e) {
            log.error("Erreur reset-password: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Erreur lors de la réinitialisation"));
        }
    }
}