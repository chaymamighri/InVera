package org.erp.invera.controller.erp;

import org.erp.invera.dto.erp.Produitdto.ProduitDTO;
import org.erp.invera.model.erp.Categorie;
import org.erp.invera.model.erp.Produit;
import org.erp.invera.service.erp.ProduitService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Contrôleur de gestion des produits.
 *
 * Endpoints :
 * - POST   /add                    → Ajouter un produit (avec image et prix par fournisseur)
 * - GET    /all                    → Tous les produits
 * - GET    /actifs                 → Produits actifs uniquement
 * - GET    /{id}                   → Détail d'un produit
 * - PUT    /update/{id}            → Modifier un produit
 * - DELETE /delete/{id}            → Désactiver un produit (soft delete)
 * - PATCH  /{id}/reactiver         → Réactiver un produit
 * - GET    /search                 → Rechercher (mot-clé, statut, catégorie)
 * - GET    /categorie/{id}         → Produits par catégorie
 * - GET    /low-stock              → Produits en stock faible
 * - PATCH  /{id}/stock             → Mettre à jour la quantité
 * - GET    /{id}/verifier-disponibilite → Vérifier disponibilité
 * - GET    /{id}/fournisseurs      → Récupérer les fournisseurs d'un produit avec leurs prix
 * - PUT    /{id}/fournisseurs      → Mettre à jour les fournisseurs d'un produit
 * - PUT    /{id}/fournisseur/{fournisseurId}/prix → Mettre à jour le prix d'un fournisseur
 */
