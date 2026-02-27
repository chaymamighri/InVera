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

    // Trouver les catégories par ordre alphabétique
    List<Categorie> findAllByOrderByNomCategorieAsc();

}