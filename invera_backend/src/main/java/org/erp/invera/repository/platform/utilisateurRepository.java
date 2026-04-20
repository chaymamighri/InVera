package org.erp.invera.repository.platform;

import org.erp.invera.model.platform.Utilisateur;  // ← U majuscule
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface utilisateurRepository extends JpaRepository<Utilisateur, Long> {  // ← U majuscule pour l'entity

    Optional<Utilisateur> findByEmail(String email);

    List<Utilisateur> findByClientId(Long clientId);  // ← U majuscule

    List<Utilisateur> findByRole(Utilisateur.RoleUtilisateur role);  // ← U majuscule

    boolean existsByEmail(String email);

    @Query("SELECT u FROM Utilisateur u WHERE u.role = 'ADMIN_CLIENT'")  // ← U majuscule
    List<Utilisateur> findSuperAdmins();  // ← U majuscule
}