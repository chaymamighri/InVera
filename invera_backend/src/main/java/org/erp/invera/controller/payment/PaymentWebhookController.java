/*package org.erp.invera.controller.payment;


//  === Callbacks paiement ===
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Abonnement;
import org.erp.invera.service.payment.FlouciPaymentService;
import org.erp.invera.service.payment.SubscriptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments/webhook")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private final FlouciPaymentService flouciService;
    private final SubscriptionService subscriptionService;

    @PostMapping("/flouci")
    public ResponseEntity<?> handleFlouciWebhook(@RequestBody Map<String, Object> payload) {
        log.info("Webhook Flouci reçu: {}", payload);

        String status = (String) payload.get("status");
        String transactionId = (String) payload.get("transaction_id");
        Long clientId = Long.valueOf((String) payload.get("client_id"));

        if ("SUCCESS".equals(status)) {
            // Créer l'abonnement
            subscriptionService.createSubscription(clientId,
                    Abonnement.PlanType.PRO,
                    Abonnement.PeriodType.MENSUEL);
        }

        return ResponseEntity.ok(Map.of("received", true));
    }
}*/