package org.erp.invera.controller.erp;

import org.erp.invera.service.erp.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;


/**
 * Contrôleur des rapports d'analyse commerciale.
 *
 * Endpoints (accès ADMIN ou COMMERCIAL) :
 * - GET /sales      → Rapport des ventes (CA, commandes, panier moyen...)
 * - GET /invoices   → Rapport des factures (payées/impayées, recouvrement...)
 * - GET /clients    → Rapport des clients (top clients, répartition par type)
 * - GET /dashboard  → Aperçu rapide pour le tableau de bord
 * - GET /types      → Liste des types de rapports disponibles (utile pour le front-end)
 *
 * Paramètres communs :
 * - period     : today, week, month, quarter, year
 * - startDate  : début période personnalisée (format ISO)
 * - endDate    : fin période personnalisée
 * - clientType : VIP, ENTREPRISE, FIDELE, PARTICULIER
 * - status     : statut commande ou facture
 */
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

