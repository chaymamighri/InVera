package org.erp.invera.service.platform;

import org.erp.invera.model.platform.SuperAdmin;
import org.erp.invera.repository.platform.SuperAdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SuperAdminService {

    private final SuperAdminRepository superAdminRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // Vérifier si un super admin existe
    public boolean exists() {
        return superAdminRepository.count() > 0;
    }

    // Créer le premier super admin (installation)
    @Transactional
    public org.erp.invera.dto.platform.superAdmindto.SuperAdminDTO createFirstSuperAdmin(org.erp.invera.dto.platform.superAdmindto.SuperAdminDTO dto) {
        if (exists()) {
            throw new RuntimeException("Un super admin existe déjà. Installation impossible.");
        }

        if (dto.getEmail() == null || dto.getEmail().isEmpty()) {
            throw new RuntimeException("L'email est obligatoire");
        }
        if (dto.getMotDePasse() == null || dto.getMotDePasse().length() < 6) {
            throw new RuntimeException("Le mot de passe doit contenir au moins 6 caractères");
        }

        SuperAdmin superAdmin = new SuperAdmin();
        superAdmin.setNom(dto.getNom());
        superAdmin.setEmail(dto.getEmail());
        superAdmin.setMotDePasse(passwordEncoder.encode(dto.getMotDePasse()));
        superAdmin.setCreatedAt(LocalDateTime.now());

        SuperAdmin saved = superAdminRepository.save(superAdmin);
        return convertToDTO(saved);
    }

    // Authentifier un super admin
    public org.erp.invera.dto.platform.superAdmindto.SuperAdminDTO authenticate(org.erp.invera.dto.platform.superAdmindto.LoginRequestDTO loginRequest) {
        Optional<SuperAdmin> superAdminOpt = superAdminRepository.findByEmail(loginRequest.getEmail());

        if (superAdminOpt.isEmpty()) {
            throw new RuntimeException("Email ou mot de passe incorrect");
        }

        SuperAdmin superAdmin = superAdminOpt.get();

        if (!passwordEncoder.matches(loginRequest.getMotDePasse(), superAdmin.getMotDePasse())) {
            throw new RuntimeException("Email ou mot de passe incorrect");
        }

        return convertToDTO(superAdmin);
    }

    // Récupérer un super admin par email
    public org.erp.invera.dto.platform.superAdmindto.SuperAdminDTO getByEmail(String email) {
        SuperAdmin superAdmin = superAdminRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Super admin non trouvé"));
        return convertToDTO(superAdmin);
    }

    // Récupérer un super admin par id
    public org.erp.invera.dto.platform.superAdmindto.SuperAdminDTO getById(Integer id) {
        SuperAdmin superAdmin = superAdminRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Super admin non trouvé"));
        return convertToDTO(superAdmin);
    }

    // Convertir entité en DTO
    private org.erp.invera.dto.platform.superAdmindto.SuperAdminDTO convertToDTO(SuperAdmin superAdmin) {
        org.erp.invera.dto.platform.superAdmindto.SuperAdminDTO dto = new org.erp.invera.dto.platform.superAdmindto.SuperAdminDTO();
        dto.setId(superAdmin.getId());
        dto.setNom(superAdmin.getNom());
        dto.setEmail(superAdmin.getEmail());
        dto.setMotDePasse(null); // Ne pas renvoyer le mot de passe
        dto.setCreatedAt(superAdmin.getCreatedAt());
        return dto;
    }
}