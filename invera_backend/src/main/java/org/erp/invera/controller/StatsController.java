package org.erp.invera.controller;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.DashboardAchatEtStock.*;
import org.erp.invera.service.StatsAchatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/procurement/stats")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StatsController {

    private final StatsAchatService statsService;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    /**
     * Méthode utilitaire pour parser une date en gérant les chaînes vides et null
     */
    private LocalDate parseLocalDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty() || dateStr.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(dateStr.trim(), DATE_FORMATTER);
        } catch (DateTimeParseException e) {
            // Log l'erreur mais retourne null
            System.err.println("Erreur de parsing de la date: " + dateStr);
            return null;
        }
    }

    /**
     * Méthode utilitaire pour parser une date en LocalDateTime (début de journée)
     */
    private LocalDateTime parseLocalDateTimeStart(String dateStr) {
        LocalDate date = parseLocalDate(dateStr);
        return date != null ? date.atStartOfDay() : null;
    }

    /**
     * GET /api/procurement/stats/dashboard
     * Récupère toutes les statistiques du tableau de bord
     * Avec filtrage optionnel par période
     */
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        LocalDate start = parseLocalDate(startDate);
        LocalDate end = parseLocalDate(endDate);

        DashboardStatsDTO stats = statsService.getDashboardStats(start, end);
        return ResponseEntity.ok(stats);
    }

    /**
     * GET /api/procurement/stats/commandes
     * Statistiques des commandes par période ou date personnalisée
     */
    @GetMapping("/commandes")
    public ResponseEntity<DashboardStatsDTO.CommandesStats> getCommandes(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "MOIS") String filtre) {

        LocalDate start = parseLocalDate(startDate);
        LocalDate end = parseLocalDate(endDate);

        // Valeurs par défaut si dates null
        if (start == null) {
            start = LocalDate.now().minusMonths(1);
        }
        if (end == null) {
            end = LocalDate.now();
        }

        DashboardStatsDTO.CommandesStats stats = statsService.getCommandesStats(start, end, filtre);
        return ResponseEntity.ok(stats);
    }

    /**
     * GET /api/procurement/stats/stocks
     * Statistiques des stocks avec filtrage par période
     */
    @GetMapping("/stocks")
    public ResponseEntity<DashboardStatsDTO.StockStats> getStockStats(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        LocalDateTime start = parseLocalDateTimeStart(startDate);
        LocalDateTime end = parseLocalDateTimeStart(endDate);

        DashboardStatsDTO.StockStats stats = statsService.getStockStats(start, end);
        return ResponseEntity.ok(stats);
    }

    /**
     * GET /api/procurement/stats/evolution-commandes
     * Évolution des commandes sur l'année
     */
    @GetMapping("/evolution-commandes")
    public ResponseEntity<List<EvolutionCommandesDTO>> getEvolutionCommandes(
            @RequestParam(required = false) Integer annee) {
        int year = annee != null ? annee : Year.now().getValue();
        List<EvolutionCommandesDTO> evolution = statsService.getEvolutionCommandes(year);
        return ResponseEntity.ok(evolution);
    }

    /**
     * GET /api/procurement/stats/mouvements-stock
     * Mouvements de stock par période ou dates personnalisées
     */
    @GetMapping("/mouvements-stock")
    public ResponseEntity<List<MouvementStockPeriodDTO>> getMouvementsStock(
            @RequestParam(defaultValue = "8weeks") String periode,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        LocalDate start = parseLocalDate(startDate);
        LocalDate end = parseLocalDate(endDate);

        List<MouvementStockPeriodDTO> mouvements = statsService.getMouvementsStock(periode, start, end);
        return ResponseEntity.ok(mouvements);
    }

    /**
     * GET /api/procurement/stats/repartition-categories
     */
    @GetMapping("/repartition-categories")
    public ResponseEntity<List<CategorieRepartitionDTO>> getRepartitionCategories(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        LocalDate start = parseLocalDate(startDate);
        LocalDate end = parseLocalDate(endDate);

        List<CategorieRepartitionDTO> repartition = statsService.getRepartitionCategories(start, end);
        return ResponseEntity.ok(repartition);
    }

    /**
     * GET /api/procurement/stats/alertes-stock
     */
    @GetMapping("/alertes-stock")
    public ResponseEntity<List<AlerteStockDTO>> getAlertesStock(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        LocalDate start = parseLocalDate(startDate);
        LocalDate end = parseLocalDate(endDate);

        List<AlerteStockDTO> alertes = statsService.getAlertesStock(start, end);
        return ResponseEntity.ok(alertes);
    }

    /**
     * GET /api/procurement/stats/commandes-attente
     */
    @GetMapping("/commandes-attente")
    public ResponseEntity<Map<String, Object>> getCommandesATraiter() {
        Map<String, Object> commandes = statsService.getCommandesATraiter();
        return ResponseEntity.ok(commandes);
    }

    /**
     * GET /api/procurement/stats/kpis
     */
    @GetMapping("/kpis")
    public ResponseEntity<KPIsDTO> getKPIs() {
        KPIsDTO kpis = statsService.getKPIs();
        return ResponseEntity.ok(kpis);
    }

    /**
     * GET /api/procurement/stats/valeur-stock
     */
    @GetMapping("/valeur-stock")
    public ResponseEntity<List<StockValeurDTO>> getValeurStockParCategorie() {
        List<StockValeurDTO> valeurs = statsService.getValeurStockParCategorie();
        return ResponseEntity.ok(valeurs);
    }

    /**
     * GET /api/procurement/stats/rotation-stock
     */
    @GetMapping("/rotation-stock")
    public ResponseEntity<Double> getRotationStock() {
        Double rotation = statsService.getRotationStock();
        return ResponseEntity.ok(rotation);
    }
}