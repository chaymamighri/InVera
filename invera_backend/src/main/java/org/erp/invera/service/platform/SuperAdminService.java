package org.erp.invera.service.platform;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.platform.superAdmindto.ChangeSuperAdminPasswordRequest;
import org.erp.invera.dto.platform.superAdmindto.LoginRequestDTO;
import org.erp.invera.dto.platform.superAdmindto.SuperAdminDTO;
import org.erp.invera.dto.platform.superAdmindto.UpdateSuperAdminProfileRequest;
import org.erp.invera.model.platform.SuperAdmin;
import org.erp.invera.repository.platform.SuperAdminRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SuperAdminService {

    private final SuperAdminRepository superAdminRepository;
    private final PasswordEncoder passwordEncoder;

    public boolean exists() {
        return superAdminRepository.count() > 0;
    }

    @Transactional
    public SuperAdminDTO createFirstSuperAdmin(SuperAdminDTO dto) {
        if (exists()) {
            throw new RuntimeException("Un super admin existe deja. Installation impossible.");
        }

        String normalizedEmail = normalizeEmail(dto.getEmail());
        if (normalizedEmail == null) {
            throw new RuntimeException("L'email est obligatoire");
        }
        if (dto.getMotDePasse() == null || dto.getMotDePasse().length() < 6) {
            throw new RuntimeException("Le mot de passe doit contenir au moins 6 caracteres");
        }

        SuperAdmin superAdmin = new SuperAdmin();
        superAdmin.setNom(dto.getNom());
        superAdmin.setEmail(normalizedEmail);
        superAdmin.setMotDePasse(passwordEncoder.encode(dto.getMotDePasse()));
        superAdmin.setCreatedAt(LocalDateTime.now());
        superAdmin.setLastLogin(null);

        SuperAdmin saved = superAdminRepository.save(superAdmin);
        return convertToDTO(saved);
    }

    @Transactional
    public SuperAdminDTO authenticate(LoginRequestDTO loginRequest) {
        String normalizedEmail = normalizeEmail(loginRequest.getEmail());
        Optional<SuperAdmin> superAdminOpt = normalizedEmail == null
                ? Optional.empty()
                : superAdminRepository.findByEmail(normalizedEmail);

        if (superAdminOpt.isEmpty()) {
            throw new RuntimeException("Email ou mot de passe incorrect");
        }

        SuperAdmin superAdmin = superAdminOpt.get();

        if (!passwordEncoder.matches(loginRequest.getMotDePasse(), superAdmin.getMotDePasse())) {
            throw new RuntimeException("Email ou mot de passe incorrect");
        }

        superAdmin.setLastLogin(LocalDateTime.now());
        SuperAdmin updatedSuperAdmin = superAdminRepository.save(superAdmin);

        return convertToDTO(updatedSuperAdmin);
    }

    public SuperAdminDTO getByEmail(String email) {
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail == null) {
            throw new RuntimeException("Super admin non trouve");
        }

        SuperAdmin superAdmin = superAdminRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("Super admin non trouve"));
        return convertToDTO(superAdmin);
    }

    public SuperAdminDTO getById(Integer id) {
        SuperAdmin superAdmin = superAdminRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Super admin non trouve"));
        return convertToDTO(superAdmin);
    }

    @Transactional
    public SuperAdminDTO updateProfile(String currentEmail, UpdateSuperAdminProfileRequest request) {
        String normalizedCurrentEmail = normalizeEmail(currentEmail);
        if (normalizedCurrentEmail == null) {
            throw new RuntimeException("Super admin non authentifie");
        }

        SuperAdmin superAdmin = superAdminRepository.findByEmail(normalizedCurrentEmail)
                .orElseThrow(() -> new RuntimeException("Super admin non trouve"));

        String normalizedEmail = normalizeEmail(request.getEmail());
        if (normalizedEmail == null) {
            throw new RuntimeException("L'email est obligatoire");
        }
        if (!normalizedEmail.equalsIgnoreCase(superAdmin.getEmail())
                && superAdminRepository.existsByEmail(normalizedEmail)) {
            throw new RuntimeException("Email deja utilise");
        }

        String newNom = request.getNom() == null ? "" : request.getNom().trim();
        if (newNom.length() < 2) {
            throw new RuntimeException("Le nom doit contenir au moins 2 caracteres");
        }

        superAdmin.setNom(newNom);
        superAdmin.setEmail(normalizedEmail);

        return convertToDTO(superAdminRepository.save(superAdmin));
    }

    @Transactional
    public void changePassword(String currentEmail, ChangeSuperAdminPasswordRequest request) {
        String normalizedCurrentEmail = normalizeEmail(currentEmail);
        if (normalizedCurrentEmail == null) {
            throw new RuntimeException("Super admin non authentifie");
        }

        SuperAdmin superAdmin = superAdminRepository.findByEmail(normalizedCurrentEmail)
                .orElseThrow(() -> new RuntimeException("Super admin non trouve"));

        if (superAdmin.getMotDePasse() == null || superAdmin.getMotDePasse().isBlank()) {
            throw new RuntimeException("Aucun mot de passe n'est defini pour ce compte");
        }

        if (!passwordEncoder.matches(request.getOldPassword(), superAdmin.getMotDePasse())) {
            throw new RuntimeException("Mot de passe actuel incorrect");
        }

        String newPassword = request.getNewPassword() == null ? "" : request.getNewPassword().trim();
        if (newPassword.length() < 8) {
            throw new RuntimeException("Le nouveau mot de passe doit contenir au moins 8 caracteres");
        }
        if (passwordEncoder.matches(newPassword, superAdmin.getMotDePasse())) {
            throw new RuntimeException("Le nouveau mot de passe doit etre different de l'ancien");
        }

        superAdmin.setMotDePasse(passwordEncoder.encode(newPassword));
        superAdminRepository.save(superAdmin);
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return email.trim().toLowerCase();
    }

    private SuperAdminDTO convertToDTO(SuperAdmin superAdmin) {
        SuperAdminDTO dto = new SuperAdminDTO();
        dto.setId(superAdmin.getId());
        dto.setNom(superAdmin.getNom());
        dto.setEmail(superAdmin.getEmail());
        dto.setMotDePasse(null);
        dto.setCreatedAt(superAdmin.getCreatedAt());
        dto.setLastLogin(superAdmin.getLastLogin());
        return dto;
    }
}
