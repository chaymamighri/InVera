package org.erp.invera.service.platform;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class SessionManagementService {

    private final Map<String, SessionInfo> activeSessions = new ConcurrentHashMap<>();

    record SessionInfo(String token, LocalDateTime lastActivityTime, int timeoutSeconds) {}

    public boolean registerSession(String email, String token) {
        SessionInfo existingSession = activeSessions.get(email);
        LocalDateTime now = LocalDateTime.now();

        if (existingSession != null && existingSession.token().equals(token)) {
            activeSessions.put(email, new SessionInfo(token, now, existingSession.timeoutSeconds()));
            return true;
        }

        boolean hadDifferentActiveSession = existingSession != null;
        activeSessions.put(email, new SessionInfo(token, now, 1800));

        if (hadDifferentActiveSession) {
            log.warn("Ancienne session fermee pour {}", email);
        }

        return !hadDifferentActiveSession;
    }

    public boolean isSessionValid(String email, String token) {
        SessionInfo session = activeSessions.get(email);
        if (session == null || !session.token().equals(token)) return false;
        boolean expired = LocalDateTime.now().isAfter(session.lastActivityTime().plusSeconds(session.timeoutSeconds()));
        if (expired) activeSessions.remove(email);
        return !expired;
    }

    public void updateActivity(String email) {
        SessionInfo session = activeSessions.get(email);
        if (session != null) {
            activeSessions.put(email, new SessionInfo(session.token(), LocalDateTime.now(), session.timeoutSeconds()));
        }
    }

    public void removeSession(String email) {
        activeSessions.remove(email);
    }
}
