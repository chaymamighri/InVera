package org.erp.invera.repository.platform;

import org.erp.invera.model.platform.ActivationToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ActivationTokenRepository extends JpaRepository<ActivationToken, Long> {

    Optional<ActivationToken> findByToken(String token);

    void deleteByUserEmail(String email);
}
