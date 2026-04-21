package org.erp.invera.repository.platform;

import org.erp.invera.model.platform.UserSession;
import org.erp.invera.model.platform.Utilisateur;  // ← Ajouter l'import
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    @Query("SELECT COUNT(s) FROM UserSession s WHERE s.user.id = :userId AND s.loginTime >= FUNCTION('date_trunc', 'week', CURRENT_DATE)")
    long countSessionsThisWeek(@Param("userId") Long userId);

    // ✅ Méthodes supplémentaires utiles
    Optional<UserSession> findByToken(String token);

    List<UserSession> findByUserAndIsActiveTrue(Utilisateur user);

    @Query("UPDATE UserSession s SET s.isActive = false WHERE s.user.id = :userId AND s.isActive = true")
    void deactivateAllSessionsForUser(@Param("userId") Long userId);

    @Query("SELECT s FROM UserSession s WHERE s.user.id = :userId AND s.isActive = true")
    List<UserSession> findActiveSessionsByUserId(@Param("userId") Long userId);
}