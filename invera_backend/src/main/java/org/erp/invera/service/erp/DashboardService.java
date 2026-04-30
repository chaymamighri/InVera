package org.erp.invera.service.erp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.erp.DashboardVente.DashboardDTO;
import org.erp.invera.model.erp.client.Client;
import org.erp.invera.model.erp.client.CommandeClient;
import org.erp.invera.model.erp.client.FactureClient;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.erp.invera.security.JwtTokenProvider;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service du tableau de bord (Dashboard) - MULTI-TENANT.
 * Architecture : 1 base = 1 client
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TenantAwareRepository tenantRepo;
    private final JwtTokenProvider jwtTokenProvider;

    // ==================== MÉTHODES MULTI-TENANT ====================

    private Long getClientIdFromToken(String token) {
        return jwtTokenProvider.getClientIdFromToken(token);
    }

    // ==================== MÉTHODES PUBLIQUES ====================

    public DashboardDTO getSummary(String period, String token) {
        Periode periode = calculerPeriode(period);

        DashboardDTO dto = new DashboardDTO();
        dto.setSuccess(true);
        dto.setPeriod(period);
        dto.setKpi(calculerKPI(periode, token));
        dto.setCharts(calculerCharts(periode, token));
        dto.setStatusRepartition(getStatusRepartition(periode, token));
        dto.setOrdersEvolution(getOrdersEvolution(periode, token));
        dto.setClientTypeRepartition(getClientTypeRepartition(periode, token));

        return dto;
    }

    public DashboardDTO getCustomSummary(LocalDate startDate, LocalDate endDate, String token) {
        Periode periode = new Periode();
        periode.setDebut(startDate);
        periode.setFin(endDate);
        periode.setDebutCompare(null);
        periode.setFinCompare(null);

        return new DashboardDTO(
                true,
                "Période personnalisée",
                "custom",
                calculerKPI(periode, token),
                calculerCharts(periode, token),
                getStatusRepartition(periode, token),
                getOrdersEvolution(periode, token),
                getClientTypeRepartition(periode, token)
        );
    }

    // ========================
    // RÉPARTITION PAR STATUT
    // ========================
    private List<DashboardDTO.StatusData> getStatusRepartition(Periode p, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        LocalDateTime debut = p.getDebut().atStartOfDay();
        LocalDateTime fin = p.getFin().atTime(23, 59, 59);

        String sql = """
            SELECT statut, COUNT(*) as count, COALESCE(SUM(total), 0) as total
            FROM commande_client
            WHERE date_commande BETWEEN ? AND ?
            GROUP BY statut
            """;

        List<Object[]> results = tenantRepo.query(sql, (rs, rowNum) -> new Object[]{
                CommandeClient.StatutCommande.valueOf(rs.getString("statut")),
                rs.getLong("count"),
                rs.getBigDecimal("total")
        }, clientId, authClientId, debut, fin);

        return results.stream()
                .map(row -> {
                    DashboardDTO.StatusData data = new DashboardDTO.StatusData();
                    CommandeClient.StatutCommande statutEnum = (CommandeClient.StatutCommande) row[0];
                    data.setStatut(statutEnum.name());
                    data.setNombre(((Number) row[1]).longValue());
                    data.setMontant((BigDecimal) row[2]);
                    data.setPourcentage(0.0);

                    switch (statutEnum) {
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
    private List<DashboardDTO.OrdersEvolutionData> getOrdersEvolution(Periode p, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        List<DashboardDTO.OrdersEvolutionData> evolution = new ArrayList<>();
        LocalDateTime debut = p.getDebut().atStartOfDay();
        LocalDateTime fin = p.getFin().atTime(23, 59, 59);

        String sql = """
            SELECT DATE(date_commande) as date, 
                   COUNT(*) as commandes, 
                   COALESCE(SUM(total), 0) as ca
            FROM commande_client
            WHERE date_commande BETWEEN ? AND ?
            GROUP BY DATE(date_commande)
            ORDER BY date
            """;

        List<Object[]> results = tenantRepo.query(sql, (rs, rowNum) -> new Object[]{
                rs.getDate("date").toLocalDate(),
                rs.getLong("commandes"),
                rs.getBigDecimal("ca")
        }, clientId, authClientId, debut, fin);

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
    // RÉPARTITION PAR TYPE DE CLIENT
    // ========================
    private List<DashboardDTO.ClientTypeData> getClientTypeRepartition(Periode p, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        LocalDateTime debut = p.getDebut().atStartOfDay();
        LocalDateTime fin = p.getFin().atTime(23, 59, 59);

        String sql = """
            SELECT c.type_client, 
                   COUNT(*) as nombre, 
                   COALESCE(SUM(cmd.total), 0) as montant
            FROM commande_client cmd
            JOIN client c ON cmd.client_id = c.id_client
            WHERE cmd.date_commande BETWEEN ? AND ?
            GROUP BY c.type_client
            """;

        List<Object[]> results = tenantRepo.query(sql, (rs, rowNum) -> new Object[]{
                Client.TypeClient.valueOf(rs.getString("type_client")),
                rs.getLong("nombre"),
                rs.getBigDecimal("montant")
        }, clientId, authClientId, debut, fin);

        Map<String, DashboardDTO.ClientTypeData> typeMap = new LinkedHashMap<>();

        for (Client.TypeClient type : Client.TypeClient.values()) {
            DashboardDTO.ClientTypeData data = new DashboardDTO.ClientTypeData();
            data.setType(type.name());
            data.setMontant(BigDecimal.ZERO);
            data.setNombre(0L);

            switch (type) {
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
                log.error("Erreur traitement type client: {}", e.getMessage());
            }
        }

        return typeMap.values().stream()
                .filter(data -> data.getMontant().compareTo(BigDecimal.ZERO) > 0 || data.getNombre() > 0)
                .collect(Collectors.toList());
    }

    // ========================
    // CALCUL PÉRIODE
    // ========================
    private Periode calculerPeriode(String period) {
        LocalDate now = LocalDate.now();
        Periode p = new Periode();

        switch (period) {
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
    // CALCUL KPI
    // ========================
    private DashboardDTO.KPI calculerKPI(Periode p, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        LocalDateTime debutDateTime = p.getDebut().atStartOfDay();
        LocalDateTime finDateTime = p.getFin().atTime(23, 59, 59);

        String sumSql = "SELECT COALESCE(SUM(total), 0) FROM commande_client WHERE date_commande BETWEEN ? AND ?";
        String countSql = "SELECT COUNT(*) FROM commande_client WHERE date_commande BETWEEN ? AND ?";

        BigDecimal caActuel = tenantRepo.queryForObject(sumSql, BigDecimal.class, clientId, authClientId, debutDateTime, finDateTime);
        Long cmdActuel = tenantRepo.queryForObject(countSql, Long.class, clientId, authClientId, debutDateTime, finDateTime);
        if (cmdActuel == null) cmdActuel = 0L;

        // Période précédente
        LocalDateTime debutCompareDateTime = p.getDebutCompare() != null ? p.getDebutCompare().atStartOfDay() : null;
        LocalDateTime finCompareDateTime = p.getFinCompare() != null ? p.getFinCompare().atTime(23, 59, 59) : null;

        BigDecimal caPrecedent = BigDecimal.ZERO;
        Long cmdPrecedent = 0L;
        if (debutCompareDateTime != null && finCompareDateTime != null) {
            caPrecedent = tenantRepo.queryForObject(sumSql, BigDecimal.class, clientId, authClientId, debutCompareDateTime, finCompareDateTime);
            cmdPrecedent = tenantRepo.queryForObject(countSql, Long.class, clientId, authClientId, debutCompareDateTime, finCompareDateTime);
            if (cmdPrecedent == null) cmdPrecedent = 0L;
        }

        // Semaine
        LocalDateTime debutSemaine = p.getDebut().with(DayOfWeek.MONDAY).atStartOfDay();
        LocalDateTime finSemaine = p.getFin().with(DayOfWeek.SUNDAY).atTime(23, 59, 59);
        BigDecimal caSemaine = tenantRepo.queryForObject(sumSql, BigDecimal.class, clientId, authClientId, debutSemaine, finSemaine);
        Long commandesSemaine = tenantRepo.queryForObject(countSql, Long.class, clientId, authClientId, debutSemaine, finSemaine);
        if (commandesSemaine == null) commandesSemaine = 0L;

        LocalDateTime debutSemaineDerniere = debutSemaine.minusWeeks(1);
        LocalDateTime finSemaineDerniere = finSemaine.minusWeeks(1);
        BigDecimal caSemaineDerniere = tenantRepo.queryForObject(sumSql, BigDecimal.class, clientId, authClientId, debutSemaineDerniere, finSemaineDerniere);
        BigDecimal variationSemaine = calculerVariation(caSemaine, caSemaineDerniere);

        // Mois
        LocalDateTime debutMois = p.getDebut().withDayOfMonth(1).atStartOfDay();
        LocalDateTime finMois = p.getFin().withDayOfMonth(p.getFin().lengthOfMonth()).atTime(23, 59, 59);
        BigDecimal caMois = tenantRepo.queryForObject(sumSql, BigDecimal.class, clientId, authClientId, debutMois, finMois);
        Long commandesMois = tenantRepo.queryForObject(countSql, Long.class, clientId, authClientId, debutMois, finMois);
        if (commandesMois == null) commandesMois = 0L;

        LocalDateTime debutMoisDernier = debutMois.minusMonths(1);
        LocalDateTime finMoisDernier = finMois.minusMonths(1);
        BigDecimal caMoisDernier = tenantRepo.queryForObject(sumSql, BigDecimal.class, clientId, authClientId, debutMoisDernier, finMoisDernier);
        BigDecimal variationMois = calculerVariation(caMois, caMoisDernier);

        // Année
        LocalDateTime debutAnnee = LocalDate.now().withDayOfYear(1).atStartOfDay();
        LocalDateTime finAnnee = LocalDate.now().withMonth(12).withDayOfMonth(31).atTime(23, 59, 59);
        BigDecimal caAnnee = tenantRepo.queryForObject(sumSql, BigDecimal.class, clientId, authClientId, debutAnnee, finAnnee);
        Long commandesAnnee = tenantRepo.queryForObject(countSql, Long.class, clientId, authClientId, debutAnnee, finAnnee);
        if (commandesAnnee == null) commandesAnnee = 0L;

        LocalDateTime debutAnneeDerniere = debutAnnee.minusYears(1);
        LocalDateTime finAnneeDerniere = finAnnee.minusYears(1);
        BigDecimal caAnneeDerniere = tenantRepo.queryForObject(sumSql, BigDecimal.class, clientId, authClientId, debutAnneeDerniere, finAnneeDerniere);
        BigDecimal variationAnnee = calculerVariation(caAnnee, caAnneeDerniere);

        // Panier moyen
        BigDecimal panierMoyen = (cmdActuel != null && cmdActuel > 0 && caActuel != null) ?
                caActuel.divide(BigDecimal.valueOf(cmdActuel), 2, RoundingMode.HALF_UP) :
                BigDecimal.ZERO;

        // Taux de transformation
        BigDecimal tauxTransfo = calculerTauxTransformation(debutDateTime, finDateTime, token);

        // Créances
        String factureSumSql = "SELECT COALESCE(SUM(montant_total), 0) FROM facture_client WHERE statut = 'NON_PAYE'";
        String factureCountSql = "SELECT COUNT(*) FROM facture_client WHERE statut = 'NON_PAYE'";
        String factureRetardSql = "SELECT COUNT(*) FROM facture_client WHERE statut = 'NON_PAYE' AND date_facture < ?";

        BigDecimal creancesTotal = tenantRepo.queryForObject(factureSumSql, BigDecimal.class, clientId, authClientId);
        Long creancesNombre = tenantRepo.queryForObject(factureCountSql, Long.class, clientId, authClientId);
        LocalDateTime dateRetard = LocalDate.now().minusDays(30).atStartOfDay();
        Long facturesRetard = tenantRepo.queryForObject(factureRetardSql, Long.class, clientId, authClientId, dateRetard);

        if (creancesTotal == null) creancesTotal = BigDecimal.ZERO;
        if (creancesNombre == null) creancesNombre = 0L;
        if (facturesRetard == null) facturesRetard = 0L;

        return new DashboardDTO.KPI(
                caActuel, caPrecedent, caSemaine, caMois, caAnnee,
                calculerVariation(caActuel, caPrecedent),
                variationSemaine, variationMois, variationAnnee,
                cmdActuel, cmdPrecedent,
                commandesSemaine != null ? commandesSemaine : 0L,
                commandesMois != null ? commandesMois : 0L,
                commandesAnnee != null ? commandesAnnee : 0L,
                panierMoyen, tauxTransfo,
                creancesTotal, creancesNombre, facturesRetard
        );
    }

    private BigDecimal calculerTauxTransformation(LocalDateTime debut, LocalDateTime fin, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = """
            SELECT COALESCE(
                (SELECT COUNT(*) FROM commande_client WHERE statut = 'CONFIRMEE' AND date_commande BETWEEN ? AND ?) * 100.0 /
                NULLIF((SELECT COUNT(*) FROM commande_client WHERE date_commande BETWEEN ? AND ?), 0), 0)
            """;

        return tenantRepo.queryForObject(sql, BigDecimal.class, clientId, authClientId, debut, fin, debut, fin);
    }

    // ========================
    // CALCUL CHARTS
    // ========================
    private DashboardDTO.Charts calculerCharts(Periode p, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        List<DashboardDTO.Point> evolution = new ArrayList<>();
        LocalDate currentDate = p.getDebut();
        LocalDate endDate = p.getFin();

        String daySql = "SELECT COALESCE(SUM(total), 0) FROM commande_client WHERE DATE(date_commande) = ?";

        while (!currentDate.isAfter(endDate)) {
            BigDecimal caDuJour = tenantRepo.queryForObject(daySql, BigDecimal.class, clientId, authClientId, currentDate);

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

        // ✅ Utiliser les bons types : Integer, String, Long, BigDecimal, String
        String topSql = """
        SELECT p.id_produit as id,
               p.libelle as nom,
               COALESCE(SUM(lc.quantite), 0) as quantite,
               COALESCE(SUM(lc.sous_total), 0) as montant,
               p.image_url as image
        FROM ligne_commande_client lc
        JOIN produit p ON lc.produit_id = p.id_produit
        JOIN commande_client cmd ON lc.commande_client_id = cmd.id_commande_client
        WHERE cmd.date_commande BETWEEN ? AND ?
        GROUP BY p.id_produit, p.libelle, p.image_url
        ORDER BY quantite DESC
        LIMIT 5
        """;

        List<DashboardDTO.ProduitVente> topProduits = tenantRepo.query(topSql, (rs, rowNum) -> {
            Integer id = Integer.valueOf(rs.getInt("id"));           // int → Integer explicit
            String nom = rs.getString("nom");
            Long quantite = Long.valueOf(rs.getLong("quantite"));    // long → Long explicit
            BigDecimal montant = rs.getBigDecimal("montant");
            String image = rs.getString("image");

            return new DashboardDTO.ProduitVente(id, nom, quantite, montant, image);
        }, clientId, authClientId, debut, fin);
        return new DashboardDTO.Charts(
                evolution,
                topProduits,
                new ArrayList<>()
        );
    }

    // ========================
    // CALCUL VARIATION
    // ========================
    private BigDecimal calculerVariation(BigDecimal current, BigDecimal previous) {
        if (current == null) current = BigDecimal.ZERO;
        if (previous == null) previous = BigDecimal.ZERO;

        if (previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) > 0 ? BigDecimal.valueOf(100) : BigDecimal.ZERO;
        }
        return current.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }

    // ========================
    // CLASSE INTERNE PÉRIODE
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