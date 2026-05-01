package org.erp.invera.controller.erp;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.erp.stockmouvement.StockMovementDTO;
import org.erp.invera.model.erp.stock.StockMovement;
import org.erp.invera.service.erp.StockMovementService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Contrôleur des mouvements de stock - MULTI-TENANT.
 *
 * Endpoints :
 * - GET /                         → Liste tous les mouvements (filtres optionnels : dates, type)
 * - GET /produit/{produitId}      → Historique d'un produit spécifique
 * - GET /periode                  → Mouvements sur une période (dates obligatoires)
 * - GET /stats/theorique/{produitId} → Stock théorique calculé (entrées - sorties)
 */
@RestController
@RequestMapping("/api/stock/mouvements")
@RequiredArgsConstructor
public class StockMovementController {

    private final StockMovementService stockMovementService;

    // ==================== MÉTHODE UTILITAIRE ====================

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        throw new RuntimeException("Token JWT manquant ou invalide");
    }

    // ==================== ENDPOINTS ====================

    /**
     * GET - Récupérer tous les mouvements avec filtres optionnels
     */
    @GetMapping
    public ResponseEntity<List<StockMovementDTO>> getAllMovements(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin,
            @RequestParam(required = false) String type,
            HttpServletRequest request) {

        String token = extractToken(request);
        List<StockMovement> movements;

        if (debut != null || fin != null || type != null) {
            movements = stockMovementService.getMovementsWithFilters(debut, fin, type, token);
        } else {
            movements = stockMovementService.getAllMovements(token);
        }

        return ResponseEntity.ok(movements.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    /**
     * GET - Historique d'un produit
     */
    @GetMapping("/produit/{produitId}")
    public ResponseEntity<List<StockMovementDTO>> getMovementsByProduct(
            @PathVariable Integer produitId,
            HttpServletRequest request) {

        String token = extractToken(request);
        List<StockMovement> movements = stockMovementService.getHistoriqueProduit(produitId, token);

        return ResponseEntity.ok(movements.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    /**
     * GET - Mouvements sur une période
     */
    @GetMapping("/periode")
    public ResponseEntity<List<StockMovementDTO>> getMovementsByPeriode(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin,
            HttpServletRequest request) {

        String token = extractToken(request);
        List<StockMovement> movements = stockMovementService.getMovementsByPeriode(debut, fin, token);

        return ResponseEntity.ok(movements.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    /**
     * GET - Stock théorique d'un produit
     */
    @GetMapping("/stats/theorique/{produitId}")
    public ResponseEntity<Integer> getStockTheorique(
            @PathVariable Integer produitId,
            HttpServletRequest request) {

        String token = extractToken(request);
        return ResponseEntity.ok(stockMovementService.calculerStockTheorique(produitId, token));
    }

    // ==================== CONVERSION ====================


    private StockMovementDTO convertToDTO(StockMovement movement) {
        StockMovementDTO dto = new StockMovementDTO();
        dto.setId(movement.getId());

        if (movement.getProduit() != null) {
            dto.setProduitId(movement.getProduit().getIdProduit());
            dto.setProduitLibelle(movement.getProduit().getLibelle());
        }

        dto.setTypeMouvement(movement.getTypeMouvement().name());
        dto.setQuantite(movement.getQuantite());
        dto.setStockAvant(movement.getStockAvant());
        dto.setStockApres(movement.getStockApres());
        dto.setTypeDocument(movement.getTypeDocument());
        dto.setCommentaire(movement.getCommentaire());
        dto.setDateMouvement(movement.getDateMouvement());
        return dto;
    }
}