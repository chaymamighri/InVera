package org.erp.invera.repository.erp;

import org.erp.invera.model.erp.Categorie;
import org.erp.invera.model.erp.Produit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProduitRepository extends JpaRepository<Produit, Integer> {

    // ✅ Récupérer un produit avec son fournisseur (One-to-Many)
    @Query("SELECT DISTINCT p FROM Produit p LEFT JOIN FETCH p.fournisseur WHERE p.idProduit = :id")
    Optional<Produit> findByIdWithFournisseur(@Param("id") Integer id);

    // ✅ Récupérer tous les produits d'un fournisseur spécifique
    List<Produit> findByFournisseur_IdFournisseur(Integer fournisseurId);

    // Vos méthodes existantes
    List<Produit> findByActiveTrue();
    List<Produit> findByCategorieAndActiveTrue(Categorie categorie);
    List<Produit> findByStatusInAndActiveTrue(List<Produit.StockStatus> statusList);

    @Query(value = "SELECT * FROM produit WHERE " +
            "(:keyword IS NULL OR lower(libelle) LIKE lower(concat('%', :keyword, '%'))) AND " +
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



    // ========== MÉTHODES POUR LES STATISTIQUES ==========

    /**
     * ✅ Compte le nombre total de produits actifs
     */
    @Query("SELECT COUNT(p) FROM Produit p WHERE p.active = true")
    Long countByActiveTrue();

    /**
     * ✅ Compte le nombre de produits en rupture de stock (quantiteStock = 0)
     */
    @Query("SELECT COUNT(p) FROM Produit p WHERE p.quantiteStock = 0 AND p.active = true")
    Long countByStockActuelEqualsZero();

    /**
     * ✅ Compte le nombre de produits avec stock critique (quantiteStock < seuilMinimum ET > 0)
     */
    @Query("SELECT COUNT(p) FROM Produit p WHERE p.quantiteStock < p.seuilMinimum AND p.quantiteStock > 0 AND p.active = true")
    Long countByStockCritique();

    /**
     * ✅ Calcule la valeur totale du stock (quantiteStock * prixAchat) calculre depuis mouvement stock
     */
    @Query("SELECT COALESCE(SUM(sm.valeurTotale), 0) FROM StockMovement sm " +
            "WHERE sm.produit.active = true AND sm.typeMouvement IN ('INIT_STOCK', 'ENTREE') " +
            "AND (sm.dateMouvement <= CURRENT_DATE OR sm.dateMouvement IS NULL)")
    Double sumValeurStockTotale();

    /**
     * ✅ Calcule la valeur totale du stock par catégorie (à partir des mouvements de stock)
     * Utilise 'nomCategorie' car c'est le champ dans l'entité Categorie
     */
    @Query("SELECT c.nomCategorie, COALESCE(SUM(sm.valeurTotale), 0), COUNT(DISTINCT sm.produit.idProduit) " +
            "FROM StockMovement sm " +
            "JOIN sm.produit p " +
            "LEFT JOIN p.categorie c " +
            "WHERE p.active = true " +
            "AND sm.typeMouvement IN ('INIT_STOCK', 'ENTREE') " +
            "GROUP BY c.idCategorie, c.nomCategorie")
    List<Object[]> sumValeurStockByCategorie();

    /**
     * ✅ Calcule le stock moyen de tous les produits
     */
    @Query("SELECT COALESCE(AVG(p.quantiteStock), 0) FROM Produit p WHERE p.active = true")
    Double averageStock();

    /**
     * ✅ Récupère les produits en rupture de stock
     */
    @Query("SELECT p FROM Produit p WHERE p.quantiteStock = 0 AND p.active = true ORDER BY p.libelle")
    List<Produit> findProduitsEnRupture();

    /**
     * ✅ Récupère les produits avec stock critique
     */
    @Query("SELECT p FROM Produit p WHERE p.quantiteStock < p.seuilMinimum AND p.quantiteStock > 0 AND p.active = true ORDER BY (p.quantiteStock * 1.0 / p.seuilMinimum) ASC")
    List<Produit> findProduitsStockCritique();


    /**
     * ✅ Calcule le nombre de produits par catégorie
     * Utilise 'nomCategorie' car c'est le champ dans l'entité Categorie
     */
    @Query("SELECT c.nomCategorie, COUNT(p) FROM Produit p " +
            "LEFT JOIN p.categorie c " +
            "WHERE p.active = true " +
            "GROUP BY c.idCategorie, c.nomCategorie")
    List<Object[]> countByCategorie();


}