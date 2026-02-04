package org.erp.invera.repository;

import org.erp.invera.model.Produit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProduitRepository extends JpaRepository<Produit, Integer> {

    List<Produit> findByLibelleContainingIgnoreCase(String libelle);
    List<Produit> findByStatus(Produit.StockStatus status);
    List<Produit> findByLibelleContainingIgnoreCaseAndStatus(String libelle, Produit.StockStatus status);
    List<Produit> findByStatusIn(List<Produit.StockStatus> statusList);
    List<Produit> findByCategorie(String categorie);
    List<Produit> findByLibelleContainingIgnoreCaseAndCategorie(String libelle, String categorie);
    List<Produit> findByStatusAndCategorie(Produit.StockStatus status, String categorie);
    List<Produit> findByLibelleContainingIgnoreCaseAndStatusAndCategorie(
            String libelle, Produit.StockStatus status, String categorie);
}
