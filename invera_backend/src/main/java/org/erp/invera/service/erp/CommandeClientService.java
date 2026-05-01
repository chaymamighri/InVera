package org.erp.invera.service.erp;

import org.erp.invera.dto.erp.commandeClientdto.CommandeRequestDTO;
import org.erp.invera.dto.erp.commandeClientdto.CommandeUpdateRequestDTO;
import org.erp.invera.dto.erp.Produitdto.ProduitCommandeRequestDTO;
import org.erp.invera.dto.erp.Produitdto.ProduitCommandeUpdateDTO;
import org.erp.invera.model.erp.client.CommandeClient;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CommandeClientService {

    private final TenantAwareRepository tenantRepo;
    private final JwtTokenProvider jwtTokenProvider;
    private final ProduitService produitService;

    public CommandeClientService(TenantAwareRepository tenantRepo,
                                 JwtTokenProvider jwtTokenProvider,
                                 ProduitService produitService) {
        this.tenantRepo = tenantRepo;
        this.jwtTokenProvider = jwtTokenProvider;
        this.produitService = produitService;
    }

    // ✅ RowMapper pour CommandeClient (MÉTHODE)
    public RowMapper<CommandeClient> commandeRowMapper() {
        return (rs, rowNum) -> {
            CommandeClient commande = new CommandeClient();
            commande.setIdCommandeClient(rs.getInt("id_commande_client"));
            commande.setReferenceCommandeClient(rs.getString("reference_commande_client"));
            commande.setStatut(CommandeClient.StatutCommande.valueOf(rs.getString("statut")));
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

    // ✅ RowMapper pour Client (privé)
    private RowMapper<Client> clientRowMapper() {
        return (rs, rowNum) -> {
            Client client = new Client();
            client.setIdClient(rs.getInt("id_client"));
            client.setNom(rs.getString("nom"));
            client.setPrenom(rs.getString("prenom"));
            client.setEmail(rs.getString("email"));
            client.setTelephone(rs.getString("telephone"));
            client.setAdresse(rs.getString("adresse"));
            return client;
        };
    }

    // ✅ RowMapper pour Produit (MÉTHODE)
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

    // ✅ RowMapper pour LigneCommandeClient (MÉTHODE)
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
            Integer stockDispo = tenantRepo.queryForObject(sql, Integer.class, clientId, authClientId, produitId);

            if (stockDispo == null || stockDispo < quantiteDemandee) {
                return false;
            }
        }
        return true;
    }

    @Transactional
    public CommandeClient createCommande(CommandeRequestDTO commandeRequest, String token) {
        System.out.println("🛠️ Création de commande en cours...");

        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // 1. Vérifier et récupérer le client
        String sqlClient = "SELECT * FROM client WHERE id = ?";
        Client client = tenantRepo.queryForObject(sqlClient, clientRowMapper(), clientId, authClientId, clientId);

        if (client == null) {
            throw new RuntimeException("Client non trouvé avec l'ID: " + clientId);
        }
        System.out.println("✅ Client trouvé: " + client.getNom());

        // 2. Générer la référence de commande
        String reference = genererReferenceCommande();

        // 3. Vérifier la disponibilité
        Map<Integer, Integer> produitsMap = new HashMap<>();
        for (ProduitCommandeRequestDTO produitDTO : commandeRequest.getProduits()) {
            produitsMap.put(produitDTO.getProduitId(), produitDTO.getQuantite());
        }

        boolean disponible = verifierDisponibilite(produitsMap, token);
        if (!disponible) {
            throw new RuntimeException("Stock insuffisant pour certains produits");
        }
        System.out.println("✅ Disponibilité vérifiée");

        // 4. Insérer la commande
        String insertCommande = """
            INSERT INTO commande_client (reference_commande_client, client_id, statut, date_commande, sous_total, taux_remise, total)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            RETURNING id_commande_client
            """;

        Integer commandeId = tenantRepo.queryForObject(insertCommande, Integer.class, clientId, authClientId,
                reference, clientId, "EN_ATTENTE", LocalDateTime.now(), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);

        // 5. Calculer les totaux et créer les lignes de commande
        BigDecimal sousTotal = BigDecimal.ZERO;
        List<LigneCommandeClient> lignesCommande = new ArrayList<>();

        for (ProduitCommandeRequestDTO produitDTO : commandeRequest.getProduits()) {
            // Récupérer le produit
            String sqlProduit = "SELECT * FROM produit WHERE id_produit = ?";
            Produit produit = tenantRepo.queryForObject(sqlProduit, produitRowMapper(), clientId, authClientId, produitDTO.getProduitId());

            if (produit == null) {
                throw new RuntimeException("Produit non trouvé avec l'ID: " + produitDTO.getProduitId());
            }

            // Déterminer le prix unitaire
            BigDecimal prixUnitaire = produitDTO.getPrixUnitaire() != null ?
                    produitDTO.getPrixUnitaire() : safeToBigDecimal(produit.getPrixVente());

            BigDecimal quantite = BigDecimal.valueOf(produitDTO.getQuantite());
            BigDecimal sousTotalLigne = prixUnitaire.multiply(quantite);
            sousTotal = sousTotal.add(sousTotalLigne);

            // Insérer la ligne de commande
            String insertLigne = """
                INSERT INTO ligne_commande_client (commande_client_id, produit_id, quantite, prix_unitaire, sous_total)
                VALUES (?, ?, ?, ?, ?)
                RETURNING id_ligne_commande_client
                """;

            tenantRepo.queryForObject(insertLigne, Integer.class, clientId, authClientId,
                    commandeId, produitDTO.getProduitId(), produitDTO.getQuantite(), prixUnitaire, sousTotalLigne);

            System.out.println("📦 Produit ajouté: " + produit.getLibelle() +
                    ", Quantité: " + produitDTO.getQuantite() +
                    ", Prix unitaire: " + prixUnitaire +
                    ", Sous-total: " + sousTotalLigne);
        }

        // 6. Appliquer la remise
        BigDecimal tauxRemise = commandeRequest.getRemiseTotale() != null ?
                commandeRequest.getRemiseTotale() : BigDecimal.ZERO;

        BigDecimal montantRemise = sousTotal.multiply(tauxRemise.divide(BigDecimal.valueOf(100)));
        BigDecimal total = sousTotal.subtract(montantRemise);

        // 7. Mettre à jour les totaux de la commande
        String updateTotaux = """
            UPDATE commande_client 
            SET sous_total = ?, taux_remise = ?, total = ? 
            WHERE id_commande_client = ?
            """;
        tenantRepo.update(updateTotaux, clientId, authClientId, sousTotal, tauxRemise, total, commandeId);

        System.out.println("💰 Totaux calculés:");
        System.out.println("  Sous-total: " + sousTotal);
        System.out.println("  Remise: " + montantRemise + " (" + tauxRemise + "%)");
        System.out.println("  Total: " + total);

        // 8. Retourner la commande créée
        String sqlCommande = "SELECT * FROM commande_client WHERE id_commande_client = ?";
        CommandeClient savedCommande = tenantRepo.queryForObject(sqlCommande, commandeRowMapper(), clientId, authClientId, commandeId);

        System.out.println("✅ Commande créée avec ID: " + savedCommande.getIdCommandeClient() +
                " et référence: " + savedCommande.getReferenceCommandeClient());

        return savedCommande;
    }

    @Transactional
    public CommandeClient updateCommande(Integer commandeId, CommandeUpdateRequestDTO request, String token) {

        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // Récupérer la commande existante
        String sqlCommande = "SELECT * FROM commande_client WHERE id_commande_client = ?";
        CommandeClient commande = tenantRepo.queryForObject(sqlCommande, commandeRowMapper(), clientId, authClientId, commandeId);

        if (commande == null) {
            throw new RuntimeException("Commande non trouvée");
        }

        // Vérifier que la commande est en attente
        if (commande.getStatut() != CommandeClient.StatutCommande.EN_ATTENTE) {
            throw new RuntimeException("Impossible de modifier une commande qui n'est pas en attente");
        }

        // Mettre à jour le statut si fourni
        if (request.getStatut() != null) {
            String updateStatut = "UPDATE commande_client SET statut = ? WHERE id_commande_client = ?";
            tenantRepo.update(updateStatut, clientId, authClientId, request.getStatut(), commandeId);
        }

        // Mettre à jour l'adresse du client si fournie
        if (request.getClientAdresse() != null) {
            String updateClient = "UPDATE client SET adresse = ?, telephone = ?, email = ? WHERE id = ?";
            tenantRepo.update(updateClient, clientId, authClientId,
                    request.getClientAdresse(), request.getClientTelephone(), request.getClientEmail(), clientId);
        }

        // Mettre à jour les lignes de commande
        updateLignesCommande(commandeId, request.getProduits(), token);

        // Recalculer les totaux
        String sqlLignes = "SELECT * FROM ligne_commande_client WHERE commande_client_id = ?";
        List<LigneCommandeClient> lignes = tenantRepo.query(sqlLignes, ligneCommandeRowMapper(), clientId, authClientId, commandeId);

        BigDecimal sousTotal = calculerSousTotal(lignes);
        BigDecimal tauxRemise = commande.getTauxRemise();
        BigDecimal total = sousTotal.subtract(sousTotal.multiply(tauxRemise.divide(BigDecimal.valueOf(100))));

        // Mettre à jour les totaux
        String updateTotaux = "UPDATE commande_client SET sous_total = ?, total = ? WHERE id_commande_client = ?";
        tenantRepo.update(updateTotaux, clientId, authClientId, sousTotal, total, commandeId);

        // Retourner la commande mise à jour
        return tenantRepo.queryForObject(sqlCommande, commandeRowMapper(), clientId, authClientId, commandeId);
    }

    private void updateLignesCommande(Integer commandeId, List<ProduitCommandeUpdateDTO> produitsDTO, String token) {

        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // Récupérer les IDs des lignes existantes
        String sqlLignesExistantes = "SELECT id_ligne_commande_client FROM ligne_commande_client WHERE commande_client_id = ?";
        List<Integer> idsExistants = tenantRepo.query(sqlLignesExistantes,
                (rs, rowNum) -> rs.getInt("id_ligne_commande_client"), clientId, authClientId, commandeId);

        // IDs à conserver
        List<Integer> idsAConserver = produitsDTO.stream()
                .filter(p -> p.getId() != null)
                .map(ProduitCommandeUpdateDTO::getId)
                .collect(Collectors.toList());

        // Supprimer les lignes qui ne sont plus dans la nouvelle liste
        for (Integer id : idsExistants) {
            if (!idsAConserver.contains(id)) {
                String deleteLigne = "DELETE FROM ligne_commande_client WHERE id_ligne_commande_client = ?";
                tenantRepo.update(deleteLigne, clientId, authClientId, id);
            }
        }

        // Mettre à jour ou ajouter les lignes
        for (ProduitCommandeUpdateDTO produitDTO : produitsDTO) {
            if (produitDTO.getId() != null) {
                // Mise à jour d'une ligne existante
                String updateLigne = """
                    UPDATE ligne_commande_client 
                    SET quantite = ?, prix_unitaire = ?, sous_total = ? 
                    WHERE id_ligne_commande_client = ?
                    """;

                tenantRepo.update(updateLigne, clientId, authClientId,
                        produitDTO.getQuantite(), produitDTO.getPrixUnitaire(),
                        produitDTO.getPrixUnitaire().multiply(produitDTO.getQuantite()),
                        produitDTO.getId());
            } else {
                // Ajout d'une nouvelle ligne
                String insertLigne = """
                    INSERT INTO ligne_commande_client (commande_client_id, produit_id, quantite, prix_unitaire, sous_total)
                    VALUES (?, ?, ?, ?, ?)
                    """;

                tenantRepo.update(insertLigne, clientId, authClientId,
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
            // Récupérer la commande
            String sqlCommande = "SELECT * FROM commande_client WHERE id_commande_client = ?";
            CommandeClient commande = tenantRepo.queryForObject(sqlCommande, commandeRowMapper(), clientId, authClientId, commandeId);

            if (commande == null) {
                throw new RuntimeException("Commande non trouvée avec l'ID: " + commandeId);
            }

            System.out.println("✅ Commande trouvée: " + commande.getIdCommandeClient());
            System.out.println("📊 Statut actuel: " + commande.getStatut());

            // Vérifier le statut
            if (commande.getStatut() != CommandeClient.StatutCommande.EN_ATTENTE) {
                throw new RuntimeException("Seules les commandes en attente peuvent être confirmées. Statut actuel: " + commande.getStatut());
            }

            // Récupérer les lignes de commande
            String sqlLignes = "SELECT * FROM ligne_commande_client WHERE commande_client_id = ?";
            List<LigneCommandeClient> lignes = tenantRepo.query(sqlLignes, ligneCommandeRowMapper(), clientId, authClientId, commandeId);

            if (lignes == null || lignes.isEmpty()) {
                throw new RuntimeException("La commande ne contient aucun produit");
            }

            // Vérifier le stock
            for (LigneCommandeClient ligne : lignes) {
                String sqlProduit = "SELECT * FROM produit WHERE id_produit = ?";
                Produit produit = tenantRepo.queryForObject(sqlProduit, produitRowMapper(), clientId, authClientId, ligne.getProduit().getIdProduit());

                if (produit == null) {
                    throw new RuntimeException("Produit non trouvé");
                }

                if (produit.getQuantiteStock() < ligne.getQuantite()) {
                    throw new RuntimeException("Stock insuffisant pour le produit: " + produit.getLibelle());
                }
            }

            // Traitement de chaque ligne (déduire le stock)
            for (LigneCommandeClient ligne : lignes) {
                String sqlProduit = "SELECT * FROM produit WHERE id_produit = ?";
                Produit produit = tenantRepo.queryForObject(sqlProduit, produitRowMapper(), clientId, authClientId, ligne.getProduit().getIdProduit());

                int nouveauStock = produit.getQuantiteStock() - ligne.getQuantite();

                // Mettre à jour le stock
                String updateStock = "UPDATE produit SET quantite_stock = ? WHERE id_produit = ?";
                tenantRepo.update(updateStock, clientId, authClientId, nouveauStock, produit.getIdProduit());

                // Créer le mouvement de stock
                String insertMouvement = """
                    INSERT INTO stock_movement (produit_id, type_mouvement, quantite, stock_avant, stock_apres, type_document, commentaire, date_mouvement)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """;
                tenantRepo.update(insertMouvement, clientId, authClientId,
                        produit.getIdProduit(), "SORTIE", ligne.getQuantite(),
                        produit.getQuantiteStock(), nouveauStock,
                        "COMMANDE_CLIENT", "Vente - Commande client " + commande.getReferenceCommandeClient(), LocalDateTime.now());
            }

            // Mettre à jour le statut de la commande
            String updateStatut = "UPDATE commande_client SET statut = 'CONFIRMEE' WHERE id_commande_client = ?";
            tenantRepo.update(updateStatut, clientId, authClientId, commandeId);

            // Retourner la commande mise à jour
            CommandeClient updated = tenantRepo.queryForObject(sqlCommande, commandeRowMapper(), clientId, authClientId, commandeId);
            System.out.println("✅ Commande " + updated.getIdCommandeClient() + " confirmée avec succès");

            return updated;

        } catch (Exception e) {
            System.err.println("❌ EXCEPTION dans confirmerCommande: " + e.getMessage());
            throw e;
        }
    }

    @Transactional
    public CommandeClient rejeterCommande(Integer commandeId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sqlCommande = "SELECT * FROM commande_client WHERE id_commande_client = ?";
        CommandeClient commande = tenantRepo.queryForObject(sqlCommande, commandeRowMapper(), clientId, authClientId, commandeId);

        if (commande == null) {
            throw new RuntimeException("Commande non trouvée");
        }

        if (commande.getStatut() == CommandeClient.StatutCommande.ANNULEE) {
            throw new RuntimeException("La commande est déjà annulée");
        }

        if (commande.getStatut() == CommandeClient.StatutCommande.CONFIRMEE) {
            // Restituer le stock
            String sqlLignes = "SELECT * FROM ligne_commande_client WHERE commande_client_id = ?";
            List<LigneCommandeClient> lignes = tenantRepo.query(sqlLignes, ligneCommandeRowMapper(), clientId, authClientId, commandeId);

            for (LigneCommandeClient ligne : lignes) {
                String sqlProduit = "SELECT * FROM produit WHERE id_produit = ?";
                Produit produit = tenantRepo.queryForObject(sqlProduit, produitRowMapper(), clientId, authClientId, ligne.getProduit().getIdProduit());

                int nouveauStock = produit.getQuantiteStock() + ligne.getQuantite();
                String updateStock = "UPDATE produit SET quantite_stock = ? WHERE id_produit = ?";
                tenantRepo.update(updateStock, clientId, authClientId, nouveauStock, produit.getIdProduit());
            }
        }

        // Annuler la commande
        String updateStatut = "UPDATE commande_client SET statut = 'ANNULEE' WHERE id_commande_client = ?";
        tenantRepo.update(updateStatut, clientId, authClientId, commandeId);

        return tenantRepo.queryForObject(sqlCommande, commandeRowMapper(), clientId, authClientId, commandeId);
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