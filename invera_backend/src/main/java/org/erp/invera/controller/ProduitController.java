package org.erp.invera.controller;

import org.erp.invera.model.Produit;
import org.erp.invera.service.ProduitService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/product")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class ProduitController {

    private final ProduitService produitService;

    public ProduitController(ProduitService produitService) {
        this.produitService = produitService;
    }
    @PostMapping("/addproduct")
    public ResponseEntity<Map<String, Object>> addProduct(@RequestBody Produit produit) {
        try {
            Produit createdProduit = produitService.createProduit(produit);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Produit ajouté avec succès");
            response.put("produit", createdProduit);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur lors de l'ajout du produit: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/getallproduct")
    public ResponseEntity<Map<String, Object>> getAllProduct() {
        try {
            List<Produit> produits = produitService.getAllProduits();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", produits.size());
            response.put("produits", produits);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur lors de la récupération des produits: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/getproductbyid/{id}")
    public ResponseEntity<Map<String, Object>> getProductById(@PathVariable Integer id) {
        return produitService.getProduitById(id)
                .map(produit -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("produit", produit);
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "success", false,
                                "message", "Produit non trouvé avec l'ID: " + id
                        )));
    }

    @PutMapping("/updateproduct/{id}")
    public ResponseEntity<Map<String, Object>> updateProduct(@PathVariable Integer id, @RequestBody Produit produit) {
        try {
            Produit updatedProduit = produitService.updateProduit(id, produit);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Produit mis à jour avec succès");
            response.put("produit", updatedProduit);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Produit non trouvé avec l'ID: " + id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur lors de la mise à jour: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/deleteproduct/{id}")
    public ResponseEntity<Map<String, Object>> deleteProduct(@PathVariable Integer id) {
        try {
            produitService.deleteProduit(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Produit supprimé avec succès");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Produit non trouvé avec l'ID: " + id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur lors de la suppression: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // Endpoints pour chercher un produit
    @GetMapping("/search")
    public ResponseEntity<List<Produit>> searchProduits(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Produit.StockStatus status,
            @RequestParam(required = false) String categorie) {

        List<Produit> produits = produitService.searchProduits(keyword, status, categorie);
        return ResponseEntity.ok(produits);
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<Produit>> getLowStockProduits() {
        List<Produit> produits = produitService.getLowStockProduits();
        return ResponseEntity.ok(produits);
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<Produit> updateStock(
            @PathVariable Integer id,
            @RequestParam Integer quantite) {

        Produit updatedProduit = produitService.updateStock(id, quantite);
        return ResponseEntity.ok(updatedProduit);
    }

    @GetMapping("/{id}/remises")
    public ResponseEntity<Map<String, Object>> getRemisesForProduit(@PathVariable Integer id) {
        return produitService.getProduitById(id)
                .map(produit -> {
                    Map<String, Object> remises = new HashMap<>();
                    remises.put("remiseParticulier", produit.getRemiseParticulier());
                    remises.put("remiseVIP", produit.getRemiseVIP());
                    remises.put("remiseProfessionnelle", produit.getRemiseProfessionnelle());
                    remises.put("remiseTemporaire", produit.getRemiseTemporaire());

                    return ResponseEntity.ok(remises);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

