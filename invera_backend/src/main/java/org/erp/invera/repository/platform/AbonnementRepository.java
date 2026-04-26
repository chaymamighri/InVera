package org.erp.invera.repository.platform;

import org.erp.invera.model.platform.Abonnement;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AbonnementRepository extends JpaRepository<Abonnement, Long> {

    @EntityGraph(attributePaths = {"client", "offreAbonnement"})
    List<Abonnement> findByStatutAndDateFinBefore(Abonnement.StatutAbonnement statut, LocalDateTime date);

    @EntityGraph(attributePaths = {"client", "offreAbonnement"})
    Optional<Abonnement> findByClientIdAndStatut(Long clientId, Abonnement.StatutAbonnement statut);

    @EntityGraph(attributePaths = {"client", "offreAbonnement"})
    List<Abonnement> findByClientIdOrderByDateDebutDesc(Long clientId);

    boolean existsByClientIdAndStatut(Long clientId, Abonnement.StatutAbonnement statut);

    long countByStatut(Abonnement.StatutAbonnement statut);

    long countByOffreAbonnementId(Long offreAbonnementId);

    @EntityGraph(attributePaths = {"client", "offreAbonnement"})
    List<Abonnement> findAllByOrderByDateDebutDesc();

    @EntityGraph(attributePaths = {"client", "offreAbonnement"})
    List<Abonnement> findByStatutOrderByDateDebutDesc(Abonnement.StatutAbonnement statut);

    /**
     * Vérifie s'il existe des abonnements avec un statut donné pour une offre spécifique
     * Utilisé dans OffreAbonnementService.deactivateOffer()
     */
    boolean existsByOffreAbonnementIdAndStatut(Long offreAbonnementId, Abonnement.StatutAbonnement statut);

    /**
     * Trouve les abonnements actifs dont la date de fin est entre deux dates
     * Utile pour les notifications d'expiration (J-7, J-1, etc.)
     */
    @EntityGraph(attributePaths = {"client", "offreAbonnement"})
    List<Abonnement> findByStatutAndDateFinBetween(
            Abonnement.StatutAbonnement statut,
            LocalDateTime start,
            LocalDateTime end
    );

}
