package org.erp.invera.service.erp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.erp.DashboardAchatEtStock.*;
import org.erp.invera.model.erp.Produit;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.erp.invera.security.JwtTokenProvider;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.WeekFields;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatsAchatService {

    private final TenantAwareRepository tenantRepo;
    private final JwtTokenProvider jwtTokenProvider;

    private final Map<String, Map<String, Long>> statsCache = new HashMap<>();

    private Long getClientIdFromToken(String token) {
        return jwtTokenProvider.getClientIdFromToken(token);
    }

    private RowMapper<Produit> produitRowMapper() {
        return (rs, rowNum) -> {
            Produit produit = new Produit();
            produit.setIdProduit(rs.getInt("id_produit"));
            produit.setLibelle(rs.getString("libelle"));
            produit.setPrixVente(rs.getDouble("prix_vente"));
            produit.setQuantiteStock(rs.getInt("quantite_stock"));
            produit.setSeuilMinimum(rs.getInt("seuil_minimum"));
            produit.setActive(rs.getBoolean("is_active"));
            return produit;
        };
    }

    // ==================== MÉTHODES PRIVÉES CORRIGÉES ====================

    private Map<String, Long> getEntreesAndSorties(LocalDateTime startDate, LocalDateTime endDate, String token) {
        if (startDate == null || endDate == null) {
            Map<String, Long> empty = new HashMap<>();
            empty.put("ENTREE", 0L);
            empty.put("SORTIE", 0L);
            return empty;
        }

        String cacheKey = startDate.toString() + "_" + endDate.toString();

        if (statsCache.containsKey(cacheKey)) {
            return statsCache.get(cacheKey);
        }

        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = """
            SELECT 
                COALESCE(SUM(CASE WHEN type_mouvement = 'ENTREE' THEN quantite ELSE 0 END), 0) as entrees,
                COALESCE(SUM(CASE WHEN type_mouvement = 'SORTIE' THEN quantite ELSE 0 END), 0) as sorties
            FROM stock_movement
            WHERE date_mouvement BETWEEN ? AND ?
            """;

        Map<String, Long> stats = tenantRepo.queryForObjectAuth(sql, (rs, rowNum) -> {
            Map<String, Long> result = new HashMap<>();
            result.put("ENTREE", rs.getLong("entrees"));
            result.put("SORTIE", rs.getLong("sorties"));
            return result;
        }, clientId, authClientId, startDate, endDate);

        if (stats == null) {
            stats = new HashMap<>();
            stats.put("ENTREE", 0L);
            stats.put("SORTIE", 0L);
        }

        statsCache.put(cacheKey, stats);
        return stats;
    }

    private Long countCommandesByDate(LocalDateTime debut, LocalDateTime fin, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = "SELECT COUNT(*) FROM commandes_fournisseurs WHERE date_commande BETWEEN ? AND ?";
        return tenantRepo.queryForObjectAuth(sql, Long.class, clientId, authClientId, debut, fin);
    }

    private Long countCommandesByStatutAndDate(String statut, LocalDateTime debut, LocalDateTime fin, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = "SELECT COUNT(*) FROM commandes_fournisseurs WHERE statut = ? AND date_commande BETWEEN ? AND ?";
        return tenantRepo.queryForObjectAuth(sql, Long.class, clientId, authClientId, statut, debut, fin);
    }

    private Long countTotalCommandes(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = "SELECT COUNT(*) FROM commandes_fournisseurs";
        return tenantRepo.queryForObjectAuth(sql, Long.class, clientId, authClientId);
    }

    private List<Object[]> findCommandesByMonth(int annee, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = """
            SELECT EXTRACT(MONTH FROM date_commande) as month, 
                   COUNT(*) as count, 
                   COALESCE(SUM(totalht), 0) as total
            FROM commandes_fournisseurs 
            WHERE EXTRACT(YEAR FROM date_commande) = ?
            GROUP BY EXTRACT(MONTH FROM date_commande)
            ORDER BY month
            """;
        return tenantRepo.queryWithAuth(sql, (rs, rowNum) -> new Object[]{
                rs.getInt("month"),
                rs.getLong("count"),
                rs.getDouble("total")
        }, clientId, authClientId, annee);
    }

    private Long countProduits(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = "SELECT COUNT(*) FROM produit";
        return tenantRepo.queryForObjectAuth(sql, Long.class, clientId, authClientId);
    }

    private Long countProduitsActifs(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = "SELECT COUNT(*) FROM produit WHERE is_active = true";
        return tenantRepo.queryForObjectAuth(sql, Long.class, clientId, authClientId);
    }

    private Long countProduitsRupture(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = "SELECT COUNT(*) FROM produit WHERE quantite_stock = 0 OR quantite_stock IS NULL";
        return tenantRepo.queryForObjectAuth(sql, Long.class, clientId, authClientId);
    }

    private Long countProduitsCritique(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = """
            SELECT COUNT(*) FROM produit 
            WHERE quantite_stock > 0 AND quantite_stock <= seuil_minimum * 0.25
            """;
        return tenantRepo.queryForObjectAuth(sql, Long.class, clientId, authClientId);
    }

    private Double sommeValeurStockTotale(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = "SELECT COALESCE(SUM(quantite_stock * prix_vente), 0) FROM produit";
        BigDecimal result = tenantRepo.queryForObjectAuth(sql, BigDecimal.class, clientId, authClientId);
        return result != null ? result.doubleValue() : 0.0;
    }

    private Double averageStock(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = "SELECT AVG(quantite_stock) FROM produit WHERE quantite_stock IS NOT NULL";
        return tenantRepo.queryForObjectAuth(sql, Double.class, clientId, authClientId);
    }

    private List<Produit> findProduitsEnRupture(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = "SELECT * FROM produit WHERE quantite_stock = 0 OR quantite_stock IS NULL";
        return tenantRepo.queryWithAuth(sql, produitRowMapper(), clientId, authClientId);
    }

    private List<Produit> findProduitsStockCritique(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = """
            SELECT * FROM produit 
            WHERE quantite_stock > 0 AND quantite_stock <= seuil_minimum * 0.25
            """;
        return tenantRepo.queryWithAuth(sql, produitRowMapper(), clientId, authClientId);
    }

    private List<Object[]> countProduitsByCategorie(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = """
            SELECT COALESCE(c.nom_categorie, 'Sans catégorie') as nom_categorie, COUNT(p.id_produit) as count
            FROM produit p
            LEFT JOIN categorie c ON p.categorie_id = c.id_categorie
            GROUP BY c.nom_categorie
            """;
        return tenantRepo.queryWithAuth(sql, (rs, rowNum) -> new Object[]{
                rs.getString("nom_categorie"),
                rs.getLong("count")
        }, clientId, authClientId);
    }

    private List<Object[]> sommeValeurStockByCategorie(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = """
            SELECT COALESCE(c.nom_categorie, 'Sans catégorie') as nom_categorie, 
                   COALESCE(SUM(p.quantite_stock * p.prix_vente), 0) as valeur,
                   COUNT(p.id_produit) as count
            FROM produit p
            LEFT JOIN categorie c ON p.categorie_id = c.id_categorie
            GROUP BY c.nom_categorie
            """;
        return tenantRepo.queryWithAuth(sql, (rs, rowNum) -> new Object[]{
                rs.getString("nom_categorie"),
                rs.getDouble("valeur"),
                rs.getInt("count")
        }, clientId, authClientId);
    }

    private Long countProduitsPrecedent(String token) {
        LocalDateTime debut = LocalDateTime.now().minusMonths(1);
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = "SELECT COUNT(*) FROM produit WHERE created_at >= ?";
        return tenantRepo.queryForObjectAuth(sql, Long.class, clientId, authClientId, debut);
    }

    private Long getMouvementsMois(LocalDateTime start, LocalDateTime end, String token) {
        if (start == null || end == null) return 0L;
        Map<String, Long> stats = getEntreesAndSorties(start, end, token);
        return stats.get("ENTREE") + stats.get("SORTIE");
    }

    private Double calculateRotationStock(String token) {
        LocalDateTime startOfYear = LocalDateTime.now().withDayOfYear(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime now = LocalDateTime.now();

        Map<String, Long> stats = getEntreesAndSorties(startOfYear, now, token);
        BigDecimal totalSorties = BigDecimal.valueOf(stats.get("SORTIE"));

        Double stockMoyen = averageStock(token);
        if (stockMoyen == null || stockMoyen == 0) return 0.0;

        return BigDecimal.valueOf(totalSorties.doubleValue())
                .divide(BigDecimal.valueOf(stockMoyen), 2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private Double calculateTendanceCommandes(LocalDateTime startDateTime, LocalDateTime endDateTime, String token) {
        if (startDateTime == null || endDateTime == null) return 0.0;

        Long commandesActuelles = countCommandesByDate(startDateTime, endDateTime, token);

        long duration = Duration.between(startDateTime, endDateTime).toMillis();
        LocalDateTime periodPrecedenteStart = startDateTime.minus(duration, ChronoUnit.MILLIS);
        LocalDateTime periodPrecedenteEnd = startDateTime;

        Long commandesPrecedentes = countCommandesByDate(periodPrecedenteStart, periodPrecedenteEnd, token);

        if (commandesPrecedentes == null || commandesPrecedentes == 0) return 0.0;

        return ((commandesActuelles - commandesPrecedentes) * 100.0) / commandesPrecedentes;
    }

    private Double calculateTendanceProduits(String token) {
        Long totalActuel = countProduits(token);
        Long totalPrecedent = countProduitsPrecedent(token);

        if (totalPrecedent == null || totalPrecedent == 0) return 0.0;
        return ((totalActuel - totalPrecedent) * 100.0) / totalPrecedent;
    }

    private Double calculateTendanceStock(String token) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime monthAgo = now.minusMonths(1);

        Map<String, Long> statsMois = getEntreesAndSorties(monthAgo, now, token);
        Map<String, Long> statsMoisPrecedent = getEntreesAndSorties(monthAgo.minusMonths(1), monthAgo, token);

        Long mouvementsMois = statsMois.get("ENTREE") + statsMois.get("SORTIE");
        Long mouvementsPrecedent = statsMoisPrecedent.get("ENTREE") + statsMoisPrecedent.get("SORTIE");

        if (mouvementsPrecedent == null || mouvementsPrecedent == 0) return 0.0;
        return ((mouvementsMois - mouvementsPrecedent) * 100.0) / mouvementsPrecedent;
    }

    private Double calculateTauxService(String token) {
        Long commandesLivrees = countCommandesByStatutAndDate("RECUE", null, null, token);
        Long commandesTotales = countTotalCommandes(token);

        if (commandesTotales == null || commandesTotales == 0) return 100.0;
        return (commandesLivrees != null ? commandesLivrees : 0L) * 100.0 / commandesTotales;
    }

    private AlerteStockDTO buildAlerte(Produit produit, String type) {
        return AlerteStockDTO.builder()
                .produitId(Long.valueOf(produit.getIdProduit()))
                .produitNom(produit.getLibelle())
                .stockActuel(produit.getQuantiteStock())
                .stockMin(produit.getSeuilMinimum())
                .typeAlerte(type)
                .build();
    }

    private List<MouvementStockPeriodDTO> getMouvementsParSemaine(LocalDateTime startDate, LocalDateTime endDate, String token) {
        List<MouvementStockPeriodDTO> result = new ArrayList<>();

        LocalDate start = startDate.toLocalDate();
        LocalDate end = endDate.toLocalDate();
        long weeksBetween = ChronoUnit.WEEKS.between(start, end);
        int maxWeeks = (int) Math.min(weeksBetween + 1, 12);

        for (int i = 0; i < maxWeeks; i++) {
            LocalDate weekStart = start.plusWeeks(i).with(DayOfWeek.MONDAY);
            LocalDate weekEnd = weekStart.plusDays(6);

            if (weekStart.isAfter(end)) break;
            if (weekEnd.isAfter(end)) weekEnd = end;

            LocalDateTime weekStartDateTime = weekStart.atStartOfDay();
            LocalDateTime weekEndDateTime = weekEnd.atTime(23, 59, 59);

            Map<String, Long> stats = getEntreesAndSorties(weekStartDateTime, weekEndDateTime, token);

            String weekLabel = String.format("Sem %d (%s/%s → %s/%s)",
                    weekStart.get(WeekFields.ISO.weekOfWeekBasedYear()),
                    weekStart.getDayOfMonth(), weekStart.getMonthValue(),
                    weekEnd.getDayOfMonth(), weekEnd.getMonthValue());

            result.add(MouvementStockPeriodDTO.builder()
                    .label(weekLabel)
                    .entrees(stats.get("ENTREE"))
                    .sorties(stats.get("SORTIE"))
                    .max(0L)
                    .build());
        }

        long max = result.stream()
                .mapToLong(dto -> Math.max(dto.getEntrees(), dto.getSorties()))
                .max()
                .orElse(100L);

        for (MouvementStockPeriodDTO dto : result) {
            dto.setMax(max != 0 ? max : 100L);
        }

        return result;
    }

    private String getMonthName(int month) {
        String[] months = {"Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"};
        return months[month - 1];
    }

    private String formatDateRange(LocalDate startDate, LocalDate endDate) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        return startDate.format(formatter) + " → " + endDate.format(formatter);
    }

    // ==================== MÉTHODES PUBLIQUES ====================

    public DashboardStatsDTO getDashboardStats(LocalDate startDate, LocalDate endDate, String token) {
        LocalDateTime startDateTime;
        LocalDateTime endDateTime;

        if (startDate != null && endDate != null) {
            startDateTime = startDate.atStartOfDay();
            endDateTime = endDate.atTime(23, 59, 59);
        } else {
            endDateTime = LocalDateTime.now();
            startDateTime = endDateTime.minusDays(30);
        }

        return DashboardStatsDTO.builder()
                .commandes(DashboardStatsDTO.CommandesStats.builder()
                        .total(countCommandesByDate(startDateTime, endDateTime, token))
                        .enAttente(countCommandesByStatutAndDate("BROUILLON", startDateTime, endDateTime, token))
                        .enCours(countCommandesByStatutAndDate("ENVOYEE", startDateTime, endDateTime, token))
                        .livre(countCommandesByStatutAndDate("RECUE", startDateTime, endDateTime, token))
                        .tendance(calculateTendanceCommandes(startDateTime, endDateTime, token))
                        .build())
                .produits(DashboardStatsDTO.ProduitsStats.builder()
                        .total(countProduits(token))
                        .actifs(countProduitsActifs(token))
                        .rupture(countProduitsRupture(token))
                        .alerte(countProduitsCritique(token))
                        .tendance(calculateTendanceProduits(token))
                        .build())
                .stock(DashboardStatsDTO.StockStats.builder()
                        .valeurTotale(sommeValeurStockTotale(token))
                        .mouvementsMois(getMouvementsMois(startDateTime, endDateTime, token))
                        .rotation(getRotationStock(token))
                        .tendance(calculateTendanceStock(token))
                        .build())
                .build();
    }

    public DashboardStatsDTO.CommandesStats getCommandesStats(LocalDate startDate, LocalDate endDate, String filtre, String token) {
        if (startDate == null) startDate = LocalDate.now().minusDays(30);
        if (endDate == null) endDate = LocalDate.now();

        LocalDateTime debut = startDate.atStartOfDay();
        LocalDateTime fin = endDate.atTime(23, 59, 59);

        Long total = Optional.ofNullable(countCommandesByDate(debut, fin, token)).orElse(0L);
        Long enAttente = Optional.ofNullable(countCommandesByStatutAndDate("BROUILLON", debut, fin, token)).orElse(0L);
        Long enCours = Optional.ofNullable(countCommandesByStatutAndDate("ENVOYEE", debut, fin, token)).orElse(0L);
        Long livre = Optional.ofNullable(countCommandesByStatutAndDate("RECUE", debut, fin, token)).orElse(0L);

        Double tendance = total > 0 ? (enCours + livre) * 100.0 / total : 0.0;

        return DashboardStatsDTO.CommandesStats.builder()
                .total(total)
                .enAttente(enAttente)
                .enCours(enCours)
                .livre(livre)
                .tendance(tendance)
                .build();
    }

    public List<EvolutionCommandesDTO> getEvolutionCommandes(int annee, String token) {
        List<Object[]> results = findCommandesByMonth(annee, token);
        Map<Integer, EvolutionCommandesDTO> monthMap = new LinkedHashMap<>();

        for (int i = 1; i <= 12; i++) {
            monthMap.put(i, new EvolutionCommandesDTO(getMonthName(i), 0L, 0.0));
        }

        for (Object[] result : results) {
            if (result[0] == null) continue;
            Integer month = ((Number) result[0]).intValue();
            Long count = result[1] != null ? ((Number) result[1]).longValue() : 0L;
            Double total = result[2] != null ? ((Number) result[2]).doubleValue() : 0.0;
            monthMap.put(month, new EvolutionCommandesDTO(getMonthName(month), count, total));
        }

        return new ArrayList<>(monthMap.values());
    }

    public DashboardStatsDTO.StockStats getStockStats(LocalDateTime startDate, LocalDateTime endDate, String token) {
        if (startDate == null) startDate = LocalDateTime.now().minusDays(30);
        if (endDate == null) endDate = LocalDateTime.now();

        Map<String, Long> stats = getEntreesAndSorties(startDate, endDate, token);

        Long entrees = stats.get("ENTREE");
        Long sorties = stats.get("SORTIE");
        Long max = Math.max(entrees, sorties);

        return DashboardStatsDTO.StockStats.builder()
                .entrees(entrees)
                .sorties(sorties)
                .max(max != 0 ? max : 100L)
                .build();
    }

    public List<MouvementStockPeriodDTO> getMouvementsStock(String periode, LocalDate startDate, LocalDate endDate, String token) {
        List<MouvementStockPeriodDTO> result = new ArrayList<>();
        String dateRangeLabel = "";

        if (startDate != null && endDate != null) {
            dateRangeLabel = formatDateRange(startDate, endDate);
            LocalDateTime startDateTime = startDate.atStartOfDay();
            LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

            LocalDate current = startDate.withDayOfMonth(1);
            LocalDate endMonth = endDate.withDayOfMonth(1);

            while (!current.isAfter(endMonth)) {
                LocalDateTime monthStart = current.atStartOfDay();
                LocalDateTime monthEnd = current.withDayOfMonth(current.lengthOfMonth()).atTime(23, 59, 59);

                if (current.isEqual(endMonth)) {
                    monthEnd = endDateTime;
                }

                Map<String, Long> stats = getEntreesAndSorties(monthStart, monthEnd, token);

                String monthLabel = current.getMonth().getDisplayName(TextStyle.SHORT, Locale.FRENCH)
                        + " " + current.getYear();

                result.add(MouvementStockPeriodDTO.builder()
                        .label(monthLabel)
                        .entrees(stats.get("ENTREE"))
                        .sorties(stats.get("SORTIE"))
                        .max(Math.max(stats.get("ENTREE"), stats.get("SORTIE")))
                        .dateRange(dateRangeLabel)
                        .build());

                current = current.plusMonths(1);
            }

        } else if ("8weeks".equals(periode)) {
            LocalDate now = LocalDate.now();
            LocalDate startDate8Weeks = now.minusWeeks(8);
            dateRangeLabel = formatDateRange(startDate8Weeks, now);

            for (int i = 7; i >= 0; i--) {
                LocalDate weekStart = now.minusWeeks(i).with(DayOfWeek.MONDAY);
                LocalDate weekEnd = weekStart.plusDays(6);

                LocalDateTime weekStartDateTime = weekStart.atStartOfDay();
                LocalDateTime weekEndDateTime = weekEnd.atTime(23, 59, 59);

                Map<String, Long> stats = getEntreesAndSorties(weekStartDateTime, weekEndDateTime, token);

                String weekLabel = String.format("Sem %d (%s)",
                        weekStart.get(WeekFields.ISO.weekOfWeekBasedYear()),
                        weekStart.getDayOfMonth() + "/" + weekStart.getMonthValue());

                result.add(MouvementStockPeriodDTO.builder()
                        .label(weekLabel)
                        .entrees(stats.get("ENTREE"))
                        .sorties(stats.get("SORTIE"))
                        .max(0L)
                        .dateRange(dateRangeLabel)
                        .build());
            }

            long max = result.stream()
                    .mapToLong(dto -> Math.max(dto.getEntrees(), dto.getSorties()))
                    .max()
                    .orElse(100L);

            for (MouvementStockPeriodDTO dto : result) {
                dto.setMax(max != 0 ? max : 100L);
            }

        } else {
            LocalDateTime endDateTime = LocalDateTime.now();
            LocalDateTime startDateTime = endDateTime.minusDays(30);
            dateRangeLabel = formatDateRange(startDateTime.toLocalDate(), endDateTime.toLocalDate());

            result = getMouvementsParSemaine(startDateTime, endDateTime, token);

            for (MouvementStockPeriodDTO dto : result) {
                dto.setDateRange(dateRangeLabel);
            }
        }

        if (result.isEmpty()) {
            result.add(MouvementStockPeriodDTO.builder()
                    .label("Aucune donnée")
                    .entrees(0L)
                    .sorties(0L)
                    .max(100L)
                    .dateRange(dateRangeLabel)
                    .build());
        }

        return result;
    }

    public List<CategorieRepartitionDTO> getRepartitionCategories(LocalDate startDate, LocalDate endDate, String token) {
        List<Object[]> results = countProduitsByCategorie(token);
        Long totalProduits = countProduits(token);

        return results.stream()
                .map(result -> {
                    Long count = ((Number) result[1]).longValue();
                    double percentage = (totalProduits != null && totalProduits > 0) ? (count * 100.0) / totalProduits : 0.0;
                    return new CategorieRepartitionDTO((String) result[0], count, percentage);
                }).collect(Collectors.toList());
    }

    public List<AlerteStockDTO> getAlertesStock(LocalDate startDate, LocalDate endDate, String token) {
        List<Produit> produitsRupture = findProduitsEnRupture(token);
        List<Produit> produitsCritiques = findProduitsStockCritique(token);

        List<AlerteStockDTO> alertes = new ArrayList<>();
        for (Produit p : produitsRupture) alertes.add(buildAlerte(p, "RUPTURE"));
        for (Produit p : produitsCritiques) alertes.add(buildAlerte(p, "CRITIQUE"));

        return alertes;
    }

    public Map<String, Object> getCommandesATraiter(String token) {
        Map<String, Object> result = new HashMap<>();
        result.put("enAttente", countCommandesByStatutAndDate("BROUILLON", null, null, token));
        result.put("enCours", countCommandesByStatutAndDate("ENVOYEE", null, null, token));
        return result;
    }

    public KPIsDTO getKPIs(String token) {
        LocalDate now = LocalDate.now();
        LocalDateTime debutMois = now.withDayOfMonth(1).atStartOfDay();
        LocalDateTime finJour = now.atTime(23, 59, 59);

        Long nbCommandesMois = countCommandesByDate(debutMois, finJour, token);
        Double panierMoyen = 0.0;
        Double rotationStock = getRotationStock(token);
        Double tauxService = calculateTauxService(token);
        double rotationValue = (rotationStock != null && rotationStock > 0) ? rotationStock : 1.0;

        return KPIsDTO.builder()
                .nombreCommandesMois(nbCommandesMois != null ? nbCommandesMois.intValue() : 0)
                .panierMoyen(panierMoyen)
                .tauxRotationStock(rotationStock != null ? rotationStock : 0.0)
                .tauxCouvertureStock(rotationStock != null ? rotationStock * 30 : 0.0)
                .joursStockMoyen((int) (360 / rotationValue))
                .tauxService(tauxService != null ? tauxService : 0.0)
                .build();
    }

    public List<StockValeurDTO> getValeurStockParCategorie(String token) {
        List<Object[]> results = sommeValeurStockByCategorie(token);
        return results.stream()
                .map(r -> new StockValeurDTO((String) r[0], (Double) r[1], ((Number) r[2]).intValue()))
                .collect(Collectors.toList());
    }

    public Double getRotationStock(String token) {
        return calculateRotationStock(token);
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 3600000)
    public void clearCache() {
        statsCache.clear();
        log.info("🗑️ Cache des statistiques vidé");
    }
}