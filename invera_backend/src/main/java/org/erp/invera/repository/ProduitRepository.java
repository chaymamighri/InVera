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

    // Recherche des produits actifs uniquement
    List<Produit> findByActiveTrue();

    // Recherche des produits inactifs uniquement
    List<Produit> findByActiveFalse();


    // Recherche par liste de statuts (produits actifs)
    List<Produit> findByStatusInAndActiveTrue(List<Produit.StockStatus> statusList);

    // Recherche par catégorie (produits actifs)
    List<Produit> findByCategorieAndActiveTrue(Categorie categorie);

    // Recherche avec filtre actif dynamique
    List<Produit> findByLibelleContainingIgnoreCaseAndActive(String libelle, Boolean active);

    List<Produit> findByStatusAndActive(Produit.StockStatus status, Boolean active);

    List<Produit> findByCategorieIdCategorieAndActive(Integer categorieId, Boolean active);

    List<Produit> findByStatusAndCategorieIdCategorieAndActive(Produit.StockStatus status, Integer categorieId, Boolean active);

    List<Produit> findByLibelleContainingIgnoreCaseAndStatusAndActive(String libelle, Produit.StockStatus status, Boolean active);

    List<Produit> findByLibelleContainingIgnoreCaseAndCategorieIdCategorieAndActive(String libelle, Integer categorieId, Boolean active);

    List<Produit> findByLibelleContainingIgnoreCaseAndStatusAndCategorieIdCategorieAndActive(
            String libelle, Produit.StockStatus status, Integer categorieId, Boolean active);



}