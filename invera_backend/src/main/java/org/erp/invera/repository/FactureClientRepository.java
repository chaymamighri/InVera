package org.erp.invera.repository;

import org.erp.invera.model.FactureClient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FactureClientRepository extends JpaRepository<FactureClient, Integer> {

    // ✅ Par ID de commande
    boolean existsByCommandeIdCommandeClient(Integer commandeId);

    Optional<FactureClient> findByCommandeIdCommandeClient(Integer commandeId);

    // ✅ Par référence
    boolean existsByReferenceFactureClient(String reference);

    Optional<FactureClient> findByReferenceFactureClient(String reference);

    // ✅ Par client
    List<FactureClient> findByClientIdClient(Integer clientId);

    // ✅ Par statut
    List<FactureClient> findByStatut(FactureClient.StatutFacture statut);
}