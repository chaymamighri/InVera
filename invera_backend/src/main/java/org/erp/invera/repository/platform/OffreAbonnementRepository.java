package org.erp.invera.repository.platform;

import org.erp.invera.model.platform.OffreAbonnement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OffreAbonnementRepository extends JpaRepository<OffreAbonnement, Long> {

    List<OffreAbonnement> findByDeletedFalseOrderByCreatedAtDesc();

    List<OffreAbonnement> findByDeletedFalseAndActiveTrueOrderByPrixAsc();

    Optional<OffreAbonnement> findByIdAndDeletedFalse(Long id);

    boolean existsByNomIgnoreCaseAndTypeOffreAndDureeMoisAndDeletedFalse(
            String nom,
            OffreAbonnement.TypeOffre typeOffre,
            Integer dureeMois
    );
}
