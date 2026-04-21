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
        boolean wasActive = activeSessions.containsKey(email);
        activeSessions.put(email, new SessionInfo(token, LocalDateTime.now(), 1800));
        if (wasActive) log.warn("⚠️ Ancienne session fermée pour {}", email);
        return !wasActive;
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