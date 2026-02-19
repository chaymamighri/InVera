package org.erp.invera.controller;

import org.erp.invera.dto.ClientDTO;
import org.erp.invera.dto.NouveauClientDTO;
import org.erp.invera.model.Client;
import org.erp.invera.service.ClientService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clients")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    // CRUD Clients

    @PostMapping("/creer")
    public ResponseEntity<Map<String, Object>> creerClient(@RequestBody NouveauClientDTO clientDTO) {
        try {
            Client client = clientService.creerClient(clientDTO);
            ClientDTO clientResponse = ClientDTO.fromEntity(client);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Client créé avec succès");
            response.put("client", clientResponse);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @GetMapping("/liste")
    public ResponseEntity<Map<String, Object>> getAllClients() {
        try {
            List<Client> clients = clientService.getAllClients();
            List<ClientDTO> clientDTOs = clients.stream()
                    .map(ClientDTO::fromEntity)
                    .toList();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", clientDTOs.size());
            response.put("clients", clientDTOs);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/update/{id}")
    public ResponseEntity<Map<String, Object>> updateClient(
            @PathVariable Integer id,
            @RequestBody NouveauClientDTO clientDTO) {

        System.out.println("=== REQUÊTE DE MISE À JOUR ===");
        System.out.println("ID client: " + id);
        System.out.println("Données reçues: " + clientDTO);

        try {
            // Le service utilise NouveauClientDTO pour la mise à jour
            Client client = clientService.updateClient(id, clientDTO);

            // Mais on retourne ClientDTO en sortie (plus complet)
            ClientDTO clientResponse = ClientDTO.fromEntity(client);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Client modifié avec succès");
            response.put("client", clientResponse);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ Erreur: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @GetMapping("/rechercher")
    public ResponseEntity<Map<String, Object>> searchClients(
            @RequestParam(required = false) String q) {
        try {
            List<Client> clients = clientService.searchClients(q);
            List<ClientDTO> clientDTOs = clients.stream()
                    .map(ClientDTO::fromEntity)
                    .toList();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", clientDTOs.size());
            response.put("clients", clientDTOs);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/verifier-telephone")
    public ResponseEntity<Map<String, Object>> verifierTelephone(
            @RequestParam String telephone) {
        try {
            boolean exists = clientService.checkTelephoneExists(telephone);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("exists", exists);
            response.put("message", exists ?
                    "Ce numéro est déjà utilisé" :
                    "Ce numéro est disponible");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/types")
    public ResponseEntity<Map<String, Object>> getClientTypes() {
        try {
            List<String> types = clientService.getClientTypes();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("types", types);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/remise/{typeClient}")
    public ResponseEntity<Map<String, Object>> getRemiseForType(
            @PathVariable String typeClient) {
        try {
            Double remise = clientService.calculerRemiseParType(
                    Client.TypeClient.valueOf(typeClient.toUpperCase()));

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("type", typeClient);
            response.put("remise", remise);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Type de client invalide: " + typeClient);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

}