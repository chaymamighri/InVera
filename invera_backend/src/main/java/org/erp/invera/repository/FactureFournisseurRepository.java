package org.erp.invera.repository;

import org.erp.invera.dto.FactureFournisseurDTO.FactureListeDTO;
import org.erp.invera.model.Fournisseurs.FactureFournisseur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FactureFournisseurRepository extends JpaRepository<FactureFournisseur, Integer> {

    // ✅ Vérification existence
    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM FactureFournisseur f WHERE f.commandeFournisseur.idCommandeFournisseur = :commandeId")
    boolean existsByCommandeFournisseurId(@Param("commandeId") Integer commandeId);

    // ✅ Liste paginée avec interface DTO (SANS constructeur)
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

    // ✅ Pour le détail d'une facture (AVEC les lignes)
    @Query("SELECT DISTINCT f FROM FactureFournisseur f " +
            "LEFT JOIN FETCH f.commandeFournisseur c " +
            "LEFT JOIN FETCH c.fournisseur " +
            "LEFT JOIN FETCH c.lignesCommande l " +
            "LEFT JOIN FETCH l.produit p " +
            "WHERE f.idFactureFournisseur = :id")
    Optional<FactureFournisseur> findByIdWithDetails(@Param("id") Integer id);
}