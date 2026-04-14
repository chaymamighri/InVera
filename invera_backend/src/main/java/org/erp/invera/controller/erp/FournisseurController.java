package org.erp.invera.controller.erp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.erp.fournisseurdto.FournisseurDTO;
import org.erp.invera.service.erp.FournisseurServices;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


/**
 * Contrôleur de gestion des fournisseurs.
 *
 * Endpoints :
 * - GET    /all           → Tous les fournisseurs (actifs + inactifs)
 * - GET    /active        → Fournisseurs actifs uniquement
 * - GET    /inactive      → Fournisseurs inactifs
 * - POST   /add           → Créer un fournisseur
 * - PUT    /{id}          → Modifier un fournisseur
 * - DELETE /{id}          → Désactiver (soft delete)
 * - PATCH  /{id}/reactivate → Réactiver un fournisseur
 * - GET    /search        → Recherche paginée (fournisseurs actifs)
 * - GET    /search/all    → Recherche paginée (tous, admin)
 * - GET    /stats         → Statistiques (total, actifs/inactifs, par ville/pays)
 */
@RestController
@RequestMapping("/api/fournisseurs")
@RequiredArgsConstructor
@Slf4j
public class FournisseurController {

    private final FournisseurServices fournisseurServices;

    // ==================== GET ALL ====================

    /**
     * Récupère tous les fournisseurs (y compris inactifs)
     */
    @GetMapping("/all")
    public ResponseEntity<List<FournisseurDTO>> getAllFournisseurs() {
        log.info("GET /api/fournisseurs/all - Récupération de tous les fournisseurs");
        List<FournisseurDTO> fournisseurs = fournisseurServices.getAllFournisseurs();
        return ResponseEntity.ok(fournisseurs);
    }

    /**
     * Récupère uniquement les fournisseurs actifs
     */
    @GetMapping("/active")
    public ResponseEntity<List<FournisseurDTO>> getActiveFournisseurs() {
        log.info("GET /api/fournisseurs/active - Récupération des fournisseurs actifs");
        List<FournisseurDTO> fournisseurs = fournisseurServices.getActiveFournisseurs();
        return ResponseEntity.ok(fournisseurs);
    }

    /**
     * Récupère uniquement les fournisseurs inactifs (soft delete)
     */
    @GetMapping("/inactive")
    public ResponseEntity<List<FournisseurDTO>> getInactiveFournisseurs() {
        log.info("GET /api/fournisseurs/inactive - Récupération des fournisseurs inactifs");
        List<FournisseurDTO> fournisseurs = fournisseurServices.getInactiveFournisseurs();
        return ResponseEntity.ok(fournisseurs);
    }

    // ==================== CREATE ====================

    /**
     * Crée un nouveau fournisseur
     */
    @PostMapping("add")
    public ResponseEntity<FournisseurDTO> createFournisseur(@Valid @RequestBody FournisseurDTO fournisseurDTO) {
        log.info("POST /api/fournisseurs - Création du fournisseur: {}", fournisseurDTO.getNomFournisseur());

        FournisseurDTO created = fournisseurServices.createFournisseur(
                fournisseurDTO.getNomFournisseur(),
                fournisseurDTO.getEmail(),
                fournisseurDTO.getAdresse(),
                fournisseurDTO.getTelephone(),
                fournisseurDTO.getVille(),
                fournisseurDTO.getPays()
        );

        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    // ==================== UPDATE ====================

    /**
     * Met à jour un fournisseur existant
     */
    @PutMapping("/{id}")
    public ResponseEntity<FournisseurDTO> updateFournisseur(
            @PathVariable Integer id,
            @Valid @RequestBody FournisseurDTO fournisseurDTO) {

        log.info("PUT /api/fournisseurs/{} - Mise à jour du fournisseur", id);

        FournisseurDTO updated = fournisseurServices.updateFournisseur(
                id,
                fournisseurDTO.getNomFournisseur(),
                fournisseurDTO.getEmail(),
                fournisseurDTO.getAdresse(),
                fournisseurDTO.getTelephone(),
                fournisseurDTO.getVille(),
                fournisseurDTO.getPays(),
                fournisseurDTO.getActif()
        );

        return ResponseEntity.ok(updated);
    }

    // ==================== SOFT DELETE (DÉSACTIVATION) ====================

    /**
     * Soft delete - Désactive un fournisseur
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> softDeleteFournisseur(@PathVariable Integer id) {
        log.info("DELETE /api/fournisseurs/{} - Désactivation du fournisseur", id);

        fournisseurServices.softDeleteFournisseur(id);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Fournisseur désactivé avec succès");
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }
    // ==================== REACTIVATION ====================
    /**
     * Réactive un fournisseur désactivé
     */
    @PatchMapping("/{id}/reactivate")
    public ResponseEntity<FournisseurDTO> reactivateFournisseur(@PathVariable Integer id) {
        log.info("PATCH /api/fournisseurs/{}/reactivate - Réactivation du fournisseur", id);

        FournisseurDTO reactivated = fournisseurServices.reactivateFournisseur(id);
        return ResponseEntity.ok(reactivated);
    }

    // ==================== SEARCH ====================

    /**
     * Recherche paginée des fournisseurs actifs
     */
    @GetMapping("/search")
    public ResponseEntity<Page<FournisseurDTO>> searchActiveFournisseurs(
            @RequestParam String term,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "nomFournisseur,asc") String[] sort) {

        log.info("GET /api/fournisseurs/search - Recherche: '{}', page: {}, size: {}", term, page, size);

        Sort.Direction direction = sort[1].equalsIgnoreCase("desc") ?
                Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sortObj = Sort.by(direction, sort[0]);
        Pageable pageable = PageRequest.of(page, size, sortObj);

        Page<FournisseurDTO> result = fournisseurServices.searchActiveFournisseurs(term, pageable);
        return ResponseEntity.ok(result);
    }

    /**
     * Recherche paginée de tous les fournisseurs (admin)
     */
    @GetMapping("/search/all")
    public ResponseEntity<Page<FournisseurDTO>> searchAllFournisseurs(
            @RequestParam String term,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "nomFournisseur,asc") String[] sort) {

        log.info("GET /api/fournisseurs/search/all - Recherche admin: '{}', page: {}, size: {}", term, page, size);

        Sort.Direction direction = sort[1].equalsIgnoreCase("desc") ?
                Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sortObj = Sort.by(direction, sort[0]);
        Pageable pageable = PageRequest.of(page, size, sortObj);

        Page<FournisseurDTO> result = fournisseurServices.searchAllFournisseurs(term, pageable);
        return ResponseEntity.ok(result);
    }

    // ==================== STATISTIQUES ====================

    /**
     * Récupère les statistiques des fournisseurs
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        log.info("GET /api/fournisseurs/stats - Récupération des statistiques");
        Map<String, Object> stats = fournisseurServices.getStats();
        return ResponseEntity.ok(stats);
    }
}