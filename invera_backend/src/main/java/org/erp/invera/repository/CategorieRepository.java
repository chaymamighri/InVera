package org.erp.invera.repository;

import org.erp.invera.model.Categorie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategorieRepository extends JpaRepository<Categorie, Integer> {

    // Recherche par nom (insensible à la casse)
    Optional<Categorie> findByNomCategorieIgnoreCase(String nomCategorie);

    // Recherche par nom contenant (insensible à la casse)
    List<Categorie> findByNomCategorieContainingIgnoreCase(String nomCategorie);

    // Recherche par description contenant
    List<Categorie> findByDescriptionContainingIgnoreCase(String description);

    // Vérifier si une catégorie existe par son nom
    boolean existsByNomCategorieIgnoreCase(String nomCategorie);

    // Recherche des catégories qui ont des produits
    @Query("SELECT DISTINCT c FROM Categorie c JOIN c.produits p")
    List<Categorie> findCategoriesWithProducts();

    // Recherche des catégories sans produits
    @Query("SELECT c FROM Categorie c WHERE c.produits IS EMPTY")
    List<Categorie> findCategoriesWithoutProducts();

    // Compter le nombre de produits par catégorie
    @Query("SELECT c.nomCategorie, COUNT(p) FROM Categorie c LEFT JOIN c.produits p GROUP BY c.idCategorie, c.nomCategorie")
    List<Object[]> countProductsByCategory();

    // Recherche par nom avec requête JPQL personnalisée
    @Query("SELECT c FROM Categorie c WHERE LOWER(c.nomCategorie) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Categorie> searchByNom(@Param("searchTerm") String searchTerm);

    // Récupérer les catégories avec leurs produits (fetch join)
    @Query("SELECT DISTINCT c FROM Categorie c LEFT JOIN FETCH c.produits WHERE c.idCategorie = :id")
    Optional<Categorie> findByIdWithProducts(@Param("id") Integer id);

    // Récupérer toutes les catégories avec leurs produits
    @Query("SELECT DISTINCT c FROM Categorie c LEFT JOIN FETCH c.produits")
    List<Categorie> findAllWithProducts();

    // Trouver les catégories par ordre alphabétique
    List<Categorie> findAllByOrderByNomCategorieAsc();

    // Trouver les catégories qui ont un certain nombre minimum de produits
    @Query("SELECT c FROM Categorie c WHERE SIZE(c.produits) >= :minProduits")
    List<Categorie> findCategoriesWithMinProducts(@Param("minProduits") int minProduits);

    // Supprimer une catégorie seulement si elle n'a pas de produits
    @Query("DELETE FROM Categorie c WHERE c.idCategorie = :id AND c.produits IS EMPTY")
    void deleteIfNoProducts(@Param("id") Integer id);
}