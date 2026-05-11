package org.erp.invera.repository.platform;

import org.erp.invera.model.platform.Paiement;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaiementRepository extends JpaRepository<Paiement, Long> {

    // ✅ CORRECTION : Utiliser une méthode différente ou @Query
    @EntityGraph(attributePaths = {"abonnement", "abonnement.client", "abonnement.offreAbonnement"})
    Optional<Paiement> findWithDetailsById(Long id);

    // Récupérer tous les paiements avec les relations chargées
    @Query("SELECT DISTINCT p FROM Paiement p " +
            "LEFT JOIN FETCH p.abonnement a " +
            "LEFT JOIN FETCH a.client c " +
            "LEFT JOIN FETCH a.offreAbonnement o " +
            "ORDER BY p.dateDemande DESC")
    List<Paiement> findAllWithRelations();

    @Query("SELECT p FROM Paiement p " +
            "LEFT JOIN FETCH p.abonnement a " +
            "LEFT JOIN FETCH a.client c " +
            "LEFT JOIN FETCH a.offreAbonnement o " +
            "WHERE p.id = :id")
    Optional<Paiement> findByIdWithAllRelations(@Param("id") Long id);

    // Recherche par KonnectPaymentId avec chargement des relations (✅ celle-ci est bonne)
    @EntityGraph(attributePaths = {"abonnement", "abonnement.client", "abonnement.offreAbonnement"})
    Optional<Paiement> findByKonnectPaymentId(String konnectPaymentId);

    // ✅ AJOUTER pour la vérification anti-doublon
    boolean existsByAbonnementIdAndStatut(Long abonnementId, Paiement.StatutPaiement statut);
}