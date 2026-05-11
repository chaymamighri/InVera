package org.erp.invera.repository.platform;


import org.erp.invera.model.platform.UserEmail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserEmailRepository extends JpaRepository<UserEmail, Long> {
    Optional<UserEmail> findByEmail(String email);
    List<UserEmail> findByClientId(Long clientId);
    void deleteByClientIdAndUserId(Long clientId, Long userId);
}