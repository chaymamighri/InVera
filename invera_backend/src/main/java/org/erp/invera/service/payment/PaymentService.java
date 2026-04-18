package org.erp.invera.service.payment;

import org.erp.invera.model.platform.Paiement;

import java.util.Map;

//  Transaction paiement
public interface PaymentService {

    /**
     * Initialise un paiement
     * @return URL de redirection ou clientSecret
     */
    PaymentIntent initiatePayment(Paiement paiement);

    /**
     * Vérifie le statut d'un paiement
     */
    PaymentStatus checkStatus(String transactionId);

    /**
     * Gère le webhook/callback
     */
    void handleWebhook(Map<String, Object> payload);

    /**
     * Rembourse un paiement
     */
    boolean refund(String transactionId, Double montant);

    record PaymentIntent(String id, String clientSecret, String redirectUrl, String qrCode) {}
    record PaymentStatus(String status, Boolean paid, String message) {}
}
