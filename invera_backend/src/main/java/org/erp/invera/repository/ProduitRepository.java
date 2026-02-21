package org.erp.invera.repository;

import org.erp.invera.dto.DashboardDTO;
import org.erp.invera.model.Categorie;
import org.erp.invera.model.Produit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProduitRepository extends JpaRepository<Produit, Integer> {

    // Recherche par libellé (insensible à la casse)
    List<Produit> findByLibelleContainingIgnoreCase(String libelle);

    // Recherche par statut
    List<Produit> findByStatus(Produit.StockStatus status);

    // Recherche par libellé et statut
    List<Produit> findByLibelleContainingIgnoreCaseAndStatus(String libelle, Produit.StockStatus status);

    // Recherche par liste de statuts
    List<Produit> findByStatusIn(List<Produit.StockStatus> statusList);

    // Recherche par catégorie (objet Categorie)
    List<Produit> findByCategorie(Categorie categorie);

    // Recherche par ID de catégorie - CORRIGÉ : categorie.idCategorie au lieu de categorie.id
    List<Produit> findByCategorieIdCategorie(Integer categorieId);

    // Recherche par libellé et catégorie ID - CORRIGÉ
    List<Produit> findByLibelleContainingIgnoreCaseAndCategorieIdCategorie(String libelle, Integer categorieId);

    // Recherche par statut et catégorie ID - CORRIGÉ
    List<Produit> findByStatusAndCategorieIdCategorie(Produit.StockStatus status, Integer categorieId);

    // Recherche par libellé, statut et catégorie ID - CORRIGÉ
    List<Produit> findByLibelleContainingIgnoreCaseAndStatusAndCategorieIdCategorie(
            String libelle, Produit.StockStatus status, Integer categorieId);


    @Query("SELECT p FROM Produit p " +
            "WHERE p.quantiteStock <= p.seuilMinimum AND p.quantiteStock > 0 " +
            "ORDER BY p.quantiteStock ASC")
    List<Produit> findLowStockProducts();

    @Query("SELECT p FROM Produit p " +
            "WHERE p.quantiteStock <= 0")
    List<Produit> findOutOfStockProducts();


    // Vérifier si un produit existe avec un certain libellé dans une catégorie
    /*boolean existsByLibelleAndCategorieIdCategorie(String libelle, Integer categorieId);
    @Query("SELECT NEW org.erp.invera.dto.DashboardDTO$Alerte(" +
            "p.idProduit, p.libelle, " +
            "CONCAT('Stock: ', p.quantiteStock, ' ', p.uniteMesure), 'STOCK_FAIBLE', " +
            "'Réapprovisionner', NULL, NULL) " +
            "FROM Produit p " +
            "WHERE p.quantiteStock <= p.seuilMinimum AND p.quantiteStock > 0 " +
            "ORDER BY p.quantiteStock ASC LIMIT :limit")
    List<DashboardDTO.Alerte> stocksFaibles(@Param("limit") int limit);

    @Query("SELECT NEW org.erp.invera.dto.DashboardDTO$Alerte(" +
            "p.idProduit, p.libelle, 'Rupture de stock', 'RUPTURE', " +
            "'Commander', NULL, NULL) " +
            "FROM Produit p " +
            "WHERE p.quantiteStock <= 0 LIMIT :limit")
    List<DashboardDTO.Alerte> produitsRupture(@Param("limit") int limit);*/

}