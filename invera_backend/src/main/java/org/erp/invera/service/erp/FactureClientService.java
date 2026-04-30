package org.erp.invera.service.erp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.erp.client.Client;
import org.erp.invera.model.erp.client.CommandeClient;
import org.erp.invera.model.erp.client.FactureClient;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.erp.invera.security.JwtTokenProvider;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

/**
 * Service de gestion des factures clients - MULTI-TENANT.
 * Architecture : 1 base = 1 client
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FactureClientService {

    private final TenantAwareRepository tenantRepo;
    private final JwtTokenProvider jwtTokenProvider;

    private final Random random = new Random();

    // ==================== MÉTHODES MULTI-TENANT ====================

    private Long getClientIdFromToken(String token) {
        return jwtTokenProvider.getClientIdFromToken(token);
    }

    // ==================== ROW MAPPER ====================

    private RowMapper<FactureClient> factureRowMapper() {
        return (rs, rowNum) -> {
            FactureClient facture = new FactureClient();
            facture.setIdFactureClient(rs.getInt("id_facture_client"));
            facture.setReferenceFactureClient(rs.getString("reference_facture_client"));
            facture.setDateFacture(rs.getTimestamp("date_facture") != null ? rs.getTimestamp("date_facture").toLocalDateTime() : null);
            facture.setMontantTotal(rs.getBigDecimal("montant_total"));
            facture.setStatut(FactureClient.StatutFacture.valueOf(rs.getString("statut")));
            facture.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null);
            facture.setCreatedBy(rs.getString("created_by"));
            return facture;
        };
    }

    private RowMapper<CommandeClient> commandeRowMapper() {
        return (rs, rowNum) -> {
            CommandeClient commande = new CommandeClient();
            commande.setIdCommandeClient(rs.getInt("id_commande_client"));
            commande.setReferenceCommandeClient(rs.getString("reference_commande_client"));
            commande.setDateCommande(rs.getTimestamp("date_commande") != null ? rs.getTimestamp("date_commande").toLocalDateTime() : null);
            commande.setTotal(rs.getBigDecimal("total"));
            commande.setSousTotal(rs.getBigDecimal("sous_total"));
            commande.setTauxRemise(rs.getBigDecimal("taux_remise"));
            commande.setStatut(CommandeClient.StatutCommande.valueOf(rs.getString("statut")));

            // ✅ Créer un objet Client avec l'ID
            Client client = new Client();
            client.setIdClient(rs.getInt("client_id"));
            commande.setClient(client);

            return commande;
        };
    }

    // ==================== MÉTHODES PRIVÉES ====================

    private boolean existsByCommandeId(Integer commandeId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = "SELECT COUNT(*) FROM facture_client WHERE commande_id = ?";
        Integer count = tenantRepo.queryForObject(sql, Integer.class, clientId, authClientId, commandeId);
        return count != null && count > 0;
    }

    private boolean existsByReference(String reference, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = "SELECT COUNT(*) FROM facture_client WHERE reference_facture_client = ?";
        Integer count = tenantRepo.queryForObject(sql, Integer.class, clientId, authClientId, reference);
        return count != null && count > 0;
    }

    private CommandeClient getCommandeById(Integer commandeId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = "SELECT * FROM commande_client WHERE id_commande_client = ?";
        return tenantRepo.queryForObject(sql, commandeRowMapper(), clientId, authClientId, commandeId);
    }

    private String genererReferenceFacture(String token) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
        String datePart = LocalDateTime.now().format(formatter);

        int randomPart = 1000 + random.nextInt(9000);
        String reference = "FAC-" + datePart + "-" + randomPart;

        while (existsByReference(reference, token)) {
            randomPart = 1000 + random.nextInt(9000);
            reference = "FAC-" + datePart + "-" + randomPart;
        }

        return reference;
    }

    // ==================== MÉTHODES PUBLIQUES ====================

    /**
     * Génère une facture à partir d'une commande validée
     */
    public FactureClient genererFactureDepuisCommande(Integer commandeId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // 1. Récupérer la commande
        CommandeClient commande = getCommandeById(commandeId, token);
        if (commande == null) {
            throw new RuntimeException("Commande non trouvée avec l'ID: " + commandeId);
        }

        // 2. Vérifier que la commande est validée
        if (commande.getStatut() != CommandeClient.StatutCommande.CONFIRMEE) {
            throw new RuntimeException("Seules les commandes validées peuvent être facturées");
        }

        // 3. Vérifier qu'une facture n'existe pas déjà
        if (existsByCommandeId(commandeId, token)) {
            throw new RuntimeException("Une facture existe déjà pour cette commande");
        }

        // 4. Insérer la facture
        String reference = genererReferenceFacture(token);
        String currentUser = jwtTokenProvider.getEmailFromToken(token);
        if (currentUser == null || currentUser.isBlank()) {
            currentUser = "SYSTEM";
        }

        String insertSql = """
            INSERT INTO facture_client (reference_facture_client, date_facture, montant_total, 
                                        statut, client_id, commande_id, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id_facture_client
            """;

        Integer factureId = tenantRepo.queryForObject(insertSql, Integer.class, clientId, authClientId,
                reference, LocalDateTime.now(), commande.getTotal(),
                FactureClient.StatutFacture.NON_PAYE.name(), commande.getClient().getIdClient(), commandeId,
                currentUser, LocalDateTime.now());

        // 5. Récupérer la facture créée
        return getFactureById(factureId, token);
    }

    /**
     * Récupérer une facture par son ID
     */
    public FactureClient getFactureById(Integer factureId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = "SELECT * FROM facture_client WHERE id_facture_client = ?";
        FactureClient facture = tenantRepo.queryForObject(sql, factureRowMapper(), clientId, authClientId, factureId);

        if (facture == null) {
            throw new RuntimeException("Facture non trouvée avec l'ID: " + factureId);
        }
        return facture;
    }

    /**
     * Récupérer une facture par ID de commande
     */
    public FactureClient getFactureByCommandeId(Integer commandeId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = "SELECT * FROM facture_client WHERE commande_id = ?";
        return tenantRepo.queryForObject(sql, factureRowMapper(), clientId, authClientId, commandeId);
    }

    /**
     * Récupérer toutes les factures
     */
    public List<FactureClient> getAllFactures(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = "SELECT * FROM facture_client ORDER BY date_facture DESC";
        return tenantRepo.query(sql, factureRowMapper(), clientId, authClientId);
    }

    /**
     * Récupérer les factures d'un client
     */
    public List<FactureClient> getFacturesByClient(Integer clientId, String token) {
        Long tenantClientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(tenantClientId);
        String sql = "SELECT * FROM facture_client WHERE client_id = ? ORDER BY date_facture DESC";
        return tenantRepo.query(sql, factureRowMapper(), tenantClientId, authClientId, clientId);
    }

    /**
     * Marquer une facture comme payée
     */
    public FactureClient marquerFacturePayee(Integer factureId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // Vérifier que la facture existe
        FactureClient facture = getFactureById(factureId, token);

        String updateSql = "UPDATE facture_client SET statut = ? WHERE id_facture_client = ?";
        tenantRepo.update(updateSql, clientId, authClientId, FactureClient.StatutFacture.PAYE.name(), factureId);

        return getFactureById(factureId, token);
    }
}