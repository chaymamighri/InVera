package org.erp.invera.service.erp;

import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.erp.commandeClientdto.CommandeRequestDTO;
import org.erp.invera.dto.erp.commandeClientdto.CommandeResponseDTO;
import org.erp.invera.dto.erp.Produitdto.ProduitCommandeRequestDTO;
import org.erp.invera.model.erp.Categorie;
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

    //  RowMapper pour CommandeClient
    public RowMapper<CommandeClient> commandeRowMapper() {
        return (rs, rowNum) -> {
            CommandeClient commande = new CommandeClient();
            commande.setIdCommandeClient(rs.getInt("id_commande_client"));
            commande.setReferenceCommandeClient(rs.getString("reference_commande_client"));

            //  Créer un objet Client avec seulement l'ID (le reste sera chargé plus tard)
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
            String typeClient = null;
            try {
                typeClient = rs.getString("type_client");
            } catch (Exception e) {
                typeClient = null;
            }

            if (typeClient != null) {
                try {
                    client.setTypeClient(Client.TypeClient.valueOf(typeClient));
                } catch (IllegalArgumentException e) {
                    log.warn("Type client inconnu: {}, utilisation de PARTICULIER par défaut", typeClient);
                    client.setTypeClient(Client.TypeClient.PARTICULIER);
                }
            } else {
                client.setTypeClient(Client.TypeClient.PARTICULIER);
            }

            // Raison sociale (peut être null pour les particuliers)
            try {
                String raisonSociale = rs.getString("raison_sociale");
                if (raisonSociale != null && !rs.wasNull()) {
                    client.setRaisonSociale(raisonSociale);
                }
            } catch (Exception e) {
                // Colonne n'existe pas, ignorer
            }

            // Matricule fiscale (peut être null)
            try {
                String matriculeFiscale = rs.getString("matricule_fiscale");
                if (matriculeFiscale != null && !rs.wasNull()) {
                    client.setMatriculeFiscale(matriculeFiscale);
                }
            } catch (Exception e) {
                // Colonne n'existe pas, ignorer
            }

            // created_at
            try {
                if (rs.getTimestamp("created_at") != null) {
                    client.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
                }
            } catch (Exception e) {
                // Colonne n'existe pas, ignorer
            }

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

    // Vérifier la disponibilité
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

    @Transactional
    public CommandeClient createCommande(CommandeRequestDTO commandeRequest, String token) {
        System.out.println("[COMMANDE] Creation de commande en cours...");

        Integer clientFinalId = commandeRequest.getClientId();
        Long tenantId = getClientIdFromToken(token);
        String authClientId = String.valueOf(tenantId);

        if (clientFinalId == null) {
            throw new RuntimeException("ID client requis pour créer la commande");
        }

        System.out.println("[COMMANDE] Client final ID: " + clientFinalId);
        System.out.println("[COMMANDE] Tenant ID (client connecte): " + tenantId);

        // 1. Recuperer le client
        String sqlClient = "SELECT id_client, nom, prenom, email, telephone, adresse, raison_sociale, matricule_fiscale, type_client FROM client WHERE id_client = ?";

        List<Client> clientsTrouves = tenantRepo.queryWithAuth(sqlClient, clientRowMapper(), tenantId, authClientId, clientFinalId);

        if (clientsTrouves == null || clientsTrouves.isEmpty()) {
            String listSql = "SELECT id_client, nom, prenom, type_client FROM client";
            List<Map<String, Object>> clientsDispo = tenantRepo.queryWithAuth(listSql, (rs, rowNum) -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", rs.getInt("id_client"));
                map.put("nom", rs.getString("nom"));
                map.put("prenom", rs.getString("prenom"));
                map.put("type_client", rs.getString("type_client"));
                return map;
            }, tenantId, authClientId);

            System.out.println("Clients disponibles dans la base du client connecte " + tenantId + ":");
            for (Map<String, Object> c : clientsDispo) {
                System.out.println("  - ID: " + c.get("id") + ", Nom: " + c.get("nom") + ", Type: " + c.get("type_client"));
            }

            throw new RuntimeException("Client destinataire non trouve avec l'ID: " + clientFinalId);
        }

        Client client = clientsTrouves.get(0);
        System.out.println("[COMMANDE] Client destinataire trouve: " + client.getNom() + " - Type: " + client.getTypeClient());

        // 2. Recuperer la remise client
        BigDecimal tauxRemiseClient = BigDecimal.ZERO;
        if (client.getTypeClient() != null) {
            String sqlRemise = "SELECT remise FROM client_type_discount WHERE type_client = ?";
            Double remise = tenantRepo.queryForObjectAuth(sqlRemise, Double.class, tenantId, authClientId, client.getTypeClient().name());
            if (remise != null) {
                tauxRemiseClient = BigDecimal.valueOf(remise);
                System.out.println("[COMMANDE] Remise client " + client.getTypeClient() + " recuperee: " + tauxRemiseClient + "%");
            }
        }

        String reference = genererReferenceCommande();

        // 3. Verifier la disponibilite des stocks
        Map<Integer, Integer> produitsMap = new HashMap<>();
        for (ProduitCommandeRequestDTO produitDTO : commandeRequest.getProduits()) {
            produitsMap.put(produitDTO.getProduitId(), produitDTO.getQuantite());
        }

        boolean disponible = verifierDisponibilite(produitsMap, token);
        if (!disponible) {
            throw new RuntimeException("Stock insuffisant pour certains produits");
        }
        System.out.println("[COMMANDE] Disponibilite verifiee");

        // 4. Creer la commande avec RETURNING
        String insertCommande = """
        INSERT INTO commande_client (reference_commande_client, client_id, statut, date_commande, sous_total, total)
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING id_commande_client
        """;

        Integer commandeId = tenantRepo.queryForObjectAuth(insertCommande, Integer.class, tenantId, authClientId,
                reference, clientFinalId, "EN_ATTENTE", LocalDateTime.now(), BigDecimal.ZERO, BigDecimal.ZERO);

        if (commandeId == null) {
            throw new RuntimeException("Erreur lors de la creation de la commande");
        }

        System.out.println("[COMMANDE] Commande creee avec ID: " + commandeId);

        // 5. Calculer les totaux et inserer les lignes
        BigDecimal sousTotal = BigDecimal.ZERO;
        BigDecimal totalRemisesProduits = BigDecimal.ZERO;
        BigDecimal totalHTApresRemisesProduits = BigDecimal.ZERO;
        BigDecimal totalTVA = BigDecimal.ZERO;

        for (ProduitCommandeRequestDTO produitDTO : commandeRequest.getProduits()) {
            String sqlProduit = """
            SELECT p.id_produit, p.libelle, p.prix_vente, p.quantite_stock,
                   c.id_categorie, c.nom_categorie, c.remise_standard, c.taux_tva
            FROM produit p
            LEFT JOIN categorie c ON p.categorie_id = c.id_categorie
            WHERE p.id_produit = ?
            """;

            Produit produit = tenantRepo.queryForObjectAuth(sqlProduit, (rs, rowNum) -> {
                Produit p = new Produit();
                p.setIdProduit(rs.getInt("id_produit"));
                p.setLibelle(rs.getString("libelle"));
                p.setPrixVente(rs.getDouble("prix_vente"));
                p.setQuantiteStock(rs.getInt("quantite_stock"));

                if (rs.getObject("id_categorie") != null) {
                    Categorie categorie = new Categorie();
                    categorie.setIdCategorie(rs.getInt("id_categorie"));
                    categorie.setNomCategorie(rs.getString("nom_categorie"));
                    categorie.setRemiseStandard(rs.getDouble("remise_standard"));
                    categorie.setTauxTVA(rs.getBigDecimal("taux_tva"));
                    p.setCategorie(categorie);
                }
                return p;
            }, tenantId, authClientId, produitDTO.getProduitId());

            if (produit == null) {
                throw new RuntimeException("Produit non trouve avec l'ID: " + produitDTO.getProduitId());
            }

            BigDecimal prixUnitaire = produitDTO.getPrixUnitaire() != null ?
                    produitDTO.getPrixUnitaire() : safeToBigDecimal(produit.getPrixVente());
            BigDecimal quantite = BigDecimal.valueOf(produitDTO.getQuantite());
            BigDecimal sousTotalLigne = prixUnitaire.multiply(quantite);

            BigDecimal tauxRemiseProduit = BigDecimal.ZERO;
            if (produit.getCategorie() != null && produit.getCategorie().getRemiseStandard() != null) {
                tauxRemiseProduit = BigDecimal.valueOf(produit.getCategorie().getRemiseStandard());
            }

            BigDecimal montantRemiseLigne = sousTotalLigne.multiply(tauxRemiseProduit.divide(BigDecimal.valueOf(100)));
            BigDecimal totalHTLigne = sousTotalLigne.subtract(montantRemiseLigne);

            BigDecimal tauxTVAProduit = BigDecimal.ZERO;
            if (produit.getCategorie() != null && produit.getCategorie().getTauxTVA() != null) {
                tauxTVAProduit = produit.getCategorie().getTauxTVA();
            } else {
                tauxTVAProduit = BigDecimal.valueOf(19);
            }

            BigDecimal tauxTVACalcule = tauxTVAProduit.compareTo(BigDecimal.valueOf(1)) > 0
                    ? tauxTVAProduit.divide(BigDecimal.valueOf(100))
                    : tauxTVAProduit;

            BigDecimal montantTVA = totalHTLigne.multiply(tauxTVACalcule);

            sousTotal = sousTotal.add(sousTotalLigne);
            totalRemisesProduits = totalRemisesProduits.add(montantRemiseLigne);
            totalHTApresRemisesProduits = totalHTApresRemisesProduits.add(totalHTLigne);
            totalTVA = totalTVA.add(montantTVA);

            System.out.println("[COMMANDE] Produit: " + produit.getLibelle());
            System.out.println("[COMMANDE]   Prix unitaire: " + prixUnitaire);
            System.out.println("[COMMANDE]   Quantite: " + quantite);
            System.out.println("[COMMANDE]   Remise categorie: " + tauxRemiseProduit + "% -> -" + montantRemiseLigne);
            System.out.println("[COMMANDE]   TVA: " + tauxTVAProduit + "% -> +" + montantTVA);
            System.out.println("[COMMANDE]   Total HT ligne: " + totalHTLigne);

            String insertLigne = """
            INSERT INTO ligne_commande_client (commande_client_id, produit_id, quantite, prix_unitaire, sous_total)
            VALUES (?, ?, ?, ?, ?)
            """;

            tenantRepo.updateWithAuth(insertLigne, tenantId, authClientId,
                    commandeId, produitDTO.getProduitId(), produitDTO.getQuantite(), prixUnitaire, totalHTLigne);
        }

        // 6. Appliquer la remise client
        BigDecimal montantRemiseClient = totalHTApresRemisesProduits.multiply(tauxRemiseClient.divide(BigDecimal.valueOf(100)));
        BigDecimal totalHTFinal = totalHTApresRemisesProduits.subtract(montantRemiseClient);
        BigDecimal totalTTC = totalHTFinal.add(totalTVA);

        System.out.println("[COMMANDE] Totaux calcules:");
        System.out.println("[COMMANDE]   Sous-total (brut): " + sousTotal);
        System.out.println("[COMMANDE]   Remises produits: -" + totalRemisesProduits);
        System.out.println("[COMMANDE]   Total HT apres remises produits: " + totalHTApresRemisesProduits);
        System.out.println("[COMMANDE]   Remise client (" + tauxRemiseClient + "%): -" + montantRemiseClient);
        System.out.println("[COMMANDE]   Total HT final: " + totalHTFinal);
        System.out.println("[COMMANDE]   TVA totale: " + totalTVA);
        System.out.println("[COMMANDE]   Total TTC final: " + totalTTC);

        // 7. Mettre a jour la commande avec les bons totaux
        String updateTotaux = """
        UPDATE commande_client 
        SET sous_total = ?, total = ? 
        WHERE id_commande_client = ?
        """;

        tenantRepo.updateWithAuth(updateTotaux, tenantId, authClientId, totalHTFinal, totalTTC, commandeId);

        // 8. CORRECTION: Utiliser queryWithAuth pour recuperer la commande
        String sqlCommandeFinale = """
        SELECT id_commande_client, reference_commande_client, client_id, 
               statut, date_commande, sous_total, total
        FROM commande_client 
        WHERE id_commande_client = ?
        """;

        List<CommandeClient> commandesTrouvees = tenantRepo.queryWithAuth(
                sqlCommandeFinale,
                (rs, rowNum) -> {
                    CommandeClient cmd = new CommandeClient();
                    cmd.setIdCommandeClient(rs.getInt("id_commande_client"));
                    cmd.setReferenceCommandeClient(rs.getString("reference_commande_client"));
                    cmd.setClient(new Client());
                    cmd.getClient().setIdClient(rs.getInt("client_id"));
                    cmd.setDateCommande(rs.getTimestamp("date_commande") != null ?
                            rs.getTimestamp("date_commande").toLocalDateTime() : null);
                    cmd.setSousTotal(rs.getBigDecimal("sous_total") != null ?
                            rs.getBigDecimal("sous_total") : BigDecimal.ZERO);
                    cmd.setTotal(rs.getBigDecimal("total") != null ?
                            rs.getBigDecimal("total") : BigDecimal.ZERO);
                    cmd.setTauxRemise(BigDecimal.ZERO);

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
                tenantId, authClientId, commandeId
        );

        if (commandesTrouvees == null || commandesTrouvees.isEmpty()) {
            throw new RuntimeException("Erreur lors de la recuperation de la commande creee");
        }

        CommandeClient savedCommande = commandesTrouvees.get(0);

        System.out.println("[COMMANDE] Commande creee avec ID: " + savedCommande.getIdCommandeClient() +
                " et reference: " + savedCommande.getReferenceCommandeClient());
        System.out.println("[COMMANDE]    Sous-total (HT final): " + savedCommande.getSousTotal());
        System.out.println("[COMMANDE]    Total (TTC final): " + savedCommande.getTotal());

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
           c.id_categorie, c.nom_categorie, c.remise_standard, c.taux_tva
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

            // Récupérer la catégorie avec sa remise standard
            if (rs.getObject("id_categorie") != null) {
                Categorie categorie = new Categorie();
                categorie.setIdCategorie(rs.getInt("id_categorie"));
                categorie.setNomCategorie(rs.getString("nom_categorie"));

                // Récupérer la remise standard de la catégorie
                Double remiseStandard = rs.getDouble("remise_standard");
                if (remiseStandard != null && !rs.wasNull()) {
                    categorie.setRemiseStandard(remiseStandard);
                } else {
                    categorie.setRemiseStandard(0.0);
                }

                // Récupérer le taux de TVA
                BigDecimal tauxTVA = rs.getBigDecimal("taux_tva");
                if (tauxTVA != null) {
                    categorie.setTauxTVA(tauxTVA);
                } else {
                    categorie.setTauxTVA(BigDecimal.valueOf(19));
                }

                produit.setCategorie(categorie);
            }

            ligne.setProduit(produit);
            return ligne;
        }, clientId, authClientId, commande.getIdCommandeClient());

        commande.setLignesCommande(lignes);
        log.info("Commande {} - {} lignes chargees", commande.getIdCommandeClient(), lignes.size());
    }

    /**
     * Charger les détails complets du client d'une commande
     */

    private void chargerClientComplet(CommandeClient commande, Long tenantId, String authClientId) {
        if (commande.getClient() == null || commande.getClient().getIdClient() == null) {
            log.warn("Commande {} n'a pas de client associé", commande.getIdCommandeClient());
            return;
        }

        Integer clientId = commande.getClient().getIdClient();
        String sqlClient = "SELECT * FROM client WHERE id_client = ?";

        Client clientComplet = tenantRepo.queryForObjectAuth(sqlClient, clientRowMapper(), tenantId, authClientId, clientId);

        if (clientComplet != null) {
            // ✅ Récupérer la remise client depuis client_type_discount
            if (clientComplet.getTypeClient() != null) {
                String sqlRemise = "SELECT remise FROM client_type_discount WHERE type_client = ?";
                Double remise = tenantRepo.queryForObjectAuth(sqlRemise, Double.class, tenantId, authClientId, clientComplet.getTypeClient().name());
                if (remise != null) {
                    // ✅ Définir le taux de remise dans la commande
                    commande.setTauxRemise(BigDecimal.valueOf(remise));
                    log.info("Remise pour client {} (type {}): {}%", clientComplet.getNom(), clientComplet.getTypeClient(), remise);
                }
            }

            commande.setClient(clientComplet);
            log.info("Client chargé pour commande {}: {} {} (ID: {})",
                    commande.getIdCommandeClient(),
                    clientComplet.getPrenom(),
                    clientComplet.getNom(),
                    clientComplet.getIdClient());
        } else {
            log.warn("Client non trouvé pour commande {} avec client_id: {}",
                    commande.getIdCommandeClient(), clientId);
        }
    }

    public List<CommandeResponseDTO> getAllCommandes(String token) {
        log.info("========== DEBUT RECUPERATION COMMANDES ==========");

        Long tenantId = getClientIdFromToken(token);
        String authClientId = String.valueOf(tenantId);

        log.info("Tenant ID: {}", tenantId);

        // ✅ CORRECTION : Pas de WHERE client_id = ?
        // Le tenant est déjà isolé par sa propre base de données
        // Toutes les commandes dans cette base appartiennent aux clients internes de ce tenant
        String sql = "SELECT id_commande_client, reference_commande_client, client_id, " +
                "statut, date_commande, sous_total, total " +
                "FROM commande_client ORDER BY date_commande DESC";

        List<CommandeClient> commandes = tenantRepo.queryWithAuth(
                sql,
                (rs, rowNum) -> {
                    CommandeClient cmd = new CommandeClient();
                    cmd.setIdCommandeClient(rs.getInt("id_commande_client"));
                    cmd.setReferenceCommandeClient(rs.getString("reference_commande_client"));

                    Client client = new Client();
                    client.setIdClient(rs.getInt("client_id"));
                    cmd.setClient(client);

                    cmd.setDateCommande(rs.getTimestamp("date_commande") != null ?
                            rs.getTimestamp("date_commande").toLocalDateTime() : null);
                    cmd.setSousTotal(rs.getBigDecimal("sous_total") != null ?
                            rs.getBigDecimal("sous_total") : BigDecimal.ZERO);
                    // La colonne taux_remise n'existe pas, mettre à 0
                    cmd.setTauxRemise(BigDecimal.ZERO);
                    cmd.setTotal(rs.getBigDecimal("total") != null ?
                            rs.getBigDecimal("total") : BigDecimal.ZERO);

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
                tenantId, authClientId  // ✅ Pas besoin de passer tenantId comme paramètre
        );

        log.info("Nombre de commandes trouvees: {}", commandes.size());
        if (commandes.isEmpty()) {
            log.warn("Aucune commande trouvee pour le tenant {}", tenantId);
            return new ArrayList<>();
        }

        // CHARGER LES LIGNES ET LES CLIENTS COMPLETS
        for (CommandeClient cmd : commandes) {
            chargerLignesCommande(cmd, tenantId, authClientId);
            chargerClientComplet(cmd, tenantId, authClientId);
        }

        for (int i = 0; i < commandes.size(); i++) {
            CommandeClient cmd = commandes.get(i);
            log.info("==========================================");
            log.info("Commande #{} - ID: {}, Ref: {}", (i+1), cmd.getIdCommandeClient(), cmd.getReferenceCommandeClient());
            log.info("  Client: {} {} (ID: {})",
                    cmd.getClient() != null ? cmd.getClient().getPrenom() : "?",
                    cmd.getClient() != null ? cmd.getClient().getNom() : "?",
                    cmd.getClient() != null ? cmd.getClient().getIdClient() : "?");
            log.info("  Date: {}", cmd.getDateCommande());
            log.info("  Sous-total: {} TND", cmd.getSousTotal());
            log.info("  Remise: {} %", cmd.getTauxRemise());
            log.info("  Total: {} TND", cmd.getTotal());
            log.info("  Statut: {}", cmd.getStatut());
            log.info("  Nombre de lignes: {}", cmd.getLignesCommande() != null ? cmd.getLignesCommande().size() : 0);
        }

        log.info("========== FIN RECUPERATION COMMANDES ==========");

        return commandes.stream()
                .map(cmd -> CommandeResponseDTO.fromEntity(cmd, clientService, produitService))
                .collect(Collectors.toList());
    }

    public CommandeResponseDTO getCommandeById(Integer id, String token) {
        log.info("========== RECHERCHE COMMANDE ID: {} ==========", id);

        Long tenantId = getClientIdFromToken(token);
        String authClientId = String.valueOf(tenantId);

        log.info("Tenant ID (clientId du token): {}", tenantId);

        // Dans un système multi-tenant, chaque client a sa propre base
        // Donc pas besoin de filtrer par client_id, la base est déjà isolée
        // La colonne taux_remise n'existe pas dans la table commande_client
        String sql = "SELECT id_commande_client, reference_commande_client, client_id, " +
                "statut, date_commande, sous_total, total " +
                "FROM commande_client WHERE id_commande_client = ?";

        CommandeClient commande = null;

        try {
            commande = tenantRepo.queryForObjectAuth(
                    sql,
                    (rs, rowNum) -> {
                        CommandeClient cmd = new CommandeClient();
                        cmd.setIdCommandeClient(rs.getInt("id_commande_client"));
                        cmd.setReferenceCommandeClient(rs.getString("reference_commande_client"));

                        Client client = new Client();
                        client.setIdClient(rs.getInt("client_id"));
                        cmd.setClient(client);

                        cmd.setDateCommande(rs.getTimestamp("date_commande") != null ?
                                rs.getTimestamp("date_commande").toLocalDateTime() : null);
                        cmd.setSousTotal(rs.getBigDecimal("sous_total") != null ?
                                rs.getBigDecimal("sous_total") : BigDecimal.ZERO);

                        // La colonne taux_remise n'existe pas dans la table
                        // Le taux de remise est stocké dans la table client_type_discount
                        // On met à 0 par défaut, il sera chargé via chargerClientComplet
                        cmd.setTauxRemise(BigDecimal.ZERO);

                        cmd.setTotal(rs.getBigDecimal("total") != null ?
                                rs.getBigDecimal("total") : BigDecimal.ZERO);

                        String statutStr = rs.getString("statut");
                        if (statutStr != null) {
                            try {
                                cmd.setStatut(StatutCommande.valueOf(statutStr));
                            } catch (IllegalArgumentException e) {
                                log.warn("Statut inconnu: {}, utilisation de EN_ATTENTE par défaut", statutStr);
                                cmd.setStatut(StatutCommande.EN_ATTENTE);
                            }
                        }
                        return cmd;
                    },
                    tenantId, authClientId, id
            );
        } catch (Exception e) {
            log.error("Erreur lors de la recherche de la commande ID {}: {}", id, e.getMessage());
            log.error("ID commande recherche: {}, Tenant ID: {}", id, tenantId);

            // Ajout d'informations de debug pour voir les commandes disponibles
            try {
                String listSql = "SELECT id_commande_client, client_id, reference_commande_client, statut FROM commande_client";
                List<Map<String, Object>> commandes = tenantRepo.queryWithAuth(listSql, (rs, rowNum) -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", rs.getInt("id_commande_client"));
                    map.put("client_id", rs.getInt("client_id"));
                    map.put("ref", rs.getString("reference_commande_client"));
                    map.put("statut", rs.getString("statut"));
                    return map;
                }, tenantId, authClientId);

                log.info("Commandes disponibles dans la base du tenant {}: {}", tenantId, commandes);
            } catch (Exception ex) {
                log.error("Impossible de lister les commandes: {}", ex.getMessage());
            }

            throw new RuntimeException("Commande non trouvee avec l'ID: " + id);
        }

        if (commande == null) {
            log.error("Commande non trouvee avec l'ID: {}", id);
            throw new RuntimeException("Commande non trouvee avec l'ID: " + id);
        }

        // Chargement des lignes de commande
        chargerLignesCommande(commande, tenantId, authClientId);

        // Chargement du client complet (y compris le taux de remise depuis client_type_discount)
        chargerClientComplet(commande, tenantId, authClientId);

        log.info("Commande trouvee avec succes:");
        log.info("  ID: {}", commande.getIdCommandeClient());
        log.info("  Reference: {}", commande.getReferenceCommandeClient());
        log.info("  Client destinataire ID: {}", commande.getClient().getIdClient());
        log.info("  Sous-total: {} TND", commande.getSousTotal());
        log.info("  Taux remise: {} %", commande.getTauxRemise());
        log.info("  Total: {} TND", commande.getTotal());
        log.info("  Statut: {}", commande.getStatut());

        return CommandeResponseDTO.fromEntity(commande, clientService, produitService);
    }



    @Transactional
    public CommandeClient confirmerCommande(Integer commandeId, String token) {

        // Identification du client connecte (tenant)
        // Le client connecte est l'entreprise qui utilise l'application et possede sa propre base de donnees
        System.out.println("=== DEBUT confirmerCommande ===");
        System.out.println("Recherche commande ID: " + commandeId);

        Long tenantId = getClientIdFromToken(token);
        String authClientId = String.valueOf(tenantId);

        System.out.println("Client connecte (tenant) ID: " + tenantId);
        System.out.println("Base de donnees utilisee: client_" + tenantId);

        try {

            // ETAPE 1: RECHERCHE DE LA COMMANDE
            // La colonne taux_remise n'existe pas dans la table commande_client
            // Le taux de remise est stocke dans la table client_type_discount
            String sqlCommande = "SELECT id_commande_client, reference_commande_client, client_id, " +
                    "statut, date_commande, sous_total, total, created_by " +
                    "FROM commande_client WHERE id_commande_client = ?";

            // Utilisation de queryWithAuth qui retourne une liste
            List<CommandeClient> commandesTrouvees = tenantRepo.queryWithAuth(
                    sqlCommande,
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
                        cmd.setCreatedBy(rs.getString("created_by"));

                        // Le taux de remise est initialise a 0
                        // Il sera charge plus tard par chargerClientComplet
                        cmd.setTauxRemise(BigDecimal.ZERO);

                        // Client destinataire: celui qui va recevoir physiquement la commande
                        Client clientDestinataire = new Client();
                        clientDestinataire.setIdClient(rs.getInt("client_id"));
                        cmd.setClient(clientDestinataire);

                        String statutStr = rs.getString("statut");
                        if (statutStr != null) {
                            try {
                                cmd.setStatut(StatutCommande.valueOf(statutStr));
                            } catch (IllegalArgumentException e) {
                                System.out.println("Statut inconnu: " + statutStr + ", utilisation de EN_ATTENTE par defaut");
                                cmd.setStatut(StatutCommande.EN_ATTENTE);
                            }
                        }
                        return cmd;
                    },
                    tenantId, authClientId, commandeId
            );

            // Verification si la commande a ete trouvee
            if (commandesTrouvees == null || commandesTrouvees.isEmpty()) {
                // La commande n'existe pas dans la base du client connecte
                // Affichage des commandes disponibles pour debug
                String listSql = "SELECT id_commande_client, client_id, reference_commande_client, statut FROM commande_client";
                List<Map<String, Object>> commandesDispo = tenantRepo.queryWithAuth(listSql, (rs, rowNum) -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", rs.getInt("id_commande_client"));
                    map.put("client_id", rs.getInt("client_id"));
                    map.put("ref", rs.getString("reference_commande_client"));
                    map.put("statut", rs.getString("statut"));
                    return map;
                }, tenantId, authClientId);

                System.out.println("Liste des commandes disponibles dans la base du client connecte " + tenantId + ":");
                for (Map<String, Object> cmd : commandesDispo) {
                    System.out.println("  - ID commande: " + cmd.get("id") +
                            ", Client destinataire ID: " + cmd.get("client_id") +
                            ", Reference: " + cmd.get("ref") +
                            ", Statut: " + cmd.get("statut"));
                }

                throw new RuntimeException("Commande non trouvee avec l'ID: " + commandeId +
                        " dans la base du client connecte " + tenantId);
            }

            // Prendre la premiere commande de la liste
            CommandeClient commande = commandesTrouvees.get(0);

            // Affichage des informations sur les deux types de clients
            System.out.println("=== INFORMATIONS COMMANDE ===");
            System.out.println("ID Commande: " + commande.getIdCommandeClient());
            System.out.println("Reference: " + commande.getReferenceCommandeClient());
            System.out.println("Client connecte (tenant) ID: " + tenantId);
            System.out.println("  -> Ce client possede la base de donnees et est responsable de la commande");
            System.out.println("Client destinataire ID: " + commande.getClient().getIdClient());
            System.out.println("  -> Ce client recevra physiquement la commande");
            System.out.println("Statut actuel: " + commande.getStatut());
            System.out.println("============================");

            // Verification du statut
            if (commande.getStatut() != CommandeClient.StatutCommande.EN_ATTENTE) {
                throw new RuntimeException("Seules les commandes en attente peuvent etre confirmees. Statut actuel: " + commande.getStatut());
            }

            // ETAPE 2: RECUPERATION DES LIGNES DE COMMANDE AVEC LES PRODUITS
            String sqlLignesProduits = """
            SELECT l.id_ligne_commande_client, l.quantite, l.prix_unitaire,
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
            }, tenantId, authClientId, commandeId);

            if (lignesData == null || lignesData.isEmpty()) {
                throw new RuntimeException("La commande ne contient aucun produit");
            }

            System.out.println("Nombre de produits dans la commande: " + lignesData.size());

            // ETAPE 3: VERIFICATION DU STOCK POUR CHAQUE PRODUIT
            for (Map<String, Object> ligne : lignesData) {
                int quantiteCommandee = (int) ligne.get("quantite");
                int stockDisponible = (int) ligne.get("stockAvant");
                String produitLibelle = (String) ligne.get("produitLibelle");

                if (stockDisponible < quantiteCommandee) {
                    throw new RuntimeException("Stock insuffisant pour le produit: " + produitLibelle +
                            ". Stock disponible: " + stockDisponible +
                            ", Quantite commandee: " + quantiteCommandee);
                }
            }

            // ETAPE 4: MISE A JOUR DU STOCK ET CREATION DES MOUVEMENTS
            for (Map<String, Object> ligne : lignesData) {
                int produitId = (int) ligne.get("produitId");
                int quantite = (int) ligne.get("quantite");
                int stockAvant = (int) ligne.get("stockAvant");
                int nouveauStock = stockAvant - quantite;
                BigDecimal prixUnitaire = (BigDecimal) ligne.get("prixUnitaire");
                BigDecimal valeurTotale = prixUnitaire.multiply(BigDecimal.valueOf(quantite));

                // Mise a jour du stock dans la table produit
                String updateStock = "UPDATE produit SET quantite_stock = ? WHERE id_produit = ?";
                int lignesAffectees = tenantRepo.updateWithAuth(updateStock, tenantId, authClientId, nouveauStock, produitId);

                System.out.println("Produit: " + ligne.get("produitLibelle"));
                System.out.println("  Stock avant: " + stockAvant);
                System.out.println("  Quantite sortie: " + quantite);
                System.out.println("  Stock apres: " + nouveauStock);
                System.out.println("  Lignes mises a jour: " + lignesAffectees);

                // Creation d'un mouvement de stock pour l'audit
                String insertMovement = """
    INSERT INTO stock_movement 
    (produit_id, type_mouvement, quantite, stock_avant, stock_apres, 
     prix_unitaire, valeur_totale, date_mouvement, created_by)
    VALUES (?, 'SORTIE', ?, ?, ?, ?, ?, NOW(), ?)
    """;
                tenantRepo.updateWithAuth(insertMovement, tenantId, authClientId,
                        produitId, quantite, stockAvant, nouveauStock,
                        prixUnitaire, valeurTotale,
                        commande.getReferenceCommandeClient(),
                        commande.getCreatedBy() != null ? commande.getCreatedBy() : "System");
            }

            // ETAPE 5: MISE A JOUR DU STATUT DE LA COMMANDE
            String updateStatut = "UPDATE commande_client SET statut = 'CONFIRMEE' WHERE id_commande_client = ?";
            int lignesModifiees = tenantRepo.updateWithAuth(updateStatut, tenantId, authClientId, commandeId);
            System.out.println("Statut commande mis a jour: EN_ATTENTE -> CONFIRMEE");
            System.out.println("Lignes modifiees: " + lignesModifiees);

            // ETAPE 6: RECHARGE DE LA COMMANDE POUR LE RETOUR
            List<CommandeClient> commandeFinale = tenantRepo.queryWithAuth(
                    sqlCommande,
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

                        Client clientDestinataire = new Client();
                        clientDestinataire.setIdClient(rs.getInt("client_id"));
                        cmd.setClient(clientDestinataire);

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
                    tenantId, authClientId, commandeId
            );

            if (commandeFinale == null || commandeFinale.isEmpty()) {
                throw new RuntimeException("Erreur lors du rechargement de la commande confirmee");
            }

            // Chargement du client complet pour avoir le taux de remise
            chargerClientComplet(commandeFinale.get(0), tenantId, authClientId);

            System.out.println("=== COMMANDE CONFIRMEE AVEC SUCCES ===");
            System.out.println("ID Commande: " + commandeFinale.get(0).getIdCommandeClient());
            System.out.println("Client connecte (tenant): " + tenantId);
            System.out.println("Client destinataire: " + commandeFinale.get(0).getClient().getIdClient());

            return commandeFinale.get(0);

        } catch (Exception e) {
            System.err.println("EXCEPTION dans confirmerCommande: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    // Rejeter une commande - Seulement pour les commandes en attente
// Aucune modification de stock car une commande en attente n'a pas encore diminué le stock
    @Transactional
    public CommandeClient rejeterCommande(Integer commandeId, String token) {
        Long tenantId = getClientIdFromToken(token);
        String authClientId = String.valueOf(tenantId);

        System.out.println("=== DEBUT rejeterCommande ===");
        System.out.println("Recherche commande ID: " + commandeId);
        System.out.println("Client connecte (tenant) ID: " + tenantId);

        try {
            // Requete avec colonnes explicites, pas de SELECT *, pas de taux_remise
            String sqlCommande = """
            SELECT id_commande_client, reference_commande_client, client_id, 
                   statut, date_commande, sous_total, total, created_by
            FROM commande_client 
            WHERE id_commande_client = ?
            """;

            List<CommandeClient> commandesTrouvees = tenantRepo.queryWithAuth(
                    sqlCommande,
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
                        cmd.setCreatedBy(rs.getString("created_by"));
                        cmd.setTauxRemise(BigDecimal.ZERO);

                        Client client = new Client();
                        client.setIdClient(rs.getInt("client_id"));
                        cmd.setClient(client);

                        String statutStr = rs.getString("statut");
                        if (statutStr != null) {
                            try {
                                cmd.setStatut(CommandeClient.StatutCommande.valueOf(statutStr));
                            } catch (IllegalArgumentException e) {
                                System.out.println("Statut inconnu: " + statutStr + ", utilisation de EN_ATTENTE par defaut");
                                cmd.setStatut(CommandeClient.StatutCommande.EN_ATTENTE);
                            }
                        }
                        return cmd;
                    },
                    tenantId, authClientId, commandeId
            );

            if (commandesTrouvees == null || commandesTrouvees.isEmpty()) {
                throw new RuntimeException("Commande non trouvee avec l'ID: " + commandeId);
            }

            CommandeClient commande = commandesTrouvees.get(0);

            System.out.println("Commande trouvee: " + commande.getIdCommandeClient());
            System.out.println("Client destinataire ID: " + commande.getClient().getIdClient());
            System.out.println("Statut actuel: " + commande.getStatut());

            // Verification: seule une commande EN_ATTENTE peut etre rejetee
            if (commande.getStatut() == CommandeClient.StatutCommande.ANNULEE) {
                throw new RuntimeException("La commande est deja annulee");
            }

            if (commande.getStatut() == CommandeClient.StatutCommande.CONFIRMEE) {
                throw new RuntimeException("Impossible de rejeter une commande deja confirmee. Le stock a deja ete diminue.");
            }

            if (commande.getStatut() != CommandeClient.StatutCommande.EN_ATTENTE) {
                throw new RuntimeException("Seules les commandes en attente peuvent etre rejetees. Statut actuel: " + commande.getStatut());
            }

            // Mise à jour du statut uniquement - PAS de modification du stock
            // Une commande en attente n'a pas encore diminué le stock
            String updateStatut = "UPDATE commande_client SET statut = 'ANNULEE' WHERE id_commande_client = ?";
            int lignesModifiees = tenantRepo.updateWithAuth(updateStatut, tenantId, authClientId, commandeId);

            System.out.println("Statut commande mis a jour: " + commande.getStatut() + " -> ANNULEE");
            System.out.println("Lignes modifiees: " + lignesModifiees);
            System.out.println("Aucune modification de stock - La commande n'etait pas confirmee");

            // Recharger la commande pour retour
            List<CommandeClient> commandeFinale = tenantRepo.queryWithAuth(
                    sqlCommande,
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
                    tenantId, authClientId, commandeId
            );

            System.out.println("=== COMMANDE REJETEE AVEC SUCCES ===");
            System.out.println("ID Commande: " + commandeId);
            System.out.println("Le stock n'a pas ete modifie.");

            return (commandeFinale != null && !commandeFinale.isEmpty()) ? commandeFinale.get(0) : commande;

        } catch (Exception e) {
            System.err.println("EXCEPTION dans rejeterCommande: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
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