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

}