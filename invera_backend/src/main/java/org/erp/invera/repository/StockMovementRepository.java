package org.erp.invera.repository;

import org.erp.invera.model.stock.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    List<StockMovement> findByProduit_IdProduitOrderByDateMouvementDesc(Integer produitId);

    List<StockMovement> findByTypeDocumentAndIdDocument(String typeDocument, Long idDocument);

    // ✅ Solution définitive : Native Query avec CAST explicite pour PostgreSQL
    @Query(value = "SELECT * FROM stock_movement WHERE " +
            "(CAST(:debut AS TIMESTAMP) IS NULL OR date_mouvement >= CAST(:debut AS TIMESTAMP)) AND " +
            "(CAST(:fin AS TIMESTAMP) IS NULL OR date_mouvement <= CAST(:fin AS TIMESTAMP)) AND " +
            "(CAST(:type AS VARCHAR) IS NULL OR type_mouvement = CAST(:type AS VARCHAR)) " +
            "ORDER BY date_mouvement DESC",
            nativeQuery = true)
    List<StockMovement> findByFiltersNative(@Param("debut") LocalDateTime debut,
                                            @Param("fin") LocalDateTime fin,
                                            @Param("type") String type);

    // ✅ SOMME DES ENTREES PAR PRODUIT
    @Query("SELECT COALESCE(SUM(m.quantite), 0) FROM StockMovement m WHERE m.produit.idProduit = :produitId AND m.typeMouvement = 'ENTREE'")
    Integer sumEntreesByProduit(@Param("produitId") Integer produitId);

    // ✅ SOMME DES SORTIES PAR PRODUIT
    @Query("SELECT COALESCE(SUM(m.quantite), 0) FROM StockMovement m WHERE m.produit.idProduit = :produitId AND m.typeMouvement = 'SORTIE'")
    Integer sumSortiesByProduit(@Param("produitId") Integer produitId);
}