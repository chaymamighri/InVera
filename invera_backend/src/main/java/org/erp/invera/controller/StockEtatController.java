package org.erp.invera.controller;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.stockmouvement.StockEtatDTO;
import org.erp.invera.service.StockEtatService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur de l'état des stocks.
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

    @PreAuthorize("hasRole('RESPONSABLE_ACHAT') or hasAuthority('ROLE_RESPONSABLE_ACHAT')")
    @GetMapping
    public ResponseEntity<List<StockEtatDTO>> getEtatStock(
            @RequestParam(required = false) Integer categorieId,
            @RequestParam(required = false) Boolean seuilAlerte,
            @RequestParam(required = false) Boolean rupture) {

        List<StockEtatDTO> etatStock = stockEtatService.getEtatStock(
                categorieId, seuilAlerte, rupture);

        return ResponseEntity.ok(etatStock);
    }


    @GetMapping("/ruptures")
    public ResponseEntity<List<StockEtatDTO>> getProduitsEnRupture() {
        return ResponseEntity.ok(stockEtatService.getProduitsEnRupture());
    }
}
