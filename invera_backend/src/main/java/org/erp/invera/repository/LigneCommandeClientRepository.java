package org.erp.invera.repository;

import org.erp.invera.model.LigneCommandeClient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface LigneCommandeClientRepository extends JpaRepository<LigneCommandeClient, Integer> {

    // Trouver toutes les lignes d'une commande
    List<LigneCommandeClient> findByCommandeClientIdCommandeClient(Integer commandeClientId);

    // Trouver toutes les lignes d'un produit
    List<LigneCommandeClient> findByProduitIdProduit(Integer produitId);

    // Trouver les lignes d'une commande avec chargement des produits
    @Query("SELECT l FROM LigneCommandeClient l " +
            "LEFT JOIN FETCH l.produit " +
            "WHERE l.commandeClient.idCommandeClient = :commandeId")
    List<LigneCommandeClient> findByCommandeIdWithProduit(@Param("commandeId") Integer commandeId);

    // Compter le nombre de lignes pour une commande
    Long countByCommandeClientIdCommandeClient(Integer commandeClientId);

    // Compter le nombre total de produits commandés dans une commande
    @Query("SELECT SUM(l.quantite) FROM LigneCommandeClient l " +
            "WHERE l.commandeClient.idCommandeClient = :commandeId")
    Integer sumQuantiteByCommandeId(@Param("commandeId") Integer commandeId);

    // Supprimer toutes les lignes d'une commande
    @Modifying
    @Transactional
    @Query("DELETE FROM LigneCommandeClient l WHERE l.commandeClient.idCommandeClient = :commandeId")
    void deleteByCommandeClientId(@Param("commandeId") Integer commandeId);

    // Vérifier si un produit est présent dans une commande
    boolean existsByCommandeClientIdCommandeClientAndProduitIdProduit(
            Integer commandeClientId, Integer produitId);

    // Trouver les produits les plus commandés
    @Query("SELECT l.produit.idProduit, l.produit.libelle, SUM(l.quantite) as totalQuantite " +
            "FROM LigneCommandeClient l " +
            "GROUP BY l.produit.idProduit, l.produit.libelle " +
            "ORDER BY totalQuantite DESC")
    List<Object[]> findTopProduitsByQuantite();

    // Calculer le total des ventes pour un produit
    @Query("SELECT SUM(l.sousTotal) FROM LigneCommandeClient l " +
            "WHERE l.produit.idProduit = :produitId")
    BigDecimal sumSousTotalByProduitId(@Param("produitId") Integer produitId);

    // Trouver les lignes avec stock faible après commande
    @Query("SELECT l FROM LigneCommandeClient l " +
            "WHERE l.produit.quantiteStock < l.produit.seuilMinimum " +
            "ORDER BY l.commandeClient.dateCommande DESC")
    List<LigneCommandeClient> findLignesWithLowStockAfterCommande();

    // Statistiques par commande
    @Query("SELECT l.commandeClient.idCommandeClient, " +
            "COUNT(l), " +
            "SUM(l.quantite), " +
            "SUM(l.sousTotal) " +
            "FROM LigneCommandeClient l " +
            "GROUP BY l.commandeClient.idCommandeClient")
    List<Object[]> getCommandesStatistics();

    // Supprimer les lignes d'une commande spécifique
    void deleteByCommandeClientIdCommandeClient(Integer commandeClientId);
}