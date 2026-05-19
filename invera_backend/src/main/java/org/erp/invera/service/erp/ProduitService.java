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

            // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ CatÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©gorie
            if (rs.getObject("categorie_id") != null) {
                Categorie categorie = new Categorie();
                categorie.setIdCategorie(rs.getInt("categorie_id"));
                categorie.setNomCategorie(rs.getString("categorie_nom"));
                produit.setCategorie(categorie);
                log.info("ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€¦Ã¢â‚¬â„¢ CatÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©gorie trouvÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e: id={}, nom={}", categorie.getIdCategorie(), categorie.getNomCategorie());
            }

            // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Fournisseur
            Object fournisseurIdObj = rs.getObject("fournisseur_id");
            log.info("ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚Â fournisseur_id dans ResultSet: {}", fournisseurIdObj);

            if (fournisseurIdObj != null) {
                Fournisseur fournisseur = new Fournisseur();
                fournisseur.setIdFournisseur(rs.getInt("fournisseur_id"));
                fournisseur.setNomFournisseur(rs.getString("fournisseur_nom"));
                fournisseur.setEmail(rs.getString("fournisseur_email"));
                fournisseur.setTelephone(rs.getString("fournisseur_telephone"));

                // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier si ces colonnes existent avant de les lire
                try {
                    fournisseur.setAdresse(rs.getString("fournisseur_adresse"));
                    fournisseur.setVille(rs.getString("fournisseur_ville"));
                    fournisseur.setPays(rs.getString("fournisseur_pays"));
                } catch (SQLException e) {
                    log.warn("Colonnes fournisseur supplÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©mentaires non trouvÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es: {}", e.getMessage());
                }

                produit.setFournisseur(fournisseur);
                log.info("ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Fournisseur attachÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©: id={}, nom={}",
                        fournisseur.getIdFournisseur(), fournisseur.getNomFournisseur());
            } else {
                log.warn("ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Aucun fournisseur_id trouvÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© pour ce produit");
            }

            updateStockStatus(produit);
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

        System.out.println("ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂºÃƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â CrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ation produit en cours pour client: " + clientId);

        // 1. VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier la catÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©gorie
        if (produit.getCategorie() != null && produit.getCategorie().getIdCategorie() != null) {
            String sqlCategorie = "SELECT * FROM categorie WHERE id_categorie = ?";
            // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Utiliser queryForObjectAuth
            Categorie categorie = tenantRepo.queryForObjectAuth(sqlCategorie, categorieRowMapper(),
                    clientId, authClientId, produit.getCategorie().getIdCategorie());

            if (categorie == null) {
                throw new RuntimeException("Categorie non trouvÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e avec l'id: " + produit.getCategorie().getIdCategorie());
            }
        }

        // 2. VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier le fournisseur
        if (fournisseurId != null) {
            String sqlFournisseur = "SELECT * FROM fournisseurs WHERE id_fournisseur = ?";
            // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Utiliser queryForObjectAuth
            Fournisseur fournisseur = tenantRepo.queryForObjectAuth(sqlFournisseur, fournisseurRowMapper(),
                    clientId, authClientId, fournisseurId);

            if (fournisseur == null) {
                throw new RuntimeException("Fournisseur non trouvÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© avec l'id: " + fournisseurId);
            }
        }

        // 3. InsÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rer le produit
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

        // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Utiliser queryForObjectAuth
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

        // 4. RÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cupÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rer le produit crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©
        String selectSql = "SELECT * FROM produit WHERE id_produit = ?";
        // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Utiliser queryForObjectAuth
        Produit savedProduit = tenantRepo.queryForObjectAuth(selectSql, produitRowMapperSimple(), clientId, authClientId, produitId);

        // 5. CrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©er le mouvement de stock initial si nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cessaire
        if (savedProduit.getQuantiteStock() != null && savedProduit.getQuantiteStock() > 0) {
            String insertMovementSql = """
                INSERT INTO stock_movement (produit_id, type_mouvement, quantite, stock_avant, stock_apres, 
                                            prix_unitaire, valeur_totale, type_document, commentaire, date_mouvement)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
            // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Utiliser updateWithAuth
            tenantRepo.updateWithAuth(insertMovementSql, clientId, authClientId,
                    savedProduit.getIdProduit(), "INIT_STOCK", savedProduit.getQuantiteStock(),
                    0, savedProduit.getQuantiteStock(),
                    prixAchat != null ? prixAchat : BigDecimal.ZERO,
                    (prixAchat != null ? prixAchat : BigDecimal.ZERO).multiply(BigDecimal.valueOf(savedProduit.getQuantiteStock())),
                    "INIT_STOCK", "Stock initial ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  la crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ation du produit", LocalDateTime.now());
        }

        return savedProduit;
    }

    // Dans ProduitService.java - ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ ajouter
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

        // Construction des paramÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨tres
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
        // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ CORRECTION: Utiliser queryWithAuth
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

        log.info("ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚Â ExÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cution requÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªte getProduitById pour ID: {}", id);

        Produit produit = tenantRepo.queryForObjectAuth(sql, produitRowMapper(), clientId, authClientId, id);

        if (produit != null) {
            log.info("ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Produit trouvÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©: id={}, libelle={}", produit.getIdProduit(), produit.getLibelle());
            if (produit.getFournisseur() != null) {
                log.info("ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Fournisseur attachÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©: id={}, nom={}",
                        produit.getFournisseur().getIdFournisseur(),
                        produit.getFournisseur().getNomFournisseur());
            } else {
                log.warn("ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Aucun fournisseur attachÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© au produit ID={}", id);
            }
        } else {
            log.warn("ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Produit non trouvÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© pour ID: {}", id);
        }

        return Optional.ofNullable(produit);
    }

    @Transactional
    public Produit updateProduit(Integer id, Produit produitDetails, Integer fournisseurId,
                                 Integer categorieId, BigDecimal prixAchat, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        log.info("ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â Mise ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour produit ID: {} pour client: {}", id, clientId);
        log.info("ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â fournisseurId reÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§u: {}, categorieId reÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§u: {}", fournisseurId, categorieId);

        // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier que le produit existe
        String checkSql = "SELECT COUNT(*) FROM produit WHERE id_produit = ?";
        Integer count = tenantRepo.queryForObjectAuth(checkSql, Integer.class, clientId, authClientId, id);

        if (count == null || count == 0) {
            throw new RuntimeException("Produit non trouvÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© avec l'id: " + id);
        }

        // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ RÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cupÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rer le produit existant (pour les valeurs actuelles)
        String selectSql = "SELECT * FROM produit WHERE id_produit = ?";
        Produit existingProduit = tenantRepo.queryForObjectAuth(selectSql, produitRowMapperSimple(), clientId, authClientId, id);

        if (existingProduit == null) {
            throw new RuntimeException("Erreur lors de la rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cupÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ration du produit");
        }

        Integer previousQuantity = existingProduit.getQuantiteStock();

        // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ PrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©parer les valeurs mises ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour (utiliser les nouvelles valeurs ou conserver les anciennes)
        String finalLibelle = (produitDetails.getLibelle() != null) ? produitDetails.getLibelle() : existingProduit.getLibelle();
        Double finalPrixVente = (produitDetails.getPrixVente() != null) ? produitDetails.getPrixVente() : existingProduit.getPrixVente();
        BigDecimal finalPrixAchat = (prixAchat != null) ? prixAchat : existingProduit.getPrixAchat();
        Integer finalQuantiteStock = (produitDetails.getQuantiteStock() != null) ? produitDetails.getQuantiteStock() : existingProduit.getQuantiteStock();
        Integer finalSeuilMinimum = (produitDetails.getSeuilMinimum() != null) ? produitDetails.getSeuilMinimum() : existingProduit.getSeuilMinimum();
        String finalUniteMesure = (produitDetails.getUniteMesure() != null) ? produitDetails.getUniteMesure().name() : existingProduit.getUniteMesure().name();
        Double finalRemiseTemporaire = (produitDetails.getRemiseTemporaire() != null) ? produitDetails.getRemiseTemporaire() : existingProduit.getRemiseTemporaire();
        Boolean finalActive = (produitDetails.getActive() != null) ? produitDetails.getActive() : existingProduit.getActive();
        String finalImageUrl = (produitDetails.getImageUrl() != null) ? produitDetails.getImageUrl() : existingProduit.getImageUrl();

        // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Calculer le statut du stock
        Produit.StockStatus finalStatus = calculerStatutStock(finalQuantiteStock, finalSeuilMinimum);

        // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Mettre ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour le produit
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

        log.info("ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ UPDATE exÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cutÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©, affectedRows={}", updated);

        if (updated == 0) {
            throw new RuntimeException("Erreur lors de la mise ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour du produit");
        }

        // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Notification si besoin
        stockNotificationService.notifyIfStockNeedsReorder(existingProduit, previousQuantity, finalQuantiteStock, token);

        // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Retourner le produit mis ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour
        return getProduitById(id, token).orElseThrow(() -> new RuntimeException("Produit non trouvÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© aprÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨s mise ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour"));
    }

    // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ MÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©thode utilitaire pour calculer le statut du stock
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

    // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ RowMapper simple pour la rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cupÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ration interne
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
            updateStockStatus(produit);

            return produit;
        };
    }

    public void desactiverProduit(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "UPDATE produit SET is_active = false WHERE id_produit = ?";
        // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Utiliser updateWithAuth
        tenantRepo.updateWithAuth(sql, clientId, authClientId, id);
    }

    public Produit reactiverProduit(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "UPDATE produit SET is_active = true WHERE id_produit = ?";
        // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Utiliser updateWithAuth
        tenantRepo.updateWithAuth(sql, clientId, authClientId, id);

        String selectSql = "SELECT * FROM produit WHERE id_produit = ?";
        // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Utiliser queryForObjectAuth
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
        // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Utiliser queryForObjectAuth avec RowMapper
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
