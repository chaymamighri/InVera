package org.erp.invera.repository.erp;

import org.erp.invera.model.erp.Fournisseurs.Fournisseur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FournisseurRepository extends JpaRepository<Fournisseur, Integer> {

    // Recherche par email (pour vérifier les doublons)
    Optional<Fournisseur> findByEmail(String email);

    // Récupérer uniquement les fournisseurs actifs
    List<Fournisseur> findByActifTrue();

    List<Fournisseur> findByActifFalse();

    // Récupérer par ID seulement si actif
    // CORRECTION : Utiliser idFournisseur au lieu de id
    Optional<Fournisseur> findByIdFournisseurAndActifTrue(Integer idFournisseur);

    // Compter les fournisseurs actifs
    long countByActifTrue();

    // Recherche avec filtre actif par défaut
    @Query("SELECT f FROM Fournisseur f WHERE " +
            "f.actif = true AND (" +
            "LOWER(f.nomFournisseur) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(f.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(f.ville) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(f.pays) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Fournisseur> searchActive(@Param("search") String search, Pageable pageable);

    // Recherche sans filtre actif (pour admin)
    @Query("SELECT f FROM Fournisseur f WHERE " +
            "LOWER(f.nomFournisseur) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(f.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(f.ville) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(f.pays) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Fournisseur> searchAll(@Param("search") String search, Pageable pageable);

    // Statistiques
    @Query("SELECT COUNT(f) FROM Fournisseur f WHERE f.actif = true")
    long countActive();

    @Query("SELECT f.ville, COUNT(f) FROM Fournisseur f WHERE f.actif = true GROUP BY f.ville")
    List<Object[]> countByVille();

    @Query("SELECT f.pays, COUNT(f) FROM Fournisseur f WHERE f.actif = true GROUP BY f.pays")
    List<Object[]> countByPays();
}