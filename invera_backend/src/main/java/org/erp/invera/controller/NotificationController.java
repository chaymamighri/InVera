package org.erp.invera.controller;

import org.erp.invera.dto.MessageResponse;
import org.erp.invera.model.Notification;
import org.erp.invera.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_ACHAT')")
public class NotificationController {

    private static final String ADMIN_ROLE = "ADMIN";

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<?> getAll(Authentication authentication) {
        return ResponseEntity.ok(getVisibleNotifications(authentication));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount(Authentication authentication) {
        long unread = getVisibleNotifications(authentication).stream()
                .filter(notification -> !notification.isRead())
                .count();
        return ResponseEntity.ok(unread);
    }

    @PatchMapping("/{id}/read")
    @Transactional
    public ResponseEntity<?> markRead(@PathVariable Long id, Authentication authentication) {
        Notification notification = notificationRepository.findById(id)
                .orElse(null);

        if (notification == null || !canAccess(notification, authentication)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Notification introuvable"));
        }

        notification.setRead(true);
        notificationRepository.save(notification);
        return ResponseEntity.ok(new MessageResponse("OK"));
    }

    @PatchMapping("/read-all")
    @Transactional
    public ResponseEntity<?> markAllRead(Authentication authentication) {
        List<Notification> notifications = getVisibleNotifications(authentication).stream()
                .filter(notification -> !notification.isRead())
                .toList();

        notifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(notifications);
        return ResponseEntity.ok(new MessageResponse("OK"));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteOne(@PathVariable Long id, Authentication authentication) {
        Notification notification = notificationRepository.findById(id)
                .orElse(null);

        if (notification == null || !canAccess(notification, authentication)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Notification introuvable"));
        }

        notificationRepository.delete(notification);
        return ResponseEntity.ok(new MessageResponse("Notification supprimee"));
    }

    @DeleteMapping
    @Transactional
    public ResponseEntity<?> deleteAll(Authentication authentication) {
        List<Notification> notifications = getVisibleNotifications(authentication);
        notificationRepository.deleteAll(notifications);
        return ResponseEntity.ok(Map.of("deleted", notifications.size()));
    }

    @DeleteMapping("/by-range")
    @Transactional
    public ResponseEntity<?> deleteByRange(@RequestParam String range, Authentication authentication) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime from;

        if ("week".equalsIgnoreCase(range)) {
            from = now.minusDays(7);
        } else if ("month".equalsIgnoreCase(range)) {
            from = now.minusDays(30);
        } else {
            return ResponseEntity.badRequest().body(new MessageResponse("range must be week or month"));
        }

        List<Notification> notifications = getVisibleNotifications(authentication).stream()
                .filter(notification -> notification.getCreatedAt() != null)
                .filter(notification -> !notification.getCreatedAt().isBefore(from))
                .toList();

        notificationRepository.deleteAll(notifications);
        return ResponseEntity.ok(Map.of("deleted", notifications.size()));
    }

    @DeleteMapping("/by-month")
    @Transactional
    public ResponseEntity<?> deleteByMonth(@RequestParam String month, Authentication authentication) {
        YearMonth ym;
        try {
            ym = YearMonth.parse(month);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid month format. Use YYYY-MM"));
        }

        LocalDateTime from = ym.atDay(1).atStartOfDay();
        LocalDateTime to = ym.plusMonths(1).atDay(1).atStartOfDay();

        List<Notification> notifications = getVisibleNotifications(authentication).stream()
                .filter(notification -> notification.getCreatedAt() != null)
                .filter(notification -> !notification.getCreatedAt().isBefore(from))
                .filter(notification -> notification.getCreatedAt().isBefore(to))
                .toList();

        notificationRepository.deleteAll(notifications);
        return ResponseEntity.ok(Map.of("deleted", notifications.size()));
    }

    private List<Notification> getVisibleNotifications(Authentication authentication) {
        String role = getCurrentRole(authentication);
        return notificationRepository.findAllOrderByCreatedAtDesc().stream()
                .filter(notification -> canAccess(notification, role))
                .toList();
    }

    private boolean canAccess(Notification notification, Authentication authentication) {
        return canAccess(notification, getCurrentRole(authentication));
    }

    private boolean canAccess(Notification notification, String role) {
        String targetRole = notification.getTargetRole();
        if (ADMIN_ROLE.equals(role)) {
            return targetRole == null || targetRole.isBlank() || ADMIN_ROLE.equalsIgnoreCase(targetRole);
        }
        return role != null && role.equalsIgnoreCase(targetRole);
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
}
