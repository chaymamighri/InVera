package org.erp.invera.repository;

import org.erp.invera.model.stock.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    List<StockMovement> findByProduit_IdProduitOrderByDateMouvementDesc(Integer produitId);

    @Query(value = "SELECT * FROM stock_movement WHERE " +
            "(:debut IS NULL OR date_mouvement >= :debut) AND " +
            "(:fin IS NULL OR date_mouvement <= :fin) AND " +
            "(:type IS NULL OR type_mouvement = :type) " +
            "ORDER BY date_mouvement DESC",
            nativeQuery = true)
    List<StockMovement> findByFiltersNative(@Param("debut") LocalDateTime debut,
                                            @Param("fin") LocalDateTime fin,
                                            @Param("type") String type);

    @Query("SELECT COALESCE(SUM(m.quantite), 0) FROM StockMovement m " +
            "WHERE m.produit.idProduit = :produitId AND m.typeMouvement = 'ENTREE'")
    Integer sumEntreesByProduit(@Param("produitId") Integer produitId);

    @Query("SELECT COALESCE(SUM(m.quantite), 0) FROM StockMovement m " +
            "WHERE m.produit.idProduit = :produitId AND m.typeMouvement = 'SORTIE'")
    Integer sumSortiesByProduit(@Param("produitId") Integer produitId);

    @Query("SELECT COALESCE(COUNT(m), 0) FROM StockMovement m " +
            "WHERE m.dateMouvement BETWEEN :debut AND :fin")
    Long countByDateMouvementBetween(@Param("debut") LocalDateTime debut,
                                     @Param("fin") LocalDateTime fin);

    // Version corrigée - SANS IS NULL OR
    @Query("SELECT COALESCE(SUM(sm.quantite), 0) FROM StockMovement sm " +
            "WHERE sm.typeMouvement = :type " +
            "AND sm.dateMouvement BETWEEN :startDate AND :endDate")
    Long countEntreesByWeek(@Param("type") StockMovement.MovementType type,
                            @Param("startDate") LocalDateTime startDate,
                            @Param("endDate") LocalDateTime endDate);

    // Version corrigée - SANS IS NULL OR
    @Query("SELECT COALESCE(SUM(sm.quantite), 0) FROM StockMovement sm " +
            "WHERE sm.typeMouvement = :type " +
            "AND sm.dateMouvement BETWEEN :startDate AND :endDate")
    Long countSortiesByWeek(@Param("type") StockMovement.MovementType type,
                            @Param("startDate") LocalDateTime startDate,
                            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COALESCE(SUM(sm.quantite), 0) FROM StockMovement sm " +
            "WHERE sm.typeMouvement = :type " +
            "AND sm.dateMouvement BETWEEN :debut AND :fin")
    BigDecimal sumQuantiteByTypeAndPeriod(@Param("type") StockMovement.MovementType type,
                                          @Param("debut") LocalDateTime debut,
                                          @Param("fin") LocalDateTime fin);
}