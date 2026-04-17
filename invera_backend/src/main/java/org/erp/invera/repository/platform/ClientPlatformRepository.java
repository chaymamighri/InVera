package org.erp.invera.repository.platform;

import org.erp.invera.model.platform.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClientPlatformRepository extends JpaRepository<Client, Long> {

    // ========== RECHERCHES DE BASE ==========
    Optional<Client> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByTelephone(String telephone);

    // ========== RECHERCHES PAR STATUT (avec ENUM) ==========
    List<Client> findByStatut(Client.StatutClient statut);

    @Query("SELECT c FROM Client c WHERE c.statut = :statut AND c.justificatifsValides = false")
    List<Client> findPendingValidationClients(@Param("statut") Client.StatutClient statut);

    @Query("SELECT c FROM Client c WHERE c.nomBaseDonnees IS NOT NULL")
    List<Client> findClientsWithDatabase();

}