package org.erp.invera.repository.erp;

import org.erp.invera.model.erp.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository
        extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenAndUserEmail(String token, String email);

    void deleteByUserEmail(String email);

}
