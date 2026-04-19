package org.erp.invera.service.platform;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class SessionManagementService {

    // Map: email -> token actif
    private final Map<String, String> activeSessions = new ConcurrentHashMap<>();

    /**
     * Enregistre une nouvelle session
     * @return true si la session actuelle est valide, false si une autre session a été fermée
     */
    public boolean registerSession(String email, String token) {
        String oldToken = activeSessions.get(email);

        if (oldToken != null && !oldToken.equals(token)) {
            log.warn("⚠️ Nouvelle connexion pour {} - Ancienne session invalidée", email);
            activeSessions.put(email, token);
            return false; // L'ancienne session a été remplacée
        }

        activeSessions.put(email, token);
        log.info("✅ Session enregistrée pour {}", email);
        return true;
    }

    /**
     * Vérifie si le token est la session active
     */
    public boolean isSessionValid(String email, String token) {
        String activeToken = activeSessions.get(email);
        return activeToken != null && activeToken.equals(token);
    }

    /**
     * Supprime une session (déconnexion)
     */
    public void removeSession(String email) {
        activeSessions.remove(email);
        log.info("🔓 Session supprimée pour {}", email);
    }
}
