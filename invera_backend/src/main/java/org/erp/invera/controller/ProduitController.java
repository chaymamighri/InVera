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
@RequestMapping("/api/produits")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class ProduitController {

    private final ProduitService produitService;

    public ProduitController(ProduitService produitService) {
        this.produitService = produitService;
    }

    /**
     * Ajouter un nouveau produit
     */
    @PostMapping("/add")
    public ResponseEntity<Map<String, Object>> addProduct(@RequestBody Produit produit) {
        try {
            // Validation de base
            if (produit.getLibelle() == null || produit.getLibelle().trim().isEmpty()) {
                return errorResponse("Le libellé du produit est requis", HttpStatus.BAD_REQUEST);
            }

            if (produit.getCategorie() == null || produit.getCategorie().getIdCategorie() == null) {
                return errorResponse("La catégorie du produit est requise", HttpStatus.BAD_REQUEST);
            }

            if (produit.getPrixVente() == null || produit.getPrixVente() <= 0) {
                return errorResponse("Le prix de vente doit être supérieur à 0", HttpStatus.BAD_REQUEST);
            }

            // Initialisation des valeurs par défaut
            if (produit.getQuantiteStock() == null) produit.setQuantiteStock(0);
            if (produit.getSeuilMinimum() == null) produit.setSeuilMinimum(10);
            if (produit.getActive() == null) produit.setActive(true);
            if (produit.getRemiseTemporaire() == null) produit.setRemiseTemporaire(0.0);

            Produit createdProduit = produitService.createProduit(produit);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Produit ajouté avec succès");
            response.put("produit", createdProduit);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return errorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return errorResponse("Erreur lors de l'ajout du produit: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Récupérer tous les produits
     */
    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> getAllProducts() {
        try {
            List<Produit> produits = produitService.getAllProduits();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", produits.size());
            response.put("produits", produits);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return errorResponse("Erreur lors de la récupération des produits: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Récupérer un produit par son ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getProductById(@PathVariable Integer id) {
        return produitService.getProduitById(id)
                .map(produit -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("produit", produit);
                    return ResponseEntity.ok(response);
                })
                .orElse(errorResponse("Produit non trouvé avec l'ID: " + id, HttpStatus.NOT_FOUND));
    }

    /**
     * Modifier un produit
     */
    @PutMapping("/update/{id}")
    public ResponseEntity<Map<String, Object>> updateProduct(@PathVariable Integer id, @RequestBody Produit produit) {
        try {
            // Validation des données modifiables
            if (produit.getPrixVente() != null && produit.getPrixVente() <= 0) {
                return errorResponse("Le prix de vente doit être supérieur à 0", HttpStatus.BAD_REQUEST);
            }

            if (produit.getSeuilMinimum() != null && produit.getSeuilMinimum() < 0) {
                return errorResponse("Le seuil minimum doit être positif", HttpStatus.BAD_REQUEST);
            }

            Produit updatedProduit = produitService.updateProduit(id, produit);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Produit mis à jour avec succès");
            response.put("produit", updatedProduit);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return errorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return errorResponse("Erreur lors de la mise à jour: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Supprimer (désactiver) un produit - SOFT DELETE
     */
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Map<String, Object>> deleteProduct(@PathVariable Integer id) {
        try {
            produitService.desactiverProduit(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Produit désactivé avec succès");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return errorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return errorResponse("Erreur lors de la désactivation: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    /**
     * Réactiver un produit (soft delete inverse)
     */
    @PatchMapping("/{id}/reactiver")
    public ResponseEntity<Map<String, Object>> reactiverProduit(@PathVariable Integer id) {
        try {
            Produit produit = produitService.reactiverProduit(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Produit réactivé avec succès");
            response.put("produit", produit);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return errorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return errorResponse("Erreur lors de la réactivation: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    /**
     * Rechercher des produits
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchProduits(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Produit.StockStatus status,
            @RequestParam(required = false) Integer categorieId,
            @RequestParam(required = false) Boolean actif) {

        try {
            List<Produit> produits = produitService.searchProduits(keyword, status, categorieId, actif);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", produits.size());
            response.put("produits", produits);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return errorResponse("Erreur lors de la recherche: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Récupérer les produits par catégorie
     */
    @GetMapping("/categorie/{categorieId}")
    public ResponseEntity<Map<String, Object>> getProductsByCategorie(@PathVariable Integer categorieId) {
        try {
            List<Produit> produits = produitService.getProduitsByCategorie(categorieId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", produits.size());
            response.put("categorieId", categorieId);
            response.put("produits", produits);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return errorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return errorResponse("Erreur lors de la récupération: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Récupérer les produits en stock faible
     */
    @GetMapping("/low-stock")
    public ResponseEntity<Map<String, Object>> getLowStockProducts() {
        try {
            List<Produit> produits = produitService.getLowStockProduits();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", produits.size());
            response.put("produits", produits);
            response.put("message", produits.isEmpty() ?
                    "Aucun produit en stock faible" :
                    "Produits avec stock faible récupérés avec succès");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return errorResponse("Erreur lors de la récupération: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Mettre à jour le stock d'un produit
     */
    @PatchMapping("/{id}/stock")
    public ResponseEntity<Map<String, Object>> updateStock(
            @PathVariable Integer id,
            @RequestParam Integer quantite) {
        try {
            if (quantite < 0) {
                return errorResponse("La quantité ne peut pas être négative", HttpStatus.BAD_REQUEST);
            }

            Produit updatedProduit = produitService.updateStock(id, quantite);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Stock mis à jour avec succès");
            response.put("produit", updatedProduit);
            response.put("nouveauStock", updatedProduit.getQuantiteStock());
            response.put("status", updatedProduit.getStatus());

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return errorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return errorResponse("Erreur lors de la mise à jour du stock: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Vérifier la disponibilité d'un produit
     */
    @GetMapping("/{id}/verifier-disponibilite")
    public ResponseEntity<Map<String, Object>> verifierDisponibilite(
            @PathVariable Integer id,
            @RequestParam Integer quantite) {
        try {
            if (quantite <= 0) {
                return errorResponse("La quantité doit être positive", HttpStatus.BAD_REQUEST);
            }

            boolean disponible = produitService.verifierDisponibilite(id, quantite);
            Produit produit = produitService.getProduitById(id).orElseThrow();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("disponible", disponible);
            response.put("produitId", id);
            response.put("produitLibelle", produit.getLibelle());
            response.put("quantiteDemandee", quantite);
            response.put("quantiteDisponible", produit.getQuantiteStock());
            response.put("message", disponible ?
                    "Produit disponible en quantité suffisante" :
                    "Stock insuffisant pour la quantité demandée");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return errorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return errorResponse("Erreur lors de la vérification: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Méthode utilitaire pour les réponses d'erreur
     */
    private ResponseEntity<Map<String, Object>> errorResponse(String message, HttpStatus status) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("message", message);
        errorResponse.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.status(status).body(errorResponse);
    }
}