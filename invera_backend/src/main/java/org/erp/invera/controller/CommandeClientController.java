package org.erp.invera.controller;

import org.erp.invera.dto.CommandeRequestDTO;
import org.erp.invera.dto.CommandeResponseDTO;
import org.erp.invera.dto.ProduitCommandeDetailDTO;
import org.erp.invera.dto.ProduitCommandeRequestDTO;
import org.erp.invera.model.CommandeClient;
import org.erp.invera.model.Produit;
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
import java.util.Optional;
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

    @GetMapping("/getAllCommandes")
    public ResponseEntity<Map<String, Object>> getAllCommandes(
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) Integer clientId) {
        try {
            List<CommandeClient> commandes;

            if (statut != null && clientId != null) {
                commandes = commandeClientRepository.findByStatutAndClientIdWithDetails(
                        CommandeClient.StatutCommande.valueOf(statut), clientId);
            } else if (statut != null) {
                commandes = commandeClientRepository.findByStatutWithDetails(
                        CommandeClient.StatutCommande.valueOf(statut));
            } else if (clientId != null) {
                commandes = commandeClientRepository.findByClientIdWithDetails(clientId);
            } else {
                commandes = commandeClientRepository.findAllWithDetails();
            }

            List<CommandeResponseDTO> commandesDTO = commandes.stream()
                    .map(commande -> CommandeResponseDTO.fromEntity(
                            commande,
                            clientService,
                            produitService
                    ))
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
            errorResponse.put("message", "Statut invalide");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/validated")
    public ResponseEntity<Map<String, Object>> getCommandesValidees() {
        try {
            System.out.println("📌 API appelée: GET /api/commandes/validated");

            List<CommandeClient> commandes = commandeClientRepository.findByStatutWithDetails(
                    CommandeClient.StatutCommande.CONFIRMEE);

            System.out.println("📊 " + commandes.size() + " commandes validées trouvées");

            List<CommandeResponseDTO> commandesDTO = commandes.stream()
                    .map(commande -> CommandeResponseDTO.fromEntity(
                            commande,
                            clientService,
                            produitService
                    ))
                    .collect(Collectors.toList());

            // 3. Vérification
            if (!commandesDTO.isEmpty()) {
                CommandeResponseDTO first = commandesDTO.get(0);
                System.out.println("📋 Première commande: " + first.getNumeroCommande());
                if (first.getProduits() != null && !first.getProduits().isEmpty()) {
                    ProduitCommandeDetailDTO p = first.getProduits().get(0);
                    System.out.println("   ✅ Produit: " + p.getLibelle());
                    System.out.println("   ✅ Image: " + p.getImageUrl());
                    System.out.println("   ✅ Catégorie: " + p.getCategorie());
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("commandes", commandesDTO);
            response.put("total", commandesDTO.size());
            response.put("message", commandesDTO.size() + " commande(s) validée(s) récupérée(s)");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ ERREUR: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getCommandeById(@PathVariable Integer id) {
        try {
            // Récupérer la commande avec détails
            CommandeClient commande = commandeClientRepository.findByIdWithDetails(id)
                    .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'ID: " + id));


            CommandeResponseDTO commandeDTO = CommandeResponseDTO.fromEntity(
                    commande,
                    clientService,
                    produitService
            );

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
            e.printStackTrace();
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

            Map<Integer, Integer> produitsMap = new HashMap<>();
            for (ProduitCommandeRequestDTO produit : commandeRequest.getProduits()) {
                produitsMap.put(produit.getProduitId(), produit.getQuantite());
            }

            boolean disponible = commandeService.verifierDisponibilite(produitsMap);

            if (!disponible) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Stock insuffisant pour certains produits");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            CommandeClient commande = commandeService.createCommande(commandeRequest);

            //  Recharger avec les détails
            CommandeClient commandeAvecDetails = commandeClientRepository.findAllWithDetails()
                    .stream()
                    .filter(c -> c.getId().equals(commande.getId()))
                    .findFirst()
                    .orElse(commande);

            CommandeResponseDTO commandeDTO = CommandeResponseDTO.fromEntity(
                    commandeAvecDetails,
                    clientService,
                    produitService
            );

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
            CommandeClient commandeMaj = commandeClientRepository.save(commande);

            // Recharger avec détails
            CommandeClient commandeAvecDetails = commandeClientRepository.findAllWithDetails()
                    .stream()
                    .filter(c -> c.getId().equals(commandeMaj.getId()))
                    .findFirst()
                    .orElse(commandeMaj);


            CommandeResponseDTO commandeDTO = CommandeResponseDTO.fromEntity(
                    commandeAvecDetails,
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
    public ResponseEntity<Map<String, Object>> rejeterCommande(@PathVariable Integer id) {
        try {
            CommandeClient commande = commandeClientRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

            commande.setStatut(CommandeClient.StatutCommande.ANNULEE);
            CommandeClient commandeMaj = commandeClientRepository.save(commande);


            CommandeClient commandeAvecDetails = commandeClientRepository.findAllWithDetails()
                    .stream()
                    .filter(c -> c.getId().equals(commandeMaj.getId()))
                    .findFirst()
                    .orElse(commandeMaj);

            CommandeResponseDTO commandeDTO = CommandeResponseDTO.fromEntity(
                    commandeAvecDetails,
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
    public ResponseEntity<Map<String, Object>> verifierDisponibilite(@RequestBody Map<String, Object> request) {

        try {
            System.out.println("🔍 Vérification disponibilité - Données reçues: " + request);

            Object produitsObj = request.get("produits");
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
                disponible = commandeService.verifierDisponibilite(produitsMap);
            } else if (produitsObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<Integer, Integer> produitsMap = (Map<Integer, Integer>) produitsObj;
                disponible = commandeService.verifierDisponibilite(produitsMap);
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

    @GetMapping("/{id}/test-produit")
    public ResponseEntity<Map<String, Object>> testProduitMethod(@PathVariable Integer id) {

        try {
            Optional<Produit> produitOpt = produitService.getProduitById(1);

            Map<String, Object> response = new HashMap<>();

            if (produitOpt.isPresent()) {
                Produit p = produitOpt.get();
                response.put("libelle", p.getLibelle());
                response.put("getIdProduit", p.getIdProduit());
                response.put("classe", p.getClass().getName());
            }

            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}