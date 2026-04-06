package org.erp.invera.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/**
 * Configuration de l'audit JPA pour Spring Data.
 *
 * Ce composant active l'audit automatique des entités et fournit
 * l'utilisateur courant (son email) à Spring Data JPA pour remplir
 * automatiquement les champs @CreatedBy et @LastModifiedBy.
 *
 * L'utilisateur est extrait du contexte de sécurité Spring Security.
 * Si aucun utilisateur authentifié n'est trouvé (ou si c'est l'utilisateur
 * anonyme), un Optional.empty() est retourné.
 */
@Configuration
@EnableJpaAuditing
public class AuditConfig {

    /**
     * Fournit l'auditeur courant (l'utilisateur connecté) à Spring Data JPA.
     *
     * @return un AuditorAware qui retourne l'email de l'utilisateur authentifié,
     *         ou Optional.empty() si aucun utilisateur valide n'est connecté
     */
    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null || !authentication.isAuthenticated()
                    || "anonymousUser".equals(authentication.getPrincipal())) {
                return Optional.empty();
            }

            // Retourne simplement l'email
            return Optional.of(authentication.getName());
        };
    }
}