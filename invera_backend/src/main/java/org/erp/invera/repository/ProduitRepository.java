package org.erp.invera.repository;

import org.erp.invera.model.Categorie;
import org.erp.invera.model.Produit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProduitRepository extends JpaRepository<Produit, Integer> {

    // ========== MÉTHODES AVEC FILTRE ACTIF ==========

    // ========== MÉTHODES SIMPLES ==========
    List<Produit> findByActiveTrue();
    List<Produit> findByActiveFalse();
    List<Produit> findByCategorieAndActiveTrue(Categorie categorie);
    List<Produit> findByStatusInAndActiveTrue(List<Produit.StockStatus> statusList);


    @Query(value = "SELECT * FROM produit WHERE " +
            "(:keyword IS NULL OR lower(libelle) LIKE lower(concat('%', :keyword, '%'))) AND " +  // Plus de convert_from !
            "(:status IS NULL OR status = :status) AND " +
            "(:categorieId IS NULL OR categorie_id = :categorieId) AND " +
            "(:actif IS NULL OR is_active = :actif)",
            nativeQuery = true)
    List<Produit> searchProduits(
            @Param("keyword") String keyword,
            @Param("status") String status,
            @Param("categorieId") Integer categorieId,
            @Param("actif") Boolean actif
    );

}