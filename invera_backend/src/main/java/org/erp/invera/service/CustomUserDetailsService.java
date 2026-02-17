package org.erp.invera.service;

import org.erp.invera.model.User;
import org.erp.invera.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * Service qui charge les détails de l'utilisateur depuis la base de données
 * Utilisé par Spring Security pour l'authentification
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        // 1️⃣ Chercher user par email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found with email: " + email));

        // 2️⃣ Vérifier si le compte est activé
        if (!user.isActive()) {
            throw new DisabledException("Account is not activated. Please check your email.");
        }

        // 3️⃣ Vérifier si password existe
        if (user.getPassword() == null) {
            throw new DisabledException("Password not created yet.");
        }

        // 4️⃣ Convertir rôle en authority Spring Security
        GrantedAuthority authority =
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name());

        // 5️⃣ Retourner UserDetails
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities(Collections.singletonList(authority))
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .disabled(false) // on a déjà vérifié isActive
                .build();
    }
}
