package org.erp.invera.controller.platform;

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
import org.springframework.http.ResponseEntity;
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


    /**
     * Login UNIQUEMENT pour les clients (ADMIN_CLIENT, COMMERCIAL, RESPONSABLE_ACHAT)
     *
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Vérifier uniquement les clients
            Utilisateur utilisateur = utilisateurRepository.findByEmail(email).orElse(null);

            if (utilisateur == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Email ou mot de passe incorrect"));
            }

            // Client ou employé
            if (!utilisateur.getEstActif()) {
                return ResponseEntity.status(403).body(Map.of("error", "Compte désactivé"));
            }

            Client client = utilisateur.getClient();

            // Gestion du compteur de connexions pour ESSAI
            if (client.getTypeInscription() == Client.TypeInscription.ESSAI) {
                if (client.getConnexionsRestantes() <= 0) {
                    return ResponseEntity.status(403).body(Map.of(
                            "error", "Période d'essai expirée. Veuillez souscrire un abonnement."
                    ));
                }

                client.setConnexionsRestantes(client.getConnexionsRestantes() - 1);
                clientRepository.save(client);
            }

            String token = jwtTokenProvider.generateToken(
                    utilisateur.getEmail(),
                    utilisateur.getRole().name(),
                    client.getId()
            );

            //  Enregistrement session unique
            boolean wasOtherSessionActive = sessionManagementService.registerSession(email, token);

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("email", utilisateur.getEmail());
            response.put("role", utilisateur.getRole().name());
            response.put("type", "CLIENT");
            response.put("clientId", client.getId());
            response.put("clientName", client.getNom());
            response.put("nom", utilisateur.getNom());
            response.put("prenom", utilisateur.getPrenom());

            // Message si une autre session a été fermée
            if (!wasOtherSessionActive) {
                response.put("warning", "Une autre session a été fermée suite à cette connexion");
            }

            // Mettre à jour last_login
            utilisateur.setLastLogin(LocalDateTime.now());
            utilisateurRepository.save(utilisateur);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Erreur login client: {}", e.getMessage());
            return ResponseEntity.status(401).body(Map.of("error", "Email ou mot de passe incorrect"));
        }
    }

    /**
     * Récupérer l'utilisateur courant (UNIQUEMENT pour les clients)
     */
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

    /**
     * Déconnexion - Supprime la session active
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(Authentication authentication) {
        if (authentication != null) {
            String email = authentication.getName();
            sessionManagementService.removeSession(email);
            log.info("🔓 Déconnexion - Session supprimée pour {}", email);
        }
        return ResponseEntity.ok(Map.of("message", "Déconnecté avec succès"));
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


    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> request, Authentication authentication) {
        try {
            String currentUserEmail = authentication.getName();
            Utilisateur currentUser = utilisateurRepository.findByEmail(currentUserEmail)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Client client = currentUser.getClient();

            String nom = request.get("nom");
            String prenom = request.get("prenom");
            String email = request.get("email");
            String role = request.get("role");

            // Validations
            if (nom == null || nom.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Le nom est requis"));
            }
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "L'email est requis"));
            }

            // Vérifier si l'email existe déjà
            if (utilisateurRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cet email est déjà utilisé"));
            }

            // Vérifier le domaine email
            String adminDomain = extractEmailDomain(currentUserEmail);
            String newEmailDomain = extractEmailDomain(email);
            if (!newEmailDomain.equalsIgnoreCase(adminDomain)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "L'email doit utiliser le domaine: @" + adminDomain,
                        "expectedDomain", adminDomain
                ));
            }

            // Vérifier création d'admin en double
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

            // ✅ Générer un token JWT temporaire (valable 24h)
            String activationToken = jwtTokenProvider.generateActivationToken(email, 24);

            // Créer l'utilisateur (sans token en base)
            Utilisateur newUser = Utilisateur.builder()
                    .nom(nom.trim())
                    .prenom(prenom != null ? prenom.trim() : "")
                    .email(email.toLowerCase().trim())
                    .motDePasse(null)  // Pas de mot de passe
                    .role(mapRoleFromFrontend(role))
                    .client(client)
                    .estActif(false)  // Désactivé jusqu'à activation
                    .build();

            utilisateurRepository.save(newUser);

            // ✅ Envoyer l'email avec le token JWT comme lien d'activation
            String activationLink = "https://app.invera.com/activate?token=" + activationToken;
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

            // Mettre à jour le nom
            String name = (String) userData.get("name");
            if (name != null && !name.isEmpty()) {
                String[] nameParts = name.split(" ", 2);
                userToUpdate.setNom(nameParts[0]);
                userToUpdate.setPrenom(nameParts.length > 1 ? nameParts[1] : "");
            }

            // Mettre à jour l'email
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

    // ==================== MÉTHODES UTILITAIRES ====================

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

    private String generateTempPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            sb.append(chars.charAt((int) (Math.random() * chars.length())));
        }
        return sb.toString() + "@Temp2024";
    }
}
