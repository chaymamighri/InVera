package org.erp.invera.config;

import org.erp.invera.security.UnifiedUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Configuration de l'authentification.
 *
 * Ce fichier dit à Spring Security comment vérifier les identifiants des utilisateurs :
 * - Il utilise UnifiedUserDetailsService pour trouver l'utilisateur en base de données
 *   (cherche d'abord dans SuperAdmin, puis dans ClientUser)
 * - Il utilise PasswordEncoder pour comparer les mots de passe (BCrypt)
 * - Il fournit l'AuthenticationManager qui orchestre la vérification
 */
@Configuration
public class AuthenticationConfig {

    private final UnifiedUserDetailsService unifiedUserDetailsService;
    private final PasswordEncoder passwordEncoder;

    public AuthenticationConfig(UnifiedUserDetailsService unifiedUserDetailsService,
                                PasswordEncoder passwordEncoder) {
        this.unifiedUserDetailsService = unifiedUserDetailsService;
        this.passwordEncoder = passwordEncoder;
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(unifiedUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}