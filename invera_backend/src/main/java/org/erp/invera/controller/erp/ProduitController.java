package org.erp.invera.controller.erp;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.erp.Produitdto.ProduitDTO;
import org.erp.invera.model.erp.Categorie;
import org.erp.invera.model.erp.Produit;
import org.erp.invera.security.JwtTokenProvider;
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

@Slf4j
@RestController
@RequestMapping("/api/produits")
public class ProduitController {

    private final ProduitService produitService;
    private static final String UPLOAD_DIR = "uploads";

    public ProduitController(ProduitService produitService) {
        this.produitService = produitService;
    }

    // ==================== METHODE UTILITAIRE ====================

    private String extractToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
    private String saveImage(MultipartFile image) throws IOException {
        if (image == null || image.isEmpty()) {
            return null;
        }

        String contentType = image.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IOException("Fichier invalide. Seules les images sont autorisées.");
        }

        Path uploadPath = Paths.get(UPLOAD_DIR).toAbsolutePath().normalize();
        Path produitsPath = uploadPath.resolve("produits");

        if (!Files.exists(produitsPath)) {
            Files.createDirectories(produitsPath);
        }

        String originalFileName = StringUtils.cleanPath(
                Objects.requireNonNull(image.getOriginalFilename())
        );

        String extension = "";
        int dotIndex = originalFileName.lastIndexOf(".");
        if (dotIndex > 0) {
            extension = originalFileName.substring(dotIndex);
        }

        String fileName = UUID.randomUUID().toString() + extension;
        Path filePath = produitsPath.resolve(fileName);
        Files.copy(image.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // ✅ Stocker le chemin complet
        return "uploads/produits/" + fileName;
    }

