package org.erp.invera.controller.erp;

import jakarta.servlet.http.HttpServletRequest;
import org.erp.invera.dto.erp.Produitdto.ProduitCommandeRequestDTO;
import org.erp.invera.dto.erp.commandeClientdto.CommandeRequestDTO;
import org.erp.invera.dto.erp.commandeClientdto.CommandeResponseDTO;
import org.erp.invera.dto.erp.commandeClientdto.CommandeUpdateRequestDTO;
import org.erp.invera.model.erp.client.CommandeClient;
import org.erp.invera.model.erp.client.LigneCommandeClient;
import org.erp.invera.security.JwtTokenProvider;
import org.erp.invera.service.erp.CommandeClientService;
import org.erp.invera.service.erp.ClientService;
import org.erp.invera.service.erp.ProduitService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/commandes")
public class CommandeClientController {

    private final CommandeClientService commandeService;
    private final ClientService clientService;
    private final ProduitService produitService;
    private final JwtTokenProvider jwtTokenProvider;

    public CommandeClientController(CommandeClientService commandeService,
                                    ClientService clientService,
                                    ProduitService produitService,
                                    JwtTokenProvider jwtTokenProvider) {
        this.commandeService = commandeService;
        this.clientService = clientService;
        this.produitService = produitService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    private String extractToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }

