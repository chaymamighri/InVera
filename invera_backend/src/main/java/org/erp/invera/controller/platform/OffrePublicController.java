package org.erp.invera.controller.platform;

import lombok.RequiredArgsConstructor;
import org.erp.invera.service.platform.OffreAbonnementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/offres")
@RequiredArgsConstructor
public class OffrePublicController {

    private final OffreAbonnementService offreAbonnementService;

    /**
     * Endpoint PUBLIC - Récupère toutes les offres ACTIVES
     * Accessible sans authentification
     */
    @GetMapping
    public ResponseEntity<?> getAllOffresActives() {
        // activeOnly = true : uniquement les offres actives
        return ResponseEntity.ok(offreAbonnementService.getAllOffers(true));
    }
}