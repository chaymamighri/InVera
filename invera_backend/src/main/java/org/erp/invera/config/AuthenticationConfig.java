package org.erp.invera.config;

import org.erp.invera.service.erp.CustomUserDetailsService;
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
 * - Il utilise CustomUserDetailsService pour trouver l'utilisateur en base de données
 * - Il utilise PasswordEncoder pour comparer les mots de passe (BCrypt)
 * - Il fournit l'AuthenticationManager qui orchestre la vérification
 */
@Configuration
public class AuthenticationConfig {

    private final CustomUserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;

    public AuthenticationConfig(CustomUserDetailsService userDetailsService,
                                PasswordEncoder passwordEncoder) {
        this.userDetailsService = userDetailsService;
        this.passwordEncoder = passwordEncoder;
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}