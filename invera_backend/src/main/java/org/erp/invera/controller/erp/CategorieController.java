package org.erp.invera.controller.erp;

import jakarta.servlet.http.HttpServletRequest;
import org.erp.invera.model.erp.Categorie;
import org.erp.invera.service.erp.CategorieService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Contrôleur de gestion des catégories de produits (multi-tenant).
 *
 * Endpoints :
 * - GET    /                    → Liste de toutes les catégories
 * - GET    /{id}                → Détail d'une catégorie
 * - POST   /                    → Créer une nouvelle catégorie
 * - PUT    /{id}                → Modifier une catégorie
 * - DELETE /{id}                → Supprimer (uniquement si aucun produit associé)
 * - GET    /search?keyword=     → Rechercher par mot-clé
 *
 * Règles :
 * - Le nom de la catégorie est unique
 * - TVA par défaut : 19%
 * - Impossible de supprimer une catégorie contenant des produits
 */
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

    // ==================== ENDPOINTS ====================

    // GET - Récupérer toutes les catégories
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

    // GET - Récupérer une catégorie par ID
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

    // POST - Créer une nouvelle catégorie
    @PostMapping
    public ResponseEntity<?> createCategorie(HttpServletRequest request, @RequestBody Categorie categorie) {
        try {
            String token = extractToken(request);
            if (token == null) {
                return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
            }

            Categorie savedCategorie = categorieService.save(categorie, token);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedCategorie);
        } catch (RuntimeException e) {
            return errorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT - Mettre à jour une catégorie
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategorie(HttpServletRequest request,
                                             @PathVariable Integer id,
                                             @RequestBody Categorie categorie) {
        try {
            String token = extractToken(request);
            if (token == null) {
                return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
            }

            Categorie updatedCategorie = categorieService.update(id, categorie, token);
            return ResponseEntity.ok(updatedCategorie);
        } catch (RuntimeException e) {
            return errorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // DELETE - Supprimer une catégorie
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategorie(HttpServletRequest request, @PathVariable Integer id) {
        try {
            String token = extractToken(request);
            if (token == null) {
                return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
            }

            categorieService.deleteById(id, token);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Catégorie supprimée avec succès");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return errorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET - Rechercher des catégories
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

    // ==================== METHODE D'ERREUR ====================

    private ResponseEntity<Map<String, String>> errorResponse(String message, HttpStatus status) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", message);
        return ResponseEntity.status(status).body(errorResponse);
    }
}