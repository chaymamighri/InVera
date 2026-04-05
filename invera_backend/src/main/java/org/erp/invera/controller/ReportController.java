// src/main/java/org/erp/invera/controller/ReportController.java
package org.erp.invera.controller;

import org.erp.invera.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class ReportController {

    private final ReportService reportService;

    /**
     * RAPPORT DES VENTES (Commandes clients)
     */
    @GetMapping("/sales")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMMERCIAL')")
    public ResponseEntity<?> getSalesReport(
            @RequestParam(required = false, defaultValue = "month") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false, defaultValue = "all") String clientType,
            @RequestParam(required = false, defaultValue = "all") String status) {

        try {
            Map<String, Object> report = reportService.generateSalesReport(
                    period,
                    startDate,
                    endDate,
                    clientType,
                    status
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

    /**
     * RAPPORT DES FACTURES
     */
    @GetMapping("/invoices")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMMERCIAL')")
    public ResponseEntity<?> getInvoicesReport(
            @RequestParam(required = false, defaultValue = "month") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false, defaultValue = "all") String clientType,
            @RequestParam(required = false, defaultValue = "all") String status) {

        try {
            Map<String, Object> report = reportService.generateInvoicesReport(
                    period,
                    startDate,
                    endDate,
                    clientType,
                    status
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

    /**
     * RAPPORT DES CLIENTS
     */
    @GetMapping("/clients")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMMERCIAL')")
    public ResponseEntity<?> getClientsReport(
            @RequestParam(required = false, defaultValue = "month") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false, defaultValue = "all") String clientType) {

        try {
            Map<String, Object> report = reportService.generateClientsReport(
                    period,
                    startDate,
                    endDate,
                    clientType
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

    /**
     * APERÇU RAPIDE POUR LE DASHBOARD
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMMERCIAL')")
    public ResponseEntity<?> getDashboardPreview(
            @RequestParam(required = false, defaultValue = "month") String period) {

        try {
            Map<String, Object> preview = new HashMap<>();

            // Vous pouvez déplacer cette logique dans le service si nécessaire
            preview.put("message", "Dashboard preview - À implémenter");
            preview.put("period", period);

            return ResponseEntity.ok(preview);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage(),
                    "success", false
            ));
        }
    }

    /**
     * LISTE DES TYPES DE RAPPORTS DISPONIBLES
     */
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
