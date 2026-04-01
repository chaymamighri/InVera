package org.erp.invera.controller;

import org.erp.invera.model.Categorie;
import org.erp.invera.service.CategorieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
public class CategorieController {

    @Autowired
    private CategorieService categorieService;

    // GET - Récupérer toutes les catégories
    @GetMapping
    public ResponseEntity<List<Categorie>> getAllCategories() {
        List<Categorie> categories = categorieService.findAll();
        return ResponseEntity.ok(categories);
    }

    // GET - Récupérer une catégorie par ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getCategorieById(@PathVariable Integer id) {
        try {
            Categorie categorie = categorieService.findById(id);
            return ResponseEntity.ok(categorie);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    // POST - Créer une nouvelle catégorie
    @PostMapping
    public ResponseEntity<?> createCategorie(@RequestBody Categorie categorie) {
        try {
            Categorie savedCategorie = categorieService.save(categorie);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedCategorie);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    // DELETE - Supprimer une catégorie
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategorie(@PathVariable Integer id) {
        try {
            categorieService.deleteById(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Catégorie supprimée avec succès");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    // PUT - Mettre à jour une catégorie (NOUVEAU)
    @PutMapping("/{id}")  // ⚠️ Assurez-vous que cette annotation est présente
    public ResponseEntity<?> updateCategorie(@PathVariable Integer id, @RequestBody Categorie categorie) {
        try {
            Categorie updatedCategorie = categorieService.update(id, categorie);
            return ResponseEntity.ok(updatedCategorie);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    // GET - Rechercher des catégories
    @GetMapping("/search")
    public ResponseEntity<List<Categorie>> searchCategories(@RequestParam(required = false) String keyword) {
        List<Categorie> categories = categorieService.search(keyword);
        return ResponseEntity.ok(categories);
    }
}