@RestController
@RequestMapping("/api/produits")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class ProduitController {

    private final ProduitService produitService;
    private static final String UPLOAD_DIR = "uploads/produits";

    public ProduitController(ProduitService produitService) {
        this.produitService = produitService;
    }

    // ==== function to save image
    private String saveImage(MultipartFile image) throws IOException {
        if (image == null || image.isEmpty()) {
            return null;
        }

        String contentType = image.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IOException("Fichier invalide. Seules les images sont autorisées.");
        }

        Path uploadPath = Paths.get(UPLOAD_DIR).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);

        String originalFileName = StringUtils.cleanPath(
                Objects.requireNonNull(image.getOriginalFilename())
        );

        String extension = "";
        int dotIndex = originalFileName.lastIndexOf(".");
        if (dotIndex > 0) {
            extension = originalFileName.substring(dotIndex);
        }

        String fileName = UUID.randomUUID().toString() + extension;
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(image.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/produits/" + fileName;
    }

    /**
     * Ajouter un nouveau produit (avec image via FormData)
     * ✅ CORRIGÉ : Un seul fournisseur et un seul prix d'achat
     */
    @PostMapping(value = "/add", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> addProduct(
            @RequestParam("libelle") String libelle,
            @RequestParam("prixVente") Double prixVente,
            @RequestParam("categorieId") Integer categorieId,
            @RequestParam(value = "quantiteStock", defaultValue = "0") Integer quantiteStock,
            @RequestParam(value = "seuilMinimum", defaultValue = "10") Integer seuilMinimum,
            @RequestParam(value = "uniteMesure", defaultValue = "PIECE") String uniteMesure,
            @RequestParam(value = "remiseTemporaire", required = false) Double remiseTemporaire,
            @RequestParam(value = "active", defaultValue = "true") Boolean active,
            @RequestParam(value = "fournisseurId", required = false) Integer fournisseurId,  // ✅ Un seul fournisseur
            @RequestParam(value = "prixAchat", required = false) BigDecimal prixAchat,       // ✅ Un seul prix
            @RequestPart(value = "image", required = false) MultipartFile image) {

        try {
            System.out.println("📦 fournisseurId reçu: " + fournisseurId);
            System.out.println("💰 prixAchat reçu: " + prixAchat);

            Produit produit = new Produit();
            produit.setLibelle(libelle);
            produit.setPrixVente(prixVente);
            // ❌ Plus de prixAchat global ici (sera défini par le service)
            produit.setQuantiteStock(quantiteStock);
            produit.setSeuilMinimum(seuilMinimum);

            // Conversion UniteMesure (String -> Enum)
            try {
                String uniteUpper = uniteMesure.toUpperCase();
                if (uniteUpper.equals("PIÈCE") || uniteUpper.equals("PIECE")) {
                    produit.setUniteMesure(Produit.UniteMesure.PIECE);
                } else if (uniteUpper.equals("KG") || uniteUpper.equals("KILOGRAMME")) {
                    produit.setUniteMesure(Produit.UniteMesure.KILOGRAMME);
                } else if (uniteUpper.equals("L") || uniteUpper.equals("LITRE")) {
                    produit.setUniteMesure(Produit.UniteMesure.LITRE);
                } else if (uniteUpper.equals("M") || uniteUpper.equals("METRE")) {
                    produit.setUniteMesure(Produit.UniteMesure.METRE);
                } else {
                    produit.setUniteMesure(Produit.UniteMesure.PIECE);
                }
            } catch (Exception e) {
                return errorResponse("Unité de mesure invalide", HttpStatus.BAD_REQUEST);
            }

            if (remiseTemporaire != null) {
                produit.setRemiseTemporaire(remiseTemporaire);
            }

            produit.setActive(active);

            Categorie categorie = new Categorie();
            categorie.setIdCategorie(categorieId);
            produit.setCategorie(categorie);

            if (image != null && !image.isEmpty()) {
                String imageUrl = saveImage(image);
                produit.setImageUrl(imageUrl);
            }

            // ✅ Appel du service avec un seul fournisseur et un seul prix
            Produit createdProduit = produitService.createProduit(produit, fournisseurId, prixAchat);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Produit ajouté avec succès");
            response.put("produit", createdProduit);
            response.put("fournisseurId", fournisseurId);
            response.put("prixAchat", prixAchat);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            e.printStackTrace();
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.BAD_REQUEST);
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
     * Récupérer les produits actifs
     */
    @GetMapping("/actifs")
    public ResponseEntity<Map<String, Object>> getActiveProducts() {
        try {
            List<Produit> produits = produitService.getProduitsActifs();

            List<ProduitDTO> produitsDTO = produits.stream()
                    .map(ProduitDTO::fromEntity)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", produitsDTO);
            response.put("total", produitsDTO.size());
            response.put("message", produitsDTO.size() + " produits actifs trouvés");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Récupérer un produit avec son fournisseur
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getProduitById(@PathVariable Integer id) {
        try {
            Produit produit = produitService.getProduitByIdWithFournisseur(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("produit", produit);

            // ✅ Ajouter le fournisseur (un seul)
            if (produit.getFournisseur() != null) {
                Map<String, Object> fournisseurMap = new HashMap<>();
                fournisseurMap.put("idFournisseur", produit.getFournisseur().getIdFournisseur());
                fournisseurMap.put("nomFournisseur", produit.getFournisseur().getNomFournisseur());
                fournisseurMap.put("email", produit.getFournisseur().getEmail());
                fournisseurMap.put("telephone", produit.getFournisseur().getTelephone());
                fournisseurMap.put("adresse", produit.getFournisseur().getAdresse());
                fournisseurMap.put("ville", produit.getFournisseur().getVille());
                fournisseurMap.put("prixAchat", produit.getPrixAchat());
                response.put("fournisseur", fournisseurMap);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Modifier un produit
     * ✅ CORRIGÉ : Un seul fournisseur et un seul prix d'achat
     */
    @PutMapping(value = "/update/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> updateProduct(
            @PathVariable Integer id,
            @RequestParam(required = false) String libelle,
            @RequestParam(required = false) Double prixVente,
            @RequestParam(required = false) Integer categorieId,
            @RequestParam(required = false) Integer quantiteStock,
            @RequestParam(required = false) Integer seuilMinimum,
            @RequestParam(required = false) String uniteMesure,
            @RequestParam(required = false) Double remiseTemporaire,
            @RequestParam(required = false) Boolean active,
            @RequestParam(value = "fournisseurId", required = false) Integer fournisseurId,  // ✅ Un seul
            @RequestParam(value = "prixAchat", required = false) BigDecimal prixAchat,       // ✅ Un seul
            @RequestPart(value = "image", required = false) MultipartFile image) {

        try {
            Produit produit = produitService.getProduitById(id)
                    .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

            // Mettre à jour les champs
            if (libelle != null) produit.setLibelle(libelle);
            if (prixVente != null) produit.setPrixVente(prixVente);
            if (quantiteStock != null) produit.setQuantiteStock(quantiteStock);
            if (seuilMinimum != null) produit.setSeuilMinimum(seuilMinimum);
            if (active != null) produit.setActive(active);
            if (remiseTemporaire != null) produit.setRemiseTemporaire(remiseTemporaire);

            if (categorieId != null) {
                Categorie categorie = new Categorie();
                categorie.setIdCategorie(categorieId);
                produit.setCategorie(categorie);
            }

            if (uniteMesure != null && !uniteMesure.isEmpty()) {
                try {
                    Produit.UniteMesure unite = Produit.UniteMesure.valueOf(uniteMesure.toUpperCase());
                    produit.setUniteMesure(unite);
                } catch (IllegalArgumentException e) {
                    return errorResponse("Unité de mesure invalide", HttpStatus.BAD_REQUEST);
                }
            }

            if (image != null && !image.isEmpty()) {
                if (produit.getImageUrl() != null) {
                    try {
                        Path oldImagePath = Paths.get(UPLOAD_DIR)
                                .resolve(Paths.get(produit.getImageUrl()).getFileName());
                        Files.deleteIfExists(oldImagePath);
                    } catch (Exception e) {
                        System.err.println("Impossible de supprimer l'ancienne image: " + e.getMessage());
                    }
                }
                String imageUrl = saveImage(image);
                produit.setImageUrl(imageUrl);
            }

            // ✅ Appel du service avec un seul fournisseur et un seul prix
            Produit updatedProduit = produitService.updateProduit(id, produit, fournisseurId, prixAchat);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Produit mis à jour avec succès");
            response.put("produit", updatedProduit);
            response.put("fournisseurId", fournisseurId);
            response.put("prixAchat", prixAchat);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return errorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            e.printStackTrace();
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Récupérer le fournisseur d'un produit
     */
    @GetMapping("/{id}/fournisseur")
    public ResponseEntity<?> getFournisseurByProduit(@PathVariable Integer id) {
        try {
            Produit produit = produitService.getProduitByIdWithFournisseur(id);

            if (produit.getFournisseur() == null) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "fournisseur", null,
                        "message", "Ce produit n'a pas de fournisseur associé"
                ));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("idFournisseur", produit.getFournisseur().getIdFournisseur());
            result.put("nomFournisseur", produit.getFournisseur().getNomFournisseur());
            result.put("email", produit.getFournisseur().getEmail());
            result.put("telephone", produit.getFournisseur().getTelephone());
            result.put("prixAchat", produit.getPrixAchat());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "fournisseur", result
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
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
     * Rechercher des produits et récupère les produits avec filtre
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchProduits(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Produit.StockStatus status,
            @RequestParam(required = false) Integer categorieId,
            @RequestParam(required = false) Boolean actif) {

        try {
            List<Produit> produits = produitService.searchProduits(keyword, status, categorieId, actif);

            List<ProduitDTO> produitsDTO = produits.stream()
                    .map(ProduitDTO::fromEntity)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", produitsDTO.size());
            response.put("produits", produitsDTO);

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