package org.erp.invera.service;

import org.erp.invera.dto.DashboardDTO;
import org.erp.invera.model.Client;
import org.erp.invera.model.CommandeClient;
import org.erp.invera.model.FactureClient;
import org.erp.invera.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CommandeClientRepository commandeRepo;
    private final FactureClientRepository factureRepo;
    private final ProduitRepository produitRepo;
    private final ClientRepository clientRepo;

    public DashboardDTO getSummary(String period) {
        Periode periode = calculerPeriode(period);

        DashboardDTO dto = new DashboardDTO();
        dto.setSuccess(true);
        dto.setPeriod(period);
        dto.setKpi(calculerKPI(periode));
        dto.setCharts(calculerCharts(periode));

        // ✅ NOUVEAUX GRAPHIQUES
        dto.setStatusRepartition(getStatusRepartition(periode));
        dto.setOrdersEvolution(getOrdersEvolution(periode));
        dto.setClientTypeRepartition(getClientTypeRepartition(periode));

        return dto;
    }

    public DashboardDTO getCustomSummary(LocalDate startDate, LocalDate endDate) {
        // Créer une période personnalisée
        Periode periode = new Periode();
        periode.setDebut(startDate);
        periode.setFin(endDate);

        // Pas de période de comparaison pour le personnalisé
        periode.setDebutCompare(null);
        periode.setFinCompare(null);

        // ✅ CORRECTION: Appel correct de la méthode avec 'new'
        return new DashboardDTO(
                true,                    // success
                "Période personnalisée", // message
                "custom",                // period
                calculerKPI(periode),    // kpi
                calculerCharts(periode),  // charts
                getStatusRepartition(periode),
                getOrdersEvolution(periode),
                getClientTypeRepartition(periode)
        );
    }

    // ========================
    // 🔴 RÉPARTITION PAR STATUT
    // ========================
    private List<DashboardDTO.StatusData> getStatusRepartition(Periode p) {
        LocalDateTime debut = p.getDebut().atStartOfDay();
        LocalDateTime fin = p.getFin().atTime(23, 59, 59);

        List<Object[]> results = commandeRepo.getStatusRepartition(debut, fin);

        return results.stream()
                .map(row -> {
                    DashboardDTO.StatusData data = new DashboardDTO.StatusData();

                    // ✅ CORRECTION: L'enum est casté en enum puis converti en String
                    CommandeClient.StatutCommande statutEnum = (CommandeClient.StatutCommande) row[0];
                    data.setStatut(statutEnum.name()); // Convertit l'enum en String (EN_ATTENTE, CONFIRMEE, etc.)

                    data.setNombre(((Number) row[1]).longValue());
                    data.setMontant((BigDecimal) row[2]);
                    data.setPourcentage(0.0);

                    // Couleurs selon le statut
                    switch(statutEnum) {
                        case CONFIRMEE:
                            data.setCouleur("#10B981"); // Vert
                            break;
                        case EN_ATTENTE:
                            data.setCouleur("#F59E0B"); // Orange
                            break;
                        case ANNULEE:
                            data.setCouleur("#EF4444"); // Rouge
                            break;
                        default:
                            data.setCouleur("#6B7280"); // Gris
                    }

                    return data;
                })
                .collect(Collectors.toList());
    }

    // ========================
    // 🟠 ÉVOLUTION DES COMMANDES (double axe)
    // ========================
    private List<DashboardDTO.OrdersEvolutionData> getOrdersEvolution(Periode p) {
        List<DashboardDTO.OrdersEvolutionData> evolution = new ArrayList<>();

        LocalDateTime debut = p.getDebut().atStartOfDay();
        LocalDateTime fin = p.getFin().atTime(23, 59, 59);

        // Récupérer les données quotidiennes
        List<Object[]> results = commandeRepo.getDailyOrdersStats(debut, fin);

        for (Object[] row : results) {
            DashboardDTO.OrdersEvolutionData data = new DashboardDTO.OrdersEvolutionData();
            data.setDate(row[0].toString()); // Date formatée
            data.setCommandes(((Number) row[1]).longValue());
            data.setCa((BigDecimal) row[2]);
            evolution.add(data);
        }

        return evolution;
    }

    // ========================
    // 🟠 RÉPARTITION PAR TYPE DE CLIENT
    // ========================
    private List<DashboardDTO.ClientTypeData> getClientTypeRepartition(Periode p) {
        LocalDateTime debut = p.getDebutDateTime();
        LocalDateTime fin = p.getFinDateTime();

        List<Object[]> results = commandeRepo.getSalesByClientType(debut, fin);

        // Initialiser avec tous les types de clients
        Map<String, DashboardDTO.ClientTypeData> typeMap = new HashMap<>();

        // Ajouter tous les types d'enum avec des valeurs par défaut
        for (Client.TypeClient type : Client.TypeClient.values()) {
            DashboardDTO.ClientTypeData data = new DashboardDTO.ClientTypeData();
            data.setType(type.name());
            data.setMontant(BigDecimal.ZERO);
            data.setNombre(0L);

            // Couleurs par type
            switch(type) {
                case VIP:
                    data.setCouleur("#8B5CF6");
                    break;
                case PROFESSIONNEL:
                    data.setCouleur("#3B82F6");
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

        // Agréger les résultats de la requête
        if (results != null) {
            for (Object[] row : results) {
                try {
                    Client.TypeClient typeEnum = (Client.TypeClient) row[0];
                    String typeName = typeEnum.name();

                    Long nombre = ((Number) row[1]).longValue();  // Maintenant c'est le nombre de CLIENTS
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

        // Filtrer pour ne garder que les types qui ont des ventes ou des clients
        return typeMap.values().stream()
                .filter(data -> data.getMontant().compareTo(BigDecimal.ZERO) > 0 || data.getNombre() > 0)
                .collect(Collectors.toList());
    }

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

    private DashboardDTO.KPI calculerKPI(Periode p) {
        // Convertir LocalDate en LocalDateTime pour les requêtes
        LocalDateTime debutDateTime = p.getDebut().atStartOfDay();
        LocalDateTime finDateTime = p.getFin().atTime(23, 59, 59);
        LocalDateTime debutCompareDateTime = p.getDebutCompare() != null ?
                p.getDebutCompare().atStartOfDay() : null;
        LocalDateTime finCompareDateTime = p.getFinCompare() != null ?
                p.getFinCompare().atTime(23, 59, 59) : null;

        // ===== CA et Commandes pour la période actuelle =====
        BigDecimal caActuel = commandeRepo.sumTotalByPeriode(debutDateTime, finDateTime);
        long cmdActuel = commandeRepo.countByPeriode(debutDateTime, finDateTime);

        // ===== Période précédente pour comparaison =====
        BigDecimal caPrecedent = (debutCompareDateTime != null && finCompareDateTime != null) ?
                commandeRepo.sumTotalByPeriode(debutCompareDateTime, finCompareDateTime) : BigDecimal.ZERO;
        long cmdPrecedent = (debutCompareDateTime != null && finCompareDateTime != null) ?
                commandeRepo.countByPeriode(debutCompareDateTime, finCompareDateTime) : 0L;

        // ===== Calculs pour la semaine =====
        LocalDateTime debutSemaine = p.getDebut().with(DayOfWeek.MONDAY).atStartOfDay();
        LocalDateTime finSemaine = p.getFin().with(DayOfWeek.SUNDAY).atTime(23, 59, 59);

        BigDecimal caSemaine = commandeRepo.sumTotalByPeriode(debutSemaine, finSemaine);
        long commandesSemaine = commandeRepo.countByPeriode(debutSemaine, finSemaine);

        // Semaine dernière pour comparaison
        LocalDateTime debutSemaineDerniere = debutSemaine.minusWeeks(1);
        LocalDateTime finSemaineDerniere = finSemaine.minusWeeks(1);
        BigDecimal caSemaineDerniere = commandeRepo.sumTotalByPeriode(debutSemaineDerniere, finSemaineDerniere);
        BigDecimal variationSemaine = calculerVariation(caSemaine, caSemaineDerniere);

        // ===== Calculs pour le mois =====
        LocalDateTime debutMois = p.getDebut().withDayOfMonth(1).atStartOfDay();
        LocalDateTime finMois = p.getFin().withDayOfMonth(p.getFin().lengthOfMonth()).atTime(23, 59, 59);

        BigDecimal caMois = commandeRepo.sumTotalByPeriode(debutMois, finMois);
        long commandesMois = commandeRepo.countByPeriode(debutMois, finMois);

        // Mois dernier pour comparaison
        LocalDateTime debutMoisDernier = debutMois.minusMonths(1);
        LocalDateTime finMoisDernier = finMois.minusMonths(1);
        BigDecimal caMoisDernier = commandeRepo.sumTotalByPeriode(debutMoisDernier, finMoisDernier);
        BigDecimal variationMois = calculerVariation(caMois, caMoisDernier);

        // ===== Calculs pour l'année =====
        LocalDateTime debutAnnee = LocalDate.now().withDayOfYear(1).atStartOfDay();
        LocalDateTime finAnnee = LocalDate.now().withMonth(12).withDayOfMonth(31).atTime(23, 59, 59);

        BigDecimal caAnnee = commandeRepo.sumTotalByPeriode(debutAnnee, finAnnee);
        long commandesAnnee = commandeRepo.countByPeriode(debutAnnee, finAnnee);

        // Année dernière pour la variation
        LocalDateTime debutAnneeDerniere = debutAnnee.minusYears(1);
        LocalDateTime finAnneeDerniere = finAnnee.minusYears(1);
        BigDecimal caAnneeDerniere = commandeRepo.sumTotalByPeriode(debutAnneeDerniere, finAnneeDerniere);
        BigDecimal variationAnnee = calculerVariation(caAnnee, caAnneeDerniere);

        // ===== Panier moyen =====
        BigDecimal panierMoyen = cmdActuel > 0 ?
                caActuel.divide(BigDecimal.valueOf(cmdActuel), 2, RoundingMode.HALF_UP) :
                BigDecimal.ZERO;

        // ===== Taux transformation =====
        BigDecimal tauxTransfo = commandeRepo.tauxTransformation(debutDateTime, finDateTime);

        // ===== Créances =====
        BigDecimal creancesTotal = factureRepo.sumMontantByStatut(FactureClient.StatutFacture.NON_PAYE);
        long creancesNombre = factureRepo.countByStatut(FactureClient.StatutFacture.NON_PAYE);
        LocalDateTime dateRetard = LocalDate.now().minusDays(30).atStartOfDay();
        long facturesRetard = factureRepo.countEnRetard(dateRetard);

        // ===== Construction du KPI avec TOUS les champs =====
        // ===== Construction du KPI avec TOUS les champs =====
        return new DashboardDTO.KPI(
                // CA (BigDecimal)
                caActuel,                    // caJour
                caPrecedent,                  // caHier
                caSemaine,                    // caSemaine
                caMois,                       // caMois
                caAnnee,                      // caAnnee

                // Variations (BigDecimal)
                calculerVariation(caActuel, caPrecedent),     // variationJour
                variationSemaine,                              // variationSemaine
                variationMois,                                 // variationMois
                variationAnnee,                                // variationAnnee

                // Commandes (Long)
                cmdActuel,                     // commandesJour
                cmdPrecedent,                   // commandesHier
                commandesSemaine,               // commandesSemaine
                commandesMois,                   // commandesMois
                commandesAnnee,                  // commandesAnnee

                // Autres
                panierMoyen,                     // panierMoyen (BigDecimal)
                tauxTransfo,                      // tauxTransformation (BigDecimal)
                creancesTotal,                    // creancesTotal (BigDecimal)
                (Long) creancesNombre,            // ✅ CAST explicite en Long
                (Long) facturesRetard              // ✅ CAST explicite en Long
        );
    }

    private DashboardDTO.Charts calculerCharts(Periode p) {
        // Évolution 7 jours
        List<DashboardDTO.Point> evolution = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            evolution.add(new DashboardDTO.Point(
                    date.format(java.time.format.DateTimeFormatter.ofPattern("EEE dd/MM")),
                    commandeRepo.sumTotalByDate(date)
            ));
        }

        LocalDateTime debut = p.getDebut().atStartOfDay();
        LocalDateTime fin = p.getFin().atTime(23, 59, 59);

        return new DashboardDTO.Charts(
                evolution,
                commandeRepo.topProduits(debut, fin, 5),
                new ArrayList<>() // Repartition statuts (déplacé dans statusRepartition)
        );
    }

    private BigDecimal calculerVariation(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) > 0 ?
                    BigDecimal.valueOf(100) : BigDecimal.ZERO;
        }
        return current.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }

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