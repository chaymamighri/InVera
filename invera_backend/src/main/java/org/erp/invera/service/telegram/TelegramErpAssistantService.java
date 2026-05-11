package org.erp.invera.service.telegram;

import lombok.RequiredArgsConstructor;
import org.erp.invera.model.platform.Client;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class TelegramErpAssistantService {

    private final TenantAwareRepository tenantAwareRepository;

    public String answer(Client client, String message) {
        String normalizedMessage = normalize(message);

        if (normalizedMessage.startsWith("/sales") || normalizedMessage.contains("sales today")
                || normalizedMessage.contains("ventes aujourd")) {
            return getSalesToday(client);
        }

        if (normalizedMessage.contains("top clients") || normalizedMessage.contains("meilleurs clients")) {
            return getTopClients(client);
        }

        if (normalizedMessage.contains("achats") || normalizedMessage.contains("purchases")
                || normalizedMessage.contains("procurement")) {
            return getProcurementSummary(client);
        }

        if (normalizedMessage.contains("commandes fournisseurs") || normalizedMessage.contains("supplier orders")) {
            return getSupplierOrdersSummary(client);
        }

        if (normalizedMessage.contains("commandes clients") || normalizedMessage.contains("sales orders")
                || normalizedMessage.contains("orders")) {
            return getClientOrdersSummary(client);
        }

        if (normalizedMessage.contains("responsables achats") || normalizedMessage.contains("buyers")
                || normalizedMessage.contains("procurement managers")) {
            return getUsersByRole(client, "RESPONSABLE_ACHAT", "Responsables achats");
        }

        if (normalizedMessage.contains("responsables ventes") || normalizedMessage.contains("sales managers")
                || normalizedMessage.contains("commercial")) {
            return getUsersByRole(client, "COMMERCIAL", "Responsables ventes");
        }

        return """
                Questions disponibles:
                - sales today
                - top clients
                - achats
                - commandes clients
                - commandes fournisseurs
                - responsables ventes
                - responsables achats
                """;
    }

    private String getSalesToday(Client client) {
        Long clientId = client.getId();
        String authClientId = String.valueOf(clientId);
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.atTime(23, 59, 59);

        Long orderCount = tenantAwareRepository.queryForObject(
                "SELECT COUNT(*) FROM commande_client WHERE date_commande BETWEEN ? AND ?",
                Long.class,
                clientId,
                authClientId,
                start,
                end
        );

        BigDecimal salesAmount = tenantAwareRepository.queryForObject(
                "SELECT COALESCE(SUM(total), 0) FROM commande_client WHERE statut = 'CONFIRMEE' AND date_commande BETWEEN ? AND ?",
                BigDecimal.class,
                clientId,
                authClientId,
                start,
                end
        );

        return """
                Ventes du jour
                Client: %s
                Base: %s
                Commandes: %s
                Chiffre d'affaires: %s
                """.formatted(
                client.getNom(),
                client.getNomBaseDonnees(),
                safeLong(orderCount),
                safeDecimal(salesAmount)
        );
    }

    private String getTopClients(Client client) {
        List<String> rows = tenantAwareRepository.query(
                """
                SELECT
                    TRIM(COALESCE(c.nom, '') || ' ' || COALESCE(c.prenom, '')) AS client_name,
                    COALESCE(SUM(cmd.total), 0) AS total_amount
                FROM commande_client cmd
                JOIN client c ON c.id_client = cmd.client_id
                WHERE cmd.statut = 'CONFIRMEE'
                GROUP BY c.id_client, c.nom, c.prenom
                ORDER BY total_amount DESC
                LIMIT 5
                """,
                (rs, rowNum) -> (rowNum + 1) + ". " + rs.getString("client_name") + " - " + rs.getBigDecimal("total_amount"),
                client.getId(),
                String.valueOf(client.getId())
        );

        if (rows.isEmpty()) {
            return "Top clients\nAucune donnee disponible.";
        }

        return "Top clients\n" + String.join("\n", rows);
    }

    private String getProcurementSummary(Client client) {
        Long clientId = client.getId();
        String authClientId = String.valueOf(clientId);

        Long totalOrders = tenantAwareRepository.queryForObject(
                "SELECT COUNT(*) FROM commandes_fournisseurs",
                Long.class,
                clientId,
                authClientId
        );

        BigDecimal totalAmount = tenantAwareRepository.queryForObject(
                "SELECT COALESCE(SUM(total_ttc), 0) FROM commandes_fournisseurs",
                BigDecimal.class,
                clientId,
                authClientId
        );

        Long pendingReception = tenantAwareRepository.queryForObject(
                "SELECT COUNT(*) FROM commandes_fournisseurs WHERE statut IN ('VALIDEE', 'ENVOYEE')",
                Long.class,
                clientId,
                authClientId
        );

        return """
                Resume achats
                Commandes fournisseurs: %s
                Montant total TTC: %s
                En attente de reception: %s
                """.formatted(
                safeLong(totalOrders),
                safeDecimal(totalAmount),
                safeLong(pendingReception)
        );
    }

    private String getSupplierOrdersSummary(Client client) {
        Long clientId = client.getId();
        String authClientId = String.valueOf(clientId);

        Long draft = countByStatus("commandes_fournisseurs", "BROUILLON", clientId, authClientId);
        Long validated = countByStatus("commandes_fournisseurs", "VALIDEE", clientId, authClientId);
        Long received = countByStatus("commandes_fournisseurs", "RECUE", clientId, authClientId);
        Long rejected = countByStatus("commandes_fournisseurs", "REJETEE", clientId, authClientId);

        return """
                Commandes fournisseurs
                Brouillon: %s
                Validees: %s
                Recues: %s
                Rejetees: %s
                """.formatted(
                safeLong(draft),
                safeLong(validated),
                safeLong(received),
                safeLong(rejected)
        );
    }

    private String getClientOrdersSummary(Client client) {
        Long clientId = client.getId();
        String authClientId = String.valueOf(clientId);

        Long pending = countByStatus("commande_client", "EN_ATTENTE", clientId, authClientId);
        Long confirmed = countByStatus("commande_client", "CONFIRMEE", clientId, authClientId);
        Long cancelled = countByStatus("commande_client", "ANNULEE", clientId, authClientId);

        return """
                Commandes clients
                En attente: %s
                Confirmees: %s
                Annulees: %s
                """.formatted(
                safeLong(pending),
                safeLong(confirmed),
                safeLong(cancelled)
        );
    }

    private String getUsersByRole(Client client, String role, String title) {
        List<String> users = tenantAwareRepository.query(
                """
                SELECT nom, prenom, email
                FROM users
                WHERE role = ? AND active = true
                ORDER BY nom ASC, prenom ASC
                LIMIT 10
                """,
                (rs, rowNum) -> {
                    String nom = rs.getString("nom") == null ? "" : rs.getString("nom");
                    String prenom = rs.getString("prenom") == null ? "" : rs.getString("prenom");
                    String email = rs.getString("email") == null ? "" : rs.getString("email");
                    return (rowNum + 1) + ". " + (nom + " " + prenom).trim() + " - " + email;
                },
                client.getId(),
                String.valueOf(client.getId()),
                role
        );

        if (users.isEmpty()) {
            return title + "\nAucun utilisateur actif trouve.";
        }

        return title + "\n" + String.join("\n", users);
    }

    private Long countByStatus(String tableName, String status, Long clientId, String authClientId) {
        return tenantAwareRepository.queryForObject(
                "SELECT COUNT(*) FROM " + tableName + " WHERE statut = ?",
                Long.class,
                clientId,
                authClientId,
                status
        );
    }

    private String normalize(String message) {
        return message == null ? "" : message.trim().toLowerCase(Locale.ROOT);
    }

    private Long safeLong(Long value) {
        return value == null ? 0L : value;
    }

    private BigDecimal safeDecimal(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
