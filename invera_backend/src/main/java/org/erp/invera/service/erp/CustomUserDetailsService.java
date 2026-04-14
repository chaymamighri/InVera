package org.erp.invera.service.erp;

import org.erp.invera.model.erp.User;
import org.erp.invera.repository.erp.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * Service qui charge les détails de l'utilisateur depuis la base de données.
 *
 * Ce fichier est le cœur de l'authentification Spring Security :
 * - Spring Security l'appelle automatiquement quand un utilisateur tente de se connecter
 * - Il cherche l'utilisateur par son email dans la base
 * - Il vérifie que le compte est activé et que le mot de passe existe
 * - Il retourne les informations (email, mot de passe, rôle) à Spring Security
 * - Spring Security compare alors le mot de passe fourni avec celui stocké
 *
 * Règles de validation :
 * - Compte désactivé (active = false) → authentification refusée
 * - Mot de passe non créé (password = null) → authentification refusée
 * - Email non trouvé → authentification refusée
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        // 1 Chercher user par email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found with email: " + email));

        //  Vérifier si le compte est activé
        if (!user.isActive()) {
            throw new DisabledException("Account is not activated. Please check your email.");
        }

        //  Vérifier si password existe
        if (user.getPassword() == null) {
            throw new DisabledException("Password not created yet.");
        }

        //  Convertir rôle en authority Spring Security
        GrantedAuthority authority =
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name());

        //  Retourner UserDetails
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities(Collections.singletonList(authority))
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .disabled(false)
                .build();
    }
}
