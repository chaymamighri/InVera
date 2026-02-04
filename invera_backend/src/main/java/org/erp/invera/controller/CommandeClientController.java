package org.erp.invera.controller;

import org.erp.invera.dto.CommandeRequestDTO;
import org.erp.invera.model.CommandeClient;
import org.erp.invera.service.CommandeClientService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/commandes")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class CommandeClientController {

    private final CommandeClientService commandeService;

    public CommandeClientController(CommandeClientService commandeService) {
        this.commandeService = commandeService;
    }

    @PostMapping("/creer")
    public ResponseEntity<Map<String, Object>> creerCommande(@RequestBody CommandeRequestDTO commandeRequest) {
        try {
            // Vérifier la disponibilité
            boolean disponible = commandeService.verifierDisponibilite(commandeRequest.getProduits());

            if (!disponible) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Stock insuffisant pour certains produits");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            // Créer la commande
            CommandeClient commande = commandeService.createCommande(commandeRequest);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Commande créée avec succès");
            response.put("commande", commande);
            response.put("numeroCommande", commande.getNumeroCommande());
            response.put("total", commande.getTotal());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PostMapping("/verifier-disponibilite")
    public ResponseEntity<Map<String, Object>> verifierDisponibilite(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            Map<Integer, Integer> produits = (Map<Integer, Integer>) request.get("produits");

            boolean disponible = commandeService.verifierDisponibilite(produits);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("disponible", disponible);
            response.put("message", disponible ?
                    "Tous les produits sont disponibles" :
                    "Certains produits ne sont pas disponibles");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @GetMapping("/remise-client/{typeClient}")
    public ResponseEntity<Map<String, Object>> getRemiseForClientType(
            @PathVariable String typeClient) {
        try {
            Double remise = commandeService.getRemiseForClientType(typeClient);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("typeClient", typeClient);
            response.put("remise", remise);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
}