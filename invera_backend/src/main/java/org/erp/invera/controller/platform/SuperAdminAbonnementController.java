package org.erp.invera.controller.platform;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.platform.abonnementdto.OffreAbonnementRequest;
import org.erp.invera.dto.platform.abonnementdto.SubscriptionActionRequest;
import org.erp.invera.service.payment.SubscriptionService;
import org.erp.invera.service.platform.OffreAbonnementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/super-admin/abonnements")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SuperAdminAbonnementController {

    private final OffreAbonnementService offreAbonnementService;
    private final SubscriptionService subscriptionService;

    @GetMapping("/offres")
    public ResponseEntity<?> getOffers(@RequestParam(defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(offreAbonnementService.getAllOffers(activeOnly));
    }

    @GetMapping("/offres/{id}")
    public ResponseEntity<?> getOffer(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(offreAbonnementService.getOfferById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/offres")
    public ResponseEntity<?> createOffer(@RequestBody OffreAbonnementRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(offreAbonnementService.createOffer(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/offres/{id}")
    public ResponseEntity<?> updateOffer(@PathVariable Long id, @RequestBody OffreAbonnementRequest request) {
        try {
            return ResponseEntity.ok(offreAbonnementService.updateOffer(id, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/offres/{id}/activate")
    public ResponseEntity<?> activateOffer(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(offreAbonnementService.activateOffer(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/offres/{id}/deactivate")
    public ResponseEntity<?> deactivateOffer(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(offreAbonnementService.deactivateOffer(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/offres/{id}")
    public ResponseEntity<?> deleteOffer(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(offreAbonnementService.softDeleteOffer(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getSubscriptions(@RequestParam(required = false) String statut) {
        try {
            return ResponseEntity.ok(subscriptionService.getAllSubscriptions(statut));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{abonnementId}")
    public ResponseEntity<?> getSubscription(@PathVariable Long abonnementId) {
        try {
            return ResponseEntity.ok(subscriptionService.getSubscriptionById(abonnementId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/clients/{clientId}")
    public ResponseEntity<?> getClientSubscriptions(@PathVariable Long clientId) {
        try {
            return ResponseEntity.ok(subscriptionService.getSubscriptionsByClient(clientId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/clients/{clientId}/offres/{offreId}")
    public ResponseEntity<?> assignOfferToClient(@PathVariable Long clientId, @PathVariable Long offreId) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(subscriptionService.createSubscriptionFromOffer(clientId, offreId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{abonnementId}/suspend")
    public ResponseEntity<?> suspendSubscription(@PathVariable Long abonnementId,
                                                 @RequestBody(required = false) SubscriptionActionRequest request) {
        try {
            String motif = request != null ? request.getMotif() : null;
            return ResponseEntity.ok(subscriptionService.suspendSubscription(abonnementId, motif));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{abonnementId}/reactivate")
    public ResponseEntity<?> reactivateSubscription(@PathVariable Long abonnementId) {
        try {
            return ResponseEntity.ok(subscriptionService.reactivateSubscription(abonnementId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{abonnementId}/cancel")
    public ResponseEntity<?> cancelSubscription(@PathVariable Long abonnementId) {
        try {
            return ResponseEntity.ok(subscriptionService.cancelSubscription(abonnementId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{abonnementId}/renew")
    public ResponseEntity<?> renewSubscription(@PathVariable Long abonnementId) {
        try {
            return ResponseEntity.ok(subscriptionService.renewSubscription(abonnementId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{abonnementId}/auto-renewal")
    public ResponseEntity<?> updateAutoRenewal(@PathVariable Long abonnementId,
                                               @RequestBody SubscriptionActionRequest request) {
        try {
            boolean autoRenewal = request != null && Boolean.TRUE.equals(request.getAutoRenouvellement());
            return ResponseEntity.ok(subscriptionService.updateAutoRenewal(abonnementId, autoRenewal));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
