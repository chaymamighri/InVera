package org.erp.invera.controller.platform;

import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.platform.PaiementResponseDTO;
import org.erp.invera.model.platform.Paiement;
import org.erp.invera.service.platform.PaiementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;


@Slf4j
@RestController
public class PaiementController {

    private final PaiementService paiementService;

    public PaiementController(PaiementService paiementService) {
        this.paiementService = paiementService;
    }

    // Initier paiement après choix abonnement
    @PostMapping("/api/abonnement/{id}/paiement/initier")
    public Map<String, String> initierPaiement(@PathVariable Long id) {
        paiementService.initierPaiementParEmail(id);
        return Map.of("message", "Email de paiement envoyé avec succès");
    }

    // Obtenir détails paiement via token
    @GetMapping("/paiement/checkout")
    public ResponseEntity<?> getPaiement(@RequestParam String token) {
        try {
            Paiement paiement = paiementService.getPaiementParToken(token);
            return ResponseEntity.ok(paiement);
        } catch (RuntimeException e) {
            // ✅ Retourner une erreur JSON propre
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Créer checkout Konnect
    @PostMapping("/api/paiement/{id}/konnect")
    public Map<String, String> checkoutKonnect(@PathVariable Long id) {
        String url = paiementService.creerCheckoutKonnect(id);
        return Map.of("checkout_url", url);
    }

    // Webhook Konnect
    @GetMapping("/webhook/konnect")
    public Map<String, String> webhook(@RequestParam("payment_ref") String paymentRef) {
        log.info("📨 Webhook Konnect reçu - payment_ref: {}", paymentRef);
        paiementService.traiterWebhookKonnect(paymentRef);
        return Map.of("status", "OK");
    }
}