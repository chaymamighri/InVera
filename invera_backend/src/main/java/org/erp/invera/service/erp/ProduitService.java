package org.erp.invera.service.erp;

import lombok.extern.slf4j.Slf4j;
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
import java.util.*;

@Slf4j
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
            produit.setImageUrl(rs.getString("image_url"));
            produit.setActive(rs.getBoolean("is_active"));
            produit.setSeuilMinimum(rs.getInt("seuil_minimum"));
            produit.setRemiseTemporaire(rs.getDouble("remise_temporaire"));

            String status = rs.getString("status");
            if (status != null) {
                produit.setStatus(Produit.StockStatus.valueOf(status));
            }

            String uniteMesure = rs.getString("unite_mesure");
            if (uniteMesure != null) {
                produit.setUniteMesure(Produit.UniteMesure.valueOf(uniteMesure));
            }

            // ✅ Catégorie
            if (rs.getObject("categorie_id") != null) {
                Categorie categorie = new Categorie();
                categorie.setIdCategorie(rs.getInt("categorie_id"));
                categorie.setNomCategorie(rs.getString("categorie_nom"));
                produit.setCategorie(categorie);
                log.info("📌 Catégorie trouvée: id={}, nom={}", categorie.getIdCategorie(), categorie.getNomCategorie());
            }

            // ✅ Fournisseur
            Object fournisseurIdObj = rs.getObject("fournisseur_id");
            log.info("🔍 fournisseur_id dans ResultSet: {}", fournisseurIdObj);

            if (fournisseurIdObj != null) {
                Fournisseur fournisseur = new Fournisseur();
                fournisseur.setIdFournisseur(rs.getInt("fournisseur_id"));
                fournisseur.setNomFournisseur(rs.getString("fournisseur_nom"));
                fournisseur.setEmail(rs.getString("fournisseur_email"));
                fournisseur.setTelephone(rs.getString("fournisseur_telephone"));

                // Vérifier si ces colonnes existent avant de les lire
                try {
                    fournisseur.setAdresse(rs.getString("fournisseur_adresse"));
                    fournisseur.setVille(rs.getString("fournisseur_ville"));
                    fournisseur.setPays(rs.getString("fournisseur_pays"));
                } catch (SQLException e) {
                    log.warn("Colonnes fournisseur supplémentaires non trouvées: {}", e.getMessage());
                }

                produit.setFournisseur(fournisseur);
                log.info("✅ Fournisseur attaché: id={}, nom={}",
                        fournisseur.getIdFournisseur(), fournisseur.getNomFournisseur());
            } else {
                log.warn("⚠️ Aucun fournisseur_id trouvé pour ce produit");
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
            fournisseur.setNomFournisseur(rs.getString("nom_fournisseur"));
            fournisseur.setEmail(rs.getString("email"));
            fournisseur.setTelephone(rs.getString("telephone"));
            fournisseur.setAdresse(rs.getString("adresse"));
            fournisseur.setVille(rs.getString("ville"));
            fournisseur.setPays(rs.getString("pays"));
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
            // ✅ Utiliser queryForObjectAuth
            Categorie categorie = tenantRepo.queryForObjectAuth(sqlCategorie, categorieRowMapper(),
                    clientId, authClientId, produit.getCategorie().getIdCategorie());

            if (categorie == null) {
                throw new RuntimeException("Categorie non trouvée avec l'id: " + produit.getCategorie().getIdCategorie());
            }
        }

        // 2. Vérifier le fournisseur
        if (fournisseurId != null) {
            String sqlFournisseur = "SELECT * FROM fournisseurs WHERE id_fournisseur = ?";
            // ✅ Utiliser queryForObjectAuth
            Fournisseur fournisseur = tenantRepo.queryForObjectAuth(sqlFournisseur, fournisseurRowMapper(),
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

        // ✅ Utiliser queryForObjectAuth
        Integer produitId = tenantRepo.queryForObjectAuth(insertSql, Integer.class, clientId, authClientId,
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
        // ✅ Utiliser queryForObjectAuth
        Produit savedProduit = tenantRepo.queryForObjectAuth(selectSql, produitRowMapperSimple(), clientId, authClientId, produitId);

        // 5. Créer le mouvement de stock initial si nécessaire
        if (savedProduit.getQuantiteStock() != null && savedProduit.getQuantiteStock() > 0) {
            String insertMovementSql = """
                INSERT INTO stock_movement (produit_id, type_mouvement, quantite, stock_avant, stock_apres, 
                                            prix_unitaire, valeur_totale, type_document, commentaire, date_mouvement)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
            // ✅ Utiliser updateWithAuth
            tenantRepo.updateWithAuth(insertMovementSql, clientId, authClientId,
                    savedProduit.getIdProduit(), "INIT_STOCK", savedProduit.getQuantiteStock(),
                    0, savedProduit.getQuantiteStock(),
                    prixAchat != null ? prixAchat : BigDecimal.ZERO,
                    (prixAchat != null ? prixAchat : BigDecimal.ZERO).multiply(BigDecimal.valueOf(savedProduit.getQuantiteStock())),
                    "INIT_STOCK", "Stock initial à la création du produit", LocalDateTime.now());
        }

        return savedProduit;
    }

    // Dans ProduitService.java - À ajouter
    public List<Produit> searchProduits(String keyword, Produit.StockStatus status, Integer categorieId, Boolean actif, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = """
        SELECT p.*, 
               c.id_categorie as categorie_id, 
               c.nom_categorie as categorie_nom,
               f.id_fournisseur as fournisseur_id, 
               f.nom_fournisseur as fournisseur_nom,
               f.email as fournisseur_email,
               f.telephone as fournisseur_telephone,
               f.adresse as fournisseur_adresse,
               f.ville as fournisseur_ville,
               f.pays as fournisseur_pays
        FROM produit p
        LEFT JOIN categorie c ON p.categorie_id = c.id_categorie
        LEFT JOIN fournisseurs f ON p.fournisseur_id = f.id_fournisseur
        WHERE 1=1
        """ +
                (keyword != null && !keyword.isEmpty() ? " AND p.libelle LIKE ?" : "") +
                (status != null ? " AND p.status = ?" : "") +
                (categorieId != null ? " AND p.categorie_id = ?" : "") +
                (actif != null ? " AND p.is_active = ?" : "") +
                " ORDER BY p.libelle ASC";

        // Construction des paramètres
        List<Object> params = new ArrayList<>();
        if (keyword != null && !keyword.isEmpty()) params.add("%" + keyword + "%");
        if (status != null) params.add(status.name());
        if (categorieId != null) params.add(categorieId);
        if (actif != null) params.add(actif);

        return tenantRepo.queryWithAuth(sql, produitRowMapper(), clientId, authClientId, params.toArray());
    }

    public List<Produit> getAllProduits(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = """
        SELECT p.*, 
               c.id_categorie as categorie_id, 
               c.nom_categorie as categorie_nom,
               f.id_fournisseur as fournisseur_id, 
               f.nom_fournisseur as fournisseur_nom,
               f.email as fournisseur_email,
               f.telephone as fournisseur_telephone,
               f.adresse as fournisseur_adresse,
               f.ville as fournisseur_ville,
               f.pays as fournisseur_pays
        FROM produit p
        LEFT JOIN categorie c ON p.categorie_id = c.id_categorie
        LEFT JOIN fournisseurs f ON p.fournisseur_id = f.id_fournisseur
        ORDER BY p.id_produit
        """;

        return tenantRepo.queryWithAuth(sql, produitRowMapper(), clientId, authClientId);
    }

    public List<Produit> getProduitsActifs(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT * FROM produit WHERE is_active = true ORDER BY id_produit";
        // ✅ CORRECTION: Utiliser queryWithAuth
        return tenantRepo.queryWithAuth(sql, produitRowMapper(), clientId, authClientId);
    }

    public Optional<Produit> getProduitById(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = """
        SELECT p.*, 
               c.id_categorie as categorie_id, 
               c.nom_categorie as categorie_nom,
               f.id_fournisseur as fournisseur_id, 
               f.nom_fournisseur as fournisseur_nom,
               f.email as fournisseur_email,
               f.telephone as fournisseur_telephone,
               f.adresse as fournisseur_adresse,
               f.ville as fournisseur_ville,
               f.pays as fournisseur_pays
        FROM produit p
        LEFT JOIN categorie c ON p.categorie_id = c.id_categorie
        LEFT JOIN fournisseurs f ON p.fournisseur_id = f.id_fournisseur
        WHERE p.id_produit = ?
        """;

        log.info("🔍 Exécution requête getProduitById pour ID: {}", id);

        Produit produit = tenantRepo.queryForObjectAuth(sql, produitRowMapper(), clientId, authClientId, id);

        if (produit != null) {
            log.info("✅ Produit trouvé: id={}, libelle={}", produit.getIdProduit(), produit.getLibelle());
            if (produit.getFournisseur() != null) {
                log.info("✅ Fournisseur attaché: id={}, nom={}",
                        produit.getFournisseur().getIdFournisseur(),
                        produit.getFournisseur().getNomFournisseur());
            } else {
                log.warn("⚠️ Aucun fournisseur attaché au produit ID={}", id);
            }
        } else {
            log.warn("⚠️ Produit non trouvé pour ID: {}", id);
        }

        return Optional.ofNullable(produit);
    }

    @Transactional
    public Produit updateProduit(Integer id, Produit produitDetails, Integer fournisseurId,
                                 Integer categorieId, BigDecimal prixAchat, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        log.info("📝 Mise à jour produit ID: {} pour client: {}", id, clientId);
        log.info("📝 fournisseurId reçu: {}, categorieId reçu: {}", fournisseurId, categorieId);

        // ✅ Vérifier que le produit existe
        String checkSql = "SELECT COUNT(*) FROM produit WHERE id_produit = ?";
        Integer count = tenantRepo.queryForObjectAuth(checkSql, Integer.class, clientId, authClientId, id);

        if (count == null || count == 0) {
            throw new RuntimeException("Produit non trouvé avec l'id: " + id);
        }

        // ✅ Récupérer le produit existant (pour les valeurs actuelles)
        String selectSql = "SELECT * FROM produit WHERE id_produit = ?";
        Produit existingProduit = tenantRepo.queryForObjectAuth(selectSql, produitRowMapperSimple(), clientId, authClientId, id);

        if (existingProduit == null) {
            throw new RuntimeException("Erreur lors de la récupération du produit");
        }

        Integer previousQuantity = existingProduit.getQuantiteStock();

        // ✅ Préparer les valeurs mises à jour (utiliser les nouvelles valeurs ou conserver les anciennes)
        String finalLibelle = (produitDetails.getLibelle() != null) ? produitDetails.getLibelle() : existingProduit.getLibelle();
        Double finalPrixVente = (produitDetails.getPrixVente() != null) ? produitDetails.getPrixVente() : existingProduit.getPrixVente();
        BigDecimal finalPrixAchat = (prixAchat != null) ? prixAchat : existingProduit.getPrixAchat();
        Integer finalQuantiteStock = (produitDetails.getQuantiteStock() != null) ? produitDetails.getQuantiteStock() : existingProduit.getQuantiteStock();
        Integer finalSeuilMinimum = (produitDetails.getSeuilMinimum() != null) ? produitDetails.getSeuilMinimum() : existingProduit.getSeuilMinimum();
        String finalUniteMesure = (produitDetails.getUniteMesure() != null) ? produitDetails.getUniteMesure().name() : existingProduit.getUniteMesure().name();
        Double finalRemiseTemporaire = (produitDetails.getRemiseTemporaire() != null) ? produitDetails.getRemiseTemporaire() : existingProduit.getRemiseTemporaire();
        Boolean finalActive = (produitDetails.getActive() != null) ? produitDetails.getActive() : existingProduit.getActive();
        String finalImageUrl = (produitDetails.getImageUrl() != null) ? produitDetails.getImageUrl() : existingProduit.getImageUrl();

        // ✅ Calculer le statut du stock
        Produit.StockStatus finalStatus = calculerStatutStock(finalQuantiteStock, finalSeuilMinimum);

        // ✅ Mettre à jour le produit
        String updateSql = """
        UPDATE produit 
        SET libelle = ?, prix_vente = ?, prix_achat = ?, quantite_stock = ?, 
            status = ?, unite_mesure = ?, seuil_minimum = ?, image_url = ?, 
            remise_temporaire = ?, is_active = ?, categorie_id = ?, fournisseur_id = ?
        WHERE id_produit = ?
        """;

        int updated = tenantRepo.updateWithAuth(updateSql, clientId, authClientId,
                finalLibelle,
                finalPrixVente,
                finalPrixAchat,
                finalQuantiteStock,
                finalStatus.name(),
                finalUniteMesure,
                finalSeuilMinimum,
                finalImageUrl,
                finalRemiseTemporaire,
                finalActive,
                categorieId,
                fournisseurId,
                id);

        log.info("✅ UPDATE exécuté, affectedRows={}", updated);

        if (updated == 0) {
            throw new RuntimeException("Erreur lors de la mise à jour du produit");
        }

        // ✅ Notification si besoin
        stockNotificationService.notifyIfStockNeedsReorder(existingProduit, previousQuantity, finalQuantiteStock, token);

        // ✅ Retourner le produit mis à jour
        return getProduitById(id, token).orElseThrow(() -> new RuntimeException("Produit non trouvé après mise à jour"));
    }

    // ✅ Méthode utilitaire pour calculer le statut du stock
    private Produit.StockStatus calculerStatutStock(Integer quantiteStock, Integer seuilMinimum) {
        if (quantiteStock == null || seuilMinimum == null || quantiteStock <= 0) {
            return Produit.StockStatus.RUPTURE;
        }
        if (quantiteStock <= seuilMinimum * 0.25) {
            return Produit.StockStatus.CRITIQUE;
        }
        if (quantiteStock <= seuilMinimum) {
            return Produit.StockStatus.FAIBLE;
        }
        return Produit.StockStatus.EN_STOCK;
    }

    // ✅ RowMapper simple pour la récupération interne
    private RowMapper<Produit> produitRowMapperSimple() {
        return (rs, rowNum) -> {
            Produit produit = new Produit();
            produit.setIdProduit(rs.getInt("id_produit"));
            produit.setLibelle(rs.getString("libelle"));
            produit.setPrixVente(rs.getDouble("prix_vente"));
            produit.setPrixAchat(rs.getBigDecimal("prix_achat") != null ?
                    rs.getBigDecimal("prix_achat") : BigDecimal.ZERO);
            produit.setQuantiteStock(rs.getInt("quantite_stock"));
            produit.setImageUrl(rs.getString("image_url"));
            produit.setSeuilMinimum(rs.getInt("seuil_minimum"));
            produit.setActive(rs.getBoolean("is_active"));
            produit.setRemiseTemporaire(rs.getDouble("remise_temporaire"));

            String status = rs.getString("status");
            if (status != null) {
                produit.setStatus(Produit.StockStatus.valueOf(status));
            }

            String uniteMesure = rs.getString("unite_mesure");
            if (uniteMesure != null) {
                produit.setUniteMesure(Produit.UniteMesure.valueOf(uniteMesure));
            }

            return produit;
        };
    }

    public void desactiverProduit(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "UPDATE produit SET is_active = false WHERE id_produit = ?";
        // ✅ Utiliser updateWithAuth
        tenantRepo.updateWithAuth(sql, clientId, authClientId, id);
    }

    public Produit reactiverProduit(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "UPDATE produit SET is_active = true WHERE id_produit = ?";
        // ✅ Utiliser updateWithAuth
        tenantRepo.updateWithAuth(sql, clientId, authClientId, id);

        String selectSql = "SELECT * FROM produit WHERE id_produit = ?";
        // ✅ Utiliser queryForObjectAuth
        return tenantRepo.queryForObjectAuth(selectSql, produitRowMapper(), clientId, authClientId, id);
    }

    public List<Produit> getProduitsByCategorie(Integer categorieId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = """
        SELECT p.*, 
               c.id_categorie as categorie_id, 
               c.nom_categorie as categorie_nom,
               f.id_fournisseur as fournisseur_id, 
               f.nom_fournisseur as fournisseur_nom,
               f.email as fournisseur_email,
               f.telephone as fournisseur_telephone,
               f.adresse as fournisseur_adresse,
               f.ville as fournisseur_ville,
               f.pays as fournisseur_pays
        FROM produit p
        LEFT JOIN categorie c ON p.categorie_id = c.id_categorie
        LEFT JOIN fournisseurs f ON p.fournisseur_id = f.id_fournisseur
        WHERE p.categorie_id = ? AND p.is_active = true
        """;

        return tenantRepo.queryWithAuth(sql, produitRowMapper(), clientId, authClientId, categorieId);
    }

    public List<Produit> getProduitsByFournisseur(Integer fournisseurId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = """
        SELECT p.*, 
               c.id_categorie as categorie_id, 
               c.nom_categorie as categorie_nom,
               f.id_fournisseur as fournisseur_id, 
               f.nom_fournisseur as fournisseur_nom,
               f.email as fournisseur_email,
               f.telephone as fournisseur_telephone,
               f.adresse as fournisseur_adresse,
               f.ville as fournisseur_ville,
               f.pays as fournisseur_pays
        FROM produit p
        LEFT JOIN categorie c ON p.categorie_id = c.id_categorie
        LEFT JOIN fournisseurs f ON p.fournisseur_id = f.id_fournisseur
        WHERE p.fournisseur_id = ?
        """;

        return tenantRepo.queryWithAuth(sql, produitRowMapper(), clientId, authClientId, fournisseurId);
    }


    public boolean verifierDisponibilite(Integer produitId, Integer quantiteDemandee, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT quantite_stock, is_active FROM produit WHERE id_produit = ?";
        // ✅ Utiliser queryForObjectAuth avec RowMapper
        Map<String, Object> result = tenantRepo.queryForObjectAuth(sql,
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