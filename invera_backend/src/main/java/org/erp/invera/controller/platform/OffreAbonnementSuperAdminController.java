package org.erp.invera.controller.platform;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.platform.abonnementdto.OffreAbonnementRequest;
import org.erp.invera.service.platform.OffreAbonnementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/super-admin/offres")
@RequiredArgsConstructor
public class OffreAbonnementSuperAdminController {

    private final OffreAbonnementService offreAbonnementService;

    @GetMapping
    public ResponseEntity<?> getAllOffres(@RequestParam(defaultValue = "false") boolean activeOnly) {
        try {
            return ResponseEntity.ok(offreAbonnementService.getAllOffers(activeOnly));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOffreById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(offreAbonnementService.getOfferById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createOffre(@RequestBody OffreAbonnementRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(offreAbonnementService.createOffer(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateOffre(@PathVariable Long id, @RequestBody OffreAbonnementRequest request) {
        try {
            return ResponseEntity.ok(offreAbonnementService.updateOffer(id, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<?> activateOffre(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(offreAbonnementService.activateOffer(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivateOffre(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(offreAbonnementService.deactivateOffer(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}