package org.erp.invera.repository;

import org.erp.invera.model.CommandeClient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CommandeClientRepository extends JpaRepository<CommandeClient, Integer> {

    Optional<CommandeClient> findByNumeroCommande(String numeroCommande);
    java.util.List<CommandeClient> findByClientId(Integer clientId);
    java.util.List<CommandeClient> findByStatut(CommandeClient.StatutCommande statut);
}