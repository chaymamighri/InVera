package org.erp.invera.controller.erp;

import org.erp.invera.service.erp.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.Map;

/**
 * Contrôleur des rapports d'analyse commerciale - MULTI-TENANT.
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class ReportController {

    private final ReportService reportService;

    // ==================== MÉTHODE UTILITAIRE ====================

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        throw new RuntimeException("Token JWT manquant ou invalide");
    }

    // ==================== RAPPORT DES VENTES ====================

    @GetMapping("/sales")
    public ResponseEntity<?> getSalesReport(
            @RequestParam(required = false, defaultValue = "month") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false, defaultValue = "all") String clientType,
            @RequestParam(required = false, defaultValue = "all") String status,
            HttpServletRequest request) {  // ✅ AJOUTER HttpServletRequest

        try {
            Map<String, Object> report = reportService.generateSalesReport(
                    period,
                    startDate,
                    endDate,
                    clientType,
                    status,
                    request  // ✅ PASSER request
            );
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage(),
                    "success", false,
                    "message", "Erreur lors de la génération du rapport des ventes"
            ));
        }
    }

    // ==================== RAPPORT DES FACTURES ====================

    @GetMapping("/invoices")
    public ResponseEntity<?> getInvoicesReport(
            @RequestParam(required = false, defaultValue = "month") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false, defaultValue = "all") String clientType,
            @RequestParam(required = false, defaultValue = "all") String status,
            HttpServletRequest request) {  // ✅ AJOUTER HttpServletRequest

        try {
            Map<String, Object> report = reportService.generateInvoicesReport(
                    period,
                    startDate,
                    endDate,
                    clientType,
                    status,
                    request  // ✅ PASSER request
            );
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage(),
                    "success", false,
                    "message", "Erreur lors de la génération du rapport des factures"
            ));
        }
    }

    // ==================== RAPPORT DES CLIENTS ====================

    @GetMapping("/clients")
    public ResponseEntity<?> getClientsReport(
            @RequestParam(required = false, defaultValue = "month") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false, defaultValue = "all") String clientType,
            HttpServletRequest request) {  // ✅ AJOUTER HttpServletRequest

        try {
            Map<String, Object> report = reportService.generateClientsReport(
                    period,
                    startDate,
                    endDate,
                    clientType,
                    request  // ✅ PASSER request
            );
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage(),
                    "success", false,
                    "message", "Erreur lors de la génération du rapport des clients"
            ));
        }
    }

    // ==================== TYPES DE RAPPORTS ====================

    @GetMapping("/types")
    public ResponseEntity<?> getReportTypes() {
        return ResponseEntity.ok(Map.of(
                "types", Map.of(
                        "sales", "Rapport des ventes",
                        "invoices", "Rapport des factures",
                        "clients", "Rapport des clients"
                ),
                "periods", Map.of(
                        "today", "Aujourd'hui",
                        "week", "Cette semaine",
                        "month", "Ce mois",
                        "quarter", "Ce trimestre",
                        "year", "Cette année",
                        "custom", "Personnalisé"
                ),
                "clientTypes", Map.of(
                        "VIP", "VIP",
                        "ENTREPRISE", "Entreprise",
                        "FIDELE", "Fidèle",
                        "PARTICULIER", "Particulier"
                ),
                "orderStatus", Map.of(
                        "EN_ATTENTE", "En attente",
                        "CONFIRMEE", "Confirmée",
                        "ANNULEE", "Annulée"
                ),
                "invoiceStatus", Map.of(
                        "PAYE", "Payée",
                        "NON_PAYE", "Impayée"
                )
        ));
    }
}