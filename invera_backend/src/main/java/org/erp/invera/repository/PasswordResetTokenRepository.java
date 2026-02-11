package org.erp.invera.repository;

import org.erp.invera.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository used to access password reset tokens
 */
public interface PasswordResetTokenRepository
        extends JpaRepository<PasswordResetToken, Long> {

    /**
     * Find token entity using token string
     */
    Optional<PasswordResetToken> findByToken(String token);
}
