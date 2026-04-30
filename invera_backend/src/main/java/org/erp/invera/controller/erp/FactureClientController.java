package org.erp.invera.controller.erp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.erp.FactureDTO;
import org.erp.invera.model.erp.client.FactureClient;
import org.erp.invera.service.erp.FactureClientService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/factures")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class FactureClientController {

    private final FactureClientService factureService;

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        throw new RuntimeException("Token JWT manquant ou invalide");
    }

    @PreAuthorize("hasRole('COMMERCIAL')")
    @GetMapping("/all")
    public ResponseEntity<List<FactureDTO>> getAllFactures(HttpServletRequest request) {
        String token = extractToken(request);
        List<FactureClient> factures = factureService.getAllFactures(token);

        List<FactureDTO> factureDTOs = factures.stream()
                .map(FactureDTO::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(factureDTOs);
    }

    @GetMapping("/{factureId}")
    public ResponseEntity<?> getFactureById(@PathVariable Integer factureId, HttpServletRequest request) {
        try {
            String token = extractToken(request);
            FactureClient facture = factureService.getFactureById(factureId, token);
            FactureDTO factureDTO = FactureDTO.fromEntity(facture);
            return ResponseEntity.ok(factureDTO);
        } catch (Exception e) {
            log.error("Erreur récupération facture {}: {}", factureId, e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<?> getFacturesByClient(@PathVariable Integer clientId, HttpServletRequest request) {
        try {
            String token = extractToken(request);
            List<FactureClient> factures = factureService.getFacturesByClient(clientId, token);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", factures);
            response.put("count", factures.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Erreur récupération factures client {}: {}", clientId, e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/commande/{commandeId}")
    public ResponseEntity<?> getFactureByCommandeId(@PathVariable Integer commandeId, HttpServletRequest request) {
        try {
            String token = extractToken(request);
            FactureClient facture = factureService.getFactureByCommandeId(commandeId, token);
            if (facture != null) {
                FactureDTO factureDTO = FactureDTO.fromEntity(facture);
                return ResponseEntity.ok(factureDTO);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Aucune facture trouvée pour cette commande");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            log.error("Erreur récupération facture pour commande {}: {}", commandeId, e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/generer/{commandeId}")
    public ResponseEntity<?> genererFacture(@PathVariable Integer commandeId, HttpServletRequest request) {
        try {
            String token = extractToken(request);
            log.info("Génération facture pour commande: {}", commandeId);
            FactureClient facture = factureService.genererFactureDepuisCommande(commandeId, token);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Facture générée avec succès");
            response.put("data", Map.of(
                    "idFactureClient", facture.getIdFactureClient(),
                    "referenceFactureClient", facture.getReferenceFactureClient(),
                    "montantTotal", facture.getMontantTotal(),
                    "statut", facture.getStatut()
            ));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Erreur génération facture: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{factureId}/payer")
    public ResponseEntity<?> marquerFacturePayee(@PathVariable Integer factureId, HttpServletRequest request) {
        try {
            String token = extractToken(request);
            FactureClient facture = factureService.marquerFacturePayee(factureId, token);
            FactureDTO factureDTO = FactureDTO.fromEntity(facture);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Facture marquée comme payée");
            response.put("data", factureDTO);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Erreur paiement facture {}: {}", factureId, e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}