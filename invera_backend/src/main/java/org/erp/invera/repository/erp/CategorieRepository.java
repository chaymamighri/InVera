package org.erp.invera.repository.erp;

import org.erp.invera.model.erp.Categorie;
import org.springframework.data.jpa.repository.JpaRepository;
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