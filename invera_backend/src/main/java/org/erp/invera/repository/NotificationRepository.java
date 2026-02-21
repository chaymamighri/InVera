package org.erp.invera.repository;

import org.erp.invera.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("select n from Notification n order by n.createdAt desc")
    List<Notification> findAllOrderByCreatedAtDesc();

    @Query("select count(n) from Notification n where n.read = false")
    long countUnread();

    @Modifying
    @Query("update Notification n set n.read = true where n.read = false")
    int markAllRead();

    @Modifying
    @Query("update Notification n set n.read = true where n.id = :id")
    int markRead(@Param("id") Long id);

    // ✅ delete by date
    @Modifying
    @Query("delete from Notification n where n.createdAt >= :from")
    int deleteFrom(@Param("from") LocalDateTime from);

    // ✅ delete within range [from, to)
    @Modifying
    @Query("delete from Notification n where n.createdAt >= :from and n.createdAt < :to")
    int deleteBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    // ✅ delete all
    @Modifying
    @Query("delete from Notification")
    int deleteAllNotifications();
}