package org.erp.invera.controller.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.platform.clientsdto.ClientRegistrationRequest;
import org.erp.invera.model.platform.Abonnement;
import org.erp.invera.model.platform.Client;
import org.erp.invera.service.payment.SubscriptionService;
import org.erp.invera.service.platform.ClientPlatformService;
import org.erp.invera.service.platform.DatabaseCreationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/platform/clients")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PlatformClientController {

    private final ClientPlatformService clientService;
    private final DatabaseCreationService databaseCreationService;
    private final SubscriptionService subscriptionService;


    // ========== 1. INSCRIPTION ==========

    /**
     * Inscription d'un nouveau client
     * POST /api/platform/clients/register
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody ClientRegistrationRequest request) {
        try {
            // 1. Créer le client
            Client client = new Client();
            client.setEmail(request.getEmail());
            client.setTelephone(request.getTelephone());
            client.setNom(request.getNom());
            client.setPrenom(request.getPrenom());
            client.setTypeCompte(Client.TypeCompte.valueOf(request.getTypeCompte()));
            client.setTypeInscription(Client.TypeInscription.valueOf(request.getTypeInscription()));

            Client newClient = clientService.createClient(client);

            // 2. Si inscription DEFINITIVE, créer l'abonnement immédiatement
            Abonnement abonnement = null;
            if (client.getTypeInscription() == Client.TypeInscription.DEFINITIF) {
                Abonnement.PeriodType period = Abonnement.PeriodType.valueOf(request.getTypeAbonnement());
                abonnement = subscriptionService.createSubscription(newClient.getId(), period);
            }

            // 3. Construire la réponse
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("clientId", newClient.getId());
            response.put("statut", newClient.getStatut().getLabel());

            if (client.getTypeInscription() == Client.TypeInscription.ESSAI) {
                response.put("message", "Inscription réussie. Période d'essai de 30 connexions.");
                response.put("connexionsRestantes", newClient.getConnexionsRestantes());
            } else {
                response.put("message", "Inscription réussie. Abonnement " + request.getTypeAbonnement() + " activé.");
                response.put("abonnement", Map.of(
                        "period", abonnement.getPeriodType().getLabel(),
                        "montant", abonnement.getMontant(),
                        "dateFin", abonnement.getDateFin()
                ));
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== 2. UPLOAD JUSTIFICATIFS ==========

    /**
     * Soumettre les justificatifs
     * POST /api/platform/clients/{id}/justificatifs
     */
    @PostMapping("/{id}/justificatifs")
    public ResponseEntity<?> uploadJustificatifs(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        try {
            String typeDocument = request.get("typeDocument");
            String fileUrl = request.get("fileUrl");

            Client client = clientService.uploadJustificatifs(id, typeDocument, fileUrl);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Justificatifs soumis avec succès");
            response.put("statut", client.getStatut());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== 3. VALIDATION ADMIN ==========

    /**
     * Valider un client (Super Admin)
     * PUT /api/platform/clients/{id}/validate
     */
    @PutMapping("/{id}/validate")
    public ResponseEntity<?> validateClient(@PathVariable Long id) {
        try {
            Client client = clientService.validateClient(id, null);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Client validé avec succès");
            response.put("statut", client.getStatut());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Refuser un client (Super Admin)
     * PUT /api/platform/clients/{id}/refuse
     */
    @PutMapping("/{id}/refuse")
    public ResponseEntity<?> refuseClient(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        try {
            String motif = request.get("motif");
            Client client = clientService.refuseClient(id, motif);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Client refusé");
            response.put("motif", motif);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== 4. ACTIVATION + CRÉATION BASE ==========

    /**
     * Activer un client et créer sa base de données
     * POST /api/platform/clients/{id}/activate
     */
    @PostMapping("/{id}/activate")
    public ResponseEntity<?> activateClient(@PathVariable Long id) {
        try {
            // 1. Créer la base de données
            DatabaseCreationService.DatabaseInfo dbInfo =
                    databaseCreationService.createClientDatabase(id);

            // 2. Activer le client
            Client client = clientService.activateClient(id, dbInfo.dbName);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Client activé avec succès");
            response.put("database", dbInfo.dbName);
            response.put("username", dbInfo.username);
            response.put("connectionUrl", dbInfo.connectionUrl);
            response.put("statut", client.getStatut());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Activer avec plan d'abonnement
     * POST /api/platform/clients/{id}/activate-with-plan?plan=PRO
     */
    @PostMapping("/{id}/activate-with-plan")
    public ResponseEntity<?> activateClientWithPlan(
            @PathVariable Long id,
            @RequestParam String plan) {

        try {
            // 1. Créer base avec plan
            DatabaseCreationService.DatabaseInfo dbInfo =
                    databaseCreationService.createClientDatabaseWithPlan(id, plan);

            // 2. Activer le client
            Client client = clientService.activateClient(id, dbInfo.dbName);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Client activé avec succès");
            response.put("plan", plan);
            response.put("database", dbInfo.dbName);
            response.put("username", dbInfo.username);
            response.put("statut", client.getStatut());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== 5. CONNEXION CLIENT ==========

    /**
     * Connexion client
     * POST /api/platform/clients/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            Client client = clientService.recordLogin(email);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("clientId", client.getId());
            response.put("nom", client.getNom());
            response.put("email", client.getEmail());
            response.put("statut", client.getStatut());
            response.put("database", client.getNomBaseDonnees());
            response.put("typeInscription", client.getTypeInscription());

            if ("ESSAI".equals(client.getTypeInscription())) {
                response.put("connexionsRestantes", client.getConnexionsRestantes());
                response.put("message", "Il vous reste " + client.getConnexionsRestantes() +
                        " connexions avant expiration de votre période d'essai");
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== 6. GESTION DES BASES ==========

    /**
     * Supprimer la base d'un client
     * DELETE /api/platform/clients/{id}/database
     */
    @DeleteMapping("/{id}/database")
    public ResponseEntity<?> dropDatabase(@PathVariable Long id) {
        try {
            databaseCreationService.dropClientDatabase(id);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Base de données supprimée avec succès"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== 7. LISTES ET RECHERCHES ==========

    /**
     * Liste tous les clients
     * GET /api/platform/clients
     */
    @GetMapping
    public ResponseEntity<?> getAllClients() {
        List<Client> clients = clientService.getAllClients();
        return ResponseEntity.ok(clients);
    }

    /**
     * Clients par statut
     * GET /api/platform/clients/statut/{statut}
     */
    @GetMapping("/statut/{statut}")
    public ResponseEntity<?> getClientsByStatut(@PathVariable String statut) {
        List<Client> clients = clientService.getClientsByStatut(Client.StatutClient.valueOf(statut));
        return ResponseEntity.ok(clients);
    }

    /**
     * Clients en attente de validation
     * GET /api/platform/clients/pending
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingClients() {
        List<Client> clients = clientService.getPendingValidationClients();
        return ResponseEntity.ok(clients);
    }

    /**
     * Détail d'un client
     * GET /api/platform/clients/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getClient(@PathVariable Long id) {
        try {
            Client client = clientService.getClientById(id);
            return ResponseEntity.ok(client);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}