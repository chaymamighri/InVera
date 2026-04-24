package org.erp.invera.service.platform;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.platform.preferencesdto.LanguagePreferenceResponse;
import org.erp.invera.dto.platform.preferencesdto.UpdateLanguagePreferenceRequest;
import org.erp.invera.model.platform.PreferredLanguage;
import org.erp.invera.model.platform.SuperAdmin;
import org.erp.invera.model.platform.Utilisateur;
import org.erp.invera.repository.platform.SuperAdminRepository;
import org.erp.invera.repository.platform.utilisateurRepository;
import org.springframework.context.MessageSource;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserLanguagePreferenceService {

    private final utilisateurRepository utilisateurRepository;
    private final SuperAdminRepository superAdminRepository;
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

        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouve"));

        return new AuthenticatedLanguageOwner(
                ensurePreferredLanguage(utilisateur),
                preferredLanguage -> {
                    utilisateur.setPreferredLanguage(preferredLanguage);
                    utilisateurRepository.save(utilisateur);
                }
        );
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

    private PreferredLanguage ensurePreferredLanguage(Utilisateur utilisateur) {
        if (utilisateur.getPreferredLanguage() == null) {
            utilisateur.setPreferredLanguage(PreferredLanguage.FR);
            utilisateurRepository.save(utilisateur);
        }

        return utilisateur.getPreferredLanguage();
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
    ) {
    }

    @FunctionalInterface
    private interface LanguageUpdater {
        void accept(PreferredLanguage preferredLanguage);
    }
}
