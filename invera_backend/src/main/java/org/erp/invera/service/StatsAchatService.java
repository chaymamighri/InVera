package org.erp.invera.service;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.DashboardAchatEtStock.*;
import org.erp.invera.model.Produit;
import org.erp.invera.model.stock.StockMovement;
import org.erp.invera.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service de statistiques pour le tableau de bord des achats et stocks.
 *
 * Ce fichier fournit toutes les données nécessaires au tableau de bord :
 * - Commandes (total, en attente, en cours, livrées)
 * - Produits (total, actifs, en rupture, en alerte)
 * - Stock (valeur totale, mouvements, rotation)
 * - Factures (total, payées, impayées, montant)
 * - KPIs (chiffre d'affaires, panier moyen, taux de service...)
 *
 * Permet de filtrer par dates et d'avoir des tendances (graphiques).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsAchatService {

    private final CommandeFournisseurRepository commandeRepository;
    private final ProduitRepository produitRepository;
    private final StockMovementRepository mouvementStockRepository;
    private final FactureFournisseurRepository factureRepository;

    /**
     * Statistiques principales du tableau de bord
     * Avec filtrage optionnel par dates
     */
    public DashboardStatsDTO getDashboardStats(LocalDate startDate, LocalDate endDate) {
        // Définir des valeurs par défaut pour éviter les null
        LocalDateTime startDateTime;
        LocalDateTime endDateTime;

        if (startDate != null && endDate != null) {
            startDateTime = startDate.atStartOfDay();
            endDateTime = endDate.atTime(23, 59, 59);
        } else {
            endDateTime = LocalDateTime.now();
            startDateTime = endDateTime.minusDays(30); // 30 derniers jours par défaut
        }

        // Utiliser la méthode SANS IS NULL OR
        return DashboardStatsDTO.builder()
                .commandes(DashboardStatsDTO.CommandesStats.builder()
                        .total(commandeRepository.countByDateBetween(startDateTime, endDateTime))
                        .enAttente(commandeRepository.countByStatutAndDateBetween("EN_ATTENTE", startDateTime, endDateTime))
                        .enCours(commandeRepository.countByStatutAndDateBetween("EN_COURS", startDateTime, endDateTime))
                        .livre(commandeRepository.countByStatutAndDateBetween("LIVREE", startDateTime, endDateTime))
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
                .factures(DashboardStatsDTO.FacturesStats.builder()
                        .total(factureRepository.count())
                        .payees(factureRepository.countByStatut("PAYEE"))
                        .impayees(factureRepository.countByStatut("IMPAYEE"))
                        .montantTotal(factureRepository.sumMontantTotal())
                        .tendance(calculateTendanceFactures())
                        .build())
                .build();
    }

    /**
     * Récupère les statistiques des commandes sur une période avec filtre
     */
    public DashboardStatsDTO.CommandesStats getCommandesStats(LocalDate startDate, LocalDate endDate, String filtre) {
        // Vérifier que les dates ne sont pas null
        if (startDate == null) startDate = LocalDate.now().minusDays(30);
        if (endDate == null) endDate = LocalDate.now();

        // Conversion en LocalDateTime pour inclure toute la journée
        LocalDateTime debut = startDate.atStartOfDay();
        LocalDateTime fin = endDate.atTime(23, 59, 59);

        // Récupération des stats avec les méthodes SANS IS NULL OR
        Long total = Optional.ofNullable(commandeRepository.countByDateBetween(debut, fin)).orElse(0L);
        Long enAttente = Optional.ofNullable(commandeRepository.countByStatutAndDateBetween("EN_ATTENTE", debut, fin)).orElse(0L);
        Long enCours = Optional.ofNullable(commandeRepository.countByStatutAndDateBetween("EN_COURS", debut, fin)).orElse(0L);
        Long livre = Optional.ofNullable(commandeRepository.countByStatutAndDateBetween("LIVREE", debut, fin)).orElse(0L);

        // Calcul tendance
        Double tendance = total > 0 ? (enCours + livre) * 100.0 / total : 0.0;

        // Construction du DTO
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
     */
    public DashboardStatsDTO.StockStats getStockStats(LocalDateTime startDate, LocalDateTime endDate) {
        // Définir des valeurs par défaut si null
        if (startDate == null) startDate = LocalDateTime.now().minusDays(30);
        if (endDate == null) endDate = LocalDateTime.now();

        // Utiliser les méthodes avec LocalDateTime (pas de conversion nécessaire)
        Long entreesLong = Optional.ofNullable(
                        mouvementStockRepository.countEntreesByWeek(StockMovement.MovementType.ENTREE, startDate, endDate))
                .orElse(0L);

        Long sortiesLong = Optional.ofNullable(
                        mouvementStockRepository.countSortiesByWeek(StockMovement.MovementType.SORTIE, startDate, endDate))
                .orElse(0L);

        Long max = Math.max(entreesLong, sortiesLong);

        return DashboardStatsDTO.StockStats.builder()
                .entrees(entreesLong)
                .sorties(sortiesLong)
                .max(max != 0 ? max : 100L)
                .build();
    }

    /**
     * Récupère les mouvements de stock par période ou dates personnalisées
     */
    public List<MouvementStockPeriodDTO> getMouvementsStock(String periode, LocalDate startDate, LocalDate endDate) {
        List<MouvementStockPeriodDTO> result = new ArrayList<>();

        if (startDate != null && endDate != null) {
            // Convertir LocalDate en LocalDateTime
            LocalDateTime startDateTime = startDate.atStartOfDay();
            LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

            // Entrées et sorties sur la période personnalisée
            Long entrees = Optional.ofNullable(
                            mouvementStockRepository.countEntreesByWeek(StockMovement.MovementType.ENTREE, startDateTime, endDateTime))
                    .orElse(0L);

            Long sorties = Optional.ofNullable(
                            mouvementStockRepository.countSortiesByWeek(StockMovement.MovementType.SORTIE, startDateTime, endDateTime))
                    .orElse(0L);

            Long max = Math.max(entrees, sorties);

            result.add(MouvementStockPeriodDTO.builder()
                    .label("Période")
                    .entrees(entrees)
                    .sorties(sorties)
                    .max(max != 0 ? max : 100L)
                    .build());

        } else if ("8weeks".equals(periode)) {
            // Filtrage par 8 dernières semaines
            LocalDate now = LocalDate.now();
            for (int i = 7; i >= 0; i--) {
                LocalDate weekStart = now.minusWeeks(i).with(DayOfWeek.MONDAY);
                LocalDate weekEnd = weekStart.plusDays(6);

                LocalDateTime weekStartDateTime = weekStart.atStartOfDay();
                LocalDateTime weekEndDateTime = weekEnd.atTime(23, 59, 59);

                Long entrees = Optional.ofNullable(
                                mouvementStockRepository.countEntreesByWeek(StockMovement.MovementType.ENTREE, weekStartDateTime, weekEndDateTime))
                        .orElse(0L);

                Long sorties = Optional.ofNullable(
                                mouvementStockRepository.countSortiesByWeek(StockMovement.MovementType.SORTIE, weekStartDateTime, weekEndDateTime))
                        .orElse(0L);

                Long max = Math.max(entrees, sorties);

                result.add(MouvementStockPeriodDTO.builder()
                        .label("Sem " + (8 - i))
                        .entrees(entrees)
                        .sorties(sorties)
                        .max(max != 0 ? max : 100L)
                        .build());
            }
        } else {
            // Valeurs par défaut : 30 derniers jours
            LocalDateTime endDateTime = LocalDateTime.now();
            LocalDateTime startDateTime = endDateTime.minusDays(30);

            Long entrees = Optional.ofNullable(
                            mouvementStockRepository.countEntreesByWeek(StockMovement.MovementType.ENTREE, startDateTime, endDateTime))
                    .orElse(0L);

            Long sorties = Optional.ofNullable(
                            mouvementStockRepository.countSortiesByWeek(StockMovement.MovementType.SORTIE, startDateTime, endDateTime))
                    .orElse(0L);

            Long max = Math.max(entrees, sorties);

            result.add(MouvementStockPeriodDTO.builder()
                    .label("30 jours")
                    .entrees(entrees)
                    .sorties(sorties)
                    .max(max != 0 ? max : 100L)
                    .build());
        }

        return result;
    }

    /**
     * Répartition des produits par catégorie avec filtrage optionnel
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
     * Alertes stock avec filtrage optionnel
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
        result.put("enAttente", Optional.ofNullable(commandeRepository.countByStatut("EN_ATTENTE")).orElse(0L));
        result.put("enCours", Optional.ofNullable(commandeRepository.countByStatut("EN_COURS")).orElse(0L));
        return result;
    }

    /**
     * KPIs principaux
     */
    public KPIsDTO getKPIs() {
        LocalDate now = LocalDate.now();
        LocalDateTime debutMois = now.withDayOfMonth(1).atStartOfDay();
        LocalDateTime debutAnnee = now.withDayOfYear(1).atStartOfDay();
        LocalDateTime finJour = now.atTime(23, 59, 59);

        Double caMois = factureRepository.sumMontantByDateBetween(debutMois, finJour);
        Double caAnnee = factureRepository.sumMontantByDateBetween(debutAnnee, finJour);
        Long nbCommandesMois = commandeRepository.countByDateBetween(debutMois, finJour);
        Double panierMoyen = (nbCommandesMois != null && nbCommandesMois > 0 && caMois != null) ? caMois / nbCommandesMois : 0.0;
        Double rotationStock = calculateRotationStock();
        Double tauxService = calculateTauxService();
        double rotationValue = (rotationStock != null && rotationStock > 0) ? rotationStock : 1.0;

        return KPIsDTO.builder()
                .chiffreAffairesMois(caMois != null ? caMois : 0.0)
                .chiffreAffairesAnnee(caAnnee != null ? caAnnee : 0.0)
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
        BigDecimal totalSorties = mouvementStockRepository.sumQuantiteByTypeAndPeriod(StockMovement.MovementType.SORTIE, startOfYear, now);
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
    private Double calculateTendanceFactures() { return 8.0; }

    private Double calculateTauxService() {
        Long commandesLivrees = commandeRepository.countByStatut("LIVREE");
        Long commandesTotales = commandeRepository.countTotalCommandes();
        if (commandesTotales == null || commandesTotales == 0) return 100.0;
        return (commandesLivrees != null ? commandesLivrees : 0L) * 100.0 / commandesTotales;
    }

    private String getMonthName(int month) {
        String[] months = {"Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"};
        return months[month - 1];
    }
}