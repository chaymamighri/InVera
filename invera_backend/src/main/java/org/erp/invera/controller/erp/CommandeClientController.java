package org.erp.invera.controller.erp;

import org.erp.invera.dto.erp.Produitdto.ProduitCommandeDetailDTO;
import org.erp.invera.dto.erp.Produitdto.ProduitCommandeRequestDTO;
import org.erp.invera.dto.erp.Produitdto.ProduitCommandeUpdateDTO;
import org.erp.invera.dto.erp.commandeClientdto.CommandeRequestDTO;
import org.erp.invera.dto.erp.commandeClientdto.CommandeResponseDTO;
import org.erp.invera.dto.erp.commandeClientdto.CommandeUpdateRequestDTO;
import org.erp.invera.model.erp.client.CommandeClient;
import org.erp.invera.model.erp.Produit;
import org.erp.invera.repository.erp.CommandeClientRepository;
import org.erp.invera.repository.platform.utilisateurRepository;
import org.erp.invera.service.erp.CommandeClientService;
import org.erp.invera.service.erp.ClientService;
import org.erp.invera.service.erp.ProduitService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;


/**
 * Contrôleur des commandes clients (ventes).
 *
 * Cycle de vie d'une commande client :
 * EN_ATTENTE → CONFIRMEE (déstockage) → ANNULEE (restitution stock)
 *
 * Endpoints :
 *
 *  CONSULTATION :
 * - GET    /getAllCommandes            → Liste des commandes (filtres: statut, client)
 * - GET    /validated                  → Commandes confirmées uniquement
 * - GET    /{id}                       → Détail d'une commande
 * - GET    /client/{clientId}          → Commandes d'un client spécifique
 *
 *  CRÉATION ET MODIFICATION :
 * - POST   /creer                      → Créer une commande (EN_ATTENTE)
 * - PUT    /{id}                       → Modifier (uniquement EN_ATTENTE)
 * - POST   /verifier-disponibilite     → Vérifier le stock avant commande
 *
 *  VALIDATION / REJET :
 * - PUT    /{id}/valider               → EN_ATTENTE → CONFIRMEE (déstockage)
 * - PUT    /{id}/rejeter               → Annulation (restitution si confirmée)
 *
 *  UTILITAIRES :
 * - GET    /remise-client/{type}       → Remise selon type de client (VIP, ENTREPRISE...)
 */
@RestController
@RequestMapping("/api/commandes")
public class CommandeClientController {

    private final CommandeClientService commandeService;
    private final CommandeClientRepository commandeClientRepository;
    private final ClientService clientService;
    private final ProduitService produitService;
    private utilisateurRepository utilisateurRepository;

