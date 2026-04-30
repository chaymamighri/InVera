package org.erp.invera.security;

import org.erp.invera.model.platform.Utilisateur;
import org.erp.invera.model.platform.SuperAdmin;
import org.erp.invera.repository.platform.utilisateurRepository;
import org.erp.invera.repository.platform.SuperAdminRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UnifiedUserDetailsService implements UserDetailsService {

    private final utilisateurRepository utilisateurRepository;
    private final SuperAdminRepository superAdminRepository;

    public UnifiedUserDetailsService(utilisateurRepository utilisateurRepository,
                                     SuperAdminRepository superAdminRepository) {
        this.utilisateurRepository = utilisateurRepository;
        this.superAdminRepository = superAdminRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        // 1. Chercher parmi les Super Admins
        SuperAdmin superAdmin = superAdminRepository.findByEmail(email).orElse(null);
        if (superAdmin != null) {
            return org.springframework.security.core.userdetails.User.builder()
                    .username(superAdmin.getEmail())
                    .password(superAdmin.getMotDePasse())
                    .roles("SUPER_ADMIN")
                    .build();
        }

        // 2. Chercher parmi les employés des clients
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé: " + email));

        return utilisateur;
    }
}
