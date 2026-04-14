package org.erp.invera.controller.erp;

import org.erp.invera.dto.erp.clientdto.ClientDTO;
import org.erp.invera.dto.erp.clientdto.ClientTypeRemiseUpdateDTO;
import org.erp.invera.dto.erp.clientdto.NouveauClientDTO;
import org.erp.invera.model.erp.client.Client;
import org.erp.invera.service.erp.ClientService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


/**
 * Contrôleur de gestion des clients.
 *
 * Endpoints CRUD :
 * - POST   /creer                      → Créer un client
 * - GET    /liste                      → Liste de tous les clients
 * - POST   /update/{id}                → Modifier un client
 * - DELETE /{id}                       → Supprimer un client
 *
 * Endpoints recherche :
 * - GET    /rechercher?q=              → Rechercher par nom/téléphone/email
 * - GET    /verifier-telephone?telephone= → Vérifier si un téléphone existe
 *
 * Endpoints types et remises :
 * - GET    /types                      → Types de clients disponibles
 * - GET    /remise/{typeClient}        → Remise pour un type (VIP, FIDELE, ENTREPRISE)
 * - PUT    /type/{typeClient}/remise   → Mettre à jour la remise (ADMIN)
 *
 * Types clients : PARTICULIER, VIP, FIDELE, ENTREPRISE
 * Règle : PARTICULIER = remise 0% fixe (non modifiable)
 */
@RestController
@RequestMapping("/api/clients")
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteClient(@PathVariable Integer id) {
        System.out.println("=== REQUÊTE DE SUPPRESSION ===");
        System.out.println("ID client à supprimer: " + id);

        try {
            clientService.deleteClient(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Client supprimé avec succès");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            System.err.println(" Client non trouvé: " + e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (IllegalStateException e) {
            System.err.println("Conflit: " + e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
        } catch (Exception e) {
            System.err.println("Erreur lors de la suppression: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur lors de la suppression: " + e.getMessage());

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
            System.err.println("Erreur: " + e.getMessage());
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

            Double remise = clientService.getRemiseForClientType(typeClient);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("type", typeClient);


            if (remise != null) {
                response.put("remise", remise);
            } else {
                response.put("remise", null);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Type de client invalide: " + typeClient);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PutMapping("/type/{typeClient}/remise")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updateRemiseForType(
            @PathVariable String typeClient,
            @RequestBody ClientTypeRemiseUpdateDTO request) {
        try {
            Double remise = clientService.updateRemiseForClientType(typeClient, request.getRemise());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("type", typeClient);
            response.put("remise", remise);
            response.put("message", "Remise mise à jour avec succès");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (IllegalStateException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
