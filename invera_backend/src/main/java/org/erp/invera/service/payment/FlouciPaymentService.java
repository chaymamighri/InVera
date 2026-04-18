/*package org.erp.invera.service.payment;

import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Paiement;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
public class FlouciPaymentService implements PaymentService {

    @Value("${flouci.api.key}")
    private String apiKey;

    @Value("${flouci.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public PaymentIntent initiatePayment(Paiement paiement) {
        try {
            // 1. Créer la requête Flouci
            Map<String, Object> request = Map.of(
                    "amount", paiement.getMontant(),
                    "currency", "TND",
                    "client_id", paiement.getClient().getId().toString(),
                    "client_email", paiement.getClient().getEmail(),
                    "client_phone", paiement.getClient().getTelephone(),
                    "description", "Abonnement Invera",
                    "webhook_url", "https://votre-api.com/api/payments/flouci-webhook"
            );

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            // 2. Appeler API Flouci
            ResponseEntity<Map> response = restTemplate.exchange(
                    apiUrl + "/payments",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            // 3. Retourner les infos
            Map<String, Object> body = response.getBody();
            return new PaymentIntent(
                    (String) body.get("id"),
                    (String) body.get("client_secret"),
                    (String) body.get("redirect_url"),
                    (String) body.get("qr_code")
            );

        } catch (Exception e) {
            log.error("Erreur paiement Flouci: {}", e.getMessage());
            throw new RuntimeException("Erreur d'initialisation du paiement");
        }
    }


    @Override
    public PaymentStatus checkStatus(String transactionId) {
        // Vérifier statut via API Flouci
        // ...
        return new PaymentStatus("SUCCES", true, "Paiement confirmé");
    }

    @Override
    public void handleWebhook(Map<String, Object> payload) {
        String status = (String) payload.get("status");
        String transactionId = (String) payload.get("transaction_id");

        if ("SUCCESS".equals(status)) {
            // Mettre à jour le paiement
            // Activer l'abonnement
            // Créer la base si nécessaire
        }
    }

    @Override
    public boolean refund(String transactionId, Double montant) {
        // Implémenter remboursement Flouci
        return true;
    }
}*/
