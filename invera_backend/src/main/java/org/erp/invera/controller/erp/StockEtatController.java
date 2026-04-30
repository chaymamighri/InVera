package org.erp.invera.controller.erp;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.erp.stockmouvement.StockEtatDTO;
import org.erp.invera.service.erp.StockEtatService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * Contrôleur de l'état des stocks - MULTI-TENANT.
 *
 * Endpoints :
 * - GET /                         → État complet des stocks (filtres : catégorie, alerte, rupture)
 * - GET /ruptures                 → Liste des produits en rupture de stock
 *
 * Accès : Réservé au rôle RESPONSABLE_ACHAT
 */
@RestController
@RequestMapping("/api/stock/etat")
@RequiredArgsConstructor
public class StockEtatController {

    private final StockEtatService stockEtatService;

    // ==================== MÉTHODE UTILITAIRE ====================

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        throw new RuntimeException("Token JWT manquant ou invalide");
    }

    // ==================== ENDPOINTS ====================

    @PreAuthorize("hasRole('RESPONSABLE_ACHAT') or hasAuthority('ROLE_RESPONSABLE_ACHAT')")
    @GetMapping
    public ResponseEntity<List<StockEtatDTO>> getEtatStock(
            @RequestParam(required = false) Integer categorieId,
            @RequestParam(required = false) Boolean seuilAlerte,
            @RequestParam(required = false) Boolean rupture,
            HttpServletRequest request) {

        String token = extractToken(request);
        List<StockEtatDTO> etatStock = stockEtatService.getEtatStock(categorieId, seuilAlerte, rupture, token);

        return ResponseEntity.ok(etatStock);
    }

    @PreAuthorize("hasRole('RESPONSABLE_ACHAT') or hasAuthority('ROLE_RESPONSABLE_ACHAT')")
    @GetMapping("/ruptures")
    public ResponseEntity<List<StockEtatDTO>> getProduitsEnRupture(HttpServletRequest request) {
        String token = extractToken(request);
        return ResponseEntity.ok(stockEtatService.getProduitsEnRupture(token));
    }
}