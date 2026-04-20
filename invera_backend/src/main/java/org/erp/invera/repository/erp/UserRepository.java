package org.erp.invera.repository.erp;

import org.erp.invera.model.erp.Role;
import org.erp.invera.model.erp.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
   // Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
    Boolean existsByNom(String username);
    List<User> findByRole(Role role);

    // Filtering users
    List<User> findByNomIgnoreCaseAndPrenomIgnoreCase(String nom, String prenom);
    List<User> findByNomIgnoreCase(String nom);
    List<User> findByPrenomIgnoreCase(String prenom);


    List<User> findByNomIgnoreCaseAndRole(String nom, Role role);
    List<User> findByPrenomIgnoreCaseAndRole(String prenom, Role role);
    List<User> findByNomIgnoreCaseAndPrenomIgnoreCaseAndRole(String nom, String prenom, Role role);

}
