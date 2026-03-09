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


    // Recherches de base
    List<CommandeFournisseur> findAllByOrderByDateCommandeDesc();

    Optional<CommandeFournisseur> findByNumeroCommande(String numeroCommande);

    List<CommandeFournisseur> findByFournisseurOrderByDateCommandeDesc(Fournisseur fournisseur);

    List<CommandeFournisseur> findByStatutOrderByDateCommandeDesc(CommandeFournisseur.StatutCommande statut);

    List<CommandeFournisseur> findByDateCommandeBetweenOrderByDateCommandeDesc(
            LocalDateTime debut, LocalDateTime fin);

    List<CommandeFournisseur> findByFournisseurAndDateCommandeBetweenOrderByDateCommandeDesc(
            Fournisseur fournisseur, LocalDateTime debut, LocalDateTime fin);

    // Comptages
    Long countByStatut(CommandeFournisseur.StatutCommande statut);

    Long countByNumeroCommandeStartingWith(String prefix);

    // Agrégations
    @Query("SELECT SUM(c.totalTTC) FROM CommandeFournisseur c WHERE c.actif = true")
    BigDecimal sumTotalTTCByActifTrue();

    @Query("SELECT SUM(c.totalTVA) FROM CommandeFournisseur c WHERE c.actif = true")
    BigDecimal sumTotalTVAByActifTrue();

    @Query("SELECT SUM(c.totalTTC) FROM CommandeFournisseur c WHERE c.fournisseur = :fournisseur AND c.actif = true")
    BigDecimal sumTotalTTCByFournisseurAndActifTrue(@Param("fournisseur") Fournisseur fournisseur);


}