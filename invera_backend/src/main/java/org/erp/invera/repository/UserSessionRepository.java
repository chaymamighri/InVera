package org.erp.invera.repository;

import org.erp.invera.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    @Query("SELECT COUNT(s) FROM UserSession s WHERE s.user.id = :userId AND s.loginTime >= FUNCTION('date_trunc', 'week', CURRENT_DATE)")
    long countSessionsThisWeek(@Param("userId") Long userId);
}