package org.erp.invera.repository.platform;

import org.erp.invera.model.platform.ClientUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientUserRepository extends JpaRepository<ClientUser, Long> {

    // ========== RECHERCHES DE BASE ==========
    Optional<ClientUser> findByEmail(String email);

    boolean existsByEmail(String email);

    // ========== RECHERCHES PAR CLIENT ==========
    List<ClientUser> findByClientId(Long clientId);

    List<ClientUser> findByClientIdAndRole(Long clientId, ClientUser.RoleUtilisateur role);

    // ========== RECHERCHES PAR RÔLE ==========
    List<ClientUser> findByRole(ClientUser.RoleUtilisateur role);

    // ========== RECHERCHES PAR STATUT ==========
    List<ClientUser> findByEstActif(Boolean estActif);

    // ========== SUPER ADMIN ==========
    @Query("SELECT u FROM ClientUser u WHERE u.client IS NULL")
    List<ClientUser> findSuperAdmins();

    // ========== COMPTAGE ==========
    long countByClientId(Long clientId);

    long countByRole(ClientUser.RoleUtilisateur role);

    // ========== EMPLOYÉS ACTIFS D'UN CLIENT ==========
    @Query("SELECT u FROM ClientUser u WHERE u.client.id = :clientId AND u.estActif = true")
    List<ClientUser> findActiveEmployeesByClientId(@Param("clientId") Long clientId);
}