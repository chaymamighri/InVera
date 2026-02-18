package org.erp.invera.controller;

import jakarta.validation.Valid;
import org.erp.invera.dto.*;
import org.erp.invera.model.Role;
import org.erp.invera.model.User;
import org.erp.invera.model.PasswordResetToken;
import org.erp.invera.repository.UserRepository;
import org.erp.invera.repository.PasswordResetTokenRepository;
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

    // ===== LOGIN =====
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {

        // 1) Load user first to check active before authenticating (optional but clearer messages)
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ✅ If admin deactivated the user => block login
        if (!user.isActive()) {
            return ResponseEntity.status(403)
                    .body(new MessageResponse("Compte désactivé. Contactez l'administrateur."));
        }

        // 2) Authenticate normally
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = jwtTokenPro.generateToken(authentication);

        return ResponseEntity.ok(new JwtResponse(
                jwt,
                user.getUsername(),
                user.getRole().name(),
                user.getNom(),
                user.getPrenom()
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
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body("Username already exists");
        }

        // 🚨 Prevent admin creation
        if (request.getRole().equalsIgnoreCase("ADMIN")) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Vous ne pouvez pas créer un autre ADMIN"));
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setNom(request.getNom());
        user.setPrenom(request.getPrenom());

        // ✅ safer
        user.setRole(Role.valueOf(request.getRole().toUpperCase()));

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

        return ResponseEntity.ok(new MessageResponse("Account activated successfully"));
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
                        u.getUsername(),
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
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Modification vers ADMIN interdite"));
        }

        return userRepository.findByEmail(email)
                .map(user -> {

                    user.setUsername(request.getUsername());
                    user.setNom(request.getNom());
                    user.setPrenom(request.getPrenom());
                    user.setRole(Role.valueOf(request.getRole().toUpperCase()));

                    userRepository.save(user);

                    return ResponseEntity.ok(new MessageResponse("Utilisateur mis à jour"));
                })
                .orElseGet(() -> ResponseEntity.badRequest().body(new MessageResponse("User not found")));
    }

    // ===== UPDATE PROFILE (USER) =====
    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ✅ if user got deactivated while logged in => deny
        if (!user.isActive()) {
            return ResponseEntity.status(403)
                    .body(new MessageResponse("Compte désactivé. Contactez l'administrateur."));
        }

        user.setUsername(request.getUsername());
        user.setNom(request.getNom());
        user.setPrenom(request.getPrenom());

        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("Profile updated successfully"));
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
                        u.getUsername(),
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

        // Optional: avoid deactivating yourself (recommended)
        // if (user.getEmail().equalsIgnoreCase(SecurityContextHolder.getContext().getAuthentication().getName())) {
        //     return ResponseEntity.badRequest().body(new MessageResponse("Vous ne pouvez pas désactiver votre propre compte"));
        // }

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
                user.getUsername(),
                user.getEmail(),
                user.getNom(),
                user.getPrenom(),
                user.getRole().name(),
                user.isActive()
        ));
    }

    // ===== CHANGE PASSWORD (USER) =====
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ✅ deny if inactive
        if (!user.isActive()) {
            return ResponseEntity.status(403)
                    .body(new MessageResponse("Compte désactivé. Contactez l'administrateur."));
        }

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Old password is incorrect"));
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("Password updated successfully"));
    }

    // ===== FORGOT PASSWORD =====
    @Transactional
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {

        userRepository.findByEmail(email).ifPresent(user -> {

            // ✅ BLOCK sending email for inactive users
            if (!user.isActive()) {
                // We can either: return 403 OR silently do nothing.
                // You asked "mail can't be sent", so we hard-block with 403.
                throw new RuntimeException("Compte désactivé. Contactez l'administrateur.");
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

        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByTokenAndUserEmail(request.getCode(), request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid code"));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Code expired"));
        }

        User user = resetToken.getUser();

        // ✅ BLOCK reset if inactive
        if (!user.isActive()) {
            return ResponseEntity.status(403)
                    .body(new MessageResponse("Compte désactivé. Contactez l'administrateur."));
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setActive(true);

        userRepository.save(user);
        passwordResetTokenRepository.delete(resetToken);

        return ResponseEntity.ok(new MessageResponse("Password created successfully"));
    }

    // ===== CREATE TEMP ADMIN =====
    @PostMapping("/create-admin-temp")
    public ResponseEntity<?> createAdminTemp() {
        if (userRepository.existsByEmail("admin@example.com")) {
            return ResponseEntity.badRequest().body(new MessageResponse("Admin already exists"));
        }

        User user = new User();
        user.setUsername("hamdi");
        user.setEmail("hamdi@example.com");
        user.setPassword(passwordEncoder.encode("hamdi123!"));
        user.setNom("hamdi");
        user.setPrenom("hamdi");
        user.setRole(Role.ADMIN);
        user.setActive(true);

        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponse("Temporary admin created"));
    }
}
