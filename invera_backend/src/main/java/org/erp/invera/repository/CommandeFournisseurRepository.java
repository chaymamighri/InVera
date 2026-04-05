package org.erp.invera.repository;

import org.erp.invera.model.Fournisseurs.CommandeFournisseur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CommandeFournisseurRepository extends JpaRepository<CommandeFournisseur, Integer> {

    // ========== MÉTHODES EXISTANTES ==========

    List<CommandeFournisseur> findByActifTrue();

    List<CommandeFournisseur> findByActifFalse();

    Optional<CommandeFournisseur> findByNumeroCommande(String numeroCommande);

    List<CommandeFournisseur> findByDateCommandeBetweenOrderByDateCommandeDesc(
            LocalDateTime debut, LocalDateTime fin);

    Long countByNumeroCommandeStartingWith(String prefix);

    // ========== MÉTHODES POUR LES STATISTIQUES ==========

    /**
     * Compte le nombre total de commandes actives
     */
    @Query("SELECT COUNT(c) FROM CommandeFournisseur c WHERE c.actif = true")
    Long countTotalCommandes();

    /**
     * Compte les commandes par statut
     */
    @Query("SELECT COUNT(c) FROM CommandeFournisseur c WHERE c.statut = :statut AND c.actif = true")
    Long countByStatut(@Param("statut") CommandeFournisseur.StatutCommande statut);

    /**
     * Compte les commandes par statut (avec String)
     */
    default Long countByStatut(String statut) {
        try {
            CommandeFournisseur.StatutCommande enumStatut = CommandeFournisseur.StatutCommande.valueOf(statut.toUpperCase());
            return countByStatut(enumStatut);
        } catch (IllegalArgumentException e) {
            return 0L;
        }
    }

    /**
     * Évolution des commandes par mois pour une année donnée
     * Utilise totalTTC pour le montant
     */
    @Query(value = "SELECT EXTRACT(MONTH FROM c.date_commande) AS mois, " +
            "COUNT(c.id_commande_fournisseur) AS nb_commandes, " +
            "COALESCE(SUM(c.totalttc), 0) AS montant_total " +
            "FROM commandes_fournisseurs c " +
            "WHERE EXTRACT(YEAR FROM c.date_commande) = ?1 AND c.actif = true " +
            "GROUP BY EXTRACT(MONTH FROM c.date_commande) " +
            "ORDER BY mois", nativeQuery = true)
    List<Object[]> findCommandesByMonth(int year);

    /**
     * Compte les commandes sur une période
     */
    @Query("SELECT COUNT(c) FROM CommandeFournisseur c " +
            "WHERE c.dateCommande BETWEEN :debut AND :fin AND c.actif = true")
    Long countByDateBetween(@Param("debut") LocalDateTime debut,
                            @Param("fin") LocalDateTime fin);

    // Compter toutes les commandes entre deux dates
    @Query("SELECT COALESCE(COUNT(c), 0) FROM CommandeFournisseur c " +
            "WHERE (:debut IS NULL OR c.dateCommande >= :debut) " +
            "AND (:fin IS NULL OR c.dateCommande <= :fin) " +
            "AND c.actif = true")
    Long countBetweenDates(@Param("debut") LocalDateTime debut,
                           @Param("fin") LocalDateTime fin);

    // Compter les commandes par statut et entre deux dates
    @Query("SELECT COALESCE(COUNT(c), 0) FROM CommandeFournisseur c " +
            "WHERE (:debut IS NULL OR c.dateCommande >= :debut) " +
            "AND (:fin IS NULL OR c.dateCommande <= :fin) " +
            "AND c.statut = :statut " +
            "AND c.actif = true")
    Long countByStatutBetweenDates(@Param("statut") CommandeFournisseur.StatutCommande statut,
                                   @Param("debut") LocalDateTime debut,
                                   @Param("fin") LocalDateTime fin);

    // Pour pouvoir appeler avec String
    default Long countByStatutBetweenDates(String statut, LocalDateTime debut, LocalDateTime fin) {
        if (statut == null || statut.isEmpty()) return 0L;
        try {
            CommandeFournisseur.StatutCommande enumStatut =
                    CommandeFournisseur.StatutCommande.valueOf(statut.toUpperCase());
            return countByStatutBetweenDates(enumStatut, debut, fin);
        } catch (IllegalArgumentException e) {
            return 0L;
        }
    }
    // Méthode SANS IS NULL OR pour les statistiques par statut et date
    @Query("SELECT COALESCE(COUNT(c), 0) FROM CommandeFournisseur c " +
            "WHERE c.dateCommande BETWEEN :debut AND :fin " +
            "AND c.statut = :statut " +
            "AND c.actif = true")
    Long countByStatutAndDateBetween(@Param("statut") CommandeFournisseur.StatutCommande statut,
                                     @Param("debut") LocalDateTime debut,
                                     @Param("fin") LocalDateTime fin);

    // Version avec String
    default Long countByStatutAndDateBetween(String statut, LocalDateTime debut, LocalDateTime fin) {
        if (statut == null || statut.isEmpty()) return 0L;
        try {
            CommandeFournisseur.StatutCommande enumStatut =
                    CommandeFournisseur.StatutCommande.valueOf(statut.toUpperCase());
            return countByStatutAndDateBetween(enumStatut, debut, fin);
        } catch (IllegalArgumentException e) {
            return 0L;
        }
    }
}