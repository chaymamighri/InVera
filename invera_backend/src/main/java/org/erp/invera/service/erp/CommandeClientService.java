package org.erp.invera.service.erp;

import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.erp.commandeClientdto.CommandeRequestDTO;
import org.erp.invera.dto.erp.commandeClientdto.CommandeResponseDTO;
import org.erp.invera.dto.erp.commandeClientdto.CommandeUpdateRequestDTO;
import org.erp.invera.dto.erp.Produitdto.ProduitCommandeRequestDTO;
import org.erp.invera.dto.erp.Produitdto.ProduitCommandeUpdateDTO;
import org.erp.invera.model.erp.client.CommandeClient;
import org.erp.invera.model.erp.client.CommandeClient.StatutCommande;
import org.erp.invera.model.erp.client.Client;
import org.erp.invera.model.erp.client.LigneCommandeClient;
import org.erp.invera.model.erp.Produit;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.erp.invera.security.JwtTokenProvider;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class CommandeClientService {

    private final TenantAwareRepository tenantRepo;
    private final JwtTokenProvider jwtTokenProvider;
    private final ProduitService produitService;
    private final ClientService clientService;

    public CommandeClientService(TenantAwareRepository tenantRepo,
                                 JwtTokenProvider jwtTokenProvider,
                                 ProduitService produitService,
                                 ClientService clientService) {
        this.tenantRepo = tenantRepo;
        this.jwtTokenProvider = jwtTokenProvider;
        this.produitService = produitService;
        this.clientService = clientService;
    }

    // ✅ RowMapper pour CommandeClient
    public RowMapper<CommandeClient> commandeRowMapper() {
        return (rs, rowNum) -> {
            CommandeClient commande = new CommandeClient();
            commande.setIdCommandeClient(rs.getInt("id_commande_client"));
            commande.setReferenceCommandeClient(rs.getString("reference_commande_client"));

            // ✅ Créer un objet Client avec seulement l'ID (le reste sera chargé plus tard)
            Client client = new Client();
            client.setIdClient(rs.getInt("client_id"));
            commande.setClient(client);

            String statutStr = rs.getString("statut");
            if (statutStr != null) {
                try {
                    commande.setStatut(StatutCommande.valueOf(statutStr));
                } catch (IllegalArgumentException e) {
                    log.warn("Statut inconnu: {}, utilisation de EN_ATTENTE par défaut", statutStr);
                    commande.setStatut(StatutCommande.EN_ATTENTE);
                }
            }
            commande.setDateCommande(rs.getTimestamp("date_commande") != null ?
                    rs.getTimestamp("date_commande").toLocalDateTime() : null);
            commande.setSousTotal(rs.getBigDecimal("sous_total") != null ?
                    rs.getBigDecimal("sous_total") : BigDecimal.ZERO);
            commande.setTauxRemise(rs.getBigDecimal("taux_remise") != null ?
                    rs.getBigDecimal("taux_remise") : BigDecimal.ZERO);
            commande.setTotal(rs.getBigDecimal("total") != null ?
                    rs.getBigDecimal("total") : BigDecimal.ZERO);
            return commande;
        };
    }

    private RowMapper<Client> clientRowMapper() {
        return (rs, rowNum) -> {
            Client client = new Client();
            client.setIdClient(rs.getInt("id_client"));
            client.setNom(rs.getString("nom"));
            client.setPrenom(rs.getString("prenom"));
            client.setEmail(rs.getString("email"));
            client.setTelephone(rs.getString("telephone"));
            client.setAdresse(rs.getString("adresse"));

            // Type client (enum)
            String typeClient = rs.getString("type_client");
            if (typeClient != null) {
                try {
                    client.setTypeClient(Client.TypeClient.valueOf(typeClient));
                } catch (IllegalArgumentException e) {
                    log.warn("Type client inconnu: {}", typeClient);
                }
            }

            // Remises
            client.setRemiseClientFidele(rs.getDouble("remise_client_fidele"));
            client.setRemiseClientVIP(rs.getDouble("remise_client_vip"));
            client.setRemiseClientProfessionnelle(rs.getDouble("remise_client_professionnelle"));

            return client;
        };
    }

    public RowMapper<Produit> produitRowMapper() {
        return (rs, rowNum) -> {
            Produit produit = new Produit();
            produit.setIdProduit(rs.getInt("id_produit"));
            produit.setLibelle(rs.getString("libelle"));
            produit.setPrixVente(rs.getDouble("prix_vente"));
            produit.setQuantiteStock(rs.getInt("quantite_stock"));
            return produit;
        };
    }

    public RowMapper<LigneCommandeClient> ligneCommandeRowMapper() {
        return (rs, rowNum) -> {
            LigneCommandeClient ligne = new LigneCommandeClient();
            ligne.setIdLigneCommandeClient(rs.getInt("id_ligne_commande_client"));
            ligne.setQuantite(rs.getInt("quantite"));
            ligne.setPrixUnitaire(rs.getBigDecimal("prix_unitaire"));
            ligne.setSousTotal(rs.getBigDecimal("sous_total"));
            return ligne;
        };
    }

    private Long getClientIdFromToken(String token) {
        return jwtTokenProvider.getClientIdFromToken(token);
    }

    // ✅ Vérifier la disponibilité
    public boolean verifierDisponibilite(Map<Integer, Integer> produits, String token) {
        if (produits == null || produits.isEmpty()) {
            return false;
        }

        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        for (Map.Entry<Integer, Integer> entry : produits.entrySet()) {
            Integer produitId = entry.getKey();
            Integer quantiteDemandee = entry.getValue();

            String sql = "SELECT quantite_stock FROM produit WHERE id_produit = ?";
            Integer stockDispo = tenantRepo.queryForObjectAuth(sql, Integer.class, clientId, authClientId, produitId);

            if (stockDispo == null || stockDispo < quantiteDemandee) {
                return false;
            }
        }
        return true;
    }

    // ✅ Créer une commande
    @Transactional
    public CommandeClient createCommande(CommandeRequestDTO commandeRequest, String token) {
        System.out.println("🛠️ Création de commande en cours...");

        Integer clientFinalId = commandeRequest.getClientId();
        Long tenantId = getClientIdFromToken(token);
        String authClientId = String.valueOf(tenantId);

        if (clientFinalId == null) {
            throw new RuntimeException("ID client requis pour créer la commande");
        }

        System.out.println("🔍 Client final ID: " + clientFinalId);
        System.out.println("🔍 Tenant ID: " + tenantId);

        String sqlClient = "SELECT * FROM client WHERE id_client = ?";
        Client client = tenantRepo.queryForObjectAuth(sqlClient, clientRowMapper(), tenantId, authClientId, clientFinalId);

        if (client == null) {
            throw new RuntimeException("Client non trouvé avec l'ID: " + clientFinalId);
        }
        System.out.println("✅ Client trouvé: " + client.getNom());

        String reference = genererReferenceCommande();

        Map<Integer, Integer> produitsMap = new HashMap<>();
        for (ProduitCommandeRequestDTO produitDTO : commandeRequest.getProduits()) {
            produitsMap.put(produitDTO.getProduitId(), produitDTO.getQuantite());
        }

        boolean disponible = verifierDisponibilite(produitsMap, token);
        if (!disponible) {
            throw new RuntimeException("Stock insuffisant pour certains produits");
        }
        System.out.println("✅ Disponibilité vérifiée");

        String insertCommande = """
            INSERT INTO commande_client (reference_commande_client, client_id, statut, date_commande, sous_total, taux_remise, total)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            RETURNING id_commande_client
            """;

        Integer commandeId = tenantRepo.queryForObjectAuth(insertCommande, Integer.class, tenantId, authClientId,
                reference, clientFinalId, "EN_ATTENTE", LocalDateTime.now(), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);

        BigDecimal sousTotal = BigDecimal.ZERO;

        for (ProduitCommandeRequestDTO produitDTO : commandeRequest.getProduits()) {
            String sqlProduit = "SELECT * FROM produit WHERE id_produit = ?";
            Produit produit = tenantRepo.queryForObjectAuth(sqlProduit, produitRowMapper(), tenantId, authClientId, produitDTO.getProduitId());

            if (produit == null) {
                throw new RuntimeException("Produit non trouvé avec l'ID: " + produitDTO.getProduitId());
            }

            BigDecimal prixUnitaire = produitDTO.getPrixUnitaire() != null ?
                    produitDTO.getPrixUnitaire() : safeToBigDecimal(produit.getPrixVente());

            BigDecimal quantite = BigDecimal.valueOf(produitDTO.getQuantite());
            BigDecimal sousTotalLigne = prixUnitaire.multiply(quantite);
            sousTotal = sousTotal.add(sousTotalLigne);

            String insertLigne = """
                INSERT INTO ligne_commande_client (commande_client_id, produit_id, quantite, prix_unitaire, sous_total)
                VALUES (?, ?, ?, ?, ?)
                RETURNING id_ligne_commande_client
                """;

            tenantRepo.queryForObjectAuth(insertLigne, Integer.class, tenantId, authClientId,
                    commandeId, produitDTO.getProduitId(), produitDTO.getQuantite(), prixUnitaire, sousTotalLigne);

            System.out.println("📦 Produit ajouté: " + produit.getLibelle() +
                    ", Quantité: " + produitDTO.getQuantite() +
                    ", Prix unitaire: " + prixUnitaire +
                    ", Sous-total: " + sousTotalLigne);
        }

        BigDecimal tauxRemise = commandeRequest.getRemiseTotale() != null ?
                commandeRequest.getRemiseTotale() : BigDecimal.ZERO;

        BigDecimal montantRemise = sousTotal.multiply(tauxRemise.divide(BigDecimal.valueOf(100)));
        BigDecimal total = sousTotal.subtract(montantRemise);

        String updateTotaux = """
            UPDATE commande_client 
            SET sous_total = ?, taux_remise = ?, total = ? 
            WHERE id_commande_client = ?
            """;
        tenantRepo.updateWithAuth(updateTotaux, tenantId, authClientId, sousTotal, tauxRemise, total, commandeId);

        System.out.println("💰 Totaux calculés:");
        System.out.println("  Sous-total: " + sousTotal);
        System.out.println("  Remise: " + montantRemise + " (" + tauxRemise + "%)");
        System.out.println("  Total: " + total);

        String sqlCommande = "SELECT * FROM commande_client WHERE id_commande_client = ?";
        CommandeClient savedCommande = tenantRepo.queryForObjectAuth(sqlCommande, commandeRowMapper(), tenantId, authClientId, commandeId);

        System.out.println("✅ Commande créée avec ID: " + savedCommande.getIdCommandeClient() +
                " et référence: " + savedCommande.getReferenceCommandeClient());

        return savedCommande;
    }


    /**
     * Charger les lignes d'une commande
     */
    private void chargerLignesCommande(CommandeClient commande, Long clientId, String authClientId) {
        String sqlLignes = """
        SELECT l.*, 
               p.id_produit, p.libelle as produit_libelle, 
               p.prix_vente, p.image_url,
               c.id_categorie, c.nom_categorie
        FROM ligne_commande_client l
        JOIN produit p ON l.produit_id = p.id_produit
        LEFT JOIN categorie c ON p.categorie_id = c.id_categorie
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
            produit.setImageUrl(rs.getString("image_url"));

            ligne.setProduit(produit);
            return ligne;
        }, clientId, authClientId, commande.getIdCommandeClient());

        commande.setLignesCommande(lignes);
        log.info("📦 Commande {} - {} lignes chargées", commande.getIdCommandeClient(), lignes.size());
    }


    /**
     * Charger les détails complets du client d'une commande
     */
    private void chargerClientComplet(CommandeClient commande, Long tenantId, String authClientId) {
        if (commande.getClient() == null || commande.getClient().getIdClient() == null) {
            log.warn("⚠️ Commande {} n'a pas de client associé", commande.getIdCommandeClient());
            return;
        }

        Integer clientId = commande.getClient().getIdClient();
        String sqlClient = "SELECT * FROM client WHERE id_client = ?";

        Client clientComplet = tenantRepo.queryForObjectAuth(sqlClient, clientRowMapper(), tenantId, authClientId, clientId);

        if (clientComplet != null) {
            commande.setClient(clientComplet);
            log.info("👤 Client chargé pour commande {}: {} {} (ID: {})",
                    commande.getIdCommandeClient(),
                    clientComplet.getPrenom(),
                    clientComplet.getNom(),
                    clientComplet.getIdClient());
        } else {
            log.warn("⚠️ Client non trouvé pour commande {} avec client_id: {}",
                    commande.getIdCommandeClient(), clientId);
        }
    }


    public List<CommandeResponseDTO> getAllCommandes(String token) {
        log.info("========== DÉBUT RÉCUPÉRATION COMMANDES ==========");

        Long tenantId = getClientIdFromToken(token);
        String authClientId = String.valueOf(tenantId);

        log.info("📊 Tenant ID: {}", tenantId);

        String sql = "SELECT * FROM commande_client ORDER BY date_commande DESC";

        List<CommandeClient> commandes = tenantRepo.queryWithAuth(
                sql,
                (rs, rowNum) -> {
                    CommandeClient cmd = new CommandeClient();
                    cmd.setIdCommandeClient(rs.getInt("id_commande_client"));
                    cmd.setReferenceCommandeClient(rs.getString("reference_commande_client"));

                    // ✅ Client avec ID uniquement (pour la relation)
                    Client client = new Client();
                    client.setIdClient(rs.getInt("client_id"));
                    cmd.setClient(client);

                    cmd.setDateCommande(rs.getTimestamp("date_commande") != null ?
                            rs.getTimestamp("date_commande").toLocalDateTime() : null);
                    cmd.setSousTotal(rs.getBigDecimal("sous_total"));
                    cmd.setTauxRemise(rs.getBigDecimal("taux_remise"));
                    cmd.setTotal(rs.getBigDecimal("total"));
                    String statutStr = rs.getString("statut");
                    if (statutStr != null) {
                        try {
                            cmd.setStatut(StatutCommande.valueOf(statutStr));
                        } catch (IllegalArgumentException e) {
                            cmd.setStatut(StatutCommande.EN_ATTENTE);
                        }
                    }
                    return cmd;
                },
                tenantId, authClientId
        );

        log.info("📊 Nombre de commandes trouvées: {}", commandes.size());

        if (commandes.isEmpty()) {
            log.warn("⚠️ Aucune commande trouvée pour le tenant {}", tenantId);
            return new ArrayList<>();
        }

        // ✅ CHARGER LES LIGNES ET LES CLIENTS COMPLETS
        for (CommandeClient cmd : commandes) {
            chargerLignesCommande(cmd, tenantId, authClientId);
            chargerClientComplet(cmd, tenantId, authClientId);
        }

        for (int i = 0; i < commandes.size(); i++) {
            CommandeClient cmd = commandes.get(i);
            log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            log.info("📦 Commande #{} - ID: {}, Réf: {}", (i+1), cmd.getIdCommandeClient(), cmd.getReferenceCommandeClient());
            log.info("   👤 Client: {} {} (ID: {})",
                    cmd.getClient() != null ? cmd.getClient().getPrenom() : "?",
                    cmd.getClient() != null ? cmd.getClient().getNom() : "?",
                    cmd.getClient() != null ? cmd.getClient().getIdClient() : "?");
            log.info("   📅 Date: {}", cmd.getDateCommande());
            log.info("   💰 Sous-total: {} TND", cmd.getSousTotal());
            log.info("   🏷️  Remise: {} %", cmd.getTauxRemise());
            log.info("   💵 Total: {} TND", cmd.getTotal());
            log.info("   📌 Statut: {}", cmd.getStatut());
            log.info("   📋 Nombre de lignes: {}", cmd.getLignesCommande() != null ? cmd.getLignesCommande().size() : 0);
        }

        log.info("========== FIN RÉCUPÉRATION COMMANDES ==========");

        return commandes.stream()
                .map(cmd -> CommandeResponseDTO.fromEntity(cmd, clientService, produitService))
                .collect(Collectors.toList());
    }

    public CommandeResponseDTO getCommandeById(Integer id, String token) {
        log.info("========== RECHERCHE COMMANDE ID: {} ==========", id);

        Long tenantId = getClientIdFromToken(token);
        String authClientId = String.valueOf(tenantId);

        String sql = "SELECT * FROM commande_client WHERE id_commande_client = ?";

        CommandeClient commande = tenantRepo.queryForObjectAuth(
                sql,
                (rs, rowNum) -> {
                    CommandeClient cmd = new CommandeClient();
                    cmd.setIdCommandeClient(rs.getInt("id_commande_client"));
                    cmd.setReferenceCommandeClient(rs.getString("reference_commande_client"));

                    // ✅ Client avec ID uniquement (pour la relation)
                    Client client = new Client();
                    client.setIdClient(rs.getInt("client_id"));
                    cmd.setClient(client);

                    cmd.setDateCommande(rs.getTimestamp("date_commande") != null ?
                            rs.getTimestamp("date_commande").toLocalDateTime() : null);
                    cmd.setSousTotal(rs.getBigDecimal("sous_total"));
                    cmd.setTauxRemise(rs.getBigDecimal("taux_remise"));
                    cmd.setTotal(rs.getBigDecimal("total"));
                    String statutStr = rs.getString("statut");
                    if (statutStr != null) {
                        try {
                            cmd.setStatut(StatutCommande.valueOf(statutStr));
                        } catch (IllegalArgumentException e) {
                            cmd.setStatut(StatutCommande.EN_ATTENTE);
                        }
                    }
                    return cmd;
                },
                tenantId, authClientId, id
        );

        if (commande == null) {
            log.error("❌ Commande non trouvée avec l'ID: {}", id);
            throw new RuntimeException("Commande non trouvée");
        }

        // ✅ CHARGER LES LIGNES ET LE CLIENT COMPLET
        chargerLignesCommande(commande, tenantId, authClientId);
        chargerClientComplet(commande, tenantId, authClientId);

        log.info("✅ Commande trouvée:");
        log.info("   ID: {}", commande.getIdCommandeClient());
        log.info("   Référence: {}", commande.getReferenceCommandeClient());
        log.info("   👤 Client: {} {} (ID: {})",
                commande.getClient() != null ? commande.getClient().getPrenom() : "?",
                commande.getClient() != null ? commande.getClient().getNom() : "?",
                commande.getClient() != null ? commande.getClient().getIdClient() : "?");
        log.info("   Date: {}", commande.getDateCommande());
        log.info("   Total: {} TND", commande.getTotal());
        log.info("   Statut: {}", commande.getStatut());
        log.info("   Nombre de lignes: {}", commande.getLignesCommande() != null ? commande.getLignesCommande().size() : 0);

        return CommandeResponseDTO.fromEntity(commande, clientService, produitService);
    }

    // ✅ Mettre à jour une commande
    @Transactional
    public CommandeClient updateCommande(Integer commandeId, CommandeUpdateRequestDTO request, String token) {

        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sqlCommande = "SELECT * FROM commande_client WHERE id_commande_client = ?";
        // ✅ Utiliser queryForObjectAuth
        CommandeClient commande = tenantRepo.queryForObjectAuth(sqlCommande, commandeRowMapper(), clientId, authClientId, commandeId);

        if (commande == null) {
            throw new RuntimeException("Commande non trouvée");
        }

        if (commande.getStatut() != CommandeClient.StatutCommande.EN_ATTENTE) {
            throw new RuntimeException("Impossible de modifier une commande qui n'est pas en attente");
        }

        if (request.getStatut() != null) {
            String updateStatut = "UPDATE commande_client SET statut = ? WHERE id_commande_client = ?";
            // ✅ Utiliser updateWithAuth
            tenantRepo.updateWithAuth(updateStatut, clientId, authClientId, request.getStatut(), commandeId);
        }

        if (request.getClientAdresse() != null) {
            String updateClient = "UPDATE client SET adresse = ?, telephone = ?, email = ? WHERE id = ?";
            // ✅ Utiliser updateWithAuth
            tenantRepo.updateWithAuth(updateClient, clientId, authClientId,
                    request.getClientAdresse(), request.getClientTelephone(), request.getClientEmail(), clientId);
        }

        updateLignesCommande(commandeId, request.getProduits(), token);

        String sqlLignes = "SELECT * FROM ligne_commande_client WHERE commande_client_id = ?";
        // ✅ Utiliser queryWithAuth
        List<LigneCommandeClient> lignes = tenantRepo.queryWithAuth(sqlLignes, ligneCommandeRowMapper(), clientId, authClientId, commandeId);

        BigDecimal sousTotal = calculerSousTotal(lignes);
        BigDecimal tauxRemise = commande.getTauxRemise();
        BigDecimal total = sousTotal.subtract(sousTotal.multiply(tauxRemise.divide(BigDecimal.valueOf(100))));

        String updateTotaux = "UPDATE commande_client SET sous_total = ?, total = ? WHERE id_commande_client = ?";
        // ✅ Utiliser updateWithAuth
        tenantRepo.updateWithAuth(updateTotaux, clientId, authClientId, sousTotal, total, commandeId);

        // ✅ Utiliser queryForObjectAuth
        return tenantRepo.queryForObjectAuth(sqlCommande, commandeRowMapper(), clientId, authClientId, commandeId);
    }

    private void updateLignesCommande(Integer commandeId, List<ProduitCommandeUpdateDTO> produitsDTO, String token) {

        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sqlLignesExistantes = "SELECT id_ligne_commande_client FROM ligne_commande_client WHERE commande_client_id = ?";
        // ✅ Utiliser queryWithAuth
        List<Integer> idsExistants = tenantRepo.queryWithAuth(sqlLignesExistantes,
                (rs, rowNum) -> rs.getInt("id_ligne_commande_client"), clientId, authClientId, commandeId);

        List<Integer> idsAConserver = produitsDTO.stream()
                .filter(p -> p.getId() != null)
                .map(ProduitCommandeUpdateDTO::getId)
                .collect(Collectors.toList());

        for (Integer id : idsExistants) {
            if (!idsAConserver.contains(id)) {
                String deleteLigne = "DELETE FROM ligne_commande_client WHERE id_ligne_commande_client = ?";
                // ✅ Utiliser updateWithAuth
                tenantRepo.updateWithAuth(deleteLigne, clientId, authClientId, id);
            }
        }

        for (ProduitCommandeUpdateDTO produitDTO : produitsDTO) {
            if (produitDTO.getId() != null) {
                String updateLigne = """
                    UPDATE ligne_commande_client 
                    SET quantite = ?, prix_unitaire = ?, sous_total = ? 
                    WHERE id_ligne_commande_client = ?
                    """;
                // ✅ Utiliser updateWithAuth
                tenantRepo.updateWithAuth(updateLigne, clientId, authClientId,
                        produitDTO.getQuantite(), produitDTO.getPrixUnitaire(),
                        produitDTO.getPrixUnitaire().multiply(produitDTO.getQuantite()),
                        produitDTO.getId());
            } else {
                String insertLigne = """
                    INSERT INTO ligne_commande_client (commande_client_id, produit_id, quantite, prix_unitaire, sous_total)
                    VALUES (?, ?, ?, ?, ?)
                    """;
                // ✅ Utiliser updateWithAuth
                tenantRepo.updateWithAuth(insertLigne, clientId, authClientId,
                        commandeId, produitDTO.getProduitId(), produitDTO.getQuantite(),
                        produitDTO.getPrixUnitaire(),
                        produitDTO.getPrixUnitaire().multiply(produitDTO.getQuantite()));
            }
        }
    }

    @Transactional
    public CommandeClient confirmerCommande(Integer commandeId, String token) {
        System.out.println("🔍 === DÉBUT confirmerCommande ===");

        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        try {
            // 1. Vérifier que la commande existe et est en attente
            String sqlCommande = "SELECT * FROM commande_client WHERE id_commande_client = ?";
            CommandeClient commande = tenantRepo.queryForObjectAuth(sqlCommande, commandeRowMapper(), clientId, authClientId, commandeId);

            if (commande == null) {
                throw new RuntimeException("Commande non trouvée avec l'ID: " + commandeId);
            }

            System.out.println("✅ Commande trouvée: " + commande.getIdCommandeClient());
            System.out.println("📊 Statut actuel: " + commande.getStatut());

            if (commande.getStatut() != CommandeClient.StatutCommande.EN_ATTENTE) {
                throw new RuntimeException("Seules les commandes en attente peuvent être confirmées. Statut actuel: " + commande.getStatut());
            }

            // 2. Récupérer les lignes AVEC les produits (une seule requête)
            String sqlLignesProduits = """
        SELECT l.*, 
               p.id_produit, p.libelle, p.prix_vente, p.quantite_stock
        FROM ligne_commande_client l
        JOIN produit p ON l.produit_id = p.id_produit
        WHERE l.commande_client_id = ?
        """;

            List<Map<String, Object>> lignesData = tenantRepo.queryWithAuth(sqlLignesProduits, (rs, rowNum) -> {
                Map<String, Object> data = new HashMap<>();
                data.put("ligneId", rs.getInt("id_ligne_commande_client"));
                data.put("quantite", rs.getInt("quantite"));
                data.put("produitId", rs.getInt("id_produit"));
                data.put("produitLibelle", rs.getString("libelle"));
                data.put("stockAvant", rs.getInt("quantite_stock"));
                data.put("prixUnitaire", rs.getBigDecimal("prix_unitaire"));
                return data;
            }, clientId, authClientId, commandeId);

            if (lignesData == null || lignesData.isEmpty()) {
                throw new RuntimeException("La commande ne contient aucun produit");
            }

            // 3. Vérifier le stock
            for (Map<String, Object> ligne : lignesData) {
                int quantite = (int) ligne.get("quantite");
                int stock = (int) ligne.get("stockAvant");
                String produitLibelle = (String) ligne.get("produitLibelle");

                if (stock < quantite) {
                    throw new RuntimeException("Stock insuffisant pour le produit: " + produitLibelle);
                }
            }

            // 4. Mettre à jour le stock et ENREGISTRER LES MOUVEMENTS
            for (Map<String, Object> ligne : lignesData) {
                int produitId = (int) ligne.get("produitId");
                int quantite = (int) ligne.get("quantite");
                int stockAvant = (int) ligne.get("stockAvant");
                int nouveauStock = stockAvant - quantite;
                BigDecimal prixUnitaire = (BigDecimal) ligne.get("prixUnitaire");
                BigDecimal valeurTotale = prixUnitaire.multiply(BigDecimal.valueOf(quantite));

                // 4.1 Mettre à jour le stock du produit
                String updateStock = "UPDATE produit SET quantite_stock = ? WHERE id_produit = ?";
                tenantRepo.updateWithAuth(updateStock, clientId, authClientId, nouveauStock, produitId);

                // 4.2 ✅ INSÉRER LE MOUVEMENT DE STOCK (sans client_id)
                String insertMovement = """
    INSERT INTO stock_movement 
    (produit_id, type_mouvement, quantite, stock_avant, stock_apres, 
     prix_unitaire, valeur_totale, type_document, commentaire, 
     date_mouvement, created_by)
    VALUES (?, 'SORTIE', ?, ?, ?, ?, ?, 'COMMANDE', ?, NOW(), ?)
""";

                tenantRepo.updateWithAuth(insertMovement, clientId, authClientId,
                        produitId,
                        quantite,
                        stockAvant,
                        nouveauStock,
                        prixUnitaire,
                        valeurTotale,
                        commande.getReferenceCommandeClient(),
                        commande.getCreatedBy()
                );
                System.out.println("✅ Mouvement stock créé: Produit=" + ligne.get("produitLibelle") +
                        ", Sortie=" + quantite +
                        ", Stock avant=" + stockAvant +
                        ", Stock après=" + nouveauStock);
            }

            // 5. Mettre à jour le statut de la commande
            String updateStatut = "UPDATE commande_client SET statut = 'CONFIRMEE' WHERE id_commande_client = ?";
            tenantRepo.updateWithAuth(updateStatut, clientId, authClientId, commandeId);

            // 6. Retourner la commande mise à jour
            CommandeClient updated = tenantRepo.queryForObjectAuth(sqlCommande, commandeRowMapper(), clientId, authClientId, commandeId);
            System.out.println("✅ Commande " + updated.getIdCommandeClient() + " confirmée avec succès");

            return updated;

        } catch (Exception e) {
            System.err.println("❌ EXCEPTION dans confirmerCommande: " + e.getMessage());
            throw e;
        }
    }

    // ✅ Rejeter une commande
    @Transactional
    public CommandeClient rejeterCommande(Integer commandeId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sqlCommande = "SELECT * FROM commande_client WHERE id_commande_client = ?";
        // ✅ Utiliser queryForObjectAuth
        CommandeClient commande = tenantRepo.queryForObjectAuth(sqlCommande, commandeRowMapper(), clientId, authClientId, commandeId);

        if (commande == null) {
            throw new RuntimeException("Commande non trouvée");
        }

        if (commande.getStatut() == CommandeClient.StatutCommande.ANNULEE) {
            throw new RuntimeException("La commande est déjà annulée");
        }

        if (commande.getStatut() == CommandeClient.StatutCommande.CONFIRMEE) {
            String sqlLignes = "SELECT * FROM ligne_commande_client WHERE commande_client_id = ?";
            // ✅ Utiliser queryWithAuth
            List<LigneCommandeClient> lignes = tenantRepo.queryWithAuth(sqlLignes, ligneCommandeRowMapper(), clientId, authClientId, commandeId);

            for (LigneCommandeClient ligne : lignes) {
                String sqlProduit = "SELECT * FROM produit WHERE id_produit = ?";
                // ✅ Utiliser queryForObjectAuth
                Produit produit = tenantRepo.queryForObjectAuth(sqlProduit, produitRowMapper(), clientId, authClientId, ligne.getProduit().getIdProduit());

                int nouveauStock = produit.getQuantiteStock() + ligne.getQuantite();
                String updateStock = "UPDATE produit SET quantite_stock = ? WHERE id_produit = ?";
                // ✅ Utiliser updateWithAuth
                tenantRepo.updateWithAuth(updateStock, clientId, authClientId, nouveauStock, produit.getIdProduit());
            }
        }

        String updateStatut = "UPDATE commande_client SET statut = 'ANNULEE' WHERE id_commande_client = ?";
        // ✅ Utiliser updateWithAuth
        tenantRepo.updateWithAuth(updateStatut, clientId, authClientId, commandeId);

        // ✅ Utiliser queryForObjectAuth
        return tenantRepo.queryForObjectAuth(sqlCommande, commandeRowMapper(), clientId, authClientId, commandeId);
    }

    private BigDecimal safeToBigDecimal(Double value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        try {
            return BigDecimal.valueOf(value);
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal calculerSousTotal(List<LigneCommandeClient> lignes) {
        return lignes.stream()
                .map(LigneCommandeClient::getSousTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String genererReferenceCommande() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");
        String timestamp = LocalDateTime.now().format(formatter);
        return "CMD-" + timestamp + "-" + (int)(Math.random() * 1000);
    }
}