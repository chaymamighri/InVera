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

    Optional<CommandeClient> findByNumeroCommande(String numeroCommande);

    List<CommandeClient> findByStatut(CommandeClient.StatutCommande statut);

    List<CommandeClient> findByClientId(Integer clientId);

    List<CommandeClient> findByStatutAndClientId(
            CommandeClient.StatutCommande statut, Integer clientId);

    @Query("SELECT c FROM CommandeClient c WHERE " +
            "LOWER(c.numeroCommande) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(c.client.nom) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<CommandeClient> searchByNumeroOrClient(@Param("searchTerm") String searchTerm);

}