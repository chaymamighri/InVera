package org.erp.invera.service.erp;

import org.erp.invera.model.erp.Categorie;
import org.erp.invera.model.erp.Fournisseurs.Fournisseur;
import org.erp.invera.model.erp.Produit;
import org.erp.invera.model.erp.stock.StockMovement;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.erp.invera.security.JwtTokenProvider;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class ProduitService {

    private final TenantAwareRepository tenantRepo;
    private final JwtTokenProvider jwtTokenProvider;
    private final StockNotificationService stockNotificationService;

    public ProduitService(TenantAwareRepository tenantRepo,
                          JwtTokenProvider jwtTokenProvider,
                          StockNotificationService stockNotificationService) {
        this.tenantRepo = tenantRepo;
        this.jwtTokenProvider = jwtTokenProvider;
        this.stockNotificationService = stockNotificationService;
    }

    // ==================== ROW MAPPERS ====================

    public RowMapper<Produit> produitRowMapper() {
        return (rs, rowNum) -> {
            Produit produit = new Produit();
            produit.setIdProduit(rs.getInt("id_produit"));
            produit.setLibelle(rs.getString("libelle"));
            produit.setPrixVente(rs.getDouble("prix_vente"));
            produit.setPrixAchat(rs.getBigDecimal("prix_achat") != null ?
                    rs.getBigDecimal("prix_achat") : BigDecimal.ZERO);
            produit.setQuantiteStock(rs.getInt("quantite_stock"));

            String status = rs.getString("status");
            if (status != null) {
                produit.setStatus(Produit.StockStatus.valueOf(status));
            }

            String uniteMesure = rs.getString("unite_mesure");
            if (uniteMesure != null) {
                produit.setUniteMesure(Produit.UniteMesure.valueOf(uniteMesure));
            }

            produit.setActive(rs.getBoolean("is_active"));
            produit.setSeuilMinimum(rs.getInt("seuil_minimum"));
            produit.setImageUrl(rs.getString("image_url"));
            produit.setRemiseTemporaire(rs.getDouble("remise_temporaire"));
            produit.setCreatedBy(rs.getString("created_by"));

            if (rs.getTimestamp("created_at") != null) {
                produit.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
            }

            return produit;
        };
    }

    public RowMapper<Categorie> categorieRowMapper() {
        return (rs, rowNum) -> {
            Categorie categorie = new Categorie();
            categorie.setIdCategorie(rs.getInt("id_categorie"));
            categorie.setNomCategorie(rs.getString("nom_categorie"));
            categorie.setDescription(rs.getString("description"));
            return categorie;
        };
    }

    public RowMapper<Fournisseur> fournisseurRowMapper() {
        return (rs, rowNum) -> {
            Fournisseur fournisseur = new Fournisseur();
            fournisseur.setIdFournisseur(rs.getInt("id_fournisseur"));
            fournisseur.setNomFournisseur(rs.getString("nom"));
            fournisseur.setEmail(rs.getString("email"));
            fournisseur.setTelephone(rs.getString("telephone"));
            fournisseur.setAdresse(rs.getString("adresse"));
            return fournisseur;
        };
    }

    private Long getClientIdFromToken(String token) {
        return jwtTokenProvider.getClientIdFromToken(token);
    }

    // ==================== CRUD PRODUITS ====================

    @Transactional
    public Produit createProduit(Produit produit, Integer fournisseurId, BigDecimal prixAchat, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        System.out.println("🛠️ Création produit en cours pour client: " + clientId);

        // 1. Vérifier la catégorie
        if (produit.getCategorie() != null && produit.getCategorie().getIdCategorie() != null) {
            String sqlCategorie = "SELECT * FROM categorie WHERE id_categorie = ?";
            Categorie categorie = tenantRepo.queryForObject(sqlCategorie, categorieRowMapper(),
                    clientId, authClientId, produit.getCategorie().getIdCategorie());

            if (categorie == null) {
                throw new RuntimeException("Categorie non trouvée avec l'id: " + produit.getCategorie().getIdCategorie());
            }
        }

        // 2. Vérifier le fournisseur
        if (fournisseurId != null) {
            String sqlFournisseur = "SELECT * FROM fournisseur WHERE id_fournisseur = ?";
            Fournisseur fournisseur = tenantRepo.queryForObject(sqlFournisseur, fournisseurRowMapper(),
                    clientId, authClientId, fournisseurId);

            if (fournisseur == null) {
                throw new RuntimeException("Fournisseur non trouvé avec l'id: " + fournisseurId);
            }
        }

        // 3. Insérer le produit
        String insertSql = """
            INSERT INTO produit (libelle, prix_vente, prix_achat, quantite_stock, status, 
                                 unite_mesure, is_active, seuil_minimum, image_url, 
                                 remise_temporaire, created_by, created_at, 
                                 categorie_id, fournisseur_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id_produit
            """;

        String statusStr = produit.getStatus() != null ? produit.getStatus().name() : "EN_STOCK";
        String uniteMesureStr = produit.getUniteMesure() != null ? produit.getUniteMesure().name() : "PIECE";

        Integer produitId = tenantRepo.queryForObject(insertSql, Integer.class, clientId, authClientId,
                produit.getLibelle(),
                produit.getPrixVente(),
                prixAchat != null ? prixAchat : BigDecimal.ZERO,
                produit.getQuantiteStock() != null ? produit.getQuantiteStock() : 0,
                statusStr,
                uniteMesureStr,
                produit.getActive() != null ? produit.getActive() : true,
                produit.getSeuilMinimum() != null ? produit.getSeuilMinimum() : 5,
                produit.getImageUrl(),
                produit.getRemiseTemporaire(),
                "system",
                LocalDateTime.now(),
                produit.getCategorie() != null ? produit.getCategorie().getIdCategorie() : null,
                fournisseurId
        );

        // 4. Récupérer le produit créé
        String selectSql = "SELECT * FROM produit WHERE id_produit = ?";
        Produit savedProduit = tenantRepo.queryForObject(selectSql, produitRowMapper(), clientId, authClientId, produitId);

        // 5. Créer le mouvement de stock initial si nécessaire
        if (savedProduit.getQuantiteStock() != null && savedProduit.getQuantiteStock() > 0) {
            String insertMovementSql = """
                INSERT INTO stock_movement (produit_id, type_mouvement, quantite, stock_avant, stock_apres, 
                                            prix_unitaire, valeur_totale, type_document, commentaire, date_mouvement)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
            tenantRepo.update(insertMovementSql, clientId, authClientId,
                    savedProduit.getIdProduit(), "INIT_STOCK", savedProduit.getQuantiteStock(),
                    0, savedProduit.getQuantiteStock(),
                    prixAchat != null ? prixAchat : BigDecimal.ZERO,
                    (prixAchat != null ? prixAchat : BigDecimal.ZERO).multiply(BigDecimal.valueOf(savedProduit.getQuantiteStock())),
                    "INIT_STOCK", "Stock initial à la création du produit", LocalDateTime.now());
        }

        return savedProduit;
    }

    public List<Produit> getAllProduits(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT * FROM produit ORDER BY id_produit";
        return tenantRepo.query(sql, produitRowMapper(), clientId, authClientId);
    }

    public List<Produit> getProduitsActifs(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT * FROM produit WHERE is_active = true ORDER BY id_produit";
        return tenantRepo.query(sql, produitRowMapper(), clientId, authClientId);
    }

    public Optional<Produit> getProduitById(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT * FROM produit WHERE id_produit = ?";
        Produit produit = tenantRepo.queryForObject(sql, produitRowMapper(), clientId, authClientId, id);
        return Optional.ofNullable(produit);
    }

    @Transactional
    public Produit updateProduit(Integer id, Produit produitDetails, Integer fournisseurId, BigDecimal prixAchat, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // Récupérer le produit existant
        String selectSql = "SELECT * FROM produit WHERE id_produit = ?";
        Produit produit = tenantRepo.queryForObject(selectSql, produitRowMapper(), clientId, authClientId, id);

        if (produit == null) {
            throw new RuntimeException("Produit non trouvé avec l'id: " + id);
        }

        Integer previousQuantity = produit.getQuantiteStock();

        // Mise à jour des champs
        if (produitDetails.getLibelle() != null) {
            produit.setLibelle(produitDetails.getLibelle());
        }
        if (produitDetails.getPrixVente() != null) {
            produit.setPrixVente(produitDetails.getPrixVente());
        }
        if (prixAchat != null) {
            produit.setPrixAchat(prixAchat);
        }
        if (produitDetails.getImageUrl() != null) {
            produit.setImageUrl(produitDetails.getImageUrl());
        }
        if (produitDetails.getRemiseTemporaire() != null) {
            produit.setRemiseTemporaire(produitDetails.getRemiseTemporaire());
        }
        if (produitDetails.getSeuilMinimum() != null) {
            produit.setSeuilMinimum(produitDetails.getSeuilMinimum());
        }
        if (produitDetails.getUniteMesure() != null) {
            produit.setUniteMesure(produitDetails.getUniteMesure());
        }
        if (produitDetails.getQuantiteStock() != null) {
            produit.setQuantiteStock(produitDetails.getQuantiteStock());
        }

        // Mise à jour du statut du stock
        updateStockStatus(produit);

        // Sauvegarder les modifications
        String updateSql = """
            UPDATE produit 
            SET libelle = ?, prix_vente = ?, prix_achat = ?, quantite_stock = ?, 
                status = ?, unite_mesure = ?, seuil_minimum = ?, image_url = ?, 
                remise_temporaire = ?
            WHERE id_produit = ?
            """;

        tenantRepo.update(updateSql, clientId, authClientId,
                produit.getLibelle(), produit.getPrixVente(), produit.getPrixAchat(),
                produit.getQuantiteStock(), produit.getStatus().name(), produit.getUniteMesure().name(),
                produit.getSeuilMinimum(), produit.getImageUrl(), produit.getRemiseTemporaire(),
                id);

        // Notification si besoin
        stockNotificationService.notifyIfStockNeedsReorder(produit, previousQuantity, produit.getQuantiteStock(), token);
        return produit;
    }

    public void desactiverProduit(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "UPDATE produit SET is_active = false WHERE id_produit = ?";
        tenantRepo.update(sql, clientId, authClientId, id);
    }

    public Produit reactiverProduit(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "UPDATE produit SET is_active = true WHERE id_produit = ?";
        tenantRepo.update(sql, clientId, authClientId, id);

        String selectSql = "SELECT * FROM produit WHERE id_produit = ?";
        return tenantRepo.queryForObject(selectSql, produitRowMapper(), clientId, authClientId, id);
    }

    public List<Produit> getProduitsByCategorie(Integer categorieId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT * FROM produit WHERE categorie_id = ? AND is_active = true";
        return tenantRepo.query(sql, produitRowMapper(), clientId, authClientId, categorieId);
    }

    public List<Produit> getProduitsByFournisseur(Integer fournisseurId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT * FROM produit WHERE fournisseur_id = ?";
        return tenantRepo.query(sql, produitRowMapper(), clientId, authClientId, fournisseurId);
    }

    public boolean verifierDisponibilite(Integer produitId, Integer quantiteDemandee, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT quantite_stock, is_active FROM produit WHERE id_produit = ?";
        Map<String, Object> result = tenantRepo.queryForObject(sql,
                (rs, rowNum) -> Map.of("stock", rs.getInt("quantite_stock"), "active", rs.getBoolean("is_active")),
                clientId, authClientId, produitId);

        if (result == null) {
            return false;
        }

        boolean isActive = (Boolean) result.get("active");
        int stock = (Integer) result.get("stock");

        return isActive && stock >= quantiteDemandee;
    }

    public void updateStockStatus(Produit produit) {
        if (produit.getQuantiteStock() == null || produit.getSeuilMinimum() == null) {
            produit.setStatus(Produit.StockStatus.RUPTURE);
            return;
        }

        int quantite = produit.getQuantiteStock();
        int seuil = produit.getSeuilMinimum();

        if (quantite <= 0) {
            produit.setStatus(Produit.StockStatus.RUPTURE);
        } else if (quantite <= seuil * 0.25) {
            produit.setStatus(Produit.StockStatus.CRITIQUE);
        } else if (quantite <= seuil) {
            produit.setStatus(Produit.StockStatus.FAIBLE);
        } else {
            produit.setStatus(Produit.StockStatus.EN_STOCK);
        }
    }
}