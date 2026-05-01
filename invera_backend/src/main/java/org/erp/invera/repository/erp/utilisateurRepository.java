package org.erp.invera.repository.erp;

import org.erp.invera.model.erp.Utilisateur;  // ← U majuscule
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface utilisateurRepository extends JpaRepository<Utilisateur, Long> {  // ← U majuscule pour l'entity

    Optional<Utilisateur> findByEmail(String email);

    List<Utilisateur> findByClientId(Long clientId);  // ← U majuscule

    List<Utilisateur> findByClientIdAndRole(Long clientId, String role);

    boolean existsByEmail(String email);

}