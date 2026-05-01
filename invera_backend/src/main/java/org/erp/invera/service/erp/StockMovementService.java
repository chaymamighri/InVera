package org.erp.invera.service.erp;

import lombok.RequiredArgsConstructor;
import org.erp.invera.model.erp.Produit;
import org.erp.invera.model.erp.stock.StockMovement;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.erp.invera.security.JwtTokenProvider;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service de gestion des mouvements de stock (MULTI-TENANT).
 */
@Service
@RequiredArgsConstructor
public class StockMovementService {

    private final TenantAwareRepository tenantRepo;
    private final JwtTokenProvider jwtTokenProvider;

    // ==================== ROW MAPPER ====================

    private RowMapper<StockMovement> stockMovementRowMapper() {
        return (rs, rowNum) -> {
            StockMovement movement = new StockMovement();
            movement.setId(rs.getLong("id"));

            // ✅ Créer et remplir l'objet Produit
            Produit produit = new Produit();
            produit.setIdProduit(rs.getInt("produit_id"));
            produit.setLibelle(rs.getString("produit_libelle"));
            movement.setProduit(produit);

            movement.setTypeMouvement(StockMovement.MovementType.valueOf(rs.getString("type_mouvement")));
            movement.setQuantite(rs.getInt("quantite"));
            movement.setStockAvant(rs.getInt("stock_avant"));
            movement.setStockApres(rs.getInt("stock_apres"));
            movement.setPrixUnitaire(rs.getBigDecimal("prix_unitaire"));
            movement.setValeurTotale(rs.getBigDecimal("valeur_totale"));
            movement.setTypeDocument(rs.getString("type_document"));
            movement.setCommentaire(rs.getString("commentaire"));
            movement.setDateMouvement(rs.getTimestamp("date_mouvement").toLocalDateTime());
            movement.setCreatedBy(rs.getString("created_by"));

            if (rs.getTimestamp("created_at") != null) {
                movement.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
            }
            return movement;
        };
    }

    private Long getClientIdFromToken(String token) {
        return jwtTokenProvider.getClientIdFromToken(token);
    }

    // ==================== MÉTHODES ====================

    /**
     * Récupère les mouvements avec filtres optionnels (période et type)
     */
    public List<StockMovement> getMovementsWithFilters(LocalDateTime debut, LocalDateTime fin, String type, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        StringBuilder sql = new StringBuilder("SELECT * FROM stock_movement WHERE 1=1");

        if (debut != null) {
            sql.append(" AND date_mouvement >= ?");
        }
        if (fin != null) {
            sql.append(" AND date_mouvement <= ?");
        }
        if (type != null && !type.isEmpty()) {
            sql.append(" AND type_mouvement = ?");
        }
        sql.append(" ORDER BY date_mouvement DESC");

        List<Object> params = new java.util.ArrayList<>();
        if (debut != null) params.add(Timestamp.valueOf(debut));
        if (fin != null) params.add(Timestamp.valueOf(fin));
        if (type != null && !type.isEmpty()) params.add(type);

        return tenantRepo.query(sql.toString(), stockMovementRowMapper(), clientId, authClientId, params.toArray());
    }

    /**
     * Récupère tous les mouvements
     */
    public List<StockMovement> getAllMovements(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT * FROM stock_movement ORDER BY date_mouvement DESC";
        return tenantRepo.query(sql, stockMovementRowMapper(), clientId, authClientId);
    }

    /**
     * Récupère les mouvements par période
     */
    public List<StockMovement> getMovementsByPeriode(LocalDateTime debut, LocalDateTime fin, String token) {
        return getMovementsWithFilters(debut, fin, null, token);
    }

    /**
     * Récupère l'historique d'un produit
     */
    public List<StockMovement> getHistoriqueProduit(Integer produitId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT * FROM stock_movement WHERE produit_id = ? ORDER BY date_mouvement DESC";
        return tenantRepo.query(sql, stockMovementRowMapper(), clientId, authClientId, produitId);
    }

    /**
     * Calcule le stock théorique actuel d'un produit
     */
    public Integer calculerStockTheorique(Integer produitId, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String entreesSql = "SELECT COALESCE(SUM(quantite), 0) FROM stock_movement WHERE produit_id = ? AND type_mouvement = 'ENTREE'";
        Integer entrees = tenantRepo.queryForObject(entreesSql, Integer.class, clientId, authClientId, produitId);

        String sortiesSql = "SELECT COALESCE(SUM(quantite), 0) FROM stock_movement WHERE produit_id = ? AND type_mouvement = 'SORTIE'";
        Integer sorties = tenantRepo.queryForObject(sortiesSql, Integer.class, clientId, authClientId, produitId);

        return (entrees != null ? entrees : 0) - (sorties != null ? sorties : 0);
    }
}