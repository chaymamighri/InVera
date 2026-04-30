package org.erp.invera.controller.erp;

import jakarta.servlet.http.HttpServletRequest;
import org.erp.invera.dto.erp.Produitdto.ProduitCommandeRequestDTO;
import org.erp.invera.dto.erp.commandeClientdto.CommandeRequestDTO;
import org.erp.invera.dto.erp.commandeClientdto.CommandeResponseDTO;
import org.erp.invera.dto.erp.commandeClientdto.CommandeUpdateRequestDTO;
import org.erp.invera.model.erp.client.CommandeClient;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.erp.invera.repository.tenant.TenantRowMapper;
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
    private final TenantAwareRepository tenantRepo;
    private final TenantRowMapper rowMapper;  // ← AJOUTER CETTE LIGNE

    public CommandeClientController(CommandeClientService commandeService,
                                    ClientService clientService,
                                    ProduitService produitService,
                                    JwtTokenProvider jwtTokenProvider,
                                    TenantAwareRepository tenantRepo,
                                    TenantRowMapper rowMapper) {  // ← AJOUTER DANS LE CONSTRUCTEUR
        this.commandeService = commandeService;
        this.clientService = clientService;
        this.produitService = produitService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.tenantRepo = tenantRepo;
        this.rowMapper = rowMapper;  // ← AJOUTER CETTE LIGNE
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
            Long tenantId = jwtTokenProvider.getClientIdFromToken(token);
            String authClientId = String.valueOf(tenantId);

            String sql;
            List<CommandeClient> commandes;

            if (statut != null && clientId != null) {
                sql = "SELECT * FROM commande_client WHERE statut = ? AND client_id = ?";
                commandes = tenantRepo.query(sql, rowMapper.commandeRowMapper(), tenantId, authClientId, statut, clientId);
            } else if (statut != null) {
                sql = "SELECT * FROM commande_client WHERE statut = ?";
                commandes = tenantRepo.query(sql, rowMapper.commandeRowMapper(), tenantId, authClientId, statut);
            } else if (clientId != null) {
                sql = "SELECT * FROM commande_client WHERE client_id = ?";
                commandes = tenantRepo.query(sql, rowMapper.commandeRowMapper(), tenantId, authClientId, clientId);
            } else {
                sql = "SELECT * FROM commande_client ORDER BY date_commande DESC";
                commandes = tenantRepo.query(sql, rowMapper.commandeRowMapper(), tenantId, authClientId);
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
            Long tenantId = jwtTokenProvider.getClientIdFromToken(token);
            String authClientId = String.valueOf(tenantId);

            String sql = "SELECT * FROM commande_client WHERE statut = 'CONFIRMEE' ORDER BY date_commande DESC";
            List<CommandeClient> commandes = tenantRepo.query(sql, rowMapper.commandeRowMapper(), tenantId, authClientId);

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
            response.put("message", commandesDTO.size() + " commande(s) validée(s) récupérée(s)");

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
            Long tenantId = jwtTokenProvider.getClientIdFromToken(token);
            String authClientId = String.valueOf(tenantId);

            String sql = "SELECT * FROM commande_client WHERE id_commande_client = ?";
            CommandeClient commande = tenantRepo.queryForObject(sql, rowMapper.commandeRowMapper(), tenantId, authClientId, id);

            if (commande == null) {
                throw new RuntimeException("Commande non trouvée avec l'ID: " + id);
            }

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
        }
    }

    @PostMapping("/creer")
    public ResponseEntity<Map<String, Object>> creerCommande(HttpServletRequest request, @RequestBody CommandeRequestDTO commandeRequest) {
        try {
            String token = extractToken(request);

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
            String token = extractToken(request);  // ← Ajouter l'extraction du token
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
            Long tenantId = jwtTokenProvider.getClientIdFromToken(token);
            String authClientId = String.valueOf(tenantId);

            String sql = "SELECT * FROM commande_client WHERE client_id = ? ORDER BY date_commande DESC";
            List<CommandeClient> commandes = tenantRepo.query(sql, rowMapper.commandeRowMapper(), tenantId, authClientId, clientId);

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
            response.put("count", commandesDTO.size());
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