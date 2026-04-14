package org.erp.invera.service.erp;

import org.erp.invera.model.erp.Notification;
import org.erp.invera.model.erp.Produit;
import org.erp.invera.repository.erp.NotificationRepository;
import org.springframework.stereotype.Service;

/**
 * Service de surveillance des stocks.
 *
 * Ce fichier surveille les variations de stock des produits.
 * Quand un produit passe sous un certain seuil (stock faible, critique ou rupture),
 * il crée automatiquement une notification pour alerter le responsable des achats.
 *
 * Exemple : un produit passe de 50 à 10 unités (seuil = 20)
 * -> Notification envoyée au rôle "RESPONSABLE_ACHAT"
 */
@Service
public class StockNotificationService {

    private static final String PROCUREMENT_ROLE = "RESPONSABLE_ACHAT";

    private final NotificationRepository notificationRepository;

    public StockNotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /**
     * Vérifie si une baisse de stock nécessite une notification
     *
     * @param produit le produit concerné
     * @param previousQuantity quantité avant modification
     * @param newQuantity quantité après modification
     */
    public void notifyIfStockNeedsReorder(Produit produit, Integer previousQuantity, Integer newQuantity) {
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

        // Sauvegarder la notification en base de données
        notificationRepository.save(
                new Notification(
                        "STOCK_ALERT",
                        message,
                        null,
                        produit.getLibelle(),
                        PROCUREMENT_ROLE
                )
        );
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
            case EN_STOCK -> 0;      // OK
            case FAIBLE -> 1;        // Attention
            case CRITIQUE -> 2;      // Urgent
            case RUPTURE -> 3;       // Plus de stock
        };
    }

    /**
     * Calcule le statut du stock selon la quantité et le seuil
     */
    private Produit.StockStatus calculateStatus(Integer quantity, Integer threshold) {
        if (quantity == null || threshold == null) {
            return Produit.StockStatus.RUPTURE;
        }

        if (quantity <= 0) {
            return Produit.StockStatus.RUPTURE;      // Rupture
        }

        if (quantity <= threshold * 0.25) {
            return Produit.StockStatus.CRITIQUE;     // Critique (< 25% du seuil)
        }

        if (quantity <= threshold) {
            return Produit.StockStatus.FAIBLE;       // Faible (< seuil)
        }

        return Produit.StockStatus.EN_STOCK;         // Suffisant
    }

    private int safeThreshold(Integer threshold) {
        return threshold == null ? 0 : threshold;
    }
}