    private ResponseEntity<Map<String, Object>> errorResponse(String message, HttpStatus status) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("message", message);
        errorResponse.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.status(status).body(errorResponse);
    }

    // ==================== ENDPOINTS ====================

    @PostMapping(value = "/add", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> addProduct(
            HttpServletRequest request,
            @RequestParam("libelle") String libelle,
            @RequestParam("prixVente") Double prixVente,
            @RequestParam("categorieId") Integer categorieId,
            @RequestParam(value = "quantiteStock", defaultValue = "0") Integer quantiteStock,
            @RequestParam(value = "seuilMinimum", defaultValue = "10") Integer seuilMinimum,
            @RequestParam(value = "uniteMesure", defaultValue = "PIECE") String uniteMesure,
            @RequestParam(value = "remiseTemporaire", required = false) Double remiseTemporaire,
            @RequestParam(value = "active", defaultValue = "true") Boolean active,
            @RequestParam(value = "fournisseurId", required = false) Integer fournisseurId,
            @RequestParam(value = "prixAchat", required = false) BigDecimal prixAchat,
            @RequestPart(value = "image", required = false) MultipartFile image) {

        try {
            String token = extractToken(request);
            if (token == null) {
                return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
            }

            Produit produit = new Produit();
            produit.setLibelle(libelle);
            produit.setPrixVente(prixVente);
            produit.setQuantiteStock(quantiteStock);
            produit.setSeuilMinimum(seuilMinimum);

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

            Produit createdProduit = produitService.createProduit(produit, fournisseurId, prixAchat, token);

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

    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> getAllProducts(HttpServletRequest request) {
        try {
            String token = extractToken(request);
            if (token == null) {
                return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
            }

            List<Produit> produits = produitService.getAllProduits(token);

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

    @GetMapping("/actifs")
    public ResponseEntity<Map<String, Object>> getActiveProducts(HttpServletRequest request) {
        try {
            String token = extractToken(request);
            if (token == null) {
                return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
            }

            List<Produit> produits = produitService.getProduitsActifs(token);

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

    @GetMapping("/{id}")
    public ResponseEntity<?> getProduitById(HttpServletRequest request, @PathVariable Integer id) {
        try {
            String token = extractToken(request);
            if (token == null) {
                return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
            }

            Optional<Produit> produitOpt = produitService.getProduitById(id, token);
            if (produitOpt.isEmpty()) {
                return errorResponse("Produit non trouvé", HttpStatus.NOT_FOUND);
            }

            Produit produit = produitOpt.get();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);

            Map<String, Object> produitMap = new HashMap<>();
            produitMap.put("idProduit", produit.getIdProduit());
            produitMap.put("libelle", produit.getLibelle());
            produitMap.put("prixVente", produit.getPrixVente());
            produitMap.put("prixAchat", produit.getPrixAchat());
            produitMap.put("quantiteStock", produit.getQuantiteStock());
            produitMap.put("uniteMesure", produit.getUniteMesure() != null ? produit.getUniteMesure().name() : null);
            produitMap.put("active", produit.getActive());
            produitMap.put("seuilMinimum", produit.getSeuilMinimum());

            // ✅ Construction de l'URL de l'image
            String baseUrl = "http://localhost:8081";
            if (produit.getImageUrl() != null && !produit.getImageUrl().isEmpty()) {
                String imageFullUrl;

                if (produit.getImageUrl().startsWith("http")) {
                    // Déjà une URL complète
                    imageFullUrl = produit.getImageUrl();
                }
                else if (produit.getImageUrl().startsWith("uploads/produits/")) {
                    // ✅ CORRECTION: extraire le nom et utiliser le bon endpoint
                    String filename = produit.getImageUrl().substring(produit.getImageUrl().lastIndexOf("/") + 1);
                    imageFullUrl = baseUrl + "/api/produits/uploads/produits/" + filename;
                }
                else {
                    // Juste le nom du fichier
                    imageFullUrl = baseUrl + "/api/produits/uploads/produits/" + produit.getImageUrl();
                }
                produitMap.put("imageUrl", imageFullUrl);
            } else {
                produitMap.put("imageUrl", null);
            }

            produitMap.put("remiseTemporaire", produit.getRemiseTemporaire());
            produitMap.put("status", produit.getStatus() != null ? produit.getStatus().name() : null);

            // Catégorie
            if (produit.getCategorie() != null) {
                produitMap.put("categorieId", produit.getCategorie().getIdCategorie());
                produitMap.put("categorieNom", produit.getCategorie().getNomCategorie());
            }

            // Fournisseur
            if (produit.getFournisseur() != null) {
                produitMap.put("fournisseurId", produit.getFournisseur().getIdFournisseur());
                produitMap.put("fournisseurNom", produit.getFournisseur().getNomFournisseur());
                produitMap.put("fournisseurEmail", produit.getFournisseur().getEmail());
                produitMap.put("fournisseurTelephone", produit.getFournisseur().getTelephone());
            }

            response.put("produit", produitMap);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/fournisseur/{fournisseurId}")
    public ResponseEntity<?> getProduitsByFournisseur(HttpServletRequest request, @PathVariable Integer fournisseurId) {
        try {
            String token = extractToken(request);
            if (token == null) {
                return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
            }

            List<Produit> produits = produitService.getProduitsByFournisseur(fournisseurId, token);

            List<Map<String, Object>> produitsDTO = produits.stream()
                    .map(p -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", p.getIdProduit());
                        map.put("idProduit", p.getIdProduit());
                        map.put("libelle", p.getLibelle());
                        map.put("nom", p.getLibelle());
                        map.put("prixAchat", p.getPrixAchat());
                        map.put("prixVente", p.getPrixVente());
                        map.put("quantiteStock", p.getQuantiteStock());
                        map.put("uniteMesure", p.getUniteMesure());
                        map.put("active", p.getActive());
                        map.put("tauxTVA", p.getCategorie() != null && p.getCategorie().getTauxTVA() != null ? p.getCategorie().getTauxTVA() : 19);
                        map.put("estActif", p.getActive());
                        return map;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "produits", produitsDTO
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PutMapping(value = "/update/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> updateProduct(
            HttpServletRequest request,
            @PathVariable Integer id,
            @RequestParam(required = false) String libelle,
            @RequestParam(required = false) Double prixVente,
            @RequestParam(required = false) Integer categorieId,
            @RequestParam(required = false) Integer quantiteStock,
            @RequestParam(required = false) Integer seuilMinimum,
            @RequestParam(required = false) String uniteMesure,
            @RequestParam(required = false) Double remiseTemporaire,
            @RequestParam(required = false) Boolean active,
            @RequestParam(value = "fournisseurId", required = false) Integer fournisseurId,
            @RequestParam(value = "prixAchat", required = false) BigDecimal prixAchat,
            @RequestPart(value = "image", required = false) MultipartFile image) {

        try {
            String token = extractToken(request);
            if (token == null) {
                return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
            }

            Optional<Produit> produitOpt = produitService.getProduitById(id, token);
            if (produitOpt.isEmpty()) {
                return errorResponse("Produit non trouvé", HttpStatus.NOT_FOUND);
            }

            Produit produit = produitOpt.get();

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

            // ✅ CORRECTION: Passer categorieId en 4ème paramètre
            Produit updatedProduit = produitService.updateProduit(
                    id,                    // 1. Integer id
                    produit,               // 2. Produit produitDetails
                    fournisseurId,         // 3. Integer fournisseurId
                    categorieId,           // 4. Integer categorieId (AJOUTÉ)
                    prixAchat,            // 5. BigDecimal prixAchat
                    token                 // 6. String token
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Produit mis à jour avec succès");
            response.put("produit", updatedProduit);
            response.put("fournisseurId", fournisseurId);
            response.put("categorieId", categorieId);
            response.put("prixAchat", prixAchat);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return errorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            e.printStackTrace();
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Map<String, Object>> deleteProduct(HttpServletRequest request, @PathVariable Integer id) {
        try {
            String token = extractToken(request);
            if (token == null) {
                return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
            }

            produitService.desactiverProduit(id, token);

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

    @PatchMapping("/{id}/reactiver")
    public ResponseEntity<Map<String, Object>> reactiverProduit(HttpServletRequest request, @PathVariable Integer id) {
        try {
            String token = extractToken(request);
            if (token == null) {
                return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
            }

            Produit produit = produitService.reactiverProduit(id, token);

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

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchProduits(
            HttpServletRequest request,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Produit.StockStatus status,
            @RequestParam(required = false) Integer categorieId,
            @RequestParam(required = false) Boolean actif) {

        try {
            String token = extractToken(request);
            if (token == null) {
                return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
            }

            // Note: Cette méthode searchProduits doit aussi être adaptée dans le service
            // Pour l'instant, on fait une recherche simple
            List<Produit> produits;
            if (keyword != null && !keyword.isEmpty()) {
                produits = produitService.getAllProduits(token).stream()
                        .filter(p -> p.getLibelle().toLowerCase().contains(keyword.toLowerCase()))
                        .collect(Collectors.toList());
            } else {
                produits = produitService.getAllProduits(token);
            }

            if (status != null) {
                produits = produits.stream()
                        .filter(p -> p.getStatus() == status)
                        .collect(Collectors.toList());
            }

            if (categorieId != null) {
                produits = produits.stream()
                        .filter(p -> p.getCategorie() != null && p.getCategorie().getIdCategorie() == categorieId)
                        .collect(Collectors.toList());
            }

            if (actif != null) {
                produits = produits.stream()
                        .filter(p -> p.getActive() == actif)
                        .collect(Collectors.toList());
            }

            List<Map<String, Object>> produitsDTO = produits.stream()
                    .map(p -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("idProduit", p.getIdProduit());
                        map.put("libelle", p.getLibelle());
                        map.put("prixVente", p.getPrixVente());
                        map.put("prixAchat", p.getPrixAchat());
                        map.put("quantiteStock", p.getQuantiteStock());
                        map.put("uniteMesure", p.getUniteMesure() != null ? p.getUniteMesure().name() : null);
                        map.put("active", p.getActive());
                        map.put("seuilMinimum", p.getSeuilMinimum());
                        map.put("imageUrl", p.getImageUrl());
                        map.put("remiseTemporaire", p.getRemiseTemporaire());
                        map.put("status", p.getStatus() != null ? p.getStatus().name() : null);

                        if (p.getCategorie() != null) {
                            map.put("categorieId", p.getCategorie().getIdCategorie());
                            map.put("categorieNom", p.getCategorie().getNomCategorie());
                        }
                        return map;
                    })
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", produitsDTO.size());
            response.put("produits", produitsDTO);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return errorResponse("Erreur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/categorie/{categorieId}")
    public ResponseEntity<Map<String, Object>> getProductsByCategorie(HttpServletRequest request, @PathVariable Integer categorieId) {
        try {
            String token = extractToken(request);
            if (token == null) {
                return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
            }

            List<Produit> produits = produitService.getProduitsByCategorie(categorieId, token);

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

    @PatchMapping("/{id}/stock")
    public ResponseEntity<Map<String, Object>> updateStock(
            HttpServletRequest request,
            @PathVariable Integer id,
            @RequestParam Integer quantite) {
        try {
            String token = extractToken(request);
            if (token == null) {
                return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
            }

            if (quantite < 0) {
                return errorResponse("La quantité ne peut pas être négative", HttpStatus.BAD_REQUEST);
            }

            // Note: Cette méthode doit être adaptée dans le service
            Optional<Produit> produitOpt = produitService.getProduitById(id, token);
            if (produitOpt.isEmpty()) {
                return errorResponse("Produit non trouvé", HttpStatus.NOT_FOUND);
            }

            Produit produit = produitOpt.get();
            produit.setQuantiteStock(quantite);
            produitService.updateStockStatus(produit);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Stock mis à jour avec succès");
            response.put("produit", produit);
            response.put("nouveauStock", produit.getQuantiteStock());
            response.put("status", produit.getStatus());

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return errorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return errorResponse("Erreur lors de la mise à jour du stock: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{id}/verifier-disponibilite")
    public ResponseEntity<Map<String, Object>> verifierDisponibilite(
            HttpServletRequest request,
            @PathVariable Integer id,
            @RequestParam Integer quantite) {
        try {
            String token = extractToken(request);
            if (token == null) {
                return errorResponse("Token non trouvé", HttpStatus.UNAUTHORIZED);
            }

            if (quantite <= 0) {
                return errorResponse("La quantité doit être positive", HttpStatus.BAD_REQUEST);
            }

            boolean disponible = produitService.verifierDisponibilite(id, quantite, token);
            Optional<Produit> produitOpt = produitService.getProduitById(id, token);

            if (produitOpt.isEmpty()) {
                return errorResponse("Produit non trouvé", HttpStatus.NOT_FOUND);
            }

            Produit produit = produitOpt.get();

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
     * Endpoint public pour servir les images des produits (sans authentification)
     * URL: /api/produits/uploads/produits/{filename}
     */
    @GetMapping(value = "/uploads/produits/{filename}", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getProductImage(@PathVariable String filename) {
        try {
            Path imagePath = Paths.get("uploads/produits").toAbsolutePath().normalize().resolve(filename);

            // Vérifier aussi dans le dossier uploads/produits
            if (!Files.exists(imagePath)) {
                // Essayer avec le chemin relatif
                imagePath = Paths.get("uploads/produits").resolve(filename);
            }

            if (!Files.exists(imagePath)) {
                log.warn("❌ Image non trouvée: {}", imagePath);
                return ResponseEntity.notFound().build();
            }

            byte[] imageBytes = Files.readAllBytes(imagePath);
            String contentType = Files.probeContentType(imagePath);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType != null ? contentType : "image/jpeg"))
                    .body(imageBytes);

        } catch (Exception e) {
            log.error("❌ Erreur chargement image: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

}