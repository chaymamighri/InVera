package org.erp.invera.repository;

import org.erp.invera.model.Produit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProduitRepository extends JpaRepository<Produit, Integer> {
    // Ici tu peux ajouter des méthodes personnalisées si besoin
}
