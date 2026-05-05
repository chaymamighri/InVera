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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/platform/clients")
@RequiredArgsConstructor
public class PlatformClientController {

    private final ClientPlatformService clientPlatformService;
    private final DatabaseCreationService databaseCreationService;
    private final OtpService otpService;
    private final ClientPlatformRepository clientRepository;
    private final DocumentUploadService documentUploadService;
    private final EmailService emailService;

    // ========== 1. INSCRIPTION ==========

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody ClientRegistrationRequest request) {
        try {
            // 1. Créer le client avec les informations de base
            Client client = new Client();
            client.setEmail(request.getEmail());
            client.setTelephone(request.getTelephone());
            client.setTypeCompte(Client.TypeCompte.valueOf(request.getTypeCompte()));
            client.setTypeInscription(Client.TypeInscription.valueOf(request.getTypeInscription()));

            // 2. Remplir les champs selon le type de compte
            if (client.getTypeCompte() == Client.TypeCompte.ENTREPRISE) {
                client.setRaisonSociale(request.getRaisonSociale());
                client.setMatriculeFiscal(request.getMatriculeFiscal());
                client.setNom(request.getNom());
                client.setPrenom(request.getPrenom());
            } else {
                client.setNom(request.getNom());
                client.setPrenom(request.getPrenom());
            }

            // TOUS les clients ont 30 connexions gratuites immédiatement
            client.setConnexionsMax(30);
            client.setConnexionsRestantes(30);
            client.setIsActive(true);

            // == DÉFINIR LE STATUT ET JUSTIFICATIFS ==
            if (client.getTypeInscription() == Client.TypeInscription.ESSAI) {
                // ESSAI : accès direct, pas de documents requis
                client.setStatut(Client.StatutClient.ACTIF);
                client.setJustificatifsValides(true);
                log.info("📝 ESSAI - Statut ACTIF, justificatifs non requis");
            } else {
                // DEFINITIF : en attente validation, documents requis
                client.setStatut(Client.StatutClient.EN_ATTENTE);
                client.setJustificatifsValides(false);
                log.info("📝 DEFINITIF - Statut EN_ATTENTE, justificatifs requis");
            }

            // 3. Appeler le service de création (qui ne crée PAS l'utilisateur)
            Client newClient = clientPlatformService.createClient(client, request.getOtp(), request.getPassword());

            // 4. ⚠️ Maintenant créer la base de données ET l'utilisateur admin
            databaseCreationService.createClientDatabaseWithAdmin(newClient.getId(), request.getPassword());

            // 5. Construire la réponse
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("clientId", newClient.getId());
            response.put("statut", newClient.getStatut().getLabel());
            response.put("connexionsRestantes", newClient.getConnexionsRestantes());
            response.put("typeInscription", newClient.getTypeInscription().name());
            response.put("justificatifsValides", newClient.getJustificatifsValides());

            // Ajouter le nom affichable
            if (newClient.getTypeCompte() == Client.TypeCompte.ENTREPRISE) {
                response.put("raisonSociale", newClient.getRaisonSociale());
                response.put("matriculeFiscal", newClient.getMatriculeFiscal());
            } else {
                response.put("nom", newClient.getNom());
                response.put("prenom", newClient.getPrenom());
            }

            // Message adapté
            if (newClient.getTypeInscription() == Client.TypeInscription.ESSAI) {
                response.put("message", "✅ Inscription réussie ! Vous disposez de 30 connexions gratuites pour découvrir la plateforme.");
            } else {
                response.put("message", "✅ Inscription réussie ! Vous disposez de 30 connexions gratuites en attendant la validation de vos documents par l'administrateur.");
            }

            log.info("Nouvelle inscription - Client: {} - Type: {} - Statut: {} - Justificatifs: {} - Connexions: {}",
                    newClient.getEmail(), newClient.getTypeInscription(),
                    newClient.getStatut(), newClient.getJustificatifsValides(),
                    newClient.getConnexionsRestantes());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("Erreur paramètre inscription: {}", e.getMessage());
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

            // Appeler directement OtpService
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

    // ========== 2. UPLOAD JUSTIFICATIFS ==========

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

            // Upload
            String filePath = documentUploadService.uploadJustificatif(id, file, docType);
            log.info("✅ Fichier sauvegardé: {}", filePath);

            // Mettre à jour l'URL dans l'entité
            updateDocumentUrl(client, docType, filePath);

            // Sauvegarder
            Client savedClient = clientRepository.save(client);

            // Construire la réponse
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Justificatif soumis avec succès");
            response.put("statut", savedClient.getStatut().getLabel());
            response.put("typeDocument", typeDocument);
            response.put("fileUrl", filePath);

            log.info("✅ Justificatif {} uploadé pour client {}", typeDocument, client.getEmail());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("❌ Erreur paramètre: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'upload: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/document/{type}")
    public ResponseEntity<?> getDocument(@PathVariable Long id, @PathVariable String type) {
        try {
            Client client = clientPlatformService.getClientById(id);
            String filePath = null;

            switch (type.toLowerCase()) {
                case "cin":
                    filePath = client.getCinUrl();
                    break;
                case "gerantcin":
                    filePath = client.getGerantCinUrl();
                    break;
                case "patente":
                    filePath = client.getPatenteUrl();
                    break;
                case "rne":
                    filePath = client.getRneUrl();
                    break;
                default:
                    return ResponseEntity.badRequest().body(Map.of("error", "Type de document inconnu"));
            }

            if (filePath == null || filePath.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // Lecture directe du fichier
            byte[] content = documentUploadService.getDocument(filePath);

            // Déterminer le type MIME
            String contentType = "application/pdf";
            if (filePath.toLowerCase().endsWith(".jpg") || filePath.toLowerCase().endsWith(".jpeg")) {
                contentType = "image/jpeg";
            } else if (filePath.toLowerCase().endsWith(".png")) {
                contentType = "image/png";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(content);

        } catch (Exception e) {
            log.error("Erreur chargement document: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllClients() {
        try {
            log.info("GET /api/platform/clients/all - Récupération de tous les clients");
            List<Client> allClients = clientPlatformService.getAllClients();
            return ResponseEntity.ok(allClients);
        } catch (Exception e) {
            log.error("Erreur getAllClients: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
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
            case RNE -> client.setRneUrl(url);
        }
    }

    @GetMapping("/definitif")
    public ResponseEntity<?> getDefinitifClients() {
        try {
            List<Client> allClients = clientPlatformService.getAllClients();
            List<Client> definitifClients = allClients.stream()
                    .filter(client -> client.getTypeInscription() == Client.TypeInscription.DEFINITIF)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(definitifClients);
        } catch (Exception e) {
            log.error("Erreur getDefinitifClients: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== 3. VALIDATION ADMIN ==========

    @PutMapping("/{id}/validate")
    public ResponseEntity<?> validateClient(@PathVariable Long id) {
        try {
            Client client = clientPlatformService.validateClientManually(id, "Validation par admin");

            String clientName = client.getTypeCompte() == Client.TypeCompte.ENTREPRISE
                    ? client.getRaisonSociale()
                    : (client.getPrenom() != null ? client.getPrenom() + " " + client.getNom() : client.getNom());

            emailService.sendValidationEmail(client.getEmail(), clientName, client.getId());

            log.info("📧 Client validé - Email de paiement envoyé à {}", client.getEmail());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Client validé avec succès. Un email a été envoyé pour le paiement.",
                    "clientId", client.getId(),
                    "statut", client.getStatut().getLabel()
            ));

        } catch (Exception e) {
            log.error("Erreur validation client: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/refuse")
    public ResponseEntity<?> refuseClient(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        try {
            String motif = request.get("motif");

            Client client = clientPlatformService.refuseClientManually(id, motif);

            String clientName = client.getTypeCompte() == Client.TypeCompte.ENTREPRISE
                    ? client.getRaisonSociale()
                    : (client.getPrenom() != null ? client.getPrenom() + " " + client.getNom() : client.getNom());

            emailService.sendRefusalEmail(client.getEmail(), clientName, motif);

            log.info("📧 Client refusé: {} - Motif: {}", client.getEmail(), motif);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Client refusé",
                    "clientId", client.getId(),
                    "motif", motif,
                    "statut", client.getStatut().getLabel()
            ));

        } catch (Exception e) {
            log.error("Erreur refus client: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== 4. ACTIVATION APRÈS PAIEMENT ==========

    @PostMapping("/{id}/activate-after-payment")
    public ResponseEntity<?> activateAfterPayment(
            @PathVariable Long id,
            @RequestParam Long offreId,
            @RequestParam(required = false) String transactionId) {

        try {
            Client activatedClient = clientPlatformService.activateAfterPayment(id, offreId);

            // Vérifier si la base existe déjà
            String dbName = "client_" + id;
            if (!databaseCreationService.databaseExists(dbName)) {
                DatabaseCreationService.DatabaseInfo dbInfo = databaseCreationService.createClientDatabaseWithAdmin(id, null);
                activatedClient.setNomBaseDonnees(dbInfo.dbName);
                clientPlatformService.saveClient(activatedClient);
            }

            log.info("💰 Client activé après paiement - ID: {} - Offre: {}", id, offreId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Paiement réussi, abonnement activé",
                    "clientId", activatedClient.getId(),
                    "statut", activatedClient.getStatut().getLabel()
            ));

        } catch (Exception e) {
            log.error("Erreur activation après paiement: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<?> getClientsByStatut(@PathVariable String statut) {
        List<Client> clients = clientPlatformService.getClientsByStatut(Client.StatutClient.valueOf(statut));
        return ResponseEntity.ok(clients);
    }

    @GetMapping("/pending")
    public ResponseEntity<?> getPendingClients() {
        List<Client> clients = clientPlatformService.getPendingValidationClients();
        return ResponseEntity.ok(clients);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getClient(@PathVariable Long id) {
        try {
            Client client = clientPlatformService.getClientById(id);
            return ResponseEntity.ok(client);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}