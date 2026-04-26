package org.erp.invera.controller.platform;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.platform.abonnementdto.SubscriptionActionRequest;

import org.erp.invera.service.platform.SubscriptionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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

    @PatchMapping("/{id}/suspend")
    public ResponseEntity<?> suspendSubscription(
            @PathVariable Long id,
            @RequestBody(required = false) SubscriptionActionRequest request) {
        try {
            String motif = (request != null && request.getMotif() != null)
                    ? request.getMotif() : "Non spécifié";
            return ResponseEntity.ok(subscriptionService.suspendSubscription(id, motif));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/reactivate")
    public ResponseEntity<?> reactivateSubscription(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(subscriptionService.reactivateSubscription(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<?> cancelSubscription(
            @PathVariable Long id,
            @RequestBody(required = false) SubscriptionActionRequest request) {
        try {
            String motif = (request != null && request.getMotif() != null)
                    ? request.getMotif() : "Annulé par super administrateur";
            return ResponseEntity.ok(subscriptionService.cancelSubscription(id, motif));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}