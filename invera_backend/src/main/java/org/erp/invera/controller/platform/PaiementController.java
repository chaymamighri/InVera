package org.erp.invera.controller.platform;

import jakarta.annotation.security.PermitAll;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.platform.PaiementResponseDTO;
import org.erp.invera.model.platform.Paiement;
import org.erp.invera.service.platform.PaiementService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Controller  // Changé de @RestController à @Controller pour les redirections
public class PaiementController {

    private final PaiementService paiementService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public PaiementController(PaiementService paiementService) {
        this.paiementService = paiementService;
    }

    /**
     * Initier paiement après choix abonnement (envoi email)
     */
    @PostMapping("/api/abonnement/{id}/paiement/initier")
    @ResponseBody
    public Map<String, String> initierPaiement(@PathVariable Long id) {
        paiementService.initierPaiementParEmail(id);
        return Map.of("message", "Email de paiement envoyé avec succès");
    }

    /**
     * Get payment details via token (API)
     */
    @GetMapping("/api/paiement/checkout")
    @ResponseBody
    public ResponseEntity<?> getPaiement(@RequestParam String token) {
        try {
            Paiement paiement = paiementService.getPaiementParToken(token);
            return ResponseEntity.ok(paiement);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * REDIRECTION DIRECTE VERS KONNECT
     * Endpoint appelé par le lien dans l'email
     * Vérifie le token et redirige directement vers Konnect
     */
    @GetMapping("/paiement/checkout")
    public RedirectView redirectToKonnect(@RequestParam String token) {
        try {
            log.info("🔍 Redirection vers Konnect - Token: {}", token);

            // 1. Vérifier le token et récupérer le paiement
            Paiement paiement = paiementService.getPaiementParToken(token);

            // 2. Créer le checkout Konnect et obtenir l'URL
            String konnectCheckoutUrl = paiementService.creerCheckoutKonnect(paiement.getId());

            log.info("✅ Redirection directe vers Konnect: {}", konnectCheckoutUrl);

            // 3. Rediriger DIRECTEMENT vers Konnect
            return new RedirectView(konnectCheckoutUrl);

        } catch (Exception e) {
            log.error("❌ Erreur lors du checkout: {}", e.getMessage());

            // Rediriger vers le frontend avec l'erreur
            String errorUrl = frontendUrl + "/paiement/erreur?message=" + e.getMessage();
            return new RedirectView(errorUrl);
        }
    }

    /**
     * Créer checkout Konnect (API)
     */
    @PostMapping("/api/paiement/{id}/konnect")
    @ResponseBody
    public Map<String, String> checkoutKonnect(@PathVariable Long id) {
        String url = paiementService.creerCheckoutKonnect(id);
        return Map.of("checkout_url", url);
    }

    /**
     * Webhook Konnect (confirmé par Konnect après paiement)
     */
    @GetMapping("/webhook/konnect")
    @ResponseBody
    @PermitAll
    public Map<String, String> webhook(@RequestParam("payment_ref") String paymentRef) {
        log.info("📨 Webhook Konnect reçu - payment_ref: {}", paymentRef);
        paiementService.traiterWebhookKonnect(paymentRef);
        return Map.of("status", "OK");
    }

    /**
     * Page de succès après paiement (redirection depuis Konnect)
     */
    @GetMapping("/paiement/success")
    public RedirectView paymentSuccess(@RequestParam(required = false) String payment_ref) {
        log.info("✅ Paiement réussi - payment_ref: {}", payment_ref);

        // Rediriger vers le frontend page succès
        return new RedirectView(frontendUrl + "/paiement/success");
    }

    /**
     * Page d'annulation après paiement (redirection depuis Konnect)
     */
    @GetMapping("/paiement/cancel")
    public RedirectView paymentCancel(@RequestParam(required = false) String payment_ref) {
        log.info("❌ Paiement annulé - payment_ref: {}", payment_ref);

        // Rediriger vers le frontend page annulation
        return new RedirectView(frontendUrl + "/paiement/cancel");
    }


    /**
     * Récupérer tous les paiements (pour Super Admin)
     * Retourne une liste de PaiementResponseDTO avec toutes les relations chargées
     */
    @GetMapping("/api/super-admin/paiements")
    @ResponseBody
    public ResponseEntity<?> getAllPaiements() {
        try {
            log.info("📋 Récupération de tous les paiements pour Super Admin");

            // Récupérer les paiements avec les relations chargées
            List<Paiement> paiements = paiementService.getAllPaiements();

            // Convertir en DTO
            List<PaiementResponseDTO> dtos = paiements.stream()
                    .map(PaiementResponseDTO::fromEntity)
                    .collect(Collectors.toList());

            log.info("✅ {} paiements récupérés avec succès", dtos.size());

            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("❌ Erreur lors de la récupération des paiements: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Erreur lors de la récupération des paiements: " + e.getMessage()));
        }
    }

    /**
     * Récupérer un paiement par son ID (pour Super Admin)
     * Retourne un PaiementResponseDTO avec toutes les relations chargées
     */
    @GetMapping("/api/super-admin/paiements/{id}")
    @ResponseBody
    public ResponseEntity<?> getPaiementById(@PathVariable Long id) {
        try {
            log.info("📋 Récupération du paiement ID: {}", id);

            // Récupérer le paiement avec les relations chargées
            Paiement paiement = paiementService.getPaiementById(id);

            // Convertir en DTO
            PaiementResponseDTO dto = PaiementResponseDTO.fromEntity(paiement);

            log.info("✅ Paiement ID: {} récupéré avec succès", id);

            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            log.error("❌ Paiement non trouvé - ID: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("❌ Erreur lors de la récupération du paiement ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Erreur lors de la récupération du paiement: " + e.getMessage()));
        }
}
}