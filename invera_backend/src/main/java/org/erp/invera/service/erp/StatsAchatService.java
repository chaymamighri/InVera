package org.erp.invera.service.erp;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.erp.DashboardAchatEtStock.*;
import org.erp.invera.model.erp.Produit;
import org.erp.invera.model.erp.stock.StockMovement;
import org.erp.invera.repository.erp.CommandeFournisseurRepository;
import org.erp.invera.repository.erp.ProduitRepository;
import org.erp.invera.repository.erp.StockMovementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service de statistiques pour le tableau de bord des achats et stocks.
 * OPTIMISÉ : Utilise une seule requête SQL par période pour les entrées/sorties
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsAchatService {

    private final CommandeFournisseurRepository commandeRepository;
    private final ProduitRepository produitRepository;
    private final StockMovementRepository mouvementStockRepository;

    // Cache simple pour éviter les doublons sur la même période
    private final Map<String, Map<String, Long>> statsCache = new HashMap<>();

    /**
     * Méthode utilitaire qui récupère entrées ET sorties en UNE SEULE requête
     * avec mise en cache automatique
     */
    private Map<String, Long> getEntreesAndSorties(LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate == null || endDate == null) {
            Map<String, Long> empty = new HashMap<>();
            empty.put("ENTREE", 0L);
            empty.put("SORTIE", 0L);
            return empty;
        }

        String cacheKey = startDate.toString() + "_" + endDate.toString();

        // Vérifier le cache
        if (statsCache.containsKey(cacheKey)) {
            return statsCache.get(cacheKey);
        }

        // Une seule requête pour les deux types de mouvements
        List<Object[]> result = mouvementStockRepository.getEntreesAndSortiesByPeriod(startDate, endDate);

        Map<String, Long> stats = new HashMap<>();
        if (result != null && !result.isEmpty() && result.get(0) != null) {
            Object[] row = result.get(0);
            stats.put("ENTREE", row[0] != null ? ((Number) row[0]).longValue() : 0L);
            stats.put("SORTIE", row[1] != null ? ((Number) row[1]).longValue() : 0L);
        } else {
            stats.put("ENTREE", 0L);
            stats.put("SORTIE", 0L);
        }

        // Mettre en cache
        statsCache.put(cacheKey, stats);

        return stats;
    }

    /**
     * Statistiques principales du tableau de bord
     */
    public DashboardStatsDTO getDashboardStats(LocalDate startDate, LocalDate endDate) {
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
                        .total(commandeRepository.countByDateBetween(startDateTime, endDateTime))
                        .enAttente(commandeRepository.countByStatutAndDateBetween("BROUILLON", startDateTime, endDateTime))
                        .enCours(commandeRepository.countByStatutAndDateBetween("ENVOYEE", startDateTime, endDateTime))
                        .livre(commandeRepository.countByStatutAndDateBetween("RECUE", startDateTime, endDateTime))
                        .tendance(calculateTendanceCommandes(startDateTime, endDateTime))
                        .build())
                .produits(DashboardStatsDTO.ProduitsStats.builder()
                        .total(produitRepository.count())
                        .actifs(produitRepository.countByActiveTrue())
                        .rupture(produitRepository.countByStockActuelEqualsZero())
                        .alerte(produitRepository.countByStockCritique())
                        .tendance(calculateTendanceProduits())
                        .build())
                .stock(DashboardStatsDTO.StockStats.builder()
                        .valeurTotale(produitRepository.sumValeurStockTotale())
                        .mouvementsMois(getMouvementsMois(startDateTime, endDateTime))
                        .rotation(getRotationStock())
                        .tendance(calculateTendanceStock())
                        .build())
                .build();
    }

    /**
     * Récupère les statistiques des commandes sur une période
     */
    public DashboardStatsDTO.CommandesStats getCommandesStats(LocalDate startDate, LocalDate endDate, String filtre) {
        if (startDate == null) startDate = LocalDate.now().minusDays(30);
        if (endDate == null) endDate = LocalDate.now();

        LocalDateTime debut = startDate.atStartOfDay();
        LocalDateTime fin = endDate.atTime(23, 59, 59);

        Long total = Optional.ofNullable(commandeRepository.countByDateBetween(debut, fin)).orElse(0L);
        Long enAttente = Optional.ofNullable(commandeRepository.countByStatutAndDateBetween("BROUILLON", debut, fin)).orElse(0L);
        Long enCours = Optional.ofNullable(commandeRepository.countByStatutAndDateBetween("ENVOYEE", debut, fin)).orElse(0L);
        Long livre = Optional.ofNullable(commandeRepository.countByStatutAndDateBetween("RECUE", debut, fin)).orElse(0L);

        Double tendance = total > 0 ? (enCours + livre) * 100.0 / total : 0.0;

        return DashboardStatsDTO.CommandesStats.builder()
                .total(total)
                .enAttente(enAttente)
                .enCours(enCours)
                .livre(livre)
                .tendance(tendance)
                .build();
    }

    /**
     * Évolution des commandes sur l'année
     */
    public List<EvolutionCommandesDTO> getEvolutionCommandes(int annee) {
        List<Object[]> results = commandeRepository.findCommandesByMonth(annee);
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

    /**
     * Récupère les statistiques de mouvements de stock sur une période
     * ✅ OPTIMISÉ : Une seule requête
     */
    public DashboardStatsDTO.StockStats getStockStats(LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate == null) startDate = LocalDateTime.now().minusDays(30);
        if (endDate == null) endDate = LocalDateTime.now();

        // Une seule requête pour entrées ET sorties
        Map<String, Long> stats = getEntreesAndSorties(startDate, endDate);

        Long entrees = stats.get("ENTREE");
        Long sorties = stats.get("SORTIE");
        Long max = Math.max(entrees, sorties);

        return DashboardStatsDTO.StockStats.builder()
                .entrees(entrees)
                .sorties(sorties)
                .max(max != 0 ? max : 100L)
                .build();
    }

    /**
     * Récupère les mouvements de stock par période
     * ✅ OPTIMISÉ : Une seule requête par période
     */
    public List<MouvementStockPeriodDTO> getMouvementsStock(String periode, LocalDate startDate, LocalDate endDate) {
        List<MouvementStockPeriodDTO> result = new ArrayList<>();
        String dateRangeLabel = "";

        if (startDate != null && endDate != null) {
            // Cas 1 : Dates personnalisées (par mois)
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

                // ✅ UNE SEULE requête par mois
                Map<String, Long> stats = getEntreesAndSorties(monthStart, monthEnd);

                String monthLabel = current.getMonth().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.FRENCH)
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
            // Cas 2 : 8 semaines
            LocalDate now = LocalDate.now();
            LocalDate startDate8Weeks = now.minusWeeks(8);
            dateRangeLabel = formatDateRange(startDate8Weeks, now);

            for (int i = 7; i >= 0; i--) {
                LocalDate weekStart = now.minusWeeks(i).with(DayOfWeek.MONDAY);
                LocalDate weekEnd = weekStart.plusDays(6);

                LocalDateTime weekStartDateTime = weekStart.atStartOfDay();
                LocalDateTime weekEndDateTime = weekEnd.atTime(23, 59, 59);

                // ✅ UNE SEULE requête par semaine
                Map<String, Long> stats = getEntreesAndSorties(weekStartDateTime, weekEndDateTime);

                String weekLabel = String.format("Sem %d (%s)",
                        weekStart.get(java.time.temporal.WeekFields.ISO.weekOfWeekBasedYear()),
                        weekStart.getDayOfMonth() + "/" + (weekStart.getMonthValue()));

                result.add(MouvementStockPeriodDTO.builder()
                        .label(weekLabel)
                        .entrees(stats.get("ENTREE"))
                        .sorties(stats.get("SORTIE"))
                        .max(0L)
                        .dateRange(dateRangeLabel)
                        .build());
            }

            // Calcul du max après la boucle
            long max = result.stream()
                    .mapToLong(dto -> Math.max(dto.getEntrees(), dto.getSorties()))
                    .max()
                    .orElse(100L);

            for (MouvementStockPeriodDTO dto : result) {
                dto.setMax(max != 0 ? max : 100L);
            }

        } else {
            // Cas 3 : 30 jours par défaut
            LocalDateTime endDateTime = LocalDateTime.now();
            LocalDateTime startDateTime = endDateTime.minusDays(30);
            dateRangeLabel = formatDateRange(startDateTime.toLocalDate(), endDateTime.toLocalDate());

            result = getMouvementsParSemaine(startDateTime, endDateTime);

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

    /**
     * Regroupe les mouvements par SEMAINE
     * ✅ OPTIMISÉ : Une seule requête par semaine
     */
    private List<MouvementStockPeriodDTO> getMouvementsParSemaine(LocalDateTime startDate, LocalDateTime endDate) {
        List<MouvementStockPeriodDTO> result = new ArrayList<>();

        LocalDate start = startDate.toLocalDate();
        LocalDate end = endDate.toLocalDate();
        long weeksBetween = java.time.temporal.ChronoUnit.WEEKS.between(start, end);
        int maxWeeks = (int) Math.min(weeksBetween + 1, 12);

        for (int i = 0; i < maxWeeks; i++) {
            LocalDate weekStart = start.plusWeeks(i).with(DayOfWeek.MONDAY);
            LocalDate weekEnd = weekStart.plusDays(6);

            if (weekStart.isAfter(end)) break;
            if (weekEnd.isAfter(end)) weekEnd = end;

            LocalDateTime weekStartDateTime = weekStart.atStartOfDay();
            LocalDateTime weekEndDateTime = weekEnd.atTime(23, 59, 59);

            // ✅ UNE SEULE requête par semaine
            Map<String, Long> stats = getEntreesAndSorties(weekStartDateTime, weekEndDateTime);

            String weekLabel = String.format("Sem %d (%s/%s → %s/%s)",
                    weekStart.get(java.time.temporal.WeekFields.ISO.weekOfWeekBasedYear()),
                    weekStart.getDayOfMonth(), weekStart.getMonthValue(),
                    weekEnd.getDayOfMonth(), weekEnd.getMonthValue());

            result.add(MouvementStockPeriodDTO.builder()
                    .label(weekLabel)
                    .entrees(stats.get("ENTREE"))
                    .sorties(stats.get("SORTIE"))
                    .max(0L)
                    .build());
        }

        // Calculer le max global
        long max = result.stream()
                .mapToLong(dto -> Math.max(dto.getEntrees(), dto.getSorties()))
                .max()
                .orElse(100L);

        for (MouvementStockPeriodDTO dto : result) {
            dto.setMax(max != 0 ? max : 100L);
        }

        return result;
    }

    /**
     * Répartition des produits par catégorie
     */
    public List<CategorieRepartitionDTO> getRepartitionCategories(LocalDate startDate, LocalDate endDate) {
        List<Object[]> results = produitRepository.countByCategorie();
        Long totalProduits = produitRepository.count();

        return results.stream()
                .map(result -> {
                    Long count = ((Number) result[1]).longValue();
                    double percentage = (totalProduits != null && totalProduits > 0) ? (count * 100.0) / totalProduits : 0.0;
                    return new CategorieRepartitionDTO((String) result[0], count, percentage);
                }).collect(Collectors.toList());
    }

    /**
     * Alertes stock
     */
    public List<AlerteStockDTO> getAlertesStock(LocalDate startDate, LocalDate endDate) {
        List<Produit> produitsRupture = produitRepository.findProduitsEnRupture();
        List<Produit> produitsCritiques = produitRepository.findProduitsStockCritique();

        List<AlerteStockDTO> alertes = new ArrayList<>();
        for (Produit p : produitsRupture) alertes.add(buildAlerte(p, "RUPTURE"));
        for (Produit p : produitsCritiques) alertes.add(buildAlerte(p, "CRITIQUE"));

        return alertes;
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

    /**
     * Commandes en attente
     */
    public Map<String, Object> getCommandesATraiter() {
        Map<String, Object> result = new HashMap<>();
        result.put("enAttente", commandeRepository.countByStatut("BROUILLON"));
        result.put("enCours", commandeRepository.countByStatut("ENVOYEE"));
        return result;
    }

    /**
     * KPIs principaux
     */
    public KPIsDTO getKPIs() {
        LocalDate now = LocalDate.now();
        LocalDateTime debutMois = now.withDayOfMonth(1).atStartOfDay();
        LocalDateTime finJour = now.atTime(23, 59, 59);

        Long nbCommandesMois = commandeRepository.countByDateBetween(debutMois, finJour);
        Double panierMoyen = 0.0;
        Double rotationStock = calculateRotationStock();
        Double tauxService = calculateTauxService();
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

    /**
     * Valeur du stock par catégorie
     */
    public List<StockValeurDTO> getValeurStockParCategorie() {
        List<Object[]> results = produitRepository.sumValeurStockByCategorie();
        return results.stream()
                .map(r -> new StockValeurDTO((String) r[0], (Double) r[1], ((Number) r[2]).intValue()))
                .collect(Collectors.toList());
    }

    /**
     * Rotation des stocks
     */
    public Double getRotationStock() {
        return calculateRotationStock();
    }

    // ======= Méthodes privées =======

    private Long getMouvementsMois(LocalDateTime start, LocalDateTime end) {
        LocalDateTime startDate = start != null ? start : LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime endDate = end != null ? end : LocalDateTime.now();
        return Optional.ofNullable(mouvementStockRepository.countByDateMouvementBetween(startDate, endDate)).orElse(0L);
    }

    private Double calculateRotationStock() {
        LocalDateTime startOfYear = LocalDateTime.now().withDayOfYear(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime now = LocalDateTime.now();

        // Utilise la méthode optimisée
        Map<String, Long> stats = getEntreesAndSorties(startOfYear, now);
        BigDecimal totalSorties = BigDecimal.valueOf(stats.get("SORTIE"));

        Double stockMoyen = produitRepository.averageStock();
        if (stockMoyen == null || stockMoyen == 0) return 0.0;
        if (totalSorties == null) totalSorties = BigDecimal.ZERO;

        return totalSorties.divide(BigDecimal.valueOf(stockMoyen), 2, RoundingMode.HALF_UP).doubleValue();
    }

    private Double calculateTendanceCommandes(LocalDateTime startDateTime, LocalDateTime endDateTime) {
        return 0.0;
    }

    private Double calculateTendanceProduits() { return 5.0; }
    private Double calculateTendanceStock() { return 3.5; }

    private Double calculateTauxService() {
        Long commandesLivrees = commandeRepository.countByStatut("RECUE");
        Long commandesTotales = commandeRepository.countTotalCommandes();
        if (commandesTotales == null || commandesTotales == 0) return 100.0;
        return (commandesLivrees != null ? commandesLivrees : 0L) * 100.0 / commandesTotales;
    }

    private String getMonthName(int month) {
        String[] months = {"Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"};
        return months[month - 1];
    }

    private String formatDateRange(LocalDate startDate, LocalDate endDate) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        return startDate.format(formatter) + " → " + endDate.format(formatter);
    }

    /**
     * Nettoyage périodique du cache (toutes les heures)
     */
    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 3600000)
    public void clearCache() {
        statsCache.clear();
    }
}