package org.erp.invera.service;

import org.erp.invera.model.User;
import org.erp.invera.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
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
        // Charger l'utilisateur depuis la DB par email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Convertir le role en GrantedAuthority
        GrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());

        // Créer un UserDetails à partir de notre User
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),       // utiliser l'email comme username pour Spring Security
                user.getPassword(),
                user.isActive(),       // enabled
                true,                  // accountNonExpired
                true,                  // credentialsNonExpired
                true,                  // accountNonLocked
                Collections.singletonList(authority)
        );
    }
}
