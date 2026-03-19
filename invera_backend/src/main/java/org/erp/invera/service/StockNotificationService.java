package org.erp.invera.service;

import org.erp.invera.model.Notification;
import org.erp.invera.model.Produit;
import org.erp.invera.repository.NotificationRepository;
import org.springframework.stereotype.Service;

@Service
public class StockNotificationService {

    private static final String PROCUREMENT_ROLE = "RESPONSABLE_ACHAT";

    private final NotificationRepository notificationRepository;

    public StockNotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public void notifyIfStockNeedsReorder(Produit produit, Integer previousQuantity, Integer newQuantity) {
        if (produit == null || previousQuantity == null || newQuantity == null) {
            return;
        }

        if (newQuantity >= previousQuantity) {
            return;
        }

        Produit.StockStatus previousStatus = calculateStatus(previousQuantity, produit.getSeuilMinimum());
        Produit.StockStatus newStatus = calculateStatus(newQuantity, produit.getSeuilMinimum());

        if (!shouldNotify(previousStatus, newStatus)) {
            return;
        }

        String statusLabel = switch (newStatus) {
            case CRITIQUE -> "critique";
            case RUPTURE -> "en rupture";
            case FAIBLE -> "faible";
            default -> "en baisse";
        };

        String unit = produit.getUniteMesure() != null
                ? produit.getUniteMesure().name().toLowerCase()
                : "unite(s)";

        String message = String.format(
                "Stock %s pour le produit %s : %d -> %d %s (seuil minimum: %d). Pensez a lancer une commande fournisseur.",
                statusLabel,
                produit.getLibelle(),
                previousQuantity,
                newQuantity,
                unit,
                safeThreshold(produit.getSeuilMinimum())
        );

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

    private boolean shouldNotify(Produit.StockStatus previousStatus, Produit.StockStatus newStatus) {
        return severity(newStatus) > severity(previousStatus)
                && severity(newStatus) >= severity(Produit.StockStatus.FAIBLE);
    }

    private int severity(Produit.StockStatus status) {
        return switch (status) {
            case EN_STOCK -> 0;
            case FAIBLE -> 1;
            case CRITIQUE -> 2;
            case RUPTURE -> 3;
        };
    }

    private Produit.StockStatus calculateStatus(Integer quantity, Integer threshold) {
        if (quantity == null || threshold == null) {
            return Produit.StockStatus.RUPTURE;
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
