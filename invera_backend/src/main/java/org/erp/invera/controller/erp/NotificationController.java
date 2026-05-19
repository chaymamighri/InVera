package org.erp.invera.controller.erp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.erp.MessageResponse;
import org.erp.invera.model.erp.Notification;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.erp.invera.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * ContrÃ´leur des notifications - MULTI-TENANT.
 * Architecture : 1 base = 1 client â†’ Pas besoin de tenant_id
 */
@Slf4j
@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("hasAnyRole('ADMIN_CLIENT', 'RESPONSABLE_ACHAT')")
@RequiredArgsConstructor
public class NotificationController {

    private final TenantAwareRepository tenantRepo;
    private final JwtTokenProvider jwtTokenProvider;

    // ==================== MÃ‰THODES UTILITAIRES ====================

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        throw new RuntimeException("Token JWT manquant ou invalide");
    }

    private Long getClientIdFromToken(String token) {
        return jwtTokenProvider.getClientIdFromToken(token);
    }

    private String getCurrentRole(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return null;
        }

        return authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .filter(Objects::nonNull)
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> authority.substring("ROLE_".length()))
                .findFirst()
                .orElse(null);
    }

    // ==================== ROW MAPPER ====================

    private Notification mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        Notification notification = new Notification();
        notification.setId(rs.getLong("id"));
        notification.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        notification.setMessage(rs.getString("message"));
        notification.setRead(rs.getBoolean("read"));
        notification.setType(rs.getString("type"));
        notification.setUserEmail(rs.getString("user_email"));
        notification.setUserName(rs.getString("user_name"));
        notification.setTargetRole(rs.getString("target_role"));
        notification.setEntityId(rs.getLong("entity_id"));
        notification.setEntityReference(rs.getString("entity_reference"));
        notification.setEntityType(rs.getString("entity_type"));
        return notification;
    }

    // ==================== ENDPOINTS ====================

    @GetMapping
    public ResponseEntity<?> getAll(Authentication authentication, HttpServletRequest request) {
        String token = extractToken(request);
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String role = getCurrentRole(authentication);

        String sql = "SELECT * FROM notifications WHERE target_role = ? ORDER BY created_at DESC";
        List<Notification> notifications = tenantRepo.queryWithAuth(sql, this::mapRow, clientId, authClientId, role);

        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount(Authentication authentication, HttpServletRequest request) {
        String token = extractToken(request);
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String role = getCurrentRole(authentication);

        String sql = "SELECT COUNT(*) FROM notifications WHERE target_role = ? AND read = false";
        Long unread = tenantRepo.queryForObjectAuth(sql, Long.class, clientId, authClientId, role);

        return ResponseEntity.ok(unread != null ? unread : 0);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id, Authentication authentication, HttpServletRequest request) {
        String token = extractToken(request);
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String role = getCurrentRole(authentication);

        // VÃ©rifier l'existence et l'accÃ¨s
        String checkSql = "SELECT * FROM notifications WHERE id = ?";
        Notification notification = tenantRepo.queryForObjectAuth(checkSql, this::mapRow, clientId, authClientId, id);

        if (notification == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Notification introuvable"));
        }

        // VÃ©rifier l'accÃ¨s selon le rÃ´le
        if (!role.equals(notification.getTargetRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageResponse("AccÃ¨s non autorisÃ©"));
        }

        String updateSql = "UPDATE notifications SET read = true WHERE id = ?";
        tenantRepo.updateWithAuth(updateSql, clientId, authClientId, id);

        return ResponseEntity.ok(new MessageResponse("OK"));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllRead(Authentication authentication, HttpServletRequest request) {
        String token = extractToken(request);
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String role = getCurrentRole(authentication);

        String sql = "UPDATE notifications SET read = true WHERE target_role = ? AND read = false";
        int updated = tenantRepo.updateWithAuth(sql, clientId, authClientId, role);

        return ResponseEntity.ok(new MessageResponse(updated + " notification(s) marquÃ©e(s) comme lues"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOne(@PathVariable Long id, Authentication authentication, HttpServletRequest request) {
        String token = extractToken(request);
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String role = getCurrentRole(authentication);

        // VÃ©rifier l'existence et l'accÃ¨s
        String checkSql = "SELECT * FROM notifications WHERE id = ?";
        Notification notification = tenantRepo.queryForObjectAuth(checkSql, this::mapRow, clientId, authClientId, id);

        if (notification == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Notification introuvable"));
        }

        if (!role.equals(notification.getTargetRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageResponse("AccÃ¨s non autorisÃ©"));
        }

        String deleteSql = "DELETE FROM notifications WHERE id = ?";
        tenantRepo.updateWithAuth(deleteSql, clientId, authClientId, id);

        return ResponseEntity.ok(new MessageResponse("Notification supprimÃ©e"));
    }

    @DeleteMapping
    public ResponseEntity<?> deleteAll(Authentication authentication, HttpServletRequest request) {
        String token = extractToken(request);
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String role = getCurrentRole(authentication);

        String sql = "DELETE FROM notifications WHERE target_role = ?";
        int deleted = tenantRepo.updateWithAuth(sql, clientId, authClientId, role);

        return ResponseEntity.ok(Map.of("deleted", deleted));
    }

    @DeleteMapping("/by-range")
    public ResponseEntity<?> deleteByRange(@RequestParam String range, Authentication authentication, HttpServletRequest request) {
        String token = extractToken(request);
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String role = getCurrentRole(authentication);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime from;

        if ("week".equalsIgnoreCase(range)) {
            from = now.minusDays(7);
        } else if ("month".equalsIgnoreCase(range)) {
            from = now.minusDays(30);
        } else {
            return ResponseEntity.badRequest().body(new MessageResponse("range must be week or month"));
        }

        String sql = "DELETE FROM notifications WHERE target_role = ? AND created_at >= ?";
        int deleted = tenantRepo.updateWithAuth(sql, clientId, authClientId, role, from);

        return ResponseEntity.ok(Map.of("deleted", deleted));
    }

    @DeleteMapping("/by-month")
    public ResponseEntity<?> deleteByMonth(@RequestParam String month, Authentication authentication, HttpServletRequest request) {
        String token = extractToken(request);
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String role = getCurrentRole(authentication);

        YearMonth ym;
        try {
            ym = YearMonth.parse(month);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid month format. Use YYYY-MM"));
        }

        LocalDateTime from = ym.atDay(1).atStartOfDay();
        LocalDateTime to = ym.plusMonths(1).atDay(1).atStartOfDay();

        String sql = "DELETE FROM notifications WHERE target_role = ? AND created_at >= ? AND created_at < ?";
        int deleted = tenantRepo.updateWithAuth(sql, clientId, authClientId, role, from, to);

        return ResponseEntity.ok(Map.of("deleted", deleted));
    }
}
