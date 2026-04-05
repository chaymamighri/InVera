package org.erp.invera.repository;

import org.erp.invera.dto.FactureFournisseurDTO.FactureListeDTO;
import org.erp.invera.model.Fournisseurs.FactureFournisseur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FactureFournisseurRepository extends JpaRepository<FactureFournisseur, Integer> {

    // ========== MÉTHODES EXISTANTES ==========

    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM FactureFournisseur f WHERE f.commandeFournisseur.idCommandeFournisseur = :commandeId")
    boolean existsByCommandeFournisseurId(@Param("commandeId") Integer commandeId);

    @Query("SELECT f.idFactureFournisseur AS idFactureFournisseur, " +
            "f.referenceFactureFournisseur AS referenceFactureFournisseur, " +
            "f.dateFacture AS dateFacture, " +
            "f.montantTotal AS montantTotal, " +
            "f.statut AS statut, " +
            "four.nomFournisseur AS nomFournisseur, " +
            "four.email AS email, " +
            "c.numeroCommande AS numeroCommande, " +
            "c.dateCommande AS dateCommande " +
            "FROM FactureFournisseur f " +
            "LEFT JOIN f.commandeFournisseur c " +
            "LEFT JOIN c.fournisseur four")
    Page<FactureListeDTO> findAllFactureListe(Pageable pageable);

    @Query("SELECT DISTINCT f FROM FactureFournisseur f " +
            "LEFT JOIN FETCH f.commandeFournisseur c " +
            "LEFT JOIN FETCH c.fournisseur " +
            "LEFT JOIN FETCH c.lignesCommande l " +
            "LEFT JOIN FETCH l.produit p " +
            "WHERE f.idFactureFournisseur = :id")
    Optional<FactureFournisseur> findByIdWithDetails(@Param("id") Integer id);

    // ========== MÉTHODES POUR LES STATISTIQUES ==========



    /**
     * ✅ Compte les factures par statut spécifique
     */
    @Query("SELECT COUNT(f) FROM FactureFournisseur f WHERE f.statut = :statut")
    Long countByStatut(@Param("statut") FactureFournisseur.StatutFacture statut);

    /**
     * ✅ Compte les factures par statut (avec String)
     */
    default Long countByStatut(String statut) {
        try {
            FactureFournisseur.StatutFacture enumStatut = FactureFournisseur.StatutFacture.valueOf(statut);
            return countByStatut(enumStatut);
        } catch (IllegalArgumentException e) {
            return 0L;
        }
    }

    /**
     * ✅ Montant total de toutes les factures
     */
    @Query("SELECT COALESCE(SUM(f.montantTotal), 0) FROM FactureFournisseur f")
    Double sumMontantTotal();

    /**
     * ✅ Montant total des factures sur une période (avec LocalDate)
     */
    @Query("SELECT COALESCE(SUM(f.montantTotal), 0) FROM FactureFournisseur f WHERE DATE(f.dateFacture) BETWEEN :debut AND :fin")
    Double sumMontantByDateBetween(@Param("debut") LocalDateTime debut, @Param("fin") LocalDateTime fin);

}