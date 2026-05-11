package org.erp.invera.service.erp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.erp.clientdto.ClientDTO;
import org.erp.invera.dto.erp.commandeClientdto.CommandeResponseDTO;
import org.erp.invera.model.erp.Produit;
import org.erp.invera.model.erp.client.Client;
import org.erp.invera.model.erp.client.CommandeClient;
import org.erp.invera.model.erp.client.FactureClient;
import org.erp.invera.model.erp.client.LigneCommandeClient;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.erp.invera.security.JwtTokenProvider;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class FactureClientService {

    private final TenantAwareRepository tenantRepo;
    private final JwtTokenProvider jwtTokenProvider;
    private final CommandeClientService commandeService;


    private final Random random = new Random();

    private Long getClientIdFromToken(String token) {
        return jwtTokenProvider.getClientIdFromToken(token);
    }

    // ==================== ROW MAPPER ====================

    private RowMapper<FactureClient> factureRowMapper() {
        return (rs, rowNum) -> {
            FactureClient facture = new FactureClient();
            facture.setIdFactureClient(rs.getInt("id_facture_client"));
            facture.setReferenceFactureClient(rs.getString("reference_facture_client"));
            facture.setDateFacture(rs.getTimestamp("date_facture") != null ?
                    rs.getTimestamp("date_facture").toLocalDateTime() : null);
            facture.setMontantTotal(rs.getBigDecimal("montant_total"));

            String statutStr = rs.getString("statut");
            if (statutStr != null) {
                facture.setStatut(FactureClient.StatutFacture.valueOf(statutStr));
            }

            // ✅ Charger le client
            if (rs.getObject("client_id") != null) {
                Client client = new Client();
                client.setIdClient(rs.getInt("client_id"));
                facture.setClient(client);
            }

            // ✅ Charger la commande
            if (rs.getObject("commande_id") != null) {
                CommandeClient commande = new CommandeClient();
                commande.setIdCommandeClient(rs.getInt("commande_id"));
                facture.setCommande(commande);
            }

            facture.setCreatedAt(rs.getTimestamp("created_at") != null ?
                    rs.getTimestamp("created_at").toLocalDateTime() : null);
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
        // ✅ Utiliser queryForObjectAuth
        Integer count = tenantRepo.queryForObjectAuth(sql, Integer.class, clientId, authClientId, commandeId);
        return count != null && count > 0;
    }

    private boolean existsByReference(String reference, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = "SELECT COUNT(*) FROM facture_client WHERE reference_facture_client = ?";
        // ✅ Utiliser queryForObjectAuth
        Integer count = tenantRepo.queryForObjectAuth(sql, Integer.class, clientId, authClientId, reference);
        return count != null && count > 0;
    }

    private CommandeClient getCommandeById(Integer commandeId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = "SELECT * FROM commande_client WHERE id_commande_client = ?";
        // ✅ Utiliser queryForObjectAuth
        return tenantRepo.queryForObjectAuth(sql, commandeRowMapper(), clientId, authClientId, commandeId);
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

        CommandeClient commande = getCommandeById(commandeId, token);
        if (commande == null) {
            throw new RuntimeException("Commande non trouvée avec l'ID: " + commandeId);
        }

        if (commande.getStatut() != CommandeClient.StatutCommande.CONFIRMEE) {
            throw new RuntimeException("Seules les commandes validées peuvent être facturées");
        }

        if (existsByCommandeId(commandeId, token)) {
            throw new RuntimeException("Une facture existe déjà pour cette commande");
        }

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

        // ✅ Utiliser queryForObjectAuth
        Integer factureId = tenantRepo.queryForObjectAuth(insertSql, Integer.class, clientId, authClientId,
                reference, LocalDateTime.now(), commande.getTotal(),
                FactureClient.StatutFacture.NON_PAYE.name(), commande.getClient().getIdClient(), commandeId,
                currentUser, LocalDateTime.now());

        return getFactureById(factureId, token);
    }


    public byte[] generateInvoicePdf(Integer factureId, String token) {
        try {
            log.info("📄 Début génération PDF pour facture ID: {}", factureId);

            // 1. Récupérer la facture
            FactureClient facture = getFactureById(factureId, token);
            log.info("✅ Facture trouvée: {}", facture.getReferenceFactureClient());

            // ✅ CORRECTION: Utiliser getCommande() au lieu de getCommandeId()
            CommandeResponseDTO commande = CommandeResponseDTO.fromEntity(facture.getCommande());
            if (commande == null) {
                // Fallback: chercher par l'ID si nécessaire
                commande = commandeService.getCommandeById(facture.getCommande().getIdCommandeClient(), token);
            }
            log.info("✅ Commande trouvée: {}", commande.getReferenceCommandeClient());

            // 3. Récupérer le client
            ClientDTO client = ClientDTO.fromEntity(facture.getClient());
            if (client == null && commande != null) {
                client = commande.getClient();
            }
            log.info("✅ Client: {} {}", client.getPrenom(), client.getNom());

            // 4. Création du PDF
            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            // Version texte simple pour tester (pas un vrai PDF)
            String pdfContent = "FACTURE\n";
            pdfContent += "========\n\n";
            pdfContent += "Facture N°: " + facture.getReferenceFactureClient() + "\n";
            pdfContent += "Date: " + facture.getDateFacture() + "\n\n";
            pdfContent += "Client: " + client.getPrenom() + " " + client.getNom() + "\n";
            pdfContent += "Email: " + client.getEmail() + "\n";
            pdfContent += "Téléphone: " + client.getTelephone() + "\n\n";
            pdfContent += "Commande N°: " + commande.getReferenceCommandeClient() + "\n";
            pdfContent += "Date commande: " + commande.getDateCommande() + "\n\n";
            pdfContent += "Total TTC: " + commande.getTotal() + " TND\n";

            baos.write(pdfContent.getBytes());
            log.info("✅ PDF généré avec succès, taille: {} bytes", baos.size());

            return baos.toByteArray();

        } catch (Exception e) {
            log.error("❌ Erreur génération PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur: " + e.getMessage(), e);
        }
    }

    /**
     * Récupérer une facture par son ID
     */
    public FactureClient getFactureById(Integer factureId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // Requête avec jointures pour charger commande et client
        String sql = """
        SELECT f.*, 
               c.id_commande_client, c.reference_commande_client, c.date_commande, 
               c.sous_total, c.taux_remise, c.total,
               cl.id_client, cl.nom, cl.prenom, cl.email, cl.telephone, cl.adresse
        FROM facture_client f
        LEFT JOIN commande_client c ON f.commande_id = c.id_commande_client
        LEFT JOIN client cl ON f.client_id = cl.id_client
        WHERE f.id_facture_client = ?
        """;

        FactureClient facture = tenantRepo.queryForObjectAuth(sql, (rs, rowNum) -> {
            FactureClient fact = new FactureClient();
            fact.setIdFactureClient(rs.getInt("id_facture_client"));
            fact.setReferenceFactureClient(rs.getString("reference_facture_client"));
            fact.setDateFacture(rs.getTimestamp("date_facture") != null ?
                    rs.getTimestamp("date_facture").toLocalDateTime() : null);
            fact.setMontantTotal(rs.getBigDecimal("montant_total"));

            String statutStr = rs.getString("statut");
            if (statutStr != null) {
                fact.setStatut(FactureClient.StatutFacture.valueOf(statutStr));
            }

            // ✅ CHARGER LA COMMANDE
            CommandeClient commande = new CommandeClient();
            commande.setIdCommandeClient(rs.getInt("id_commande_client"));
            commande.setReferenceCommandeClient(rs.getString("reference_commande_client"));
            commande.setDateCommande(rs.getTimestamp("date_commande") != null ?
                    rs.getTimestamp("date_commande").toLocalDateTime() : null);
            commande.setSousTotal(rs.getBigDecimal("sous_total"));
            commande.setTauxRemise(rs.getBigDecimal("taux_remise"));
            commande.setTotal(rs.getBigDecimal("total"));
            fact.setCommande(commande);

            // ✅ CHARGER LE CLIENT
            Client client = new Client();
            client.setIdClient(rs.getInt("id_client"));
            client.setNom(rs.getString("nom"));
            client.setPrenom(rs.getString("prenom"));
            client.setEmail(rs.getString("email"));
            client.setTelephone(rs.getString("telephone"));
            client.setAdresse(rs.getString("adresse"));
            fact.setClient(client);

            return fact;
        }, clientId, authClientId, factureId);

        // ✅ CHARGER LES LIGNES DE LA COMMANDE
        if (facture != null && facture.getCommande() != null) {
            String sqlLignes = """
            SELECT l.*, p.libelle as produit_libelle, p.prix_vente
            FROM ligne_commande_client l
            JOIN produit p ON l.produit_id = p.id_produit
            WHERE l.commande_client_id = ?
            """;

            List<LigneCommandeClient> lignes = tenantRepo.queryWithAuth(sqlLignes, (rs, rowNum) -> {
                LigneCommandeClient ligne = new LigneCommandeClient();
                ligne.setIdLigneCommandeClient(rs.getInt("id_ligne_commande_client"));
                ligne.setQuantite(rs.getInt("quantite"));
                ligne.setPrixUnitaire(rs.getBigDecimal("prix_unitaire"));
                ligne.setSousTotal(rs.getBigDecimal("sous_total"));

                Produit produit = new Produit();
                produit.setIdProduit(rs.getInt("produit_id"));
                produit.setLibelle(rs.getString("produit_libelle"));
                produit.setPrixVente(rs.getDouble("prix_vente"));
                ligne.setProduit(produit);
                return ligne;
            }, clientId, authClientId, facture.getCommande().getIdCommandeClient());

            facture.getCommande().setLignesCommande(lignes);
            System.out.println("✅ Lignes chargées pour commande: " + lignes.size());
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
        // ✅ Utiliser queryForObjectAuth
        return tenantRepo.queryForObjectAuth(sql, factureRowMapper(), clientId, authClientId, commandeId);
    }

    /**
     * Récupérer toutes les factures
     */
    public List<FactureClient> getAllFactures(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // ✅ Requête avec JOIN pour charger client et commande
        String sql = """
        SELECT f.*, 
               cl.id_client, cl.nom, cl.prenom, cl.email, cl.telephone, cl.adresse, cl.type_client,
               c.id_commande_client, c.reference_commande_client, c.total, c.date_commande
        FROM facture_client f
        LEFT JOIN client cl ON f.client_id = cl.id_client
        LEFT JOIN commande_client c ON f.commande_id = c.id_commande_client
        ORDER BY f.date_facture DESC
        """;

        return tenantRepo.queryWithAuth(sql, (rs, rowNum) -> {
            FactureClient facture = new FactureClient();
            facture.setIdFactureClient(rs.getInt("id_facture_client"));
            facture.setReferenceFactureClient(rs.getString("reference_facture_client"));
            facture.setDateFacture(rs.getTimestamp("date_facture") != null ?
                    rs.getTimestamp("date_facture").toLocalDateTime() : null);
            facture.setMontantTotal(rs.getBigDecimal("montant_total"));

            String statutStr = rs.getString("statut");
            if (statutStr != null) {
                facture.setStatut(FactureClient.StatutFacture.valueOf(statutStr));
            }

            // ✅ Charger le client complet
            Client client = new Client();
            client.setIdClient(rs.getInt("id_client"));
            client.setNom(rs.getString("nom"));
            client.setPrenom(rs.getString("prenom"));
            client.setEmail(rs.getString("email"));
            client.setTelephone(rs.getString("telephone"));
            client.setAdresse(rs.getString("adresse"));
            facture.setClient(client);

            // ✅ Charger la commande complète
            CommandeClient commande = new CommandeClient();
            commande.setIdCommandeClient(rs.getInt("id_commande_client"));
            commande.setReferenceCommandeClient(rs.getString("reference_commande_client"));
            commande.setTotal(rs.getBigDecimal("total"));
            commande.setDateCommande(rs.getTimestamp("date_commande") != null ?
                    rs.getTimestamp("date_commande").toLocalDateTime() : null);
            facture.setCommande(commande);

            facture.setCreatedAt(rs.getTimestamp("created_at") != null ?
                    rs.getTimestamp("created_at").toLocalDateTime() : null);
            facture.setCreatedBy(rs.getString("created_by"));

            return facture;
        }, clientId, authClientId);
    }
    /**
     * Récupérer les factures d'un client
     */
    public List<FactureClient> getFacturesByClient(Integer clientIdParam, String token) {
        Long tenantClientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(tenantClientId);
        String sql = "SELECT * FROM facture_client WHERE client_id = ? ORDER BY date_facture DESC";
        // ✅ Utiliser queryWithAuth
        return tenantRepo.queryWithAuth(sql, factureRowMapper(), tenantClientId, authClientId, clientIdParam);
    }

    /**
     * Marquer une facture comme payée
     */
    public FactureClient marquerFacturePayee(Integer factureId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        FactureClient facture = getFactureById(factureId, token);

        String updateSql = "UPDATE facture_client SET statut = ? WHERE id_facture_client = ?";
        // ✅ Utiliser updateWithAuth
        tenantRepo.updateWithAuth(updateSql, clientId, authClientId, FactureClient.StatutFacture.PAYE.name(), factureId);

        return getFactureById(factureId, token);
    }
}