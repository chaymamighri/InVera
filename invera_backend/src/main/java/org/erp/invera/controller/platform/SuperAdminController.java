package org.erp.invera.controller.platform;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.erp.MessageResponse;
import org.erp.invera.dto.platform.superAdmindto.ChangeSuperAdminPasswordRequest;
import org.erp.invera.dto.platform.superAdmindto.LoginRequestDTO;
import org.erp.invera.dto.platform.superAdmindto.LoginResponseDTO;
import org.erp.invera.dto.platform.superAdmindto.SuperAdminDTO;
import org.erp.invera.dto.platform.superAdmindto.UpdateSuperAdminProfileRequest;
import org.erp.invera.security.JwtTokenProvider;
import org.erp.invera.security.SuperAdminPrincipal;
import org.erp.invera.service.platform.SuperAdminService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/super-admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SuperAdminController {

    private final SuperAdminService superAdminService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody SuperAdminDTO dto) {
        try {
            if (superAdminService.exists()) {
                return ResponseEntity
                        .status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Un super admin existe deja. Installation impossible."));
            }
            SuperAdminDTO created = superAdminService.createFirstSuperAdmin(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO loginRequest) {
        try {
            SuperAdminDTO admin = superAdminService.authenticate(loginRequest);

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
    public ResponseEntity<?> getCurrentSuperAdmin(Authentication authentication) {
        try {
            return ResponseEntity.ok(superAdminService.getByEmail(getAuthenticatedEmail(authentication)));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateSuperAdminProfileRequest request,
                                           Authentication authentication) {
        try {
            SuperAdminDTO updated = superAdminService.updateProfile(getAuthenticatedEmail(authentication), request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangeSuperAdminPasswordRequest request,
                                            Authentication authentication) {
        try {
            superAdminService.changePassword(getAuthenticatedEmail(authentication), request);
            return ResponseEntity.ok(new MessageResponse("Mot de passe modifie avec succes"));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    private String getAuthenticatedEmail(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("Super admin non authentifie");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof SuperAdminPrincipal superAdminPrincipal) {
            return superAdminPrincipal.getEmail();
        }

        String email = authentication.getName();
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Super admin non authentifie");
        }

        return email;
    }
}
