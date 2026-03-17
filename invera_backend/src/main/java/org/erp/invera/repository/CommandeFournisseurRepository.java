package org.erp.invera.repository;

import org.erp.invera.model.Fournisseurs.CommandeFournisseur;
import org.erp.invera.model.Fournisseurs.Fournisseur;
import org.erp.invera.model.Fournisseurs.LigneCommandeFournisseur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
@Repository
public interface CommandeFournisseurRepository  extends JpaRepository<CommandeFournisseur, Integer> {
    // Pour les commandes actives (soft delete = false)
    List<CommandeFournisseur> findByActifTrue();

    Long countByNumeroCommandeStartingWith(String prefix);

    //  Pour les commandes archivées (soft delete = true)
    List<CommandeFournisseur> findByActifFalse();

    Optional<CommandeFournisseur> findByNumeroCommande(String numeroCommande);

    List<CommandeFournisseur> findByDateCommandeBetweenOrderByDateCommandeDesc(
            LocalDateTime debut, LocalDateTime fin);

}