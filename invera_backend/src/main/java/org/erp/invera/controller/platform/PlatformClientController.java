package org.erp.invera.controller.platform;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.platform.clientsdto.ClientRegistrationRequest;
import org.erp.invera.model.platform.Client;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.erp.invera.service.docJusticatif.DocumentUploadService;
import org.erp.invera.service.erp.EmailService;
import org.erp.invera.service.platform.ClientPlatformService;
import org.erp.invera.service.platform.DatabaseCreationService;
import org.erp.invera.service.platform.OtpService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
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
    private final OtpService otpService ;
    private final ClientPlatformRepository clientRepository;
    private final DocumentUploadService documentUploadService;
    private final EmailService emailService;


    // ========== 1. INSCRIPTION ==========
// ========== 1. INSCRIPTION ==========

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody ClientRegistrationRequest request) {
        try {
            // 1. Créer le client avec les bons champs selon le type
            Client client = new Client();
            client.setEmail(request.getEmail());
            client.setTelephone(request.getTelephone());
            client.setTypeCompte(Client.TypeCompte.valueOf(request.getTypeCompte()));
            client.setTypeInscription(Client.TypeInscription.valueOf(request.getTypeInscription()));

            // 2. Remplir les champs selon le type de compte
            if (client.getTypeCompte() == Client.TypeCompte.ENTREPRISE) {
                // Pour une entreprise
                client.setRaisonSociale(request.getRaisonSociale());
                client.setMatriculeFiscal(request.getSiret());

                // Le nom par défaut = raison sociale
                client.setNom(request.getRaisonSociale());
                client.setPrenom(null);  // Pas de prénom pour entreprise

            } else {
                // Pour un particulier
                client.setNom(request.getNom());
                client.setPrenom(request.getPrenom());
            }

            // 3. Appeler le service de création
            Client newClient = clientService.createClient(client, request.getOtp(), request.getPassword());

            // 4. Construire la réponse
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("clientId", newClient.getId());
            response.put("statut", newClient.getStatut().getLabel());

            // Ajouter le nom affichable
            if (newClient.getTypeCompte() == Client.TypeCompte.ENTREPRISE) {
                response.put("raisonSociale", newClient.getRaisonSociale());
                response.put("MatriculeFiscal", newClient.getMatriculeFiscal());
            } else {
                response.put("nom", newClient.getNom());
                response.put("prenom", newClient.getPrenom());
            }

            // Message selon le type d'inscription
            if (newClient.getTypeInscription() == Client.TypeInscription.ESSAI) {
                response.put("message", "Inscription réussie. Vous pouvez vous connecter avec votre email et mot de passe.");
                response.put("connexionsRestantes", newClient.getConnexionsRestantes());
            } else {
                response.put("message", "Inscription réussie. En attente de validation des justificatifs par l'administrateur.");
            }

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur lors de l'inscription", e);
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
    /*@PostMapping("/verify-otp")
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
*/
    // ========== 2. UPLOAD JUSTIFICATIFS ==========

    /**
     * Upload des justificatifs avec chiffrement automatique
     * POST /api/platform/clients/{id}/justificatifs
     */
    @PostMapping(value = "/{id}/justificatifs", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<?> uploadJustificatifs(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("typeDocument") String typeDocument) {

        try {
            log.info("========== UPLOAD JUSTIFICATIF ==========");
            log.info("Client ID: {}", id);
            log.info("Type document: {}", typeDocument);
            log.info("Fichier reçu: {}", file.getOriginalFilename());
            log.info("Taille: {} bytes", file.getSize());

            // Vérifier que le fichier n'est pas vide
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Aucun fichier fourni"));
            }

            // Récupérer le client
            Client client = clientRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Client non trouvé"));

            // Vérifier que le client est bien en attente
            if (client.getStatut() != Client.StatutClient.EN_ATTENTE) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Le client n'est pas en attente de validation. Statut actuel: " + client.getStatut()
                ));
            }

            // Convertir le type document
            DocumentUploadService.DocumentType docType = mapToDocumentType(typeDocument);

            // Upload et chiffrement
            String encryptedPath = documentUploadService.uploadJustificatif(id, file, docType);
            log.info("✅ Fichier chiffré sauvegardé: {}", encryptedPath);

            // Mettre à jour l'URL dans l'entité
            updateDocumentUrl(client, docType, encryptedPath);

            // Sauvegarder
            Client savedClient = clientRepository.save(client);

            // Construire la réponse
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Justificatif soumis avec succès");
            response.put("statut", savedClient.getStatut().getLabel());
            response.put("typeDocument", typeDocument);
            response.put("fileUrl", encryptedPath);

            log.info("✅ Justificatif {} uploadé pour client {} (toujours en attente de validation)",
                    typeDocument, client.getEmail());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("❌ Erreur paramètre: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'upload: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }


    private boolean hasAllRequiredDocuments(Client client) {
        if (client.getTypeCompte() == Client.TypeCompte.ENTREPRISE) {
            return client.getGerantCinUrl() != null &&
                    client.getPatenteUrl() != null &&
                    client.getRneUrl() != null;
        } else {
            return client.getCinUrl() != null;
        }
    }

    private DocumentUploadService.DocumentType mapToDocumentType(String typeDocument) {
        return switch (typeDocument.toUpperCase()) {
            case "CIN" -> DocumentUploadService.DocumentType.CIN;
            case "GERANT_CIN", "CIN_GERANT" -> DocumentUploadService.DocumentType.GERANT_CIN;
            case "PATENTE" -> DocumentUploadService.DocumentType.PATENTE;
            case "RNE" -> DocumentUploadService.DocumentType.RNE;
            default -> throw new IllegalArgumentException("Type de document inconnu: " + typeDocument);
        };
    }

    private void updateDocumentUrl(Client client, DocumentUploadService.DocumentType type, String url) {
        switch (type) {
            case CIN -> client.setCinUrl(url);
            case GERANT_CIN -> client.setGerantCinUrl(url);
            case PATENTE -> client.setPatenteUrl(url);
            case RNE -> {
                client.setRneUrl(url);
            }
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

            // ✅ Envoyer l'email de validation avec lien de paiement
            String clientName = client.getTypeCompte() == Client.TypeCompte.ENTREPRISE
                    ? client.getRaisonSociale()
                    : (client.getPrenom() != null ? client.getPrenom() + " " + client.getNom() : client.getNom());

            emailService.sendValidationPaymentEmail(
                    client.getEmail(),
                    clientName,
                    client.getId()
            );

            log.info("📧 Email de validation/paiement envoyé à {}", client.getEmail());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Client validé avec succès. Un email a été envoyé au client pour procéder au paiement.");
            response.put("statut", client.getStatut().getLabel());

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

            // ✅ Envoyer l'email de refus (utiliser votre service existant)
            String clientName = client.getTypeCompte() == Client.TypeCompte.ENTREPRISE
                    ? client.getRaisonSociale()
                    : (client.getPrenom() != null ? client.getPrenom() + " " + client.getNom() : client.getNom());

            // Vous pouvez ajouter une méthode sendRefusalEmail dans EmailService
            // emailService.sendRefusalEmail(client.getEmail(), clientName, motif);

            log.info("📧 Email de refus à envoyer à {}", client.getEmail());

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
            Client client = clientService.getClientById(id);

            // ✅ Vérifier que le client est VALIDE avant activation
            if (client.getStatut() != Client.StatutClient.VALIDE) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Ce client n'est pas encore validé par l'administrateur. " +
                                "Statut actuel: " + client.getStatut().getLabel()
                ));
            }

            // ✅ Vérifier qu'un abonnement est souscrit
            if (client.getAbonnementActif() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Aucun abonnement souscrit. Veuillez d'abord choisir un plan."
                ));
            }

            // Créer la base de données
            DatabaseCreationService.DatabaseInfo dbInfo =
                    databaseCreationService.createClientDatabase(id);

            // Activer le client
            Client activatedClient = clientService.activateClient(id, dbInfo.dbName);

            // ✅ Envoyer email de bienvenue avec accès
            // emailService.sendWelcomeEmail(activatedClient.getEmail(), dbInfo);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Client activé avec succès",
                    "database", dbInfo.dbName,
                    "username", dbInfo.username,
                    "connectionUrl", dbInfo.connectionUrl,
                    "statut", activatedClient.getStatut().getLabel()
            ));

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