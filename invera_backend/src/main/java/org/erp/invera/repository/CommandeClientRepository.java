package org.erp.invera.repository;

import org.erp.invera.model.CommandeClient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommandeClientRepository extends JpaRepository<CommandeClient, Integer> {

    // ✅ Recherche par numéro de commande
    Optional<CommandeClient> findByNumeroCommande(String numeroCommande);

    // ✅ Recherches simples (sans FETCH)
    List<CommandeClient> findByStatut(CommandeClient.StatutCommande statut);
    List<CommandeClient> findByClientId(Integer clientId);
    List<CommandeClient> findByStatutAndClientId(
            CommandeClient.StatutCommande statut, Integer clientId);

    // ✅ Recherche avec terme de recherche
    @Query("SELECT c FROM CommandeClient c WHERE " +
            "LOWER(c.numeroCommande) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(c.client.nom) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<CommandeClient> searchByNumeroOrClient(@Param("searchTerm") String searchTerm);

    // ✅ 1. TOUTES LES COMMANDES AVEC DÉTAILS
    @Query("SELECT DISTINCT c FROM CommandeClient c " +
            "LEFT JOIN FETCH c.client " +
            "LEFT JOIN FETCH c.produits " +
            "ORDER BY c.dateCreation DESC")
    List<CommandeClient> findAllWithDetails();

    // ✅ 2. COMMANDE PAR ID AVEC DÉTAILS - ❗ AJOUT IMPORTANT ❗
    @Query("SELECT DISTINCT c FROM CommandeClient c " +
            "LEFT JOIN FETCH c.client " +
            "LEFT JOIN FETCH c.produits " +
            "WHERE c.id = :id")
    Optional<CommandeClient> findByIdWithDetails(@Param("id") Integer id);

    // ✅ 3. COMMANDES PAR STATUT AVEC DÉTAILS
    @Query("SELECT DISTINCT c FROM CommandeClient c " +
            "LEFT JOIN FETCH c.client " +
            "LEFT JOIN FETCH c.produits " +
            "WHERE c.statut = :statut " +
            "ORDER BY c.dateCreation DESC")
    List<CommandeClient> findByStatutWithDetails(@Param("statut") CommandeClient.StatutCommande statut);

    // ✅ 4. COMMANDES PAR CLIENT AVEC DÉTAILS
    @Query("SELECT DISTINCT c FROM CommandeClient c " +
            "LEFT JOIN FETCH c.client " +
            "LEFT JOIN FETCH c.produits " +
            "WHERE c.client.id = :clientId " +
            "ORDER BY c.dateCreation DESC")
    List<CommandeClient> findByClientIdWithDetails(@Param("clientId") Integer clientId);

    // ✅ 5. COMMANDES PAR STATUT ET CLIENT AVEC DÉTAILS
    @Query("SELECT DISTINCT c FROM CommandeClient c " +
            "LEFT JOIN FETCH c.client " +
            "LEFT JOIN FETCH c.produits " +
            "WHERE c.statut = :statut AND c.client.id = :clientId " +
            "ORDER BY c.dateCreation DESC")
    List<CommandeClient> findByStatutAndClientIdWithDetails(
            @Param("statut") CommandeClient.StatutCommande statut,
            @Param("clientId") Integer clientId);
}