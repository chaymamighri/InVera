package org.erp.invera.controller.erp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.erp.DashboardAchatEtStock.*;
import org.erp.invera.service.erp.StatsAchatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

/**
 * Contrôleur des statistiques achats et stocks - MULTI-TENANT.
 * Architecture : 1 base = 1 client
 */
@Slf4j
@RestController
@RequestMapping("/api/procurement/stats")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StatsController {

    private final StatsAchatService statsService;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    // ==================== MÉTHODE UTILITAIRE ====================

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        throw new RuntimeException("Token JWT manquant ou invalide");
    }

    private LocalDate parseLocalDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty() || dateStr.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(dateStr.trim(), DATE_FORMATTER);
        } catch (DateTimeParseException e) {
            log.warn("Erreur de parsing de la date: {}", dateStr);
            return null;
        }
    }

    private LocalDateTime parseLocalDateTimeStart(String dateStr) {
        LocalDate date = parseLocalDate(dateStr);
        return date != null ? date.atStartOfDay() : null;
    }

    // ==================== ENDPOINTS ====================

    /**
     * GET /api/procurement/stats/dashboard
     * Récupère toutes les statistiques du tableau de bord
     */
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            HttpServletRequest request) {

        String token = extractToken(request);
        LocalDate start = parseLocalDate(startDate);
        LocalDate end = parseLocalDate(endDate);

        DashboardStatsDTO stats = statsService.getDashboardStats(start, end, token);
        return ResponseEntity.ok(stats);
    }

    /**
     * GET /api/procurement/stats/commandes
     * Statistiques des commandes par période
     */
    @GetMapping("/commandes")
    public ResponseEntity<DashboardStatsDTO.CommandesStats> getCommandes(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "MOIS") String filtre,
            HttpServletRequest request) {

        String token = extractToken(request);
        LocalDate start = parseLocalDate(startDate);
        LocalDate end = parseLocalDate(endDate);

        if (start == null) {
            start = LocalDate.now().minusMonths(1);
        }
        if (end == null) {
            end = LocalDate.now();
        }

        DashboardStatsDTO.CommandesStats stats = statsService.getCommandesStats(start, end, filtre, token);
        return ResponseEntity.ok(stats);
    }

    /**
     * GET /api/procurement/stats/stocks
     * Statistiques des stocks avec filtrage par période
     */
    @GetMapping("/stocks")
    public ResponseEntity<DashboardStatsDTO.StockStats> getStockStats(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            HttpServletRequest request) {

        String token = extractToken(request);
        LocalDateTime start = parseLocalDateTimeStart(startDate);
        LocalDateTime end = parseLocalDateTimeStart(endDate);

        DashboardStatsDTO.StockStats stats = statsService.getStockStats(start, end, token);
        return ResponseEntity.ok(stats);
    }

    /**
     * GET /api/procurement/stats/evolution-commandes
     * Évolution des commandes sur l'année
     */
    @GetMapping("/evolution-commandes")
    public ResponseEntity<List<EvolutionCommandesDTO>> getEvolutionCommandes(
            @RequestParam(required = false) Integer annee,
            HttpServletRequest request) {

        String token = extractToken(request);
        int year = annee != null ? annee : Year.now().getValue();
        List<EvolutionCommandesDTO> evolution = statsService.getEvolutionCommandes(year, token);
        return ResponseEntity.ok(evolution);
    }

    /**
     * GET /api/procurement/stats/mouvements-stock
     * Mouvements de stock par période
     */
    @GetMapping("/mouvements-stock")
    public ResponseEntity<List<MouvementStockPeriodDTO>> getMouvementsStock(
            @RequestParam(defaultValue = "8weeks") String periode,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            HttpServletRequest request) {

        String token = extractToken(request);
        LocalDate start = parseLocalDate(startDate);
        LocalDate end = parseLocalDate(endDate);

        List<MouvementStockPeriodDTO> mouvements = statsService.getMouvementsStock(periode, start, end, token);
        return ResponseEntity.ok(mouvements);
    }

    /**
     * GET /api/procurement/stats/repartition-categories
     */
    @GetMapping("/repartition-categories")
    public ResponseEntity<List<CategorieRepartitionDTO>> getRepartitionCategories(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            HttpServletRequest request) {

        String token = extractToken(request);
        LocalDate start = parseLocalDate(startDate);
        LocalDate end = parseLocalDate(endDate);

        List<CategorieRepartitionDTO> repartition = statsService.getRepartitionCategories(start, end, token);
        return ResponseEntity.ok(repartition);
    }

    /**
     * GET /api/procurement/stats/alertes-stock
     */
    @GetMapping("/alertes-stock")
    public ResponseEntity<List<AlerteStockDTO>> getAlertesStock(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            HttpServletRequest request) {

        String token = extractToken(request);
        LocalDate start = parseLocalDate(startDate);
        LocalDate end = parseLocalDate(endDate);

        List<AlerteStockDTO> alertes = statsService.getAlertesStock(start, end, token);
        return ResponseEntity.ok(alertes);
    }

    /**
     * GET /api/procurement/stats/commandes-attente
     */
    @GetMapping("/commandes-attente")
    public ResponseEntity<Map<String, Object>> getCommandesATraiter(HttpServletRequest request) {
        String token = extractToken(request);
        Map<String, Object> commandes = statsService.getCommandesATraiter(token);
        return ResponseEntity.ok(commandes);
    }

    /**
     * GET /api/procurement/stats/kpis
     */
    @GetMapping("/kpis")
    public ResponseEntity<KPIsDTO> getKPIs(HttpServletRequest request) {
        String token = extractToken(request);
        KPIsDTO kpis = statsService.getKPIs(token);
        return ResponseEntity.ok(kpis);
    }

    /**
     * GET /api/procurement/stats/valeur-stock
     */
    @GetMapping("/valeur-stock")
    public ResponseEntity<List<StockValeurDTO>> getValeurStockParCategorie(HttpServletRequest request) {
        String token = extractToken(request);
        List<StockValeurDTO> valeurs = statsService.getValeurStockParCategorie(token);
        return ResponseEntity.ok(valeurs);
    }

    /**
     * GET /api/procurement/stats/rotation-stock
     */
    @GetMapping("/rotation-stock")
    public ResponseEntity<Double> getRotationStock(HttpServletRequest request) {
        String token = extractToken(request);
        Double rotation = statsService.getRotationStock(token);
        return ResponseEntity.ok(rotation);
    }
}