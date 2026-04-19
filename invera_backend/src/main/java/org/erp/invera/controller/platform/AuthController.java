package org.erp.invera.controller.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Client;
import org.erp.invera.model.platform.ClientUser;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.erp.invera.repository.platform.ClientUserRepository;
import org.erp.invera.security.JwtTokenProvider;
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
    private final ClientUserRepository clientUserRepository;
    private final ClientPlatformRepository clientRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final InvitationService invitationService;
    private final SessionManagementService sessionManagementService;

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
            ClientUser clientUser = clientUserRepository.findByEmail(email).orElse(null);

            if (clientUser == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Email ou mot de passe incorrect"));
            }

            // Client ou employé
            if (!clientUser.getEstActif()) {
                return ResponseEntity.status(403).body(Map.of("error", "Compte désactivé"));
            }

            Client client = clientUser.getClient();

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
                    clientUser.getEmail(),
                    clientUser.getRole().name(),
                    client.getId()
            );

            //  Enregistrement session unique
            boolean wasOtherSessionActive = sessionManagementService.registerSession(email, token);

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("email", clientUser.getEmail());
            response.put("role", clientUser.getRole().name());
            response.put("type", "CLIENT");
            response.put("clientId", client.getId());
            response.put("clientName", client.getNom());
            response.put("nom", clientUser.getNom());
            response.put("prenom", clientUser.getPrenom());

            // Message si une autre session a été fermée
            if (!wasOtherSessionActive) {
                response.put("warning", "Une autre session a été fermée suite à cette connexion");
            }

            // Mettre à jour last_login
            clientUser.setLastLogin(LocalDateTime.now());
            clientUserRepository.save(clientUser);

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

        ClientUser clientUser = clientUserRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        Client client = clientUser.getClient();

        Map<String, Object> response = new HashMap<>();
        response.put("id", clientUser.getId());
        response.put("email", clientUser.getEmail());
        response.put("nom", clientUser.getNom());
        response.put("prenom", clientUser.getPrenom());
        response.put("role", clientUser.getRole().name());
        response.put("type", "CLIENT");
        response.put("clientId", client.getId());
        response.put("clientName", client.getNom());
        response.put("active", clientUser.getEstActif());
        response.put("memberSince", client.getDateInscription());
        response.put("lastLogin", clientUser.getLastLogin());

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
            ClientUser currentUser = clientUserRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Client client = currentUser.getClient();
            List<ClientUser> users = clientUserRepository.findByClientId(client.getId());

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
            ClientUser currentUser = clientUserRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Client client = currentUser.getClient();
            List<ClientUser> users = clientUserRepository.findByClientId(client.getId());

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
            ClientUser currentUser = clientUserRepository.findByEmail(currentUserEmail)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Client client = currentUser.getClient();

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

            // Vérifier si l'email existe déjà
            if (clientUserRepository.findByEmail(email).isPresent()) {
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
                boolean adminExists = clientUserRepository.findByClientId(client.getId())
                        .stream()
                        .anyMatch(u -> u.getRole() == ClientUser.RoleUtilisateur.ADMIN_CLIENT);
                if (adminExists) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "error", "Un administrateur existe déjà pour ce client"
                    ));
                }
            }

            String tempPassword = generateTempPassword();

            ClientUser newUser = ClientUser.builder()
                    .nom(nom.trim())
                    .prenom(prenom != null ? prenom.trim() : "")
                    .email(email.toLowerCase().trim())
                    .motDePasse(passwordEncoder.encode(tempPassword))
                    .role(mapRoleFromFrontend(role))
                    .client(client)
                    .estActif(true)
                    .build();

            clientUserRepository.save(newUser);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Utilisateur créé avec succès");
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
            ClientUser currentUser = clientUserRepository.findByEmail(currentUserEmail)
                    .orElseThrow(() -> new RuntimeException("Utilisateur courant non trouvé"));

            ClientUser userToUpdate = clientUserRepository.findById(id)
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

                boolean emailExists = clientUserRepository.findByEmail(newEmail)
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

            clientUserRepository.save(userToUpdate);

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
            ClientUser currentUser = clientUserRepository.findByEmail(currentUserEmail)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            ClientUser userToDelete = clientUserRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            if (!userToDelete.getClient().getId().equals(currentUser.getClient().getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Non autorisé"));
            }

            if (userToDelete.getEmail().equals(currentUserEmail)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Vous ne pouvez pas supprimer votre propre compte"));
            }

            clientUserRepository.delete(userToDelete);
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
            ClientUser currentUser = clientUserRepository.findByEmail(currentUserEmail)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            ClientUser userToUpdate = clientUserRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            if (!userToUpdate.getClient().getId().equals(currentUser.getClient().getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Non autorisé"));
            }

            userToUpdate.setEstActif(active);
            clientUserRepository.save(userToUpdate);

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
            ClientUser clientUser = clientUserRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            String nom = request.get("nom");
            String prenom = request.get("prenom");

            if (nom != null && !nom.isEmpty()) clientUser.setNom(nom);
            if (prenom != null && !prenom.isEmpty()) clientUser.setPrenom(prenom);

            clientUserRepository.save(clientUser);

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

            ClientUser clientUser = clientUserRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            if (!passwordEncoder.matches(oldPassword, clientUser.getMotDePasse())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Mot de passe actuel incorrect"));
            }

            if (newPassword.length() < 8) {
                return ResponseEntity.badRequest().body(Map.of("error", "Le mot de passe doit contenir au moins 8 caractères"));
            }

            clientUser.setMotDePasse(passwordEncoder.encode(newPassword));
            clientUserRepository.save(clientUser);

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

        Client client = clientUserRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Client non trouvé")).getClient();

        ClientUser clientUser = ClientUser.builder()
                .email(client.getEmail())
                .motDePasse(passwordEncoder.encode(request.getNewPassword()))
                .role(ClientUser.RoleUtilisateur.ADMIN_CLIENT)
                .client(client)
                .estActif(true)
                .build();

        clientUserRepository.save(clientUser);

        return ResponseEntity.ok(Map.of("message", "Mot de passe créé avec succès. Vous pouvez maintenant vous connecter."));
    }

    // ==================== MÉTHODES UTILITAIRES ====================

    private String mapRoleToFrontend(ClientUser.RoleUtilisateur role) {
        switch (role) {
            case ADMIN_CLIENT: return "admin";
            case COMMERCIAL: return "sales";
            case RESPONSABLE_ACHAT: return "procurement";
            default: return "sales";
        }
    }

    private ClientUser.RoleUtilisateur mapRoleFromFrontend(String role) {
        switch (role.toLowerCase()) {
            case "admin": return ClientUser.RoleUtilisateur.ADMIN_CLIENT;
            case "sales": return ClientUser.RoleUtilisateur.COMMERCIAL;
            case "procurement": return ClientUser.RoleUtilisateur.RESPONSABLE_ACHAT;
            default: return ClientUser.RoleUtilisateur.COMMERCIAL;
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