    public CommandeClientController(CommandeClientService commandeService,
                                    CommandeClientRepository commandeClientRepository,
                                    ClientService clientService,
                                    ProduitService produitService,
                                    utilisateurRepository utilisateurRepository) {
        this.commandeService = commandeService;
        this.commandeClientRepository = commandeClientRepository;
        this.clientService = clientService;
        this.produitService = produitService;
        this.utilisateurRepository = utilisateurRepository;
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

            if (!commandesDTO.isEmpty()) {
                CommandeResponseDTO first = commandesDTO.get(0);
                System.out.println("📋 Première commande: " + first.getReferenceCommandeClient());
                if (first.getProduits() != null && !first.getProduits().isEmpty()) {
                    ProduitCommandeDetailDTO p = first.getProduits().get(0);
                    System.out.println("   ✅ Produit: " + p.getLibelle());
                    System.out.println("   ✅ Image: " + p.getImageUrl());
                    // Correction: utiliser getCategorieNom() au lieu de getCategorie()
                    System.out.println("   ✅ Catégorie: " + p.getCategorieNom());
                    System.out.println("   ✅ Catégorie ID: " + p.getCategorieId());
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


    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateCommande(
            @PathVariable Integer id,
            @RequestBody CommandeUpdateRequestDTO commandeUpdateRequest) {

        try {
            System.out.println("📦 Mise à jour commande ID: " + id);
            System.out.println("Données reçues: " + commandeUpdateRequest);

            // Vérifier que la commande existe
            CommandeClient commande = commandeClientRepository.findByIdWithDetails(id)
                    .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'ID: " + id));

            // Vérifier que la commande est en attente
            if (commande.getStatut() != CommandeClient.StatutCommande.EN_ATTENTE) {
                throw new RuntimeException("Seules les commandes en attente peuvent être modifiées");
            }

            // Vérifier la disponibilité des produits
            Map<Integer, Integer> produitsMap = new HashMap<>();
            for (ProduitCommandeUpdateDTO produit : commandeUpdateRequest.getProduits()) {
                produitsMap.put(produit.getProduitId(), produit.getQuantite().intValue());
            }

            boolean disponible = commandeService.verifierDisponibilite(produitsMap);
            if (!disponible) {
                throw new RuntimeException("Stock insuffisant pour certains produits");
            }

            // Mettre à jour la commande via le service
            CommandeClient commandeMaj = commandeService.updateCommande(id, commandeUpdateRequest);

            // Récupérer la commande mise à jour avec ses détails
            CommandeClient commandeAvecDetails = commandeClientRepository.findByIdWithDetails(commandeMaj.getIdCommandeClient())
                    .orElse(commandeMaj);

            // Convertir en DTO pour la réponse
            CommandeResponseDTO commandeDTO = CommandeResponseDTO.fromEntity(
                    commandeAvecDetails,
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
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur serveur: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getCommandeById(@PathVariable Integer id) {
        try {
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
            System.out.println(" Données reçues pour création de commande:");
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

            CommandeClient commandeAvecDetails = commandeClientRepository.findByIdWithDetails(commande.getIdCommandeClient())
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
            response.put("referenceCommande", commande.getReferenceCommandeClient());
            response.put("total", commande.getTotal());

            // ✅ Charger l'utilisateur depuis la base pour avoir nom/prénom
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) {
                String email = auth.getName();
                System.out.println("🔍 Recherche de l'utilisateur avec email: " + email);

                utilisateurRepository.findByEmail(email).ifPresentOrElse(
                        user -> {
                            Map<String, Object> userInfo = new HashMap<>();
                            userInfo.put("id", user.getId());
                            userInfo.put("email", user.getEmail());
                            userInfo.put("nom", user.getNom());
                            userInfo.put("prenom", user.getPrenom());
                            userInfo.put("role", user.getRole() != null ? user.getRole().name() : null);

                            String nomComplet = "";
                            if (user.getPrenom() != null) nomComplet += user.getPrenom() + " ";
                            if (user.getNom() != null) nomComplet += user.getNom();
                            if (nomComplet.trim().isEmpty()) nomComplet = user.getEmail();

                            userInfo.put("nomComplet", nomComplet.trim());
                            response.put("creePar", userInfo);

                            System.out.println("✅ Utilisateur trouvé: " + nomComplet);
                        },
                        () -> {
                            // Fallback si l'utilisateur n'est pas trouvé
                            Map<String, Object> userInfo = new HashMap<>();
                            userInfo.put("email", email);
                            userInfo.put("nomComplet", email);
                            response.put("creePar", userInfo);
                            System.out.println("⚠️ Utilisateur non trouvé avec email: " + email);
                        }
                );
            } else {
                // Fallback si pas d'authentification
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("nomComplet", "Inconnu");
                response.put("creePar", userInfo);
                System.out.println("⚠️ Aucune authentification trouvée");
            }

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
            CommandeClient commandeMaj = commandeService.confirmerCommande(id);

            CommandeClient commandeAvecDetails = commandeClientRepository.findByIdWithDetails(commandeMaj.getIdCommandeClient())
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
            CommandeClient commandeMaj = commandeService.rejeterCommande(id);

            CommandeClient commandeAvecDetails = commandeClientRepository.findByIdWithDetails(commandeMaj.getIdCommandeClient())
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
            Double remise = clientService.getRemiseForClientType(typeClient);

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
                response.put("idProduit", p.getIdProduit());
                response.put("classe", p.getClass().getName());
                if (p.getCategorie() != null) {
                    response.put("categorieId", p.getCategorie().getIdCategorie());
                    response.put("categorieNom", p.getCategorie().getNomCategorie());
                }
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

    // recupére les commandes d'un client
    @GetMapping("/client/{clientId}")
    public ResponseEntity<Map<String, Object>> getCommandesByClient(@PathVariable Integer clientId) {
        try {
            System.out.println("📡 Récupération des commandes pour le client: " + clientId);

            // Récupérer les commandes du client avec leurs détails
            List<CommandeClient> commandes = commandeClientRepository.findByClientIdWithDetails(clientId);

            // Transformer chaque commande en DTO avec les détails
            List<CommandeResponseDTO> commandesDTO = commandes.stream()
                    .map(commande -> CommandeResponseDTO.fromEntity(
                            commande,
                            clientService,
                            produitService
                    ))
                    .collect(Collectors.toList());

            // Trier par date (plus récent d'abord)
            commandesDTO.sort((a, b) -> {
                if (a.getDateCommande() == null) return 1;
                if (b.getDateCommande() == null) return -1;
                return b.getDateCommande().compareTo(a.getDateCommande());
            });

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("commandes", commandesDTO);
            response.put("count", commandesDTO.size());
            response.put("message", "Commandes récupérées avec succès");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println(" Erreur récupération commandes client " + clientId + ": " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur lors de la récupération des commandes: " + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

}