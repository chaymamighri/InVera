// DashboardController.java
package org.erp.invera.controller.erp;

import org.erp.invera.dto.erp.DashboardVente.DashboardDTO;
import org.erp.invera.service.erp.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;

/**
 * Contrôleur du tableau de bord - MULTI-TENANT.
 * Architecture : 1 base = 1 client
 *
 * Endpoint unique :
 * - GET /summary?period=today/week/month&startDate=&endDate=
 *
 * Périodes disponibles :
 * - today   → Aujourd'hui
 * - week    → Cette semaine (lundi à aujourd'hui)
 * - month   → Ce mois
 * - custom  → Dates personnalisées (via startDate et endDate)
 */
@Slf4j
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    // ==================== MÉTHODE UTILITAIRE ====================

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        throw new RuntimeException("Token JWT manquant ou invalide");
    }

    // ==================== ENDPOINTS ====================

    @GetMapping("/summary")
    public ResponseEntity<DashboardDTO> getDashboardSummary(
            @RequestParam(defaultValue = "today") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpServletRequest request) {

        String token = extractToken(request);
        DashboardDTO summary;

        if (startDate != null && endDate != null) {
            // Période personnalisée
            log.info("Dashboard personnalisé: {} → {}", startDate, endDate);
            summary = dashboardService.getCustomSummary(startDate, endDate, token);
        } else {
            // Période prédéfinie
            log.info("Dashboard période: {}", period);
            summary = dashboardService.getSummary(period, token);
        }

        return ResponseEntity.ok(summary);
    }
}