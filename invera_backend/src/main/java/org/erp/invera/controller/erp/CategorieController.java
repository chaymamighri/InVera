package org.erp.invera.controller.erp;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.erp.Categorie;
import org.erp.invera.service.erp.CategorieService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/categories")
public class CategorieController {

    private final CategorieService categorieService;

    public CategorieController(CategorieService categorieService) {
        this.categorieService = categorieService;
    }

    // ==================== METHODE UTILITAIRE ====================

    private String extractToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }

    private ResponseEntity<Map<String, Object>> successResponse(String message, Object data) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    private ResponseEntity<Map<String, Object>> successResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        return ResponseEntity.ok(response);
    }

    private ResponseEntity<Map<String, String>> errorResponse(String message, HttpStatus status) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("success", "false");
        errorResponse.put("error", message);
        return ResponseEntity.status(status).body(errorResponse);
    }

    // ==================== ENDPOINTS ====================

    /**
     * GET /api/categories
     * Récupérer toutes les catégories
     */
    @GetMapping
    public ResponseEntity<?> getAllCategories(HttpServletRequest request) {
        try {
            String token = extractToken(request);
            if (token == null) {
                return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
            }

            List<Categorie> categories = categorieService.findAll(token);
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * GET /api/categories/{id}
     * Récupérer une catégorie par ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getCategorieById(HttpServletRequest request, @PathVariable Integer id) {
        try {
            String token = extractToken(request);
            if (token == null) {
                return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
            }

            Categorie categorie = categorieService.findById(id, token);
            return ResponseEntity.ok(categorie);
        } catch (RuntimeException e) {
            return errorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * POST /api/categories
     * Créer une nouvelle catégorie
     * Body: { "nomCategorie": "Électronique", "description": "...", "tauxTVA": 19 }
     */
    // Dans CategorieController.java
    @PostMapping
    public ResponseEntity<?> createCategorie(HttpServletRequest request, @RequestBody Categorie categorie) {
        try {
            log.info("🔵 CONTROLLER - Début création catégorie");

            String token = extractToken(request);
            log.info("🔵 CONTROLLER - Token extrait: {}", token != null ? "PRESENT" : "NULL");

            if (token == null) {
                return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
            }

            log.info("🔵 CONTROLLER - Appel service save...");
            Categorie savedCategorie = categorieService.save(categorie, token);
            log.info("🔵 CONTROLLER - Catégorie sauvegardée avec ID: {}", savedCategorie.getIdCategorie());

            return ResponseEntity.status(HttpStatus.CREATED).body(savedCategorie);

        } catch (Exception e) {
            log.error("🔴 CONTROLLER - Erreur: {}", e.getMessage(), e);
            return errorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * PUT /api/categories/{id}
     * Mettre à jour une catégorie
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategorie(HttpServletRequest request,
                                             @PathVariable Integer id,
                                             @RequestBody Categorie categorie) {
        try {
            String token = extractToken(request);
            if (token == null) {
                return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
            }

            // Validation
            if (categorie.getNomCategorie() == null || categorie.getNomCategorie().trim().isEmpty()) {
                return errorResponse("Le nom de la catégorie est requis", HttpStatus.BAD_REQUEST);
            }

            Categorie updatedCategorie = categorieService.update(id, categorie, token);
            return ResponseEntity.ok(updatedCategorie);

        } catch (RuntimeException e) {
            return errorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * DELETE /api/categories/{id}
     * Supprimer une catégorie
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategorie(HttpServletRequest request, @PathVariable Integer id) {
        try {
            String token = extractToken(request);
            if (token == null) {
                return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
            }

            categorieService.deleteById(id, token);

            Map<String, String> response = new HashMap<>();
            response.put("success", "true");
            response.put("message", "Catégorie supprimée avec succès");
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return errorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * GET /api/categories/search?keyword=xxx
     * Rechercher des catégories par mot-clé
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchCategories(HttpServletRequest request,
                                              @RequestParam(required = false) String keyword) {
        try {
            String token = extractToken(request);
            if (token == null) {
                return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
            }

            List<Categorie> categories = categorieService.search(keyword, token);
            return ResponseEntity.ok(categories);

        } catch (Exception e) {
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}