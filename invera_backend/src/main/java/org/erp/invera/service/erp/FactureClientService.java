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
    private final ClientService clientService;
    private final ProduitService produitService;

    private final Random random = new Random();

    private Long getClientIdFromToken(String token) {
        return jwtTokenProvider.getClientIdFromToken(token);
    }

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
                try {
                    facture.setStatut(FactureClient.StatutFacture.valueOf(statutStr));
                } catch (IllegalArgumentException e) {
                    facture.setStatut(FactureClient.StatutFacture.NON_PAYE);
                }
            }

            if (rs.getObject("client_id") != null) {
                Client client = new Client();
                client.setIdClient(rs.getInt("client_id"));
                facture.setClient(client);
            }

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

    // CORRECTION: RowMapper pour CommandeClient sans taux_remise
    private RowMapper<CommandeClient> commandeRowMapper() {
        return (rs, rowNum) -> {
            CommandeClient commande = new CommandeClient();
            commande.setIdCommandeClient(rs.getInt("id_commande_client"));
            commande.setReferenceCommandeClient(rs.getString("reference_commande_client"));
            commande.setDateCommande(rs.getTimestamp("date_commande") != null ?
                    rs.getTimestamp("date_commande").toLocalDateTime() : null);
            commande.setTotal(rs.getBigDecimal("total") != null ? rs.getBigDecimal("total") : BigDecimal.ZERO);
            commande.setSousTotal(rs.getBigDecimal("sous_total") != null ? rs.getBigDecimal("sous_total") : BigDecimal.ZERO);
            // taux_remise n'existe pas dans la table, on met à 0
            commande.setTauxRemise(BigDecimal.ZERO);

            String statutStr = rs.getString("statut");
            if (statutStr != null) {
                try {
                    commande.setStatut(CommandeClient.StatutCommande.valueOf(statutStr));
                } catch (IllegalArgumentException e) {
                    commande.setStatut(CommandeClient.StatutCommande.EN_ATTENTE);
                }
            }

            Client client = new Client();
            client.setIdClient(rs.getInt("client_id"));
            commande.setClient(client);

            return commande;
        };
    }

    public boolean existsByCommandeId(Integer commandeId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = "SELECT COUNT(*) FROM facture_client WHERE commande_id = ?";
        Integer count = tenantRepo.queryForObjectAuth(sql, Integer.class, clientId, authClientId, commandeId);
        return count != null && count > 0;
    }

    private boolean existsByReference(String reference, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = "SELECT COUNT(*) FROM facture_client WHERE reference_facture_client = ?";
        Integer count = tenantRepo.queryForObjectAuth(sql, Integer.class, clientId, authClientId, reference);
        return count != null && count > 0;
    }

    // CORRECTION: Utiliser queryWithAuth au lieu de queryForObjectAuth
    // Ne pas utiliser SELECT *, lister les colonnes explicitement
    // Ne pas inclure taux_remise qui n'existe pas
    private CommandeClient getCommandeById(Integer commandeId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = """
            SELECT id_commande_client, reference_commande_client, client_id, 
                   statut, date_commande, sous_total, total
            FROM commande_client 
            WHERE id_commande_client = ?
            """;

        List<CommandeClient> resultats = tenantRepo.queryWithAuth(
                sql,
                (rs, rowNum) -> {
                    CommandeClient cmd = new CommandeClient();
                    cmd.setIdCommandeClient(rs.getInt("id_commande_client"));
                    cmd.setReferenceCommandeClient(rs.getString("reference_commande_client"));
                    cmd.setDateCommande(rs.getTimestamp("date_commande") != null ?
                            rs.getTimestamp("date_commande").toLocalDateTime() : null);
                    cmd.setSousTotal(rs.getBigDecimal("sous_total") != null ?
                            rs.getBigDecimal("sous_total") : BigDecimal.ZERO);
                    cmd.setTotal(rs.getBigDecimal("total") != null ?
                            rs.getBigDecimal("total") : BigDecimal.ZERO);
                    cmd.setTauxRemise(BigDecimal.ZERO);

                    Client client = new Client();
                    client.setIdClient(rs.getInt("client_id"));
                    cmd.setClient(client);

                    String statutStr = rs.getString("statut");
                    if (statutStr != null) {
                        try {
                            cmd.setStatut(CommandeClient.StatutCommande.valueOf(statutStr));
                        } catch (IllegalArgumentException e) {
                            cmd.setStatut(CommandeClient.StatutCommande.EN_ATTENTE);
                        }
                    }
                    return cmd;
                },
                clientId, authClientId, commandeId
        );

        return (resultats != null && !resultats.isEmpty()) ? resultats.get(0) : null;
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

    public FactureClient genererFactureDepuisCommande(Integer commandeId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        CommandeClient commande = getCommandeById(commandeId, token);
        if (commande == null) {
            throw new RuntimeException("Commande non trouvee avec l'ID: " + commandeId);
        }

        if (commande.getStatut() != CommandeClient.StatutCommande.CONFIRMEE) {
            throw new RuntimeException("Seules les commandes validees peuvent etre facturees. Statut actuel: " + commande.getStatut());
        }

        if (existsByCommandeId(commandeId, token)) {
            throw new RuntimeException("Une facture existe deja pour cette commande");
        }

        String reference = genererReferenceFacture(token);
        String currentUser = jwtTokenProvider.getEmailFromToken(token);
        if (currentUser == null || currentUser.isBlank()) {
            currentUser = "SYSTEM";
        }

        // Recuperer le client complet pour avoir son ID
        String sqlClient = "SELECT id_client FROM client WHERE id_client = ?";
        Integer clientIdFinal = tenantRepo.queryForObjectAuth(sqlClient, Integer.class, clientId, authClientId, commande.getClient().getIdClient());

        if (clientIdFinal == null) {
            throw new RuntimeException("Client non trouve pour cette commande");
        }

        String insertSql = """
            INSERT INTO facture_client (reference_facture_client, date_facture, montant_total, 
                                        statut, client_id, commande_id, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id_facture_client
            """;

        Integer factureId = tenantRepo.queryForObjectAuth(insertSql, Integer.class, clientId, authClientId,
                reference, LocalDateTime.now(), commande.getTotal(),
                FactureClient.StatutFacture.NON_PAYE.name(), clientIdFinal, commandeId,
                currentUser, LocalDateTime.now());

        return getFactureById(factureId, token);
    }

    public byte[] generateInvoicePdf(Integer factureId, String token) {
        try {
            log.info("Debut generation PDF pour facture ID: {}", factureId);

            FactureClient facture = getFactureById(factureId, token);
            log.info("Facture trouvee: {}", facture.getReferenceFactureClient());

            CommandeResponseDTO commande = CommandeResponseDTO.fromEntity(
                    facture.getCommande(),
                    clientService,
                    produitService
            );

            if (commande == null) {
                commande = commandeService.getCommandeById(facture.getCommande().getIdCommandeClient(), token);
            }
            log.info("Commande trouvee: {}", commande.getReferenceCommandeClient());

            ClientDTO client = ClientDTO.fromEntity(facture.getClient());
            if (client == null && commande != null) {
                client = commande.getClient();
            }
            log.info("Client: {} {}", client.getPrenom(), client.getNom());

            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            String pdfContent = "FACTURE\n";
            pdfContent += "========\n\n";
            pdfContent += "Facture N°: " + facture.getReferenceFactureClient() + "\n";
            pdfContent += "Date: " + facture.getDateFacture() + "\n\n";
            pdfContent += "Client: " + client.getPrenom() + " " + client.getNom() + "\n";
            pdfContent += "Email: " + client.getEmail() + "\n";
            pdfContent += "Telephone: " + client.getTelephone() + "\n\n";
            pdfContent += "Commande N°: " + commande.getReferenceCommandeClient() + "\n";
            pdfContent += "Date commande: " + commande.getDateCommande() + "\n\n";
            pdfContent += "Total TTC: " + commande.getTotal() + " TND\n";

            baos.write(pdfContent.getBytes());
            log.info("PDF genere avec succes, taille: {} bytes", baos.size());

            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Erreur generation PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur: " + e.getMessage(), e);
        }
    }

    // CORRECTION: getFactureById avec SELECT explicite et queryWithAuth
    public FactureClient getFactureById(Integer factureId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = """
            SELECT f.id_facture_client, f.reference_facture_client, f.date_facture, 
                   f.montant_total, f.statut, f.client_id, f.commande_id, f.created_at, f.created_by,
                   c.id_commande_client, c.reference_commande_client, c.date_commande, 
                   c.sous_total, c.total,
                   cl.id_client, cl.nom, cl.prenom, cl.email, cl.telephone, cl.adresse
            FROM facture_client f
            LEFT JOIN commande_client c ON f.commande_id = c.id_commande_client
            LEFT JOIN client cl ON f.client_id = cl.id_client
            WHERE f.id_facture_client = ?
            """;

        List<FactureClient> factures = tenantRepo.queryWithAuth(sql, (rs, rowNum) -> {
            FactureClient fact = new FactureClient();
            fact.setIdFactureClient(rs.getInt("id_facture_client"));
            fact.setReferenceFactureClient(rs.getString("reference_facture_client"));
            fact.setDateFacture(rs.getTimestamp("date_facture") != null ?
                    rs.getTimestamp("date_facture").toLocalDateTime() : null);
            fact.setMontantTotal(rs.getBigDecimal("montant_total"));

            String statutStr = rs.getString("statut");
            if (statutStr != null) {
                try {
                    fact.setStatut(FactureClient.StatutFacture.valueOf(statutStr));
                } catch (IllegalArgumentException e) {
                    fact.setStatut(FactureClient.StatutFacture.NON_PAYE);
                }
            }

            // Charger la commande
            CommandeClient commande = new CommandeClient();
            commande.setIdCommandeClient(rs.getInt("id_commande_client"));
            commande.setReferenceCommandeClient(rs.getString("reference_commande_client"));
            commande.setDateCommande(rs.getTimestamp("date_commande") != null ?
                    rs.getTimestamp("date_commande").toLocalDateTime() : null);
            commande.setSousTotal(rs.getBigDecimal("sous_total") != null ? rs.getBigDecimal("sous_total") : BigDecimal.ZERO);
            commande.setTotal(rs.getBigDecimal("total") != null ? rs.getBigDecimal("total") : BigDecimal.ZERO);
            commande.setTauxRemise(BigDecimal.ZERO);
            fact.setCommande(commande);

            // Charger le client
            Client client = new Client();
            client.setIdClient(rs.getInt("id_client"));
            client.setNom(rs.getString("nom"));
            client.setPrenom(rs.getString("prenom"));
            client.setEmail(rs.getString("email"));
            client.setTelephone(rs.getString("telephone"));
            client.setAdresse(rs.getString("adresse"));
            fact.setClient(client);

            fact.setCreatedAt(rs.getTimestamp("created_at") != null ?
                    rs.getTimestamp("created_at").toLocalDateTime() : null);
            fact.setCreatedBy(rs.getString("created_by"));

            return fact;
        }, clientId, authClientId, factureId);

        if (factures == null || factures.isEmpty()) {
            throw new RuntimeException("Facture non trouvee avec l'ID: " + factureId);
        }

        FactureClient facture = factures.get(0);

        // Charger les lignes de la commande
        if (facture.getCommande() != null && facture.getCommande().getIdCommandeClient() != null) {
            String sqlLignes = """
                SELECT l.id_ligne_commande_client, l.quantite, l.prix_unitaire, l.sous_total,
                       p.id_produit, p.libelle as produit_libelle, p.prix_vente
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
                produit.setIdProduit(rs.getInt("id_produit"));
                produit.setLibelle(rs.getString("produit_libelle"));
                produit.setPrixVente(rs.getDouble("prix_vente"));
                ligne.setProduit(produit);
                return ligne;
            }, clientId, authClientId, facture.getCommande().getIdCommandeClient());

            facture.getCommande().setLignesCommande(lignes);
            log.info("Lignes chargees pour commande {}: {}", facture.getCommande().getIdCommandeClient(), lignes.size());
        }

        return facture;
    }

    public FactureClient getFactureByCommandeId(Integer commandeId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        String sql = "SELECT * FROM facture_client WHERE commande_id = ?";
        return tenantRepo.queryForObjectAuth(sql, factureRowMapper(), clientId, authClientId, commandeId);
    }

    public List<FactureClient> getAllFactures(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

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
                try {
                    facture.setStatut(FactureClient.StatutFacture.valueOf(statutStr));
                } catch (IllegalArgumentException e) {
                    facture.setStatut(FactureClient.StatutFacture.NON_PAYE);
                }
            }

            Client client = new Client();
            client.setIdClient(rs.getInt("id_client"));
            client.setNom(rs.getString("nom"));
            client.setPrenom(rs.getString("prenom"));
            client.setEmail(rs.getString("email"));
            client.setTelephone(rs.getString("telephone"));
            client.setAdresse(rs.getString("adresse"));
            facture.setClient(client);

            CommandeClient commande = new CommandeClient();
            commande.setIdCommandeClient(rs.getInt("id_commande_client"));
            commande.setReferenceCommandeClient(rs.getString("reference_commande_client"));
            commande.setTotal(rs.getBigDecimal("total") != null ? rs.getBigDecimal("total") : BigDecimal.ZERO);
            commande.setDateCommande(rs.getTimestamp("date_commande") != null ?
                    rs.getTimestamp("date_commande").toLocalDateTime() : null);
            facture.setCommande(commande);

            facture.setCreatedAt(rs.getTimestamp("created_at") != null ?
                    rs.getTimestamp("created_at").toLocalDateTime() : null);
            facture.setCreatedBy(rs.getString("created_by"));

            return facture;
        }, clientId, authClientId);
    }

    public List<FactureClient> getFacturesByClient(Integer clientIdParam, String token) {
        Long tenantClientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(tenantClientId);
        String sql = "SELECT * FROM facture_client WHERE client_id = ? ORDER BY date_facture DESC";
        return tenantRepo.queryWithAuth(sql, factureRowMapper(), tenantClientId, authClientId, clientIdParam);
    }

    public FactureClient marquerFacturePayee(Integer factureId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        FactureClient facture = getFactureById(factureId, token);

        String updateSql = "UPDATE facture_client SET statut = ? WHERE id_facture_client = ?";
        tenantRepo.updateWithAuth(updateSql, clientId, authClientId, FactureClient.StatutFacture.PAYE.name(), factureId);

        return getFactureById(factureId, token);
    }
}