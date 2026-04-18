package org.erp.invera.service.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvitationService {

    private final Map<String, InvitationData> invitationCache = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    private static final int CODE_EXPIRATION_MINUTES = 60; // 1 heure

    /**
     * Génère et stocke un code d'invitation pour un email
     */
    public String generateInvitationCode(String email) {
        String code = generateCode();
        LocalDateTime expiration = LocalDateTime.now().plusMinutes(CODE_EXPIRATION_MINUTES);

        invitationCache.put(email, new InvitationData(code, expiration));
        log.info("📧 Code d'invitation généré pour {}: {}", email, code);

        return code;
    }

    /**
     * Vérifie si le code d'invitation est valide
     */
    public boolean verifyCode(String email, String code) {
        InvitationData data = invitationCache.get(email);

        if (data == null) {
            log.warn("❌ Aucun code d'invitation trouvé pour {}", email);
            return false;
        }

        if (data.expiration.isBefore(LocalDateTime.now())) {
            log.warn("⏰ Code d'invitation expiré pour {}", email);
            invitationCache.remove(email);
            return false;
        }

        if (!data.code.equals(code)) {
            log.warn("❌ Code d'invitation incorrect pour {}", email);
            return false;
        }

        log.info("✅ Code d'invitation validé pour {}", email);
        invitationCache.remove(email);
        return true;
    }

    /**
     * Génère un code aléatoire à 6 chiffres
     */
    private String generateCode() {
        return String.format("%06d", random.nextInt(1000000));
    }

    /**
     * Supprime un code d'invitation
     */
    public void invalidateCode(String email) {
        invitationCache.remove(email);
        log.info("🗑️ Code d'invitation supprimé pour {}", email);
    }

    // Classe interne pour stocker les données d'invitation
    private record InvitationData(String code, LocalDateTime expiration) {}
}