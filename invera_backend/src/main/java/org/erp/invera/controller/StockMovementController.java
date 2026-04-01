package org.erp.invera.controller;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.stockmouvement.StockMovementDTO;
import org.erp.invera.model.stock.StockMovement;
import org.erp.invera.repository.ProduitRepository;
import org.erp.invera.service.StockMovementService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/stock/mouvements")
@RequiredArgsConstructor
public class StockMovementController {

    private final StockMovementService stockMovementService;
    private final ProduitRepository produitRepository;

    // ✅ GET - Récupérer tous les mouvements avec filtres optionnels
    @GetMapping
    public ResponseEntity<List<StockMovementDTO>> getAllMovements(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin,
            @RequestParam(required = false) String type) {

        List<StockMovement> movements;

        if (debut != null || fin != null || type != null) {
            // Utiliser les filtres
            movements = stockMovementService.getMovementsWithFilters(debut, fin, type);
        } else {
            // Tous les mouvements
            movements = stockMovementService.getAllMovements();
        }

        return ResponseEntity.ok(movements.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/produit/{produitId}")
    public ResponseEntity<List<StockMovementDTO>> getMovementsByProduct(@PathVariable Integer produitId) {
        List<StockMovement> movements = stockMovementService.getHistoriqueProduit(produitId);
        return ResponseEntity.ok(movements.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/periode")
    public ResponseEntity<List<StockMovementDTO>> getMovementsByPeriode(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {
        List<StockMovement> movements = stockMovementService.getMovementsByPeriode(debut, fin);
        return ResponseEntity.ok(movements.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/stats/theorique/{produitId}")
    public ResponseEntity<Integer> getStockTheorique(@PathVariable Integer produitId) {
        return ResponseEntity.ok(stockMovementService.calculerStockTheorique(produitId));
    }

    private StockMovementDTO convertToDTO(StockMovement movement) {
        StockMovementDTO dto = new StockMovementDTO();
        dto.setId(movement.getId());
        dto.setProduitId(movement.getProduit().getIdProduit());
        dto.setProduitLibelle(movement.getProduit().getLibelle());
        dto.setTypeMouvement(movement.getTypeMouvement().name());
        dto.setQuantite(movement.getQuantite());
        dto.setStockAvant(movement.getStockAvant());
        dto.setStockApres(movement.getStockApres());
        dto.setReference(movement.getReference());
        dto.setTypeDocument(movement.getTypeDocument());
        dto.setIdDocument(movement.getIdDocument());
        dto.setCommentaire(movement.getCommentaire());
        dto.setDateMouvement(movement.getDateMouvement());
        return dto;
    }
}