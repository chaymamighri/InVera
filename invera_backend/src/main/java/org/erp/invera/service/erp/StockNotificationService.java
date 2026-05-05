package org.erp.invera.service.erp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.erp.Produit;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.erp.invera.security.JwtTokenProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Service de surveillance des stocks - MULTI-TENANT.
 *
 * Ce fichier surveille les variations de stock des produits.
 * Quand un produit passe sous un certain seuil (stock faible, critique ou rupture),
 * il crée automatiquement une notification pour alerter le responsable des achats.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StockNotificationService {

    private static final String PROCUREMENT_ROLE = "RESPONSABLE_ACHAT";

    private final TenantAwareRepository tenantRepo;
    private final JwtTokenProvider jwtTokenProvider;

    // ==================== METHODES MULTI-TENANT ====================

    private Long getClientIdFromToken(String token) {
        return jwtTokenProvider.getClientIdFromToken(token);
    }

    private JdbcTemplate getTenantJdbcTemplate(String token) {
        Long clientId = getClientIdFromToken(token);
        return tenantRepo.getClientJdbcTemplate(clientId, String.valueOf(clientId));
    }

    /**
     * Vérifie si une baisse de stock nécessite une notification
     *
     * @param produit le produit concerné
     * @param previousQuantity quantité avant modification
     * @param newQuantity quantité après modification
     * @param token token JWT du client
     */
    public void notifyIfStockNeedsReorder(Produit produit, Integer previousQuantity, Integer newQuantity, String token) {
        // Ignorer si les données sont incomplètes
        if (produit == null || previousQuantity == null || newQuantity == null) {
            return;
        }

        // Ignorer si le stock augmente ou reste identique
        if (newQuantity >= previousQuantity) {
            return;
        }

        // Calculer les statuts de stock avant et après
        Produit.StockStatus previousStatus = calculateStatus(previousQuantity, produit.getSeuilMinimum());
        Produit.StockStatus newStatus = calculateStatus(newQuantity, produit.getSeuilMinimum());

        // Ne notifier que si la situation empire et atteint au moins "FAIBLE"
        if (!shouldNotify(previousStatus, newStatus)) {
            return;
        }

        // Déterminer le libellé du statut
        String statusLabel = switch (newStatus) {
            case CRITIQUE -> "critique";
            case RUPTURE -> "en rupture";
            case FAIBLE -> "faible";
            default -> "en baisse";
        };

        // Unité de mesure
        String unit = produit.getUniteMesure() != null
                ? produit.getUniteMesure().name().toLowerCase()
                : "unite(s)";

        // Construire le message d'alerte
        String message = String.format(
                "Stock %s pour le produit %s : %d -> %d %s (seuil minimum: %d). Pensez a lancer une commande fournisseur.",
                statusLabel,
                produit.getLibelle(),
                previousQuantity,
                newQuantity,
                unit,
                safeThreshold(produit.getSeuilMinimum())
        );

        // Sauvegarder la notification dans la base tenant
        saveNotification(message, produit.getLibelle(), token);
    }

    /**
     * Sauvegarde une notification dans la base tenant
     */
    private void saveNotification(String message, String produitLibelle, String token) {
        try {
            JdbcTemplate jdbc = getTenantJdbcTemplate(token);
            Long clientId = getClientIdFromToken(token);

            String sql = """
                INSERT INTO notifications (tenant_id, created_at, message, read, type, user_name, target_role)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """;

            jdbc.update(sql,
                    String.valueOf(clientId),
                    LocalDateTime.now(),
                    message,
                    false,
                    "STOCK_ALERT",
                    produitLibelle,
                    PROCUREMENT_ROLE
            );

            log.info("✅ Notification stock créée: {}", message);

        } catch (Exception e) {
            log.error("❌ Erreur création notification stock: {}", e.getMessage());
        }
    }

    /**
     * Détermine s'il faut notifier selon l'évolution du statut
     */
    private boolean shouldNotify(Produit.StockStatus previousStatus, Produit.StockStatus newStatus) {
        return severity(newStatus) > severity(previousStatus)
                && severity(newStatus) >= severity(Produit.StockStatus.FAIBLE);
    }

    /**
     * Niveau de gravité (plus le chiffre est grand, plus c'est urgent)
     */
    private int severity(Produit.StockStatus status) {
        return switch (status) {
            case EN_STOCK -> 0;
            case FAIBLE -> 1;
            case CRITIQUE -> 2;
            case RUPTURE -> 3;
        };
    }

    /**
     * Calcule le statut du stock selon la quantité et le seuil
     */
    private Produit.StockStatus calculateStatus(Integer quantity, Integer threshold) {
        if (quantity == null || threshold == null || threshold == 0) {
            return quantity == null || quantity <= 0 ? Produit.StockStatus.RUPTURE : Produit.StockStatus.EN_STOCK;
        }

        if (quantity <= 0) {
            return Produit.StockStatus.RUPTURE;
        }

        if (quantity <= threshold * 0.25) {
            return Produit.StockStatus.CRITIQUE;
        }

        if (quantity <= threshold) {
            return Produit.StockStatus.FAIBLE;
        }

        return Produit.StockStatus.EN_STOCK;
    }

    private int safeThreshold(Integer threshold) {
        return threshold == null ? 0 : threshold;
    }
}