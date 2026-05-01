package org.erp.invera.service.erp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.erp.client.Client;
import org.erp.invera.model.erp.client.CommandeClient;
import org.erp.invera.model.erp.client.FactureClient;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.erp.invera.security.JwtTokenProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service de génération de rapports - MULTI-TENANT.
 * Architecture : 1 base = 1 client
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final TenantAwareRepository tenantRepo;
    private final JwtTokenProvider jwtTokenProvider;

    // ==================== MÉTHODES MULTI-TENANT ====================

    private Long getClientIdFromToken(HttpServletRequest request) {
        String token = extractToken(request);
        return jwtTokenProvider.getClientIdFromToken(token);
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        throw new RuntimeException("Token JWT manquant ou invalide");
    }

    // ==================== RAPPORT DES VENTES ====================

    public Map<String, Object> generateSalesReport(
            String period,
            LocalDate startDate,
            LocalDate endDate,
            String clientType,
            String status,
            HttpServletRequest request) {

        Long clientId = getClientIdFromToken(request);
        String authClientId = String.valueOf(clientId);

        DateRange dateRange = calculateDateRange(period, startDate, endDate);

        StringBuilder sql = new StringBuilder("""
            SELECT 
                c.id_commande_client,
                c.reference_commande_client,
                c.date_commande,
                c.total,
                c.statut,
                c.created_by,
                cl.id_client,
                cl.nom as client_nom,
                cl.prenom as client_prenom,
                cl.type_client
            FROM commande_client c
            JOIN client cl ON c.client_id = cl.id_client
            WHERE c.date_commande BETWEEN ? AND ?
            """);

        List<Object> params = new ArrayList<>();
        params.add(dateRange.getStartDateTime());
        params.add(dateRange.getEndDateTime());

        if (clientType != null && !"all".equalsIgnoreCase(clientType)) {
            sql.append(" AND cl.type_client = ?");
            params.add(clientType);
        }

        if (status != null && !"all".equalsIgnoreCase(status)) {
            sql.append(" AND c.statut = ?");
            params.add(status);
        }

        sql.append(" ORDER BY c.date_commande DESC");

        List<CommandeClient> commandes = tenantRepo.query(sql.toString(), (rs, rowNum) -> {
            CommandeClient cmd = new CommandeClient();
            cmd.setIdCommandeClient(rs.getInt("id_commande_client"));
            cmd.setReferenceCommandeClient(rs.getString("reference_commande_client"));
            cmd.setDateCommande(rs.getTimestamp("date_commande").toLocalDateTime());
            cmd.setTotal(rs.getBigDecimal("total"));
            cmd.setStatut(CommandeClient.StatutCommande.valueOf(rs.getString("statut")));
            cmd.setCreatedBy(rs.getString("created_by"));

            Client client = new Client();
            client.setIdClient(rs.getInt("id_client"));
            client.setNom(rs.getString("client_nom"));
            client.setPrenom(rs.getString("client_prenom"));
            client.setTypeClient(Client.TypeClient.valueOf(rs.getString("type_client")));
            cmd.setClient(client);

            return cmd;
        }, clientId, authClientId, params.toArray());

        Map<String, Object> report = new HashMap<>();

        Map<String, Object> summary = new HashMap<>();
        BigDecimal totalCA = calculateTotalCA(commandes);
        summary.put("totalCA", totalCA);
        summary.put("totalCommandes", commandes.size());
        summary.put("panierMoyen", calculateAverageBasket(commandes));
        summary.put("tauxTransformation", calculateTransformationRate(commandes));
        report.put("summary", summary);

        List<Map<String, Object>> ventesList = commandes.stream()
                .map(this::mapCommandeToDTO)
                .collect(Collectors.toList());
        report.put("ventes", ventesList);

        Map<String, Object> statsByStatus = new HashMap<>();
        commandes.stream()
                .filter(cmd -> cmd.getStatut() != null)
                .collect(Collectors.groupingBy(CommandeClient::getStatut))
                .forEach((statut, list) -> {
                    Map<String, Object> statutStats = new HashMap<>();
                    statutStats.put("nombre", list.size());
                    statutStats.put("montant", list.stream()
                            .map(CommandeClient::getTotal)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add));
                    statsByStatus.put(statut.name(), statutStats);
                });
        report.put("statsParStatut", statsByStatus);

        report.put("period", period);
        if (startDate != null && endDate != null) {
            report.put("startDate", startDate.toString());
            report.put("endDate", endDate.toString());
        }

        return report;
    }

    // ==================== RAPPORT DES FACTURES ====================

    public Map<String, Object> generateInvoicesReport(
            String period,
            LocalDate startDate,
            LocalDate endDate,
            String clientType,
            String status,
            HttpServletRequest request) {

        Long clientId = getClientIdFromToken(request);
        String authClientId = String.valueOf(clientId);

        DateRange dateRange = calculateDateRange(period, startDate, endDate);

        StringBuilder sql = new StringBuilder("""
            SELECT 
                f.id_facture_client,
                f.reference_facture_client,
                f.date_facture,
                f.montant_total,
                f.statut,
                cl.id_client,
                cl.nom as client_nom,
                cl.prenom as client_prenom,
                cl.type_client
            FROM facture_client f
            JOIN client cl ON f.client_id = cl.id_client
            WHERE f.date_facture BETWEEN ? AND ?
            """);

        List<Object> params = new ArrayList<>();
        params.add(dateRange.getStartDateTime());
        params.add(dateRange.getEndDateTime());

        if (clientType != null && !"all".equalsIgnoreCase(clientType)) {
            sql.append(" AND cl.type_client = ?");
            params.add(clientType);
        }

        if (status != null && !"all".equalsIgnoreCase(status)) {
            sql.append(" AND f.statut = ?");
            params.add(status);
        }

        sql.append(" ORDER BY f.date_facture DESC");

        List<FactureClient> factures = tenantRepo.query(sql.toString(), (rs, rowNum) -> {
            FactureClient facture = new FactureClient();
            facture.setIdFactureClient(rs.getInt("id_facture_client"));
            facture.setReferenceFactureClient(rs.getString("reference_facture_client"));
            facture.setDateFacture(rs.getTimestamp("date_facture").toLocalDateTime());
            facture.setMontantTotal(rs.getBigDecimal("montant_total"));
            facture.setStatut(FactureClient.StatutFacture.valueOf(rs.getString("statut")));

            Client client = new Client();
            client.setIdClient(rs.getInt("id_client"));
            client.setNom(rs.getString("client_nom"));
            client.setPrenom(rs.getString("client_prenom"));
            client.setTypeClient(Client.TypeClient.valueOf(rs.getString("type_client")));
            facture.setClient(client);

            return facture;
        }, clientId, authClientId, params.toArray());

        Map<String, Object> report = new HashMap<>();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalFactures", factures.size());
        summary.put("montantTotal", calculateTotalAmount(factures));

        long payees = factures.stream()
                .filter(f -> FactureClient.StatutFacture.PAYE.equals(f.getStatut()))
                .count();
        long impayees = factures.stream()
                .filter(f -> FactureClient.StatutFacture.NON_PAYE.equals(f.getStatut()))
                .count();

        summary.put("payees", payees);
        summary.put("impayees", impayees);

        BigDecimal montantPaye = factures.stream()
                .filter(f -> FactureClient.StatutFacture.PAYE.equals(f.getStatut()))
                .map(FactureClient::getMontantTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal montantImpaye = factures.stream()
                .filter(f -> FactureClient.StatutFacture.NON_PAYE.equals(f.getStatut()))
                .map(FactureClient::getMontantTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        summary.put("montantPaye", montantPaye);
        summary.put("montantImpaye", montantImpaye);
        summary.put("tauxRecouvrement", calculateRecoveryRate(factures));

        LocalDateTime dateLimite = LocalDateTime.now().minusDays(30);
        long enRetard = factures.stream()
                .filter(f -> FactureClient.StatutFacture.NON_PAYE.equals(f.getStatut()))
                .filter(f -> f.getDateFacture() != null && f.getDateFacture().isBefore(dateLimite))
                .count();
        summary.put("enRetard", enRetard);

        report.put("summary", summary);

        List<Map<String, Object>> facturesList = factures.stream()
                .map(this::mapFactureToDTO)
                .collect(Collectors.toList());
        report.put("factures", facturesList);

        report.put("period", period);
        if (startDate != null && endDate != null) {
            report.put("startDate", startDate.toString());
            report.put("endDate", endDate.toString());
        }

        return report;
    }

    // ==================== RAPPORT DES CLIENTS (CORRIGÉ) ====================

    public Map<String, Object> generateClientsReport(
            String period,
            LocalDate startDate,
            LocalDate endDate,
            String clientType,
            HttpServletRequest request) {

        Long clientId = getClientIdFromToken(request);
        String authClientId = String.valueOf(clientId);

        DateRange dateRange = calculateDateRange(period, startDate, endDate);

        // ✅ Version SANS est_actif (colonne inexistante)
        StringBuilder sql = new StringBuilder("""
        SELECT 
            cl.id_client,
            cl.nom,
            cl.prenom,
            cl.email,
            cl.type_client,
            COUNT(c.id_commande_client) as commandes,
            COALESCE(SUM(c.total), 0) as ca
        FROM client cl
        LEFT JOIN commande_client c ON cl.id_client = c.client_id 
            AND c.date_commande BETWEEN ? AND ?
        WHERE 1=1
        """);

        List<Object> params = new ArrayList<>();
        params.add(dateRange.getStartDateTime());
        params.add(dateRange.getEndDateTime());

        if (clientType != null && !"all".equalsIgnoreCase(clientType)) {
            sql.append(" AND cl.type_client = ?");
            params.add(clientType);
        }

        sql.append(" GROUP BY cl.id_client ORDER BY ca DESC LIMIT 50");

        List<Map<String, Object>> topClients = tenantRepo.query(sql.toString(), (rs, rowNum) -> {
            Map<String, Object> row = new HashMap<>();
            row.put("id_client", rs.getInt("id_client"));
            row.put("nom", rs.getString("nom"));
            row.put("prenom", rs.getString("prenom"));
            row.put("email", rs.getString("email"));
            row.put("type_client", rs.getString("type_client"));
            row.put("commandes", rs.getLong("commandes"));
            row.put("ca", rs.getBigDecimal("ca"));
            return row;
        }, clientId, authClientId, params.toArray());

        // Répartition par type de client
        String repartitionSql = """
        SELECT 
            cl.type_client,
            COUNT(cl.id_client) as nombre,
            COALESCE(SUM(c.total), 0) as ca
        FROM client cl
        LEFT JOIN commande_client c ON cl.id_client = c.client_id 
            AND c.date_commande BETWEEN ? AND ?
        GROUP BY cl.type_client
        """;

        List<Map<String, Object>> repartition = tenantRepo.query(repartitionSql, (rs, rowNum) -> {
            Map<String, Object> row = new HashMap<>();
            row.put("type_client", rs.getString("type_client"));
            row.put("nombre", rs.getLong("nombre"));
            row.put("ca", rs.getBigDecimal("ca"));
            return row;
        }, clientId, authClientId, dateRange.getStartDateTime(), dateRange.getEndDateTime());

        // ✅ Résumé sans est_actif (calcul basé sur les commandes)
        String summarySql = """
        SELECT 
            COUNT(*) as total,
            COUNT(DISTINCT CASE WHEN c.id_commande_client IS NOT NULL THEN cl.id_client END) as actifs,
            COUNT(DISTINCT CASE WHEN c.id_commande_client IS NULL THEN cl.id_client END) as inactifs
        FROM client cl
        LEFT JOIN commande_client c ON cl.id_client = c.client_id 
            AND c.date_commande BETWEEN ? AND ?
        """;

        Map<String, Object> summary = tenantRepo.queryForObject(summarySql, (rs, rowNum) -> {
            Map<String, Object> row = new HashMap<>();
            row.put("totalClients", rs.getLong("total"));
            row.put("clientsActifs", rs.getLong("actifs"));
            row.put("clientsInactifs", rs.getLong("inactifs"));
            return row;
        }, clientId, authClientId, dateRange.getStartDateTime(), dateRange.getEndDateTime());

        Map<String, Object> report = new HashMap<>();
        report.put("topClients", topClients);
        report.put("repartitionParType", repartition);
        report.put("summary", summary);
        report.put("period", period);

        if (startDate != null && endDate != null) {
            report.put("startDate", startDate.toString());
            report.put("endDate", endDate.toString());
        }

        return report;
    }

    // ==================== MÉTHODES PRIVÉES ====================

    private DateRange calculateDateRange(String period, LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null) {
            return new DateRange(startDate, endDate);
        }

        LocalDate now = LocalDate.now();
        LocalDate start;

        if (period != null) {
            switch (period) {
                case "today":
                    start = now;
                    break;
                case "week":
                    start = now.minusWeeks(1);
                    break;
                case "month":
                    start = now.minusMonths(1);
                    break;
                case "quarter":
                    start = now.minusMonths(3);
                    break;
                case "year":
                    start = now.minusYears(1);
                    break;
                default:
                    start = now.minusMonths(1);
            }
        } else {
            start = now.minusMonths(1);
        }

        return new DateRange(start, now);
    }

    private BigDecimal calculateTotalCA(List<CommandeClient> commandes) {
        return commandes.stream()
                .map(CommandeClient::getTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateAverageBasket(List<CommandeClient> commandes) {
        if (commandes.isEmpty()) return BigDecimal.ZERO;
        return calculateTotalCA(commandes)
                .divide(BigDecimal.valueOf(commandes.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateTransformationRate(List<CommandeClient> commandes) {
        if (commandes.isEmpty()) return BigDecimal.ZERO;

        long confirmees = commandes.stream()
                .filter(c -> CommandeClient.StatutCommande.CONFIRMEE.equals(c.getStatut()))
                .count();

        return BigDecimal.valueOf(confirmees)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(commandes.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateTotalAmount(List<FactureClient> factures) {
        return factures.stream()
                .map(FactureClient::getMontantTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateRecoveryRate(List<FactureClient> factures) {
        BigDecimal total = calculateTotalAmount(factures);
        if (total.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;

        BigDecimal paye = factures.stream()
                .filter(f -> FactureClient.StatutFacture.PAYE.equals(f.getStatut()))
                .map(FactureClient::getMontantTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return paye.multiply(BigDecimal.valueOf(100))
                .divide(total, 2, RoundingMode.HALF_UP);
    }

    private Map<String, Object> mapCommandeToDTO(CommandeClient commande) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", commande.getIdCommandeClient());
        map.put("reference", commande.getReferenceCommandeClient());
        map.put("date", commande.getDateCommande() != null ?
                commande.getDateCommande().format(DateTimeFormatter.ISO_DATE) : "");
        map.put("client", commande.getClient() != null ?
                (commande.getClient().getNom() != null ? commande.getClient().getNom() : "") + " " +
                        (commande.getClient().getPrenom() != null ? commande.getClient().getPrenom() : "").trim() : "Client inconnu");
        map.put("montant", commande.getTotal() != null ? commande.getTotal() : BigDecimal.ZERO);
        map.put("statut", commande.getStatut() != null ? commande.getStatut().name() : "INCONNU");
        map.put("created_by", commande.getCreatedBy() != null ? commande.getCreatedBy() : "");
        return map;
    }

    private Map<String, Object> mapFactureToDTO(FactureClient facture) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", facture.getIdFactureClient());
        map.put("numero", facture.getReferenceFactureClient());
        map.put("date", facture.getDateFacture() != null ?
                facture.getDateFacture().format(DateTimeFormatter.ISO_DATE) : "");
        map.put("client", facture.getClient() != null ?
                (facture.getClient().getNom() != null ? facture.getClient().getNom() : "") + " " +
                        (facture.getClient().getPrenom() != null ? facture.getClient().getPrenom() : "").trim() : "Client inconnu");
        map.put("montant", facture.getMontantTotal() != null ? facture.getMontantTotal() : BigDecimal.ZERO);
        map.put("statut", facture.getStatut() == FactureClient.StatutFacture.PAYE ? "Payée" : "Impayée");
        return map;
    }

    // ==================== CLASSE INTERNE ====================

    private static class DateRange {
        private final LocalDate startDate;
        private final LocalDate endDate;

        public DateRange(LocalDate startDate, LocalDate endDate) {
            this.startDate = startDate;
            this.endDate = endDate;
        }

        public LocalDateTime getStartDateTime() {
            return startDate.atStartOfDay();
        }

        public LocalDateTime getEndDateTime() {
            return endDate.atTime(LocalTime.MAX);
        }
    }
}