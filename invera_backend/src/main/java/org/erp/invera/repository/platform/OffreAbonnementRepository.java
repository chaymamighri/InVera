package org.erp.invera.repository.platform;

import org.erp.invera.model.platform.OffreAbonnement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OffreAbonnementRepository extends JpaRepository<OffreAbonnement, Long> {

    // ==================== METHODES DE BASE ====================

    /**
     * Trouver une offre par son ID
     */
    Optional<OffreAbonnement> findById(Long id);

    /**
     * Trouver toutes les offres triées par date de création (récentes d'abord)
     */
    List<OffreAbonnement> findAllByOrderByCreatedAtDesc();

    /**
     * Trouver toutes les offres actives triées par prix (croissant)
     */
    List<OffreAbonnement> findByActiveTrueOrderByPrixAsc();


    // ==================== METHODES POUR LA VALIDATION ====================

    /**
     * Vérifier si une offre existe avec un nom donné (insensible à la casse)
     */
    boolean existsByNomIgnoreCase(String nom);

    /**
     * Vérifier si une offre existe avec un nom donné, en excluant un ID (pour la mise à jour)
     */
    @Query("SELECT COUNT(o) > 0 FROM OffreAbonnement o WHERE LOWER(o.nom) = LOWER(:nom) AND o.id != :id")
    boolean existsByNomIgnoreCaseAndIdNot(@Param("nom") String nom, @Param("id") Long id);



}