package org.erp.invera.controller;

import org.erp.invera.dto.CommandeRequestDTO;
import org.erp.invera.dto.CommandeResponseDTO;
import org.erp.invera.dto.ProduitCommandeDetailDTO;
import org.erp.invera.dto.ProduitCommandeRequestDTO;
import org.erp.invera.model.CommandeClient;
import org.erp.invera.repository.CommandeClientRepository;
import org.erp.invera.service.CommandeClientService;
import org.erp.invera.service.ClientService;
import org.erp.invera.service.ProduitService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/commandes")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class CommandeClientController {

    private final CommandeClientService commandeService;
    private final CommandeClientRepository commandeClientRepository;
    private final ClientService clientService;
    private final ProduitService produitService;

    public CommandeClientController(CommandeClientService commandeService,
                                    CommandeClientRepository commandeClientRepository,
                                    ClientService clientService,
                                    ProduitService produitService) {
        this.commandeService = commandeService;
        this.commandeClientRepository = commandeClientRepository;
        this.clientService = clientService;
        this.produitService = produitService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllCommandes(
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) Integer clientId) {
        try {
            List<CommandeClient> commandes;

            // Récupérer les commandes selon les filtres
            if (statut != null && clientId != null) {
                commandes = commandeClientRepository.findByStatutAndClientId(
                        CommandeClient.StatutCommande.valueOf(statut), clientId);
            } else if (statut != null) {
                commandes = commandeClientRepository.findByStatut(
                        CommandeClient.StatutCommande.valueOf(statut));
            } else if (clientId != null) {
                commandes = commandeClientRepository.findByClientId(clientId);
            } else {
                commandes = commandeClientRepository.findAll();
            }

            // Convertir en DTOs
            List<CommandeResponseDTO> commandesDTO = commandes.stream()
                    .map(commande -> CommandeResponseDTO.fromEntity(
                            commande, clientService, produitService))
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("commandes", commandesDTO);
            response.put("total", commandesDTO.size());
            response.put("message", "Commandes récupérées avec succès");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Statut invalide. Valeurs acceptées: EN_ATTENTE, CONFIRMEE, ANNULEE");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur lors de la récupération des commandes: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getCommandeById(@PathVariable Integer id) {
        try {
            CommandeClient commande = commandeClientRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'ID: " + id));

            // Convertir en DTO
            CommandeResponseDTO commandeDTO = CommandeResponseDTO.fromEntity(
                    commande, clientService, produitService);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("commande", commandeDTO);
            response.put("message", "Commande récupérée avec succès");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur serveur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/creer")
    public ResponseEntity<Map<String, Object>> creerCommande(@RequestBody CommandeRequestDTO commandeRequest) {
        try {
            System.out.println("📦 Données reçues pour création de commande:");
            System.out.println("Client ID: " + commandeRequest.getClientId());
            System.out.println("Produits: " + commandeRequest.getProduits());

            if (commandeRequest.getProduits() == null || commandeRequest.getProduits().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Aucun produit sélectionné");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            // Convertir List<ProduitCommandeRequestDTO> en Map<Integer, Integer>
            Map<Integer, Integer> produitsMap = new HashMap<>();
            for (ProduitCommandeRequestDTO produit : commandeRequest.getProduits()) { // Note: ProduitCommandeRequestDTO
                produitsMap.put(produit.getProduitId(), produit.getQuantite());
            }

            // Vérifier la disponibilité
            boolean disponible = commandeService.verifierDisponibilite(produitsMap);

            if (!disponible) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Stock insuffisant pour certains produits");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            // Créer la commande
            CommandeClient commande = commandeService.createCommande(commandeRequest);

            // Convertir en DTO pour la réponse
            CommandeResponseDTO commandeDTO = CommandeResponseDTO.fromEntity(
                    commande, clientService, produitService);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Commande créée avec succès");
            response.put("commande", commandeDTO);
            response.put("numeroCommande", commande.getNumeroCommande());
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
            errorResponse.put("message", "Erreur lors de la création de la commande: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/{id}/valider")
    public ResponseEntity<Map<String, Object>> validerCommande(@PathVariable Integer id) {
        try {
            CommandeClient commande = commandeClientRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

            commande.setStatut(CommandeClient.StatutCommande.CONFIRMEE);
            commande.setDateLivraison(LocalDateTime.now().plusDays(7));

            CommandeClient commandeMaj = commandeClientRepository.save(commande);

            // Convertir en DTO
            CommandeResponseDTO commandeDTO = CommandeResponseDTO.fromEntity(
                    commandeMaj, clientService, produitService);

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
    public ResponseEntity<Map<String, Object>> rejeterCommande(@PathVariable Integer id) {
        try {
            CommandeClient commande = commandeClientRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

            commande.setStatut(CommandeClient.StatutCommande.ANNULEE);
            CommandeClient commandeMaj = commandeClientRepository.save(commande);

            // Convertir en DTO
            CommandeResponseDTO commandeDTO = CommandeResponseDTO.fromEntity(
                    commandeMaj, clientService, produitService);

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
    public ResponseEntity<Map<String, Object>> verifierDisponibilite(@RequestBody Map<String, Object> request) {
        try {
            System.out.println("🔍 Vérification disponibilité - Données reçues: " + request);

            // Gérer les deux formats possibles
            Object produitsObj = request.get("produits");
            boolean disponible;

            if (produitsObj instanceof List) {
                // Format: List de Map (depuis le frontend)
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> produitsList = (List<Map<String, Object>>) produitsObj;

                // Convertir en Map<Integer, Integer>
                Map<Integer, Integer> produitsMap = new HashMap<>();
                for (Map<String, Object> produitMap : produitsList) {
                    Integer produitId = ((Number) produitMap.get("produitId")).intValue();
                    Integer quantite = ((Number) produitMap.get("quantite")).intValue();
                    produitsMap.put(produitId, quantite);
                }

                disponible = commandeService.verifierDisponibilite(produitsMap);

            } else if (produitsObj instanceof Map) {
                // Format: Map<Integer, Integer> (ancien format)
                @SuppressWarnings("unchecked")
                Map<Integer, Integer> produitsMap = (Map<Integer, Integer>) produitsObj;
                disponible = commandeService.verifierDisponibilite(produitsMap);

            } else {
                throw new RuntimeException("Format de produits invalide: " +
                        (produitsObj != null ? produitsObj.getClass().getName() : "null"));
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
            @PathVariable String typeClient) {
        try {
            Double remise = commandeService.getRemiseForClientType(typeClient);

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
}