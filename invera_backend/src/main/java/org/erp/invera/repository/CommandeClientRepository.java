package org.erp.invera.repository;

import org.erp.invera.dto.DashboardDTO;
import org.erp.invera.model.CommandeClient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CommandeClientRepository extends JpaRepository<CommandeClient, Integer> {

    // ========================
    // RECHERCHES AVEC DÉTAILS (FETCH JOIN)
    // ========================

    @Query("SELECT DISTINCT c FROM CommandeClient c " +
            "LEFT JOIN FETCH c.client " +
            "LEFT JOIN FETCH c.lignesCommande l " +
            "LEFT JOIN FETCH l.produit " +
            "ORDER BY c.dateCommande DESC")
    List<CommandeClient> findAllWithDetails();

    @Query("SELECT DISTINCT c FROM CommandeClient c " +
            "LEFT JOIN FETCH c.client " +
            "LEFT JOIN FETCH c.lignesCommande l " +
            "LEFT JOIN FETCH l.produit " +
            "WHERE c.idCommandeClient = :id")
    Optional<CommandeClient> findByIdWithDetails(@Param("id") Integer id);

    @Query("SELECT DISTINCT c FROM CommandeClient c " +
            "LEFT JOIN FETCH c.client " +
            "LEFT JOIN FETCH c.lignesCommande l " +
            "LEFT JOIN FETCH l.produit " +
            "WHERE c.statut = :statut " +
            "ORDER BY c.dateCommande DESC")
    List<CommandeClient> findByStatutWithDetails(@Param("statut") CommandeClient.StatutCommande statut);

    @Query("SELECT DISTINCT c FROM CommandeClient c " +
            "LEFT JOIN FETCH c.client " +
            "LEFT JOIN FETCH c.lignesCommande l " +
            "LEFT JOIN FETCH l.produit " +
            "WHERE c.client.idClient = :clientId " +
            "ORDER BY c.dateCommande DESC")
    List<CommandeClient> findByClientIdWithDetails(@Param("clientId") Integer clientId);

    @Query("SELECT DISTINCT c FROM CommandeClient c " +
            "LEFT JOIN FETCH c.client " +
            "LEFT JOIN FETCH c.lignesCommande l " +
            "LEFT JOIN FETCH l.produit " +
            "WHERE c.statut = :statut AND c.client.idClient = :clientId " +
            "ORDER BY c.dateCommande DESC")
    List<CommandeClient> findByStatutAndClientIdWithDetails(
            @Param("statut") CommandeClient.StatutCommande statut,
            @Param("clientId") Integer clientId);

    // Dans CommandeClientRepository.java - Modifie ces signatures
    @Query("SELECT COALESCE(SUM(c.total), 0) FROM CommandeClient c " +
            "WHERE c.dateCommande BETWEEN :debut AND :fin")
    BigDecimal sumTotalByPeriode(@Param("debut") LocalDateTime debut,
                                 @Param("fin") LocalDateTime fin);

    @Query("SELECT COUNT(c) FROM CommandeClient c " +
            "WHERE c.dateCommande BETWEEN :debut AND :fin")
    long countByPeriode(@Param("debut") LocalDateTime debut,
                        @Param("fin") LocalDateTime fin);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN " +
            "CAST(COUNT(CASE WHEN c.statut = 'CONFIRMEE' THEN 1 END) AS double) / COUNT(c) * 100 " +
            "ELSE 0 END FROM CommandeClient c " +
            "WHERE c.dateCommande BETWEEN :debut AND :fin")
    BigDecimal tauxTransformation(@Param("debut") LocalDateTime debut,
                                  @Param("fin") LocalDateTime fin);

    @Query("SELECT COALESCE(SUM(c.total), 0) FROM CommandeClient c " +
            "WHERE DATE(c.dateCommande) = :date")
    BigDecimal sumTotalByDate(@Param("date") LocalDate date);

    // ========================
    // TOP PRODUITS - AVEC LES BONS NOMS D'ATTRIBUTS
    // ========================

    @Query("SELECT NEW org.erp.invera.dto.DashboardDTO$ProduitVente(" +
            "p.idProduit, " +
            "p.libelle, " +
            "SUM(l.quantite), " +
            "SUM(l.sousTotal), " +
            "p.imageUrl) " +
            "FROM LigneCommandeClient l " +
            "JOIN l.commandeClient c " +
            "JOIN l.produit p " +
            "WHERE c.dateCommande BETWEEN :debut AND :fin " +
            "AND c.statut = 'CONFIRMEE' " +
            "GROUP BY p.idProduit, p.libelle, p.imageUrl " +
            "ORDER BY SUM(l.quantite) DESC " +
            "LIMIT :limit")
    List<DashboardDTO.ProduitVente> topProduits(@Param("debut") LocalDateTime debut,
                                                @Param("fin") LocalDateTime fin,
                                                @Param("limit") int limit);

    // ========================
    // RÉPARTITION PAR STATUT
    // ========================

    // Dans CommandeClientRepository.java
    @Query("SELECT c.statut, COUNT(c), COALESCE(SUM(c.total), 0) " +
            "FROM CommandeClient c " +
            "WHERE c.dateCommande BETWEEN :debut AND :fin " +
            "GROUP BY c.statut")
    List<Object[]> getStatusRepartition(@Param("debut") LocalDateTime debut,
                                        @Param("fin") LocalDateTime fin);

    @Query("SELECT DATE(c.dateCommande), COUNT(c), COALESCE(SUM(c.total), 0) " +
            "FROM CommandeClient c " +
            "WHERE c.dateCommande BETWEEN :debut AND :fin " +
            "GROUP BY DATE(c.dateCommande) " +
            "ORDER BY DATE(c.dateCommande)")
    List<Object[]> getDailyOrdersStats(@Param("debut") LocalDateTime debut,
                                       @Param("fin") LocalDateTime fin);

    // Dans le backend - UNIQUEMENT les clients avec commandes
    @Query("SELECT cl.typeClient, " +
            "COUNT(DISTINCT cl.idClient), " +
            "COALESCE(SUM(c.total), 0) " +
            "FROM CommandeClient c " +
            "JOIN c.client cl " +
            "WHERE c.dateCommande BETWEEN :debut AND :fin " +
            "GROUP BY cl.typeClient")
    List<Object[]> getSalesByClientType(@Param("debut") LocalDateTime debut,
                                        @Param("fin") LocalDateTime fin);


    @Query("SELECT DISTINCT c FROM CommandeClient c " +
            "LEFT JOIN FETCH c.client " +
            "LEFT JOIN FETCH c.lignesCommande " +
            "WHERE c.dateCommande BETWEEN :debut AND :fin " +
            "ORDER BY c.dateCommande DESC")
    List<CommandeClient> findByDateCommandeBetweenWithDetails(
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin
    );

    @Query("SELECT c FROM CommandeClient c WHERE c.dateCommande BETWEEN :debut AND :fin")
    List<CommandeClient> findByDateCommandeBetween(
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin
    );
}
