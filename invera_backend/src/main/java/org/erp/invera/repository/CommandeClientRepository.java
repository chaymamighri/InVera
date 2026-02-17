package org.erp.invera.repository;

import org.erp.invera.model.CommandeClient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CommandeClientRepository extends JpaRepository<CommandeClient, Integer> {

    // ========================
    // RECHERCHES AVEC DÉTAILS (FETCH JOIN)
    // ========================

    @Query("SELECT DISTINCT c FROM CommandeClient c " +
            "LEFT JOIN FETCH c.client " +
            "LEFT JOIN FETCH c.lignesCommande l " +
            "LEFT JOIN FETCH l.produit " +
            "ORDER BY c.dateCommande DESC")
    List<CommandeClient> findAllWithDetails();

    @Query("SELECT DISTINCT c FROM CommandeClient c " +
            "LEFT JOIN FETCH c.client " +
            "LEFT JOIN FETCH c.lignesCommande l " +
            "LEFT JOIN FETCH l.produit " +
            "WHERE c.idCommandeClient = :id")
    Optional<CommandeClient> findByIdWithDetails(@Param("id") Integer id);

    @Query("SELECT DISTINCT c FROM CommandeClient c " +
            "LEFT JOIN FETCH c.client " +
            "LEFT JOIN FETCH c.lignesCommande l " +
            "LEFT JOIN FETCH l.produit " +
            "WHERE c.statut = :statut " +
            "ORDER BY c.dateCommande DESC")
    List<CommandeClient> findByStatutWithDetails(@Param("statut") CommandeClient.StatutCommande statut);

    @Query("SELECT DISTINCT c FROM CommandeClient c " +
            "LEFT JOIN FETCH c.client " +
            "LEFT JOIN FETCH c.lignesCommande l " +
            "LEFT JOIN FETCH l.produit " +
            "WHERE c.client.idClient = :clientId " +
            "ORDER BY c.dateCommande DESC")
    List<CommandeClient> findByClientIdWithDetails(@Param("clientId") Integer clientId);

    @Query("SELECT DISTINCT c FROM CommandeClient c " +
            "LEFT JOIN FETCH c.client " +
            "LEFT JOIN FETCH c.lignesCommande l " +
            "LEFT JOIN FETCH l.produit " +
            "WHERE c.statut = :statut AND c.client.idClient = :clientId " +
            "ORDER BY c.dateCommande DESC")
    List<CommandeClient> findByStatutAndClientIdWithDetails(
            @Param("statut") CommandeClient.StatutCommande statut,
            @Param("clientId") Integer clientId);

    // ========================
    // RECHERCHES SIMPLES
    // ========================

    List<CommandeClient> findByClientIdClientOrderByDateCommandeDesc(Integer clientId);

    List<CommandeClient> findByStatutOrderByDateCommandeDesc(CommandeClient.StatutCommande statut);

    List<CommandeClient> findByDateCommandeBetween(LocalDateTime debut, LocalDateTime fin);

    Optional<CommandeClient> findByReferenceCommandeClient(String reference);

    // ========================
    // RECHERCHES AVANCÉES
    // ========================

    List<CommandeClient> findByTotalGreaterThanEqual(BigDecimal montant);

    List<CommandeClient> findByClientIdClientAndStatutOrderByDateCommandeDesc(
            Integer clientId, CommandeClient.StatutCommande statut);

    // ========================
    // STATISTIQUES
    // ========================

    Long countByClientIdClient(Integer clientId);

    Long countByStatut(CommandeClient.StatutCommande statut);

    @Query("SELECT SUM(c.total) FROM CommandeClient c WHERE c.statut = :statut")
    BigDecimal sumTotalByStatut(@Param("statut") CommandeClient.StatutCommande statut);

    @Query("SELECT SUM(c.total) FROM CommandeClient c WHERE c.client.idClient = :clientId")
    BigDecimal sumTotalByClientId(@Param("clientId") Integer clientId);

    // ========================
    // RECHERCHES PAR PÉRIODE (SANS FONCTIONS SQL)
    // ========================

    // Trouver les commandes du jour - en utilisant between
    default List<CommandeClient> findTodayCommandes() {
        LocalDateTime debut = LocalDate.now().atStartOfDay();
        LocalDateTime fin = debut.plusDays(1).minusNanos(1);
        return findByDateCommandeBetween(debut, fin);
    }

    // Trouver les commandes d'une date spécifique
    default List<CommandeClient> findByDate(LocalDate date) {
        LocalDateTime debut = date.atStartOfDay();
        LocalDateTime fin = debut.plusDays(1).minusNanos(1);
        return findByDateCommandeBetween(debut, fin);
    }

    // Trouver les commandes entre deux dates
    default List<CommandeClient> findByDateBetween(LocalDate debut, LocalDate fin) {
        LocalDateTime debutDateTime = debut.atStartOfDay();
        LocalDateTime finDateTime = fin.atStartOfDay().plusDays(1).minusNanos(1);
        return findByDateCommandeBetween(debutDateTime, finDateTime);
    }

    // Trouver les commandes du mois courant
    default List<CommandeClient> findThisMonthCommandes() {
        LocalDate now = LocalDate.now();
        LocalDate debutMois = now.withDayOfMonth(1);
        LocalDate finMois = now.withDayOfMonth(now.lengthOfMonth());
        return findByDateBetween(debutMois, finMois);
    }

    // Trouver les commandes par mois et année
    default List<CommandeClient> findByMoisAndAnnee(int mois, int annee) {
        LocalDate debutMois = LocalDate.of(annee, mois, 1);
        LocalDate finMois = debutMois.withDayOfMonth(debutMois.lengthOfMonth());
        return findByDateBetween(debutMois, finMois);
    }

    // Compter les commandes par mois - requête native SQL
    @Query(value = "SELECT YEAR(date_commande) as annee, MONTH(date_commande) as mois, COUNT(*) as total " +
            "FROM commande_client " +
            "GROUP BY YEAR(date_commande), MONTH(date_commande) " +
            "ORDER BY annee DESC, mois DESC", nativeQuery = true)
    List<Object[]> countCommandesByMonth();
}