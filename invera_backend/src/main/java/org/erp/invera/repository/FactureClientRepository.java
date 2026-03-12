package org.erp.invera.repository;

import org.erp.invera.model.client.FactureClient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FactureClientRepository extends JpaRepository<FactureClient, Integer> {

    //  Par ID de commande
    boolean existsByCommandeIdCommandeClient(Integer commandeId);

    Optional<FactureClient> findByCommandeIdCommandeClient(Integer commandeId);

    //  Par référence
    boolean existsByReferenceFactureClient(String reference);

    //  Par client
    List<FactureClient> findByClientIdClient(Integer clientId);


    //  Par statut
    @Query("SELECT COALESCE(SUM(f.montantTotal), 0) FROM FactureClient f WHERE f.statut = :statut")
    BigDecimal sumMontantByStatut(@Param("statut") FactureClient.StatutFacture statut);


    @Query("SELECT COUNT(f) FROM FactureClient f WHERE f.statut = :statut")
    long countByStatut(@Param("statut") FactureClient.StatutFacture statut);


    @Query("SELECT COUNT(f) FROM FactureClient f " +
            "WHERE f.statut = 'NON_PAYE' AND f.dateFacture < :date")
    long countEnRetard(@Param("date") LocalDateTime date);// ← Changé en LocalDateTime


    @Query("SELECT f FROM FactureClient f WHERE f.dateFacture BETWEEN :debut AND :fin")
    List<FactureClient> findByDateFactureBetween(
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin
    );
}