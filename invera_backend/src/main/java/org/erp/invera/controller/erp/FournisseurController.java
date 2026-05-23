package org.erp.invera.controller.erp;

import jakarta.servlet.http.HttpServletRequest;
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Contrôleur de gestion des fournisseurs (multi-tenant).
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
 * - GET    /search/matricule/{matricule} → Recherche par matricule fiscale
 * - GET    /check/matricule/{matricule} → Vérifier si matricule existe
 * - GET    /stats         → Statistiques (total, actifs/inactifs, par ville/pays)
 */
@RestController
@RequestMapping("/api/fournisseurs")
@RequiredArgsConstructor
@Slf4j
public class FournisseurController {

    private final FournisseurServices fournisseurServices;

    // ==================== METHODE UTILITAIRE ====================

    private String extractToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }

    // ==================== GET ALL ====================

    /**
     * Récupère tous les fournisseurs (y compris inactifs)
     */
    @GetMapping("/all")
    public ResponseEntity<?> getAllFournisseurs(HttpServletRequest request) {
        log.info("GET /api/fournisseurs/all - Récupération de tous les fournisseurs");

        String token = extractToken(request);
        if (token == null) {
            return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
        }

        try {
            List<FournisseurDTO> fournisseurs = fournisseurServices.getAllFournisseurs(token);
            return ResponseEntity.ok(fournisseurs);
        } catch (Exception e) {
            return errorResponse(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Récupère uniquement les fournisseurs actifs
     */
    @GetMapping("/active")
    public ResponseEntity<?> getActiveFournisseurs(HttpServletRequest request) {
        log.info("GET /api/fournisseurs/active - Récupération des fournisseurs actifs");

        String token = extractToken(request);
        if (token == null) {
            return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
        }

        try {
            List<FournisseurDTO> fournisseurs = fournisseurServices.getActiveFournisseurs(token);
            return ResponseEntity.ok(fournisseurs);
        } catch (Exception e) {
            return errorResponse(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Récupère uniquement les fournisseurs inactifs (soft delete)
     */
    @GetMapping("/inactive")
    public ResponseEntity<?> getInactiveFournisseurs(HttpServletRequest request) {
        log.info("GET /api/fournisseurs/inactive - Récupération des fournisseurs inactifs");

        String token = extractToken(request);
        if (token == null) {
            return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
        }

        try {
            List<FournisseurDTO> fournisseurs = fournisseurServices.getInactiveFournisseurs(token);
            return ResponseEntity.ok(fournisseurs);
        } catch (Exception e) {
            return errorResponse(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ==================== CREATE ====================

    /**
     * Crée un nouveau fournisseur
     */
    @PostMapping("/add")
    public ResponseEntity<?> createFournisseur(HttpServletRequest request,
                                               @Valid @RequestBody FournisseurDTO fournisseurDTO) {
        log.info("POST /api/fournisseurs/add - Création du fournisseur: {}", fournisseurDTO.getNomFournisseur());

        // Log détaillé AVANT validation
        log.debug("========== REQUÊTE CRÉATION FOURNISSEUR ==========");
        log.debug("nomFournisseur: '{}'", fournisseurDTO.getNomFournisseur());
        log.debug("email: '{}'", fournisseurDTO.getEmail());
        log.debug("telephone: '{}'", fournisseurDTO.getTelephone());
        log.debug("adresse: '{}'", fournisseurDTO.getAdresse());
        log.debug("ville: '{}'", fournisseurDTO.getVille());
        log.debug("pays: '{}'", fournisseurDTO.getPays());
        log.debug("matriculeFiscale: '{}'", fournisseurDTO.getMatriculeFiscale());
        log.debug("actif: {}", fournisseurDTO.getActif());
        log.debug("=================================================");

        String token = extractToken(request);
        if (token == null) {
            return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
        }

        try {
            // Vérification explicite de chaque champ
            List<String> errors = new ArrayList<>();

            if (fournisseurDTO.getNomFournisseur() == null || fournisseurDTO.getNomFournisseur().trim().isEmpty()) {
                errors.add("Le nom du fournisseur est obligatoire");
            }

            if (fournisseurDTO.getMatriculeFiscale() == null || fournisseurDTO.getMatriculeFiscale().trim().isEmpty()) {
                errors.add("Le matricule fiscal est obligatoire");
            }

            if (fournisseurDTO.getEmail() == null || fournisseurDTO.getEmail().trim().isEmpty()) {
                errors.add("L'email est obligatoire");
            }

            if (fournisseurDTO.getTelephone() == null || fournisseurDTO.getTelephone().trim().isEmpty()) {
                errors.add("Le téléphone est obligatoire");
            }

            if (fournisseurDTO.getAdresse() == null || fournisseurDTO.getAdresse().trim().isEmpty()) {
                errors.add("L'adresse est obligatoire");
            }

            if (fournisseurDTO.getVille() == null || fournisseurDTO.getVille().trim().isEmpty()) {
                errors.add("La ville est obligatoire");
            }

            if (fournisseurDTO.getPays() == null || fournisseurDTO.getPays().trim().isEmpty()) {
                errors.add("Le pays est obligatoire");
            }

            if (!errors.isEmpty()) {
                log.error("❌ Erreurs de validation: {}", errors);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("errors", errors);
                errorResponse.put("message", "Validation échouée");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            FournisseurDTO created = fournisseurServices.createFournisseur(
                    fournisseurDTO.getNomFournisseur(),
                    fournisseurDTO.getEmail(),
                    fournisseurDTO.getAdresse(),
                    fournisseurDTO.getTelephone(),
                    fournisseurDTO.getVille(),
                    fournisseurDTO.getPays(),
                    fournisseurDTO.getMatriculeFiscale(),
                    token
            );
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            log.error("Erreur métier: {}", e.getMessage());
            return errorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Erreur technique: ", e);
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Récupère un fournisseur par son ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getFournisseurById(HttpServletRequest request, @PathVariable Integer id) {
        log.info("GET /api/fournisseurs/{} - Récupération du fournisseur", id);

        String token = extractToken(request);
        if (token == null) {
            return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
        }

        try {
            FournisseurDTO fournisseur = fournisseurServices.getFournisseurById(id, token);
            return ResponseEntity.ok(fournisseur);
        } catch (RuntimeException e) {
            return errorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Récupère un fournisseur par son matricule fiscale
     */
    @GetMapping("/matricule/{matricule}")
    public ResponseEntity<?> getFournisseurByMatriculeFiscale(HttpServletRequest request, @PathVariable String matricule) {
        log.info("GET /api/fournisseurs/matricule/{} - Récupération du fournisseur par matricule", matricule);

        String token = extractToken(request);
        if (token == null) {
            return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
        }

        try {
            FournisseurDTO fournisseur = fournisseurServices.getFournisseurByMatriculeFiscale(matricule, token);
            return ResponseEntity.ok(fournisseur);
        } catch (RuntimeException e) {
            return errorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Vérifie si un matricule fiscale existe déjà
     */
    @GetMapping("/check/matricule/{matricule}")
    public ResponseEntity<?> checkMatriculeFiscaleExists(HttpServletRequest request, @PathVariable String matricule) {
        log.info("GET /api/fournisseurs/check/matricule/{} - Vérification matricule", matricule);

        String token = extractToken(request);
        if (token == null) {
            return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
        }

        try {
            boolean exists = fournisseurServices.checkMatriculeFiscaleExists(matricule, token);
            Map<String, Object> response = new HashMap<>();
            response.put("exists", exists);
            response.put("matriculeFiscale", matricule);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ==================== UPDATE ====================

    /**
     * Met à jour un fournisseur existant
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateFournisseur(
            HttpServletRequest request,
            @PathVariable Integer id,
            @Valid @RequestBody FournisseurDTO fournisseurDTO) {

        log.info("PUT /api/fournisseurs/{} - Mise à jour du fournisseur", id);

        String token = extractToken(request);
        if (token == null) {
            return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
        }

        try {
            FournisseurDTO updated = fournisseurServices.updateFournisseur(
                    id,
                    fournisseurDTO.getNomFournisseur(),
                    fournisseurDTO.getEmail(),
                    fournisseurDTO.getAdresse(),
                    fournisseurDTO.getTelephone(),
                    fournisseurDTO.getVille(),
                    fournisseurDTO.getPays(),
                    fournisseurDTO.getMatriculeFiscale(),
                    fournisseurDTO.getActif(),
                    token
            );
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return errorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ==================== SOFT DELETE (DÉSACTIVATION) ====================

    /**
     * Soft delete - Désactive un fournisseur
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> softDeleteFournisseur(HttpServletRequest request, @PathVariable Integer id) {
        log.info("DELETE /api/fournisseurs/{} - Désactivation du fournisseur", id);

        String token = extractToken(request);
        if (token == null) {
            return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
        }

        try {
            fournisseurServices.softDeleteFournisseur(id, token);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Fournisseur désactivé avec succès");
            response.put("status", "success");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return errorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ==================== REACTIVATION ====================

    /**
     * Réactive un fournisseur désactivé
     */
    @PatchMapping("/{id}/reactivate")
    public ResponseEntity<?> reactivateFournisseur(HttpServletRequest request, @PathVariable Integer id) {
        log.info("PATCH /api/fournisseurs/{}/reactivate - Réactivation du fournisseur", id);

        String token = extractToken(request);
        if (token == null) {
            return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
        }

        try {
            FournisseurDTO reactivated = fournisseurServices.reactivateFournisseur(id, token);
            return ResponseEntity.ok(reactivated);
        } catch (RuntimeException e) {
            return errorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ==================== SEARCH ====================

    /**
     * Recherche paginée des fournisseurs actifs
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchActiveFournisseurs(
            HttpServletRequest request,
            @RequestParam String term,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "nomFournisseur,asc") String[] sort) {

        log.info("GET /api/fournisseurs/search - Recherche: '{}', page: {}, size: {}", term, page, size);

        String token = extractToken(request);
        if (token == null) {
            return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
        }

        try {
            Sort.Direction direction = sort[1].equalsIgnoreCase("desc") ?
                    Sort.Direction.DESC : Sort.Direction.ASC;
            Sort sortObj = Sort.by(direction, sort[0]);
            Pageable pageable = PageRequest.of(page, size, sortObj);

            Page<FournisseurDTO> result = fournisseurServices.searchActiveFournisseurs(term, pageable, token);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ==================== STATISTIQUES ====================

    /**
     * Récupère les statistiques des fournisseurs
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getStats(HttpServletRequest request) {
        log.info("GET /api/fournisseurs/stats - Récupération des statistiques");

        String token = extractToken(request);
        if (token == null) {
            return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
        }

        try {
            Map<String, Object> stats = fournisseurServices.getStats(token);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ==================== METHODE D'ERREUR ====================

    private ResponseEntity<Map<String, String>> errorResponse(String message, HttpStatus status) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", message);
        errorResponse.put("status", String.valueOf(status.value()));
        return ResponseEntity.status(status).body(errorResponse);
    }
}