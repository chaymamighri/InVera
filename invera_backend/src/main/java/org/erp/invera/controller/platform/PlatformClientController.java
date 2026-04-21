package org.erp.invera.controller.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.erp.RegisterRequest;
import org.erp.invera.dto.platform.clientsdto.ClientRegistrationRequest;
import org.erp.invera.model.platform.Abonnement;
import org.erp.invera.model.platform.Client;
import org.erp.invera.service.payment.SubscriptionService;
import org.erp.invera.service.platform.ClientPlatformService;
import org.erp.invera.service.platform.DatabaseCreationService;
import org.erp.invera.service.platform.OtpService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
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
    private final OtpService otpService ;


    // ========== 1. INSCRIPTION ==========

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody ClientRegistrationRequest request) {
        try {

            // 2. Créer le client
            Client client = new Client();
            client.setEmail(request.getEmail());
            client.setTelephone(request.getTelephone());
            client.setNom(request.getNom());
            client.setPrenom(request.getPrenom());
            client.setTypeCompte(Client.TypeCompte.valueOf(request.getTypeCompte()));
            client.setTypeInscription(Client.TypeInscription.valueOf(request.getTypeInscription()));

            Client newClient = clientService.createClient(client, request.getOtp(), request.getPassword());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("clientId", newClient.getId());
            response.put("statut", newClient.getStatut().getLabel());

            if (newClient.getTypeInscription() == Client.TypeInscription.ESSAI) {
                response.put("message", "Inscription réussie. Vous pouvez vous connecter avec votre email et mot de passe.");
                response.put("connexionsRestantes", newClient.getConnexionsRestantes());
            } else {
                response.put("message", "Inscription réussie. En attente de validation.");
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");

            // Validation de l'email
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email requis"));
            }

            // Appeler directement OtpService au lieu de clientService
            String otp = otpService.sendOtpByEmail(email);
            log.info("📧 OTP envoyé à {}: {}", email, otp);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Code OTP envoyé à " + email);
            response.put("expiration", "10 minutes");
            response.put("debug_otp", otp); // Pour les tests

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Erreur lors de l'envoi OTP: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


    // À AJOUTER dans PlatformClientController.java
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String code = request.get("code");

            if (email == null || code == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email et code requis"));
            }

            // Vérifier l'OTP
            boolean isValid = otpService.verifyOtp(email, code);

            if (isValid) {
                return ResponseEntity.ok(Map.of("valid", true, "message", "Code valide"));
            } else {
                return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "Code OTP invalide ou expiré"));
            }

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
// ========== 2. UPLOAD JUSTIFICATIFS ==========

    /**
     * Soumettre les justificatifs
     * POST /api/platform/clients/{id}/justificatifs
     *
     * @param id ID du client
     * @param file Fichier à uploader
     * @param typeDocument Type de document (CIN, KBIS, PATENTE, RNE, etc.)
     * @return Réponse avec statut
     */
    @PostMapping(value = "/{id}/justificatifs", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadJustificatifs(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("typeDocument") String typeDocument) {

        try {
            // Validation
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Aucun fichier fourni"));
            }

            if (typeDocument == null || typeDocument.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Type de document requis"));
            }

            // 1. Sauvegarder le fichier
            String fileUrl = saveJustificatifFile(file, typeDocument, id);

            // 2. Mettre à jour le client avec l'URL du document
            Client client = clientService.uploadJustificatifs(id, typeDocument, fileUrl);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Justificatif soumis avec succès");
            response.put("statut", client.getStatut());
            response.put("fileUrl", fileUrl);
            response.put("typeDocument", typeDocument);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Erreur lors de l'upload du justificatif: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Sauvegarde le fichier justificatif sur le disque
     */
    private String saveJustificatifFile(MultipartFile file, String typeDocument, Long clientId) throws IOException {
        // Créer le répertoire d'upload
        String uploadDir = "uploads/justificatifs/client_" + clientId + "/";
        Path uploadPath = Paths.get(uploadDir);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Générer un nom de fichier unique
        String timestamp = String.valueOf(System.currentTimeMillis());
        String originalFilename = file.getOriginalFilename();
        String extension = "";

        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String fileName = timestamp + "_" + typeDocument + extension;
        Path filePath = uploadPath.resolve(fileName);

        // Sauvegarder le fichier
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return filePath.toString();
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