    @GetMapping("/getAllCommandes")
    public ResponseEntity<Map<String, Object>> getAllCommandes(
            HttpServletRequest request,
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) Integer clientId) {
        try {
            String token = extractToken(request);

            List<CommandeResponseDTO> commandesDTO;

            // Utiliser le service pour récupérer toutes les commandes
            commandesDTO = commandeService.getAllCommandes(token);

            // Filtrer par statut si nécessaire
            if (statut != null) {
                commandesDTO = commandesDTO.stream()
                        .filter(c -> statut.equals(c.getStatut()))
                        .collect(Collectors.toList());
            }

            // Filtrer par clientId si nécessaire
            if (clientId != null) {
                commandesDTO = commandesDTO.stream()
                        .filter(c -> c.getClient() != null && clientId.equals(c.getClient().getIdClient()))
                        .collect(Collectors.toList());
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("commandes", commandesDTO);
            response.put("total", commandesDTO.size());
            response.put("message", "Commandes récupérées avec succès");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/validated")
    public ResponseEntity<Map<String, Object>> getCommandesValidees(HttpServletRequest request) {
        try {
            String token = extractToken(request);

            List<CommandeResponseDTO> allCommandes = commandeService.getAllCommandes(token);
            List<CommandeResponseDTO> commandesValidees = allCommandes.stream()
                    .filter(c -> "CONFIRMEE".equals(c.getStatut()))
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("commandes", commandesValidees);
            response.put("total", commandesValidees.size());
            response.put("message", commandesValidees.size() + " commande(s) validée(s) récupérée(s)");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateCommande(
            HttpServletRequest request,
            @PathVariable Integer id,
            @RequestBody CommandeUpdateRequestDTO commandeUpdateRequest) {

        try {
            String token = extractToken(request);
            CommandeClient commandeMaj = commandeService.updateCommande(id, commandeUpdateRequest, token);

            CommandeResponseDTO commandeDTO = CommandeResponseDTO.fromEntity(
                    commandeMaj,
                    clientService,
                    produitService
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Commande mise à jour avec succès");
            response.put("commande", commandeDTO);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getCommandeById(HttpServletRequest request, @PathVariable Integer id) {
        try {
            String token = extractToken(request);

            // ✅ Utiliser la bonne méthode du service : getCommandeById
            CommandeResponseDTO commandeDTO = commandeService.getCommandeById(id, token);

            if (commandeDTO == null) {
                throw new RuntimeException("Commande non trouvée");
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("commande", commandeDTO);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
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

    @PostMapping("/creer")
    public ResponseEntity<Map<String, Object>> creerCommande(HttpServletRequest request, @RequestBody CommandeRequestDTO commandeRequest) {
        try {
            String token = extractToken(request);

            System.out.println("========================================");
            System.out.println("📦 CommandeRequest reçu:");
            System.out.println("   - ClientId: " + commandeRequest.getClientId());
            System.out.println("   - Produits: " + commandeRequest.getProduits());
            System.out.println("   - RemiseTotale: " + commandeRequest.getRemiseTotale());

            if (commandeRequest.getClientId() == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "ID client requis");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            if (commandeRequest.getProduits() == null || commandeRequest.getProduits().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Aucun produit sélectionné");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            Map<Integer, Integer> produitsMap = new HashMap<>();
            for (ProduitCommandeRequestDTO produit : commandeRequest.getProduits()) {
                produitsMap.put(produit.getProduitId(), produit.getQuantite());
            }

            boolean disponible = commandeService.verifierDisponibilite(produitsMap, token);

            if (!disponible) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Stock insuffisant pour certains produits");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            CommandeClient commande = commandeService.createCommande(commandeRequest, token);

            CommandeResponseDTO commandeDTO = CommandeResponseDTO.fromEntity(
                    commande,
                    clientService,
                    produitService
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Commande créée avec succès");
            response.put("commande", commandeDTO);
            response.put("referenceCommande", commande.getReferenceCommandeClient());
            response.put("total", commande.getTotal());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur interne: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/{id}/valider")
    public ResponseEntity<Map<String, Object>> validerCommande(HttpServletRequest request, @PathVariable Integer id) {
        try {
            String token = extractToken(request);
            CommandeClient commandeMaj = commandeService.confirmerCommande(id, token);

            CommandeResponseDTO commandeDTO = CommandeResponseDTO.fromEntity(
                    commandeMaj,
                    clientService,
                    produitService
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Commande validée avec succès");
            response.put("commande", commandeDTO);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PutMapping("/{id}/rejeter")
    public ResponseEntity<Map<String, Object>> rejeterCommande(HttpServletRequest request, @PathVariable Integer id) {
        try {
            String token = extractToken(request);
            CommandeClient commandeMaj = commandeService.rejeterCommande(id, token);

            CommandeResponseDTO commandeDTO = CommandeResponseDTO.fromEntity(
                    commandeMaj,
                    clientService,
                    produitService
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Commande rejetée");
            response.put("commande", commandeDTO);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PostMapping("/verifier-disponibilite")
    public ResponseEntity<Map<String, Object>> verifierDisponibilite(HttpServletRequest request, @RequestBody Map<String, Object> requestBody) {
        try {
            String token = extractToken(request);
            Object produitsObj = requestBody.get("produits");
            boolean disponible;

            if (produitsObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> produitsList = (List<Map<String, Object>>) produitsObj;
                Map<Integer, Integer> produitsMap = new HashMap<>();
                for (Map<String, Object> produitMap : produitsList) {
                    Integer produitId = ((Number) produitMap.get("produitId")).intValue();
                    Integer quantite = ((Number) produitMap.get("quantite")).intValue();
                    produitsMap.put(produitId, quantite);
                }
                disponible = commandeService.verifierDisponibilite(produitsMap, token);
            } else {
                throw new RuntimeException("Format de produits invalide");
            }

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
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @GetMapping("/remise-client/{typeClient}")
    public ResponseEntity<Map<String, Object>> getRemiseForClientType(
            @PathVariable String typeClient,
            HttpServletRequest request) {
        try {
            String token = extractToken(request);
            Double remise = clientService.getRemiseForClientType(typeClient, token);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("typeClient", typeClient);
            response.put("remise", remise);
            response.put("message", "Remise récupérée avec succès");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<Map<String, Object>> getCommandesByClient(HttpServletRequest request, @PathVariable Integer clientId) {
        try {
            String token = extractToken(request);

            List<CommandeResponseDTO> allCommandes = commandeService.getAllCommandes(token);
            List<CommandeResponseDTO> commandesClient = allCommandes.stream()
                    .filter(c -> c.getClient() != null && clientId.equals(c.getClient().getIdClient()))
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("commandes", commandesClient);
            response.put("count", commandesClient.size());
            response.put("message", "Commandes récupérées avec succès");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur lors de la récupération des commandes: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}