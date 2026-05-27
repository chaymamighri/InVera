package org.erp.invera.service.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.platform.preferencesdto.LanguagePreferenceResponse;
import org.erp.invera.dto.platform.preferencesdto.UpdateLanguagePreferenceRequest;
import org.erp.invera.model.platform.PreferredLanguage;
import org.erp.invera.model.platform.SuperAdmin;
import org.erp.invera.repository.platform.SuperAdminRepository;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.springframework.context.MessageSource;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserLanguagePreferenceService {

    private final SuperAdminRepository superAdminRepository;
    private final TenantAwareRepository tenantRepo;
    private final MessageSource messageSource;

    @Transactional
    public LanguagePreferenceResponse getCurrentUserLanguage(Authentication authentication) {
        AuthenticatedLanguageOwner owner = getAuthenticatedOwner(authentication);
        return buildResponse(owner.language(), null);
    }

    @Transactional
    public LanguagePreferenceResponse updateCurrentUserLanguage(Authentication authentication,
                                                                UpdateLanguagePreferenceRequest request,
                                                                Locale locale) {
        AuthenticatedLanguageOwner owner = getAuthenticatedOwner(authentication);
        PreferredLanguage preferredLanguage = validateLanguage(request != null ? request.getLanguage() : null, locale);

        owner.updater().accept(preferredLanguage);

        return buildResponse(
                preferredLanguage,
                messageSource.getMessage("language.updated.success", null, locale)
        );
    }

    private AuthenticatedLanguageOwner getAuthenticatedOwner(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new RuntimeException("Utilisateur non authentifie");
        }

        String email = authentication.getName();

        // 1. Chercher SUPER_ADMIN (platform)
        SuperAdmin superAdmin = superAdminRepository.findByEmail(email).orElse(null);
        if (superAdmin != null) {
            return new AuthenticatedLanguageOwner(
                    ensurePreferredLanguage(superAdmin),
                    preferredLanguage -> {
                        superAdmin.setPreferredLanguage(preferredLanguage);
                        superAdminRepository.save(superAdmin);
                    }
            );
        }

        // 2. Chercher dans les bases tenant (client_X)
        Long clientId = getAuthenticatedClientId(authentication);
        if (clientId != null) {
            AuthenticatedLanguageOwner tenantOwner = getTenantUserOwner(email, clientId);
            if (tenantOwner != null) {
                return tenantOwner;
            }
        }

        // 3. Fallback
        return new AuthenticatedLanguageOwner(PreferredLanguage.FR, preferredLanguage -> {});
    }

    private Long getAuthenticatedClientId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal != null) {
            // Essayer d'extraire clientId du principal
            try {
                java.lang.reflect.Method method = principal.getClass().getMethod("getClientId");
                return (Long) method.invoke(principal);
            } catch (Exception e) {
                log.debug("Impossible d'extraire clientId du principal: {}", e.getMessage());
            }
        }
        return null;
    }

    private AuthenticatedLanguageOwner getTenantUserOwner(String email, Long clientId) {
        try {
            String selectSql = "SELECT preferred_language FROM utilisateurs WHERE email = ?";
            List<PreferredLanguage> languages = tenantRepo.query(
                    selectSql,
                    (rs, rowNum) -> {
                        String value = rs.getString("preferred_language");
                        return value == null || value.isBlank() ? PreferredLanguage.FR : PreferredLanguage.valueOf(value);
                    },
                    clientId,
                    String.valueOf(clientId),
                    email
            );

            if (languages.isEmpty()) {
                return null;
            }

            PreferredLanguage language = languages.get(0);
            return new AuthenticatedLanguageOwner(
                    language,
                    preferredLanguage -> tenantRepo.update(
                            "UPDATE utilisateurs SET preferred_language = ? WHERE email = ?",
                            clientId,
                            String.valueOf(clientId),
                            preferredLanguage.name(),
                            email
                    )
            );
        } catch (Exception e) {
            log.error("Erreur lors de la récupération de l'utilisateur tenant: {}", e.getMessage());
            return null;
        }
    }

    private PreferredLanguage validateLanguage(String language, Locale locale) {
        if (language == null || language.isBlank()) {
            throw new IllegalArgumentException(
                    messageSource.getMessage("language.required", null, locale)
            );
        }

        try {
            return PreferredLanguage.fromCode(language);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    messageSource.getMessage(
                            "language.invalid",
                            new Object[]{String.join(", ", PreferredLanguage.supportedCodes())},
                            locale
                    )
            );
        }
    }

    private LanguagePreferenceResponse buildResponse(PreferredLanguage preferredLanguage, String message) {
        return LanguagePreferenceResponse.builder()
                .language(preferredLanguage.getCode())
                .supportedLanguages(List.copyOf(PreferredLanguage.supportedCodes()))
                .message(message)
                .build();
    }

    private PreferredLanguage ensurePreferredLanguage(SuperAdmin superAdmin) {
        if (superAdmin.getPreferredLanguage() == null) {
            superAdmin.setPreferredLanguage(PreferredLanguage.FR);
            superAdminRepository.save(superAdmin);
        }
        return superAdmin.getPreferredLanguage();
    }

    private record AuthenticatedLanguageOwner(
            PreferredLanguage language,
            LanguageUpdater updater
    ) {}

    @FunctionalInterface
    private interface LanguageUpdater {
        void accept(PreferredLanguage preferredLanguage);
    }
}