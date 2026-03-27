package org.erp.invera.controller;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.stockmouvement.StockEtatDTO;
import org.erp.invera.service.StockEtatService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/alertes")
    public ResponseEntity<List<StockEtatDTO>> getProduitsEnAlerte() {
        return ResponseEntity.ok(stockEtatService.getProduitsEnAlerte());
    }

    @GetMapping("/ruptures")
    public ResponseEntity<List<StockEtatDTO>> getProduitsEnRupture() {
        return ResponseEntity.ok(stockEtatService.getProduitsEnRupture());
    }
}
