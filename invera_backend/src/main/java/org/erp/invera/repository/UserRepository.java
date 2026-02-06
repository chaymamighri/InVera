package org.erp.invera.repository;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.erp.invera.model.RoleName;
import org.erp.invera.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
    List<User> findByRole(RoleName role);
    Boolean existsByUsername(String username);
}
