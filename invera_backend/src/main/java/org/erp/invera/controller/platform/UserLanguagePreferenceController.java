package org.erp.invera.controller.platform;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.platform.preferencesdto.LanguagePreferenceResponse;
import org.erp.invera.dto.platform.preferencesdto.UpdateLanguagePreferenceRequest;
import org.erp.invera.service.platform.UserLanguagePreferenceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/users/me/preferences")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserLanguagePreferenceController {

    private final UserLanguagePreferenceService userLanguagePreferenceService;

    @GetMapping("/language")
    public ResponseEntity<LanguagePreferenceResponse> getCurrentLanguage(Authentication authentication) {
        return ResponseEntity.ok(userLanguagePreferenceService.getCurrentUserLanguage(authentication));
    }

    @PutMapping("/language")
    public ResponseEntity<?> updateCurrentLanguage(@RequestBody UpdateLanguagePreferenceRequest request,
                                                   Authentication authentication,
                                                   Locale locale) {
        try {
            return ResponseEntity.ok(userLanguagePreferenceService.updateCurrentUserLanguage(authentication, request, locale));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", ex.getMessage()));
        }
    }
}
