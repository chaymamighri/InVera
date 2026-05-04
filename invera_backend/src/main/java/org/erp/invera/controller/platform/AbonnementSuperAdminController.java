package org.erp.invera.controller.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.platform.abonnementdto.AbonnementResponse;
import org.erp.invera.model.platform.Abonnement;
import org.erp.invera.model.platform.Client;
import org.erp.invera.service.platform.SubscriptionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/super-admin/abonnements")
@RequiredArgsConstructor
public class AbonnementSuperAdminController {

    private final SubscriptionService subscriptionService;

    @GetMapping
    public ResponseEntity<?> getAllSubscriptions(@RequestParam(required = false) String statut) {
        try {
            return ResponseEntity.ok(subscriptionService.getAllSubscriptions(statut));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSubscriptionById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(subscriptionService.getSubscriptionById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<?> getSubscriptionsByClient(@PathVariable Long clientId) {
        try {
            return ResponseEntity.ok(subscriptionService.getSubscriptionsByClient(clientId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/client/{clientId}/offre/{offreId}")
    public ResponseEntity<?> createSubscriptionForClient(
            @PathVariable Long clientId,
            @PathVariable Long offreId) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(subscriptionService.createSubscriptionFromOffer(clientId, offreId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Suspendre un abonnement
     */
    @PatchMapping("/{id}/suspend")
    public ResponseEntity<?> suspendSubscription(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(subscriptionService.suspendSubscription(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Réactiver un abonnement suspendu
     */
    @PatchMapping("/{id}/reactivate")
    public ResponseEntity<?> reactivateSubscription(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(subscriptionService.reactivateSubscription(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Annuler un abonnement
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<?> cancelSubscription(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(subscriptionService.cancelSubscription(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Active un abonnement après paiement réussi
     * Passe de EN_ATTENTE_VALIDATION à ACTIF
     *
     * @param id ID de l'abonnement à activer
     * @return Réponse avec l'abonnement activé
     */
    @PatchMapping("/{id}/activate-after-payment")
    public ResponseEntity<?> activateAfterPayment(@PathVariable Long id) {
        try {
            log.info("🔍 Activation abonnement après paiement - ID: {}", id);

            // Appel au service pour activer l'abonnement
            AbonnementResponse response = subscriptionService.activateAfterPayment(id);

            log.info("✅ Abonnement {} activé avec succès", id);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Abonnement activé avec succès",
                    "data", response
            ));

        } catch (RuntimeException e) {
            log.error("❌ Erreur activation abonnement {}: {}", id, e.getMessage());

            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
}