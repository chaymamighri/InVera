package org.erp.invera.controller;

import jakarta.transaction.Transactional;
import org.erp.invera.dto.FactureDTO;
import org.erp.invera.model.client.FactureClient;
import org.erp.invera.service.FactureClientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Contrôleur des factures clients.
 *
 * Endpoints :
 * - GET    /all                     → Toutes les factures (rôle COMMERCIAL)
 * - GET    /{factureId}             → Détail d'une facture
 * - GET    /client/{clientId}       → Factures d'un client spécifique
 * - GET    /commande/{commandeId}   → Facture associée à une commande
 * - POST   /generer/{commandeId}    → Générer une facture depuis une commande confirmée
 * - PUT    /{factureId}/payer       → Marquer une facture comme payée
 */
@RestController
@RequestMapping("/api/factures")
@Transactional
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class FactureClientController {

    @Autowired
    private FactureClientService factureService;

    /**
     * ✅ Récupérer toutes les factures
     */
    @PreAuthorize("hasRole('COMMERCIAL')")
    @GetMapping("/all")
    @Transactional
    public ResponseEntity<List<FactureDTO>> getAllFactures() {

        List<FactureClient> factures = factureService.getAllFactures();

        List<FactureDTO> factureDTOs = factures.stream()
                .map(FactureDTO::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(factureDTOs);
    }


    /**
     *  Récupérer une facture par son ID
     */
    @GetMapping("/{factureId}")
    public ResponseEntity<?> getFactureById(@PathVariable Integer factureId) {
        try {
            FactureClient facture = factureService.getFactureById(factureId);

            FactureDTO factureDTO = FactureDTO.fromEntity(facture);
            return ResponseEntity.ok(factureDTO);

        } catch (Exception e) {
            System.err.println("Erreur récupération facture " + factureId + ": " + e.getMessage());

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * ✅ Récupérer les factures d'un client
     */
    @GetMapping("/client/{clientId}")
    public ResponseEntity<?> getFacturesByClient(@PathVariable Integer clientId) {
        try {
            List<FactureClient> factures = factureService.getFacturesByClient(clientId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", factures);
            response.put("count", factures.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ Erreur récupération factures client " + clientId + ": " + e.getMessage());

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     *  Récupérer une facture par référence de commande
     */
    @GetMapping("/commande/{commandeId}")
    public ResponseEntity<?> getFactureByCommandeId(@PathVariable Integer commandeId) {

        try {
            FactureClient facture = factureService.getFactureByCommandeId(commandeId);

            if (facture != null) {
                //  Utilisez FactureDTO
                FactureDTO factureDTO = FactureDTO.fromEntity(facture);
                return ResponseEntity.ok(factureDTO);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Aucune facture trouvée pour cette commande");
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Erreur récupération facture pour commande " + commandeId + ": " + e.getMessage());

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    /**
     *  Générer une facture à partir d'une commande
     */
    @PostMapping("/generer/{commandeId}")
    public ResponseEntity<?> genererFacture(@PathVariable Integer commandeId) {
        try {
            System.out.println(" Génération facture pour commande: " + commandeId);

            FactureClient facture = factureService.genererFactureDepuisCommande(commandeId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Facture générée avec succès");
            response.put("data", Map.of(
                    "idFactureClient", facture.getIdFactureClient(),
                    "referenceFactureClient", facture.getReferenceFactureClient(),
                    "montantTotal", facture.getMontantTotal(),
                    "statut", facture.getStatut()
            ));

            return ResponseEntity.ok()
                    .header("Access-Control-Allow-Origin", "http://localhost:5173")
                    .header("Access-Control-Allow-Credentials", "true")
                    .body(response);

        } catch (Exception e) {
            System.err.println(" Erreur: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     *  Marquer une facture comme payée
     */
    @PutMapping("/{factureId}/payer")
    @Transactional
    public ResponseEntity<?> marquerFacturePayee(@PathVariable Integer factureId) {
        try {
            FactureClient facture = factureService.marquerFacturePayee(factureId);

            // Utilisez FactureDTO pour la sérialisation
            FactureDTO factureDTO = FactureDTO.fromEntity(facture);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Facture marquée comme payée");
            response.put("data", factureDTO);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println(" Erreur paiement facture " + factureId + ": " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}