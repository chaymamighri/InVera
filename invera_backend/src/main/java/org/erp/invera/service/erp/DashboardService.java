package org.erp.invera.service.erp;

import org.erp.invera.dto.erp.DashboardVente.DashboardDTO;
import org.erp.invera.model.erp.client.Client;
import org.erp.invera.model.erp.client.CommandeClient;
import org.erp.invera.model.erp.client.FactureClient;
import lombok.RequiredArgsConstructor;
import org.erp.invera.repository.erp.CommandeClientRepository;
import org.erp.invera.repository.erp.FactureClientRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service du tableau de bord (Dashboard).
 *
 * Ce fichier fournit toutes les données nécessaires au tableau de bord
 * pour visualiser la performance commerciale :
 *
 * 1. KPI (INDICATEURS CLÉS) :
 *    - Chiffre d'affaires (période actuelle vs précédente)
 *    - Nombre de commandes
 *    - Panier moyen
 *    - Taux de transformation
 *    - Créances (factures impayées et en retard)
 *    - Variations (semaine, mois, année)
 *
 * 2. GRAPHIQUES :
 *    - Évolution du CA sur la période
 *    - Top 5 des produits les plus vendus
 *    - Répartition des commandes par statut (confirmée, en attente, annulée)
 *    - Évolution quotidienne des commandes et CA
 *    - Répartition par type de client (VIP, entreprise, particulier...)
 *
 * 3. FILTRES :
 *    - Périodes prédéfinies : aujourd'hui, semaine, mois
 *    - Période personnalisée (dates libres)
 *
 * Toutes les données sont calculées en temps réel depuis la base.
 */

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CommandeClientRepository commandeRepo;
    private final FactureClientRepository factureRepo;

    public DashboardDTO getSummary(String period) {
        Periode periode = calculerPeriode(period);

        DashboardDTO dto = new DashboardDTO();
        dto.setSuccess(true);
        dto.setPeriod(period);
        dto.setKpi(calculerKPI(periode));
        dto.setCharts(calculerCharts(periode));
        dto.setStatusRepartition(getStatusRepartition(periode));
        dto.setOrdersEvolution(getOrdersEvolution(periode));
        dto.setClientTypeRepartition(getClientTypeRepartition(periode));

        return dto;
    }

    public DashboardDTO getCustomSummary(LocalDate startDate, LocalDate endDate) {
        Periode periode = new Periode();
        periode.setDebut(startDate);
        periode.setFin(endDate);
        periode.setDebutCompare(null);
        periode.setFinCompare(null);

        return new DashboardDTO(
                true,
                "Période personnalisée",
                "custom",
                calculerKPI(periode),
                calculerCharts(periode),
                getStatusRepartition(periode),
                getOrdersEvolution(periode),
                getClientTypeRepartition(periode)
        );
    }

    // ========================
    //  RÉPARTITION PAR STATUT
    // ========================
    private List<DashboardDTO.StatusData> getStatusRepartition(Periode p) {
        LocalDateTime debut = p.getDebut().atStartOfDay();
        LocalDateTime fin = p.getFin().atTime(23, 59, 59);

        List<Object[]> results = commandeRepo.getStatusRepartition(debut, fin);

        return results.stream()
                .map(row -> {
                    DashboardDTO.StatusData data = new DashboardDTO.StatusData();
                    CommandeClient.StatutCommande statutEnum = (CommandeClient.StatutCommande) row[0];
                    data.setStatut(statutEnum.name());
                    data.setNombre(((Number) row[1]).longValue());
                    data.setMontant((BigDecimal) row[2]);
                    data.setPourcentage(0.0);

                    switch(statutEnum) {
                        case CONFIRMEE:
                            data.setCouleur("#10B981");
                            break;
                        case EN_ATTENTE:
                            data.setCouleur("#F59E0B");
                            break;
                        case ANNULEE:
                            data.setCouleur("#EF4444");
                            break;
                        default:
                            data.setCouleur("#6B7280");
                    }
                    return data;
                })
                .collect(Collectors.toList());
    }

    // ========================
    // ÉVOLUTION DES COMMANDES
    // ========================
    private List<DashboardDTO.OrdersEvolutionData> getOrdersEvolution(Periode p) {
        List<DashboardDTO.OrdersEvolutionData> evolution = new ArrayList<>();
        LocalDateTime debut = p.getDebut().atStartOfDay();
        LocalDateTime fin = p.getFin().atTime(23, 59, 59);
        List<Object[]> results = commandeRepo.getDailyOrdersStats(debut, fin);

        for (Object[] row : results) {
            DashboardDTO.OrdersEvolutionData data = new DashboardDTO.OrdersEvolutionData();
            data.setDate(row[0].toString());
            data.setCommandes(((Number) row[1]).longValue());
            data.setCa((BigDecimal) row[2]);
            evolution.add(data);
        }
        return evolution;
    }

    // ========================
    //  RÉPARTITION PAR TYPE DE CLIENT (SANS PROFESSIONNEL)
    // ========================
    private List<DashboardDTO.ClientTypeData> getClientTypeRepartition(Periode p) {
        LocalDateTime debut = p.getDebutDateTime();
        LocalDateTime fin = p.getFinDateTime();

        List<Object[]> results = commandeRepo.getSalesByClientType(debut, fin);

        // ✅ Initialiser avec tous les types de clients existants
        Map<String, DashboardDTO.ClientTypeData> typeMap = new LinkedHashMap<>();

        for (Client.TypeClient type : Client.TypeClient.values()) {
            DashboardDTO.ClientTypeData data = new DashboardDTO.ClientTypeData();
            data.setType(type.name());
            data.setMontant(BigDecimal.ZERO);
            data.setNombre(0L);

            switch(type) {
                case VIP:
                    data.setCouleur("#8B5CF6");
                    break;
                case ENTREPRISE:
                    data.setCouleur("#10B981");
                    break;
                case FIDELE:
                    data.setCouleur("#F59E0B");
                    break;
                case PARTICULIER:
                    data.setCouleur("#6B7280");
                    break;
                default:
                    data.setCouleur("#94A3B8");
            }
            typeMap.put(type.name(), data);
        }

        // ✅ Agréger les résultats sans conversion (PROFESSIONNEL n'existe plus)
        if (results != null && !results.isEmpty()) {
            for (Object[] row : results) {
                try {
                    Client.TypeClient typeEnum = (Client.TypeClient) row[0];
                    String typeName = typeEnum.name();
                    Long nombre = ((Number) row[1]).longValue();
                    BigDecimal montant = (BigDecimal) row[2];

                    if (typeMap.containsKey(typeName)) {
                        DashboardDTO.ClientTypeData data = typeMap.get(typeName);
                        data.setNombre(data.getNombre() + nombre);
                        data.setMontant(data.getMontant().add(montant));
                    }
                } catch (Exception e) {
                    System.err.println("Erreur traitement type client: " + e.getMessage());
                }
            }
        }

        // ✅ Filtrer les types sans données
        return typeMap.values().stream()
                .filter(data -> data.getMontant().compareTo(BigDecimal.ZERO) > 0 || data.getNombre() > 0)
                .collect(Collectors.toList());
    }

    // ========================
    //  CALCUL PÉRIODE
    // ========================
    private Periode calculerPeriode(String period) {
        LocalDate now = LocalDate.now();
        Periode p = new Periode();

        switch(period) {
            case "today":
                p.setDebut(now);
                p.setFin(now);
                p.setDebutCompare(now.minusDays(1));
                p.setFinCompare(now.minusDays(1));
                break;
            case "week":
                p.setDebut(now.with(DayOfWeek.MONDAY));
                p.setFin(now);
                p.setDebutCompare(p.getDebut().minusWeeks(1));
                p.setFinCompare(p.getFin().minusWeeks(1));
                break;
            case "month":
                p.setDebut(now.withDayOfMonth(1));
                p.setFin(now);
                p.setDebutCompare(p.getDebut().minusMonths(1));
                p.setFinCompare(p.getDebutCompare().withDayOfMonth(
                        p.getDebutCompare().lengthOfMonth()));
                break;
            default:
                p.setDebut(now);
                p.setFin(now);
                p.setDebutCompare(now.minusDays(1));
                p.setFinCompare(now.minusDays(1));
        }
        return p;
    }

    // ========================
    //  CALCUL KPI
    // ========================
    private DashboardDTO.KPI calculerKPI(Periode p) {
        LocalDateTime debutDateTime = p.getDebut().atStartOfDay();
        LocalDateTime finDateTime = p.getFin().atTime(23, 59, 59);
        LocalDateTime debutCompareDateTime = p.getDebutCompare() != null ?
                p.getDebutCompare().atStartOfDay() : null;
        LocalDateTime finCompareDateTime = p.getFinCompare() != null ?
                p.getFinCompare().atTime(23, 59, 59) : null;

        BigDecimal caActuel = commandeRepo.sumTotalByPeriode(debutDateTime, finDateTime);
        long cmdActuel = commandeRepo.countByPeriode(debutDateTime, finDateTime);

        BigDecimal caPrecedent = (debutCompareDateTime != null && finCompareDateTime != null) ?
                commandeRepo.sumTotalByPeriode(debutCompareDateTime, finCompareDateTime) : BigDecimal.ZERO;
        long cmdPrecedent = (debutCompareDateTime != null && finCompareDateTime != null) ?
                commandeRepo.countByPeriode(debutCompareDateTime, finCompareDateTime) : 0L;

        // Semaine
        LocalDateTime debutSemaine = p.getDebut().with(DayOfWeek.MONDAY).atStartOfDay();
        LocalDateTime finSemaine = p.getFin().with(DayOfWeek.SUNDAY).atTime(23, 59, 59);
        BigDecimal caSemaine = commandeRepo.sumTotalByPeriode(debutSemaine, finSemaine);
        long commandesSemaine = commandeRepo.countByPeriode(debutSemaine, finSemaine);

        LocalDateTime debutSemaineDerniere = debutSemaine.minusWeeks(1);
        LocalDateTime finSemaineDerniere = finSemaine.minusWeeks(1);
        BigDecimal caSemaineDerniere = commandeRepo.sumTotalByPeriode(debutSemaineDerniere, finSemaineDerniere);
        BigDecimal variationSemaine = calculerVariation(caSemaine, caSemaineDerniere);

        // Mois
        LocalDateTime debutMois = p.getDebut().withDayOfMonth(1).atStartOfDay();
        LocalDateTime finMois = p.getFin().withDayOfMonth(p.getFin().lengthOfMonth()).atTime(23, 59, 59);
        BigDecimal caMois = commandeRepo.sumTotalByPeriode(debutMois, finMois);
        long commandesMois = commandeRepo.countByPeriode(debutMois, finMois);

        LocalDateTime debutMoisDernier = debutMois.minusMonths(1);
        LocalDateTime finMoisDernier = finMois.minusMonths(1);
        BigDecimal caMoisDernier = commandeRepo.sumTotalByPeriode(debutMoisDernier, finMoisDernier);
        BigDecimal variationMois = calculerVariation(caMois, caMoisDernier);

        // Année
        LocalDateTime debutAnnee = LocalDate.now().withDayOfYear(1).atStartOfDay();
        LocalDateTime finAnnee = LocalDate.now().withMonth(12).withDayOfMonth(31).atTime(23, 59, 59);
        BigDecimal caAnnee = commandeRepo.sumTotalByPeriode(debutAnnee, finAnnee);
        long commandesAnnee = commandeRepo.countByPeriode(debutAnnee, finAnnee);

        LocalDateTime debutAnneeDerniere = debutAnnee.minusYears(1);
        LocalDateTime finAnneeDerniere = finAnnee.minusYears(1);
        BigDecimal caAnneeDerniere = commandeRepo.sumTotalByPeriode(debutAnneeDerniere, finAnneeDerniere);
        BigDecimal variationAnnee = calculerVariation(caAnnee, caAnneeDerniere);

        BigDecimal panierMoyen = cmdActuel > 0 ?
                caActuel.divide(BigDecimal.valueOf(cmdActuel), 2, RoundingMode.HALF_UP) :
                BigDecimal.ZERO;

        BigDecimal tauxTransfo = commandeRepo.tauxTransformation(debutDateTime, finDateTime);

        BigDecimal creancesTotal = factureRepo.sumMontantByStatut(FactureClient.StatutFacture.NON_PAYE);
        long creancesNombre = factureRepo.countByStatut(FactureClient.StatutFacture.NON_PAYE);
        LocalDateTime dateRetard = LocalDate.now().minusDays(30).atStartOfDay();
        long facturesRetard = factureRepo.countEnRetard(dateRetard);

        return new DashboardDTO.KPI(
                caActuel, caPrecedent, caSemaine, caMois, caAnnee,
                calculerVariation(caActuel, caPrecedent),
                variationSemaine, variationMois, variationAnnee,
                cmdActuel, cmdPrecedent,
                commandesSemaine, commandesMois, commandesAnnee,
                panierMoyen, tauxTransfo,
                creancesTotal, creancesNombre, facturesRetard
        );
    }

    // ========================
    //  CALCUL CHARTS
    // ========================
    private DashboardDTO.Charts calculerCharts(Periode p) {
        List<DashboardDTO.Point> evolution = new ArrayList<>();
        LocalDate currentDate = p.getDebut();
        LocalDate endDate = p.getFin();

        while (!currentDate.isAfter(endDate)) {
            BigDecimal caDuJour = commandeRepo.sumTotalByDate(currentDate);

            if (caDuJour != null && caDuJour.compareTo(BigDecimal.ZERO) > 0) {
                evolution.add(new DashboardDTO.Point(
                        currentDate.format(java.time.format.DateTimeFormatter.ofPattern("EEE dd/MM")),
                        caDuJour
                ));
            }
            currentDate = currentDate.plusDays(1);
        }

        LocalDateTime debut = p.getDebut().atStartOfDay();
        LocalDateTime fin = p.getFin().atTime(23, 59, 59);

        return new DashboardDTO.Charts(
                evolution,
                commandeRepo.topProduits(debut, fin, 5),
                new ArrayList<>()
        );
    }

    // ========================
    //  CALCUL VARIATION
    // ========================
    private BigDecimal calculerVariation(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) > 0 ?
                    BigDecimal.valueOf(100) : BigDecimal.ZERO;
        }
        return current.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }

    // ========================
    //  CLASSE INTERNE PÉRIODE
    // ========================
    @lombok.Data
    private static class Periode {
        private LocalDate debut;
        private LocalDate fin;
        private LocalDate debutCompare;
        private LocalDate finCompare;

        public LocalDateTime getDebutDateTime() {
            return debut.atStartOfDay();
        }

        public LocalDateTime getFinDateTime() {
            return fin.atTime(23, 59, 59);
        }
    }
}