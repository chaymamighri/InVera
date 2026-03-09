package org.erp.invera.controller;

import jakarta.validation.Valid;
import org.erp.invera.dto.*;
import org.erp.invera.model.Role;
import org.erp.invera.model.User;
import org.erp.invera.model.PasswordResetToken;
import org.erp.invera.model.Notification; // ✅ NEW
import org.erp.invera.repository.UserRepository;
import org.erp.invera.repository.PasswordResetTokenRepository;
import org.erp.invera.repository.NotificationRepository; // ✅ NEW
import org.erp.invera.security.JwtTokenProvider;
import org.erp.invera.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class AuthController {

    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtTokenProvider jwtTokenPro;
    @Autowired private PasswordResetTokenRepository passwordResetTokenRepository;
    @Autowired private EmailService emailService;

    @Autowired private NotificationRepository notificationRepository;

    // ===== LOGIN =====
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {

        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isActive()) {
            return ResponseEntity.status(403)
                    .body(new MessageResponse("Votre compte est désactivé. Contactez l’administrateur."));
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // ✅ Générer le token avec l'utilisateur
        String jwt = jwtTokenPro.generateToken(user);

        // ✅ Utiliser le constructeur avec toutes les infos
        return ResponseEntity.ok(new JwtResponse(
                jwt,
                user.getId(),              // Integer
                user.getEmail(),            // String
                user.getRole().name(),      // String
                user.getNom(),              // String
                user.getPrenom()            // String
        ));
    }
    // ===== REGISTER =====
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email déjà utilisé"));
        }
        if (userRepository.existsByNom(request.getNom())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Username déjà utilisé"));
        }

        if (request.getRole().equalsIgnoreCase("ADMIN")) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Vous ne pouvez pas créer un autre ADMIN"));
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setNom(request.getNom());
        user.setPrenom(request.getPrenom());
        user.setRole(Role.valueOf(request.getRole()));
        user.setActive(false);
        user.setPassword(null);

        userRepository.save(user);

        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setExpiryDate(LocalDateTime.now().plusHours(24));
        passwordResetTokenRepository.save(token);

        emailService.sendCreatePasswordEmail(user.getEmail(), token.getToken());

        return ResponseEntity.ok(new MessageResponse("Utilisateur créé. Email envoyé."));
    }

    // ===== CREATE-PASSWORD =====
    @PostMapping("/create-password")
    @Transactional
    public ResponseEntity<?> createPassword(@Valid @RequestBody ResetPasswordRequest request) {

        PasswordResetToken token = passwordResetTokenRepository
                .findByTokenAndUserEmail(request.getCode(), request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid activation token"));

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Token expired"));
        }

        User user = token.getUser();

        if (user.getPassword() != null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Password already created"));
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setActive(true);

        userRepository.save(user);
        passwordResetTokenRepository.delete(token);

        // ✅ NEW: notify admin in-app
        String fullName = ((user.getNom() == null ? "" : user.getNom()) + " " + (user.getPrenom() == null ? "" : user.getPrenom())).trim();
        String msg = "✅ Mot de passe créé (activation) par: " + fullName + " (" + user.getEmail() + ")";
        notificationRepository.save(new Notification("PASSWORD_CREATED", msg, user.getEmail(), fullName));

        return ResponseEntity.ok(new MessageResponse("Account activated successfully"));
    }

    // ===== CHANGE PASSWORD (NEW) =====
    @PutMapping("/change-password")
    @Transactional
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                            Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isActive()) {
            return ResponseEntity.status(403)
                    .body(new MessageResponse("Compte désactivé. Contactez l’administrateur."));
        }

        if (user.getPassword() == null) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Aucun mot de passe n'est défini pour ce compte"));
        }

        // ✅ verify current password
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Mot de passe actuel incorrect"));
        }

        // ✅ basic check (optional)
        if (request.getNewPassword() == null || request.getNewPassword().trim().length() < 8) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Le mot de passe doit contenir au moins 8 caractères"));
        }

        // ✅ prevent same password (optional)
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Le nouveau mot de passe doit être différent de l'ancien"));
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // ✅ NEW: notify admin in-app
        String fullName = ((user.getNom() == null ? "" : user.getNom()) + " " + (user.getPrenom() == null ? "" : user.getPrenom())).trim();
        String msg = "🔐 Mot de passe modifié par: " + fullName + " (" + user.getEmail() + ")";
        notificationRepository.save(new Notification("PASSWORD_CHANGED", msg, user.getEmail(), fullName));

        return ResponseEntity.ok(new MessageResponse("Mot de passe modifié avec succès"));
    }

    // ===== UPDATE OWN PROFILE =====
    @PutMapping("/update-profile")
    @Transactional
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateProfileRequest request,
                                           Authentication authentication) {

        String currentEmail = authentication.getName();

        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isActive()) {
            return ResponseEntity.status(403)
                    .body(new MessageResponse("Compte désactivé. Contactez l’administrateur."));
        }

        String newNom = request.getNom().trim();
        String newPrenom = request.getPrenom().trim();
        String newEmail = request.getEmail().trim().toLowerCase();

        if (!newEmail.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email déjà utilisé"));
        }

        user.setNom(newNom);
        user.setPrenom(newPrenom);
        user.setEmail(newEmail);
        userRepository.save(user);

        String fullName = ((user.getNom() == null ? "" : user.getNom()) + " " + (user.getPrenom() == null ? "" : user.getPrenom())).trim();
        String msg = "👤 Profil mis à jour par: " + fullName + " (" + user.getEmail() + ")";
        notificationRepository.save(new Notification("PROFILE_UPDATED", msg, user.getEmail(), fullName));

        return ResponseEntity.ok(new MessageResponse("Profil mis à jour avec succès"));
    }

    // ===== FILTER USERS =====
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/filter")
    public ResponseEntity<?> filterUsers(
            @RequestParam(required = false) String nom,
            @RequestParam(required = false) String prenom,
            @RequestParam(required = false) String role
    ) {
        Role roleEnum = null;
        if (role != null && !role.isBlank() && !role.equalsIgnoreCase("all")) {
            roleEnum = Role.valueOf(role.toUpperCase());
        }

        List<User> users;

        if (roleEnum != null && nom != null && prenom != null) {
            users = userRepository.findByNomIgnoreCaseAndPrenomIgnoreCaseAndRole(nom, prenom, roleEnum);
        } else if (roleEnum != null && nom != null) {
            users = userRepository.findByNomIgnoreCaseAndRole(nom, roleEnum);
        } else if (roleEnum != null && prenom != null) {
            users = userRepository.findByPrenomIgnoreCaseAndRole(prenom, roleEnum);
        } else if (roleEnum != null) {
            users = userRepository.findByRole(roleEnum);
        } else if (nom != null && prenom != null) {
            users = userRepository.findByNomIgnoreCaseAndPrenomIgnoreCase(nom, prenom);
        } else if (nom != null) {
            users = userRepository.findByNomIgnoreCase(nom);
        } else if (prenom != null) {
            users = userRepository.findByPrenomIgnoreCase(prenom);
        } else {
            users = userRepository.findAll();
        }

        List<UserInfoResponse> response = users.stream()
                .map(u -> new UserInfoResponse(
                        u.getId(),
                        u.getEmail(),
                        u.getNom(),
                        u.getPrenom(),
                        u.getRole().name(),
                        u.isActive()
                ))
                .toList();

        return ResponseEntity.ok(response);
    }

    // ===== UPDATE USER =====
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/update/{email}")
    public ResponseEntity<?> updateUser(@PathVariable String email,
                                        @RequestBody RegisterRequest request) {

        if (request.getRole().equalsIgnoreCase("ADMIN")) {
            return ResponseEntity.badRequest().body(new MessageResponse("Modification vers ADMIN interdite"));
        }

        return userRepository.findByEmail(email)
                .map(user -> {
                    user.setNom(request.getNom());
                    user.setPrenom(request.getPrenom());
                    user.setRole(Role.valueOf(request.getRole()));
                    userRepository.save(user);
                    return ResponseEntity.ok(new MessageResponse("Utilisateur mis à jour"));
                })
                .orElseGet(() -> ResponseEntity.badRequest().body(new MessageResponse("User not found")));
    }

    // ===== DELETE USER =====
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/delete/{email}")
    public ResponseEntity<?> deleteUser(@PathVariable String email, Authentication authentication) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (authentication.getName().equalsIgnoreCase(email)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Vous ne pouvez pas supprimer votre propre compte"));
        }

        userRepository.deleteById(user.getId());
        return ResponseEntity.ok(new MessageResponse("Utilisateur supprimé avec succès"));
    }

    // ===== GET ALL USERS =====
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers() {
        List<UserInfoResponse> users = userRepository.findAll().stream()
                .map(u -> new UserInfoResponse(
                        u.getId(),
                        u.getEmail(),
                        u.getNom(),
                        u.getPrenom(),
                        u.getRole().name(),
                        u.isActive()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(users);
    }

    // ===== ACTIVATE / DEACTIVATE =====
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/activate/{email}")
    public ResponseEntity<?> activateUser(@PathVariable String email, @RequestParam boolean active) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setActive(active);
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse(active ? "Utilisateur activé" : "Utilisateur désactivé"));
    }

    // ===== CURRENT USER =====
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(new UserInfoResponse(
                user.getId(),
                user.getEmail(),
                user.getNom(),
                user.getPrenom(),
                user.getRole().name(),
                user.isActive()
        ));
    }

    // ===== FORGOT PASSWORD =====
    @Transactional
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {

        userRepository.findByEmail(email).ifPresent(user -> {

            if (!user.isActive()) {
                return;
            }

            passwordResetTokenRepository.deleteByUserEmail(email);

            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setUser(user);
            resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(10));

            passwordResetTokenRepository.save(resetToken);

            CompletableFuture.runAsync(() -> emailService.sendResetPasswordEmail(email, resetToken.getToken()));
        });

        return ResponseEntity.ok(new MessageResponse("If the email exists, a reset code was sent"));
    }

    // ===== RESET PASSWORD =====
    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {

        PasswordResetToken resetToken =
                passwordResetTokenRepository
                        .findByTokenAndUserEmail(request.getCode(), request.getEmail())
                        .orElseThrow(() -> new RuntimeException("Invalid code"));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Code expired"));
        }

        User user = resetToken.getUser();

        if (!user.isActive()) {
            return ResponseEntity.status(403)
                    .body(new MessageResponse("Compte désactivé. Contactez l’administrateur."));
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setActive(true);

        userRepository.save(user);
        passwordResetTokenRepository.delete(resetToken);

        // ✅ OPTIONAL (recommended): notify admin for reset too
        String fullName = ((user.getNom() == null ? "" : user.getNom()) + " " + (user.getPrenom() == null ? "" : user.getPrenom())).trim();
        String msg = "♻️ Mot de passe réinitialisé par code pour: " + fullName + " (" + user.getEmail() + ")";
        notificationRepository.save(new Notification("PASSWORD_RESET", msg, user.getEmail(), fullName));

        return ResponseEntity.ok(new MessageResponse("Password created successfully"));
    }


}
