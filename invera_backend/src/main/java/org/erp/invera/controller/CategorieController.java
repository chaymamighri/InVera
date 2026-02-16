package org.erp.invera.controller;

import org.erp.invera.model.Categorie;
import org.erp.invera.service.CategorieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class CategorieController {

    @Autowired
    private CategorieService categorieService;

    // ===== CRUD CATÉGORIES =====

    /**
     * Ajouter une nouvelle catégorie (admin seulement)
     */
    @PostMapping("/add")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> addCategorie(@RequestBody Categorie categorie) {
        try {
            Categorie savedCategorie = categorieService.save(categorie);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Catégorie ajoutée avec succès");
            response.put("categorie", savedCategorie);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    /**
     * Récupérer toutes les catégories (admin et commercial)
     */
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMMERCIAL')")
    public ResponseEntity<Map<String, Object>> getAllCategories() {
        try {
            List<Categorie> categories = categorieService.findAll();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", categories.size());
            response.put("categories", categories);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Récupérer une catégorie par ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMMERCIAL')")
    public ResponseEntity<Map<String, Object>> getCategorieById(@PathVariable Integer id) {
        try {
            Categorie categorie = categorieService.findById(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("categorie", categorie);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    /**
     * Mettre à jour une catégorie (admin seulement)
     */
    @PutMapping("/update/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updateCategorie(
            @PathVariable Integer id,
            @RequestBody Categorie categorieDetails) {
        try {
            Categorie updatedCategorie = categorieService.update(id, categorieDetails);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Catégorie mise à jour avec succès");
            response.put("categorie", updatedCategorie);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    /**
     * Supprimer une catégorie (admin seulement)
     */
    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteCategorie(@PathVariable Integer id) {
        try {
            categorieService.deleteById(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Catégorie supprimée avec succès");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    /**
     * Rechercher des catégories par nom
     */
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMMERCIAL')")
    public ResponseEntity<Map<String, Object>> searchCategories(
            @RequestParam(required = false) String keyword) {
        try {
            List<Categorie> categories = categorieService.search(keyword);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", categories.size());
            response.put("categories", categories);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}