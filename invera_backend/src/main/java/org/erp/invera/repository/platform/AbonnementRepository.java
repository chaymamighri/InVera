package org.erp.invera.repository.platform;

import org.erp.invera.model.platform.Abonnement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AbonnementRepository extends JpaRepository<Abonnement, Long> {

    /**
     * Trouver les abonnements par statut et date d'expiration
     */
    List<Abonnement> findByStatutAndDateFinBefore(Abonnement.StatutAbonnement statut, LocalDateTime date);

    /**
     * Trouver l'abonnement actif d'un client
     */
    Optional<Abonnement> findByClientIdAndStatut(Long clientId, Abonnement.StatutAbonnement statut);

    /**
     * Trouver tous les abonnements d'un client
     */
    List<Abonnement> findByClientIdOrderByDateDebutDesc(Long clientId);

    /**
     * Vérifier si un client a un abonnement actif
     */
    boolean existsByClientIdAndStatut(Long clientId, Abonnement.StatutAbonnement statut);

    /**
     * Compter les abonnements par statut
     */
    long countByStatut(Abonnement.StatutAbonnement statut);
}