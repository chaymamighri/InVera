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
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtTokenPro.generateToken(authentication);

        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(new JwtResponse(
                jwt, user.getEmail(), user.getRole().name(), user.getNom(), user.getPrenom()
        ));
    }

    // ===== REGISTER =====
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Email déjà utilisé"));
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Username déjà utilisé"));
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNom(request.getNom());
        user.setPrenom(request.getPrenom());
        user.setRole(Role.valueOf(request.getRole()));
        user.setActive(true);

        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponse("Utilisateur créé avec succès"));
    }

    // ===== FILTER USERS =====
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/filter")
    public ResponseEntity<?> filterUsers(
            @RequestParam(required = false) String nom,
            @RequestParam(required = false) String prenom
    ) {
        List<User> users;

        if (nom != null && prenom != null) {
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
                        u.getId(), u.getUsername(), u.getEmail(),
                        u.getNom(), u.getPrenom(), u.getRole().name()))
                .toList();

        return ResponseEntity.ok(response);
    }

    // ===== UPDATE USER =====
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/update/{email}")
    public ResponseEntity<?> updateUser(@PathVariable String email, @RequestBody RegisterRequest request) {
        return userRepository.findByEmail(email)
                .map(user -> {
                    user.setUsername(request.getUsername());
                    user.setNom(request.getNom());
                    user.setPrenom(request.getPrenom());
                    user.setRole(Role.valueOf(request.getRole()));
                    if (request.getPassword() != null && !request.getPassword().isBlank()) {
                        user.setPassword(passwordEncoder.encode(request.getPassword()));
                    }
                    userRepository.save(user);
                    return ResponseEntity.ok(new MessageResponse("Utilisateur mis à jour avec succès"));
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
                .map(u -> new UserInfoResponse(u.getId(), u.getUsername(), u.getEmail(), u.getNom(), u.getPrenom(), u.getRole().name()))
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
        return ResponseEntity.ok(new UserInfoResponse(user.getId(), user.getUsername(), user.getEmail(), user.getNom(), user.getPrenom(), user.getRole().name()));
    }

    // ===== FORGOT PASSWORD =====
    // ===== FORGOT PASSWORD =====
    @PostMapping("/forgot-password")
    @Transactional
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {
        userRepository.findByEmail(email).ifPresent(user -> {

            // Supprimer l'ancien token s'il existe
            //passwordResetTokenRepository.findByUserEmail(email)
              //      .ifPresent(passwordResetTokenRepository::delete);

            // Créer un nouveau token
            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setUser(user);
            resetToken.setToken(UUID.randomUUID().toString()); // Générer un token unique
            resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(10));

            passwordResetTokenRepository.save(resetToken);

            // Envoyer l'email
            emailService.sendResetPasswordEmail(email, resetToken.getToken());
        });

        return ResponseEntity.ok(
                new MessageResponse("If the email exists, a reset code was sent")
        );
    }


    // ===== RESET PASSWORD =====


    // ===== CREATE TEMP ADMIN =====
    @PostMapping("/create-admin-temp")
    public ResponseEntity<?> createAdminTemp() {
        if (userRepository.existsByEmail("admin@example.com")) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Admin already exists"));
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
