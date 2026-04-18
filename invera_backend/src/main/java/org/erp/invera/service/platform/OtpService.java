package org.erp.invera.service.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final JavaMailSender mailSender;

    // Stockage temporaire des OTP (email -> {code, expiration})
    private final Map<String, OtpData> otpCache = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    private static final int OTP_EXPIRATION_MINUTES = 10;
    private static final int OTP_LENGTH = 6;

    /**
     * Génère et envoie un OTP par email
     * @param email Adresse email du destinataire
     * @return Le code OTP généré
     */
    public String sendOtpByEmail(String email) {
        String otp = generateOtp();
        LocalDateTime expiration = LocalDateTime.now().plusMinutes(OTP_EXPIRATION_MINUTES);

        otpCache.put(email, new OtpData(otp, expiration));

        // Envoyer l'email
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("🔐 Code de validation Invera");
            message.setText(String.format("""
                Bonjour,
                
                Votre code de validation pour vous inscrire sur Invera est : %s
                
                Ce code est valable %d minutes.
                
                Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
                
                Cordialement,
                L'équipe Invera
                """, otp, OTP_EXPIRATION_MINUTES));

            mailSender.send(message);
            log.info("📧 OTP envoyé à {}: {}", email, otp);
        } catch (Exception e) {
            log.error("❌ Erreur envoi email à {}: {}", email, e.getMessage());
            throw new RuntimeException("Erreur lors de l'envoi de l'email", e);
        }

        return otp;
    }

    /**
     * Vérifie si l'OTP est valide
     * @param email Adresse email
     * @param otp Code à vérifier
     * @return true si valide, false sinon
     */
    public boolean verifyOtp(String email, String otp) {
        OtpData otpData = otpCache.get(email);

        if (otpData == null) {
            log.warn("❌ Aucun OTP trouvé pour {}", email);
            return false;
        }

        if (otpData.expiration.isBefore(LocalDateTime.now())) {
            log.warn("⏰ OTP expiré pour {}", email);
            otpCache.remove(email);
            return false;
        }

        if (!otpData.code.equals(otp)) {
            log.warn("❌ OTP incorrect pour {} (attendu: {}, reçu: {})", email, otpData.code, otp);
            return false;
        }

        log.info("✅ OTP validé pour {}", email);
        otpCache.remove(email);
        return true;
    }

    /**
     * Génère un code OTP à 6 chiffres
     */
    private String generateOtp() {
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(random.nextInt(10));
        }
        return otp.toString();
    }

    /**
     * Supprime l'OTP du cache (invalidation manuelle)
     */
    public void invalidateOtp(String email) {
        otpCache.remove(email);
        log.info("🗑️ OTP invalidé pour {}", email);
    }

    /**
     * Vérifie si un OTP existe pour cet email
     */
    public boolean hasOtp(String email) {
        return otpCache.containsKey(email);
    }

    /**
     * Renvoie un nouvel OTP (sans attendre l'expiration)
     */
    public String resendOtp(String email) {
        invalidateOtp(email);
        return sendOtpByEmail(email);
    }

    // Classe interne pour stocker les données OTP
    private record OtpData(String code, LocalDateTime expiration) {}
}