package org.erp.invera.repository;

import org.erp.invera.model.Role;
import org.erp.invera.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
    Boolean existsByUsername(String username);
    List<User> findByRole(Role role);

    // Filtering users
    List<User> findByNomIgnoreCaseAndPrenomIgnoreCase(String nom, String prenom);
    List<User> findByNomIgnoreCase(String nom);
    List<User> findByPrenomIgnoreCase(String prenom);
}
