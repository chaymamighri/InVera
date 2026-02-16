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

    // Recherche par catégorie avec le nom de la catégorie
    @Query("SELECT p FROM Produit p WHERE p.categorie.nomCategorie = :nomCategorie")
    List<Produit> findByCategorieNom(@Param("nomCategorie") String nomCategorie);

    // Recherche par fourchette de prix
    List<Produit> findByPrixVenteBetween(Double prixMin, Double prixMax);

    // Recherche des produits avec stock faible (quantité < seuil)
    @Query("SELECT p FROM Produit p WHERE p.quantiteStock < p.seuilMinimum")
    List<Produit> findLowStockProducts();

    // Recherche des produits en rupture de stock
    @Query("SELECT p FROM Produit p WHERE p.quantiteStock = 0 OR p.quantiteStock IS NULL")
    List<Produit> findOutOfStockProducts();

    // Compter les produits par catégorie
    Long countByCategorieIdCategorie(Integer categorieId);

    // Vérifier si un produit existe avec un certain libellé dans une catégorie
    boolean existsByLibelleAndCategorieIdCategorie(String libelle, Integer categorieId);
}