package org.erp.invera.controller.platform;

import org.erp.invera.dto.platform.superAdmindto.LoginRequestDTO;
import org.erp.invera.dto.platform.superAdmindto.LoginResponseDTO;
import org.erp.invera.dto.platform.superAdmindto.SuperAdminDTO;
import org.erp.invera.model.platform.SuperAdmin;
import org.erp.invera.repository.platform.SuperAdminRepository;
import org.erp.invera.security.JwtTokenProvider;
import org.erp.invera.service.platform.SuperAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/super-admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SuperAdminController {

    private final SuperAdminService superAdminService;
    private final JwtTokenProvider jwtTokenProvider;
    private final SuperAdminRepository superAdminRepository;


    /**
     * Créer le premier super admin (installation)
     * POST /api/super-admin/register
     * Body: { "nom": "Admin", "email": "admin@invera.com", "motDePasse": "password123" }
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody SuperAdminDTO dto) {
        try {
            if (superAdminService.exists()) {
                return ResponseEntity
                        .status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Un super admin existe déjà. Installation impossible."));
            }
            SuperAdminDTO created = superAdminService.createFirstSuperAdmin(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Login super admin
     * POST /api/super-admin/login
     * Body: { "email": "admin@invera.com", "motDePasse": "password123" }
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO loginRequest) {
        try {
            SuperAdminDTO admin = superAdminService.authenticate(loginRequest);

            // ✅ CORRIGÉ : utiliser la nouvelle signature
            String token = jwtTokenProvider.generateTokenForSuperAdmin(
                    admin.getEmail(),
                    "SUPER_ADMIN",
                    null
            );

            LoginResponseDTO response = new LoginResponseDTO();
            response.setId(admin.getId());
            response.setNom(admin.getNom());
            response.setEmail(admin.getEmail());
            response.setToken(token);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        System.out.println("🔍 SuperAdmin getCurrentUser - Email: " + email);

        SuperAdmin superAdmin = superAdminRepository.findByEmail(email)
                .orElseThrow();

        Map<String, Object> response = new HashMap<>();
        response.put("id", superAdmin.getId());
        response.put("email", superAdmin.getEmail());
        response.put("nom", superAdmin.getNom());
        response.put("role", "SUPER_ADMIN");
        response.put("type", "SUPER_ADMIN");
        response.put("active", true);
        response.put("memberSince", superAdmin.getCreatedAt());

        return ResponseEntity.ok(response);
    }


}