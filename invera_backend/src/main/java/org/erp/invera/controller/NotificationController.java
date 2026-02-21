package org.erp.invera.controller;

import org.erp.invera.model.Notification;
import org.erp.invera.repository.NotificationRepository;
import org.erp.invera.dto.MessageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("hasRole('ADMIN')")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    // ✅ list
    @GetMapping
    public ResponseEntity<?> getAll() {
        List<Notification> list = notificationRepository.findAllOrderByCreatedAtDesc();
        return ResponseEntity.ok(list);
    }

    // ✅ unread count
    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount() {
        return ResponseEntity.ok(notificationRepository.countUnread());
    }

    // ✅ mark one read
    @PatchMapping("/{id}/read")
    @Transactional
    public ResponseEntity<?> markRead(@PathVariable Long id) {
        notificationRepository.markRead(id);
        return ResponseEntity.ok(new MessageResponse("OK"));
    }

    // ✅ mark all read
    @PatchMapping("/read-all")
    @Transactional
    public ResponseEntity<?> markAllRead() {
        notificationRepository.markAllRead();
        return ResponseEntity.ok(new MessageResponse("OK"));
    }

    // ✅ delete one notification
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteOne(@PathVariable Long id) {
        if (!notificationRepository.existsById(id)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Notification introuvable"));
        }
        notificationRepository.deleteById(id);
        return ResponseEntity.ok(new MessageResponse("Notification supprimée"));
    }

    // ✅ delete all notifications
    @DeleteMapping
    @Transactional
    public ResponseEntity<?> deleteAll() {
        int deleted = notificationRepository.deleteAllNotifications();
        return ResponseEntity.ok(Map.of("deleted", deleted));
    }

    // ✅ delete by preset: week | month
    // example: DELETE /api/notifications/by-range?range=week
    @DeleteMapping("/by-range")
    @Transactional
    public ResponseEntity<?> deleteByRange(@RequestParam String range) {
        LocalDateTime now = LocalDateTime.now();

        int deleted;
        if ("week".equalsIgnoreCase(range)) {
            deleted = notificationRepository.deleteFrom(now.minusDays(7));
        } else if ("month".equalsIgnoreCase(range)) {
            deleted = notificationRepository.deleteFrom(now.minusDays(30));
        } else {
            return ResponseEntity.badRequest().body(new MessageResponse("range must be week or month"));
        }

        return ResponseEntity.ok(Map.of("deleted", deleted));
    }

    // ✅ delete a specific month: YYYY-MM
    // example: DELETE /api/notifications/by-month?month=2026-02
    @DeleteMapping("/by-month")
    @Transactional
    public ResponseEntity<?> deleteByMonth(@RequestParam String month) {
        YearMonth ym;
        try {
            ym = YearMonth.parse(month);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid month format. Use YYYY-MM"));
        }

        LocalDate fromDate = ym.atDay(1);
        LocalDate toDate = ym.plusMonths(1).atDay(1);

        int deleted = notificationRepository.deleteBetween(
                fromDate.atStartOfDay(),
                toDate.atStartOfDay()
        );

        return ResponseEntity.ok(Map.of("deleted", deleted));
    }
}