package org.erp.invera.controller.platform;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.platform.clientsdto.ClientRegistrationRequest;
import org.erp.invera.dto.platform.clientsdto.ClientResponseDTO;
import org.erp.invera.model.platform.Abonnement;
import org.erp.invera.model.platform.Abonnement.StatutAbonnement;
import org.erp.invera.model.platform.Client;
import org.erp.invera.model.platform.OffreAbonnement;
import org.erp.invera.repository.platform.AbonnementRepository;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.erp.invera.repository.platform.OffreAbonnementRepository;
import org.erp.invera.service.docJusticatif.DocumentUploadService;
import org.erp.invera.service.erp.EmailService;
import org.erp.invera.service.platform.*;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
    private final AbonnementRepository  abonnementRepository;
    private final OffreAbonnementRepository  offreAbonnementRepository;
    private final SubscriptionService  subscriptionService;
    private final PaiementService paiementService;

    // ========== 1. INSCRIPTION ==========
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @ModelAttribute ClientRegistrationRequest request,
            @RequestParam Map<String, MultipartFile> allFiles) {
        try {
            log.info("========== REQUÊTE D'INSCRIPTION REÇUE ==========");

            // ✅ 0. RÉCUPÉRATION DU LOGO DEPUIS LES PARAMÈTRES
            MultipartFile logoFile = null;
            Map<String, MultipartFile> documents = new HashMap<>();

            for (Map.Entry<String, MultipartFile> entry : allFiles.entrySet()) {
                String key = entry.getKey();
                MultipartFile file = entry.getValue();

                if (file != null && !file.isEmpty()) {
                    if (key.equals("logo")) {
                        logoFile = file;
                        log.info("✅ Logo trouvé: {}", file.getOriginalFilename());
                    } else if (key.startsWith("documents[") && key.endsWith("]")) {
                        String docType = key.substring(10, key.length() - 1);
                        documents.put(docType, file);
                        log.info("✅ Document trouvé - Type: {}, Fichier: {}", docType, file.getOriginalFilename());
                    }
                }
            }

            // ✅ 1. VALIDATION ET CORRECTION DES CHAMPS OBLIGATOIRES
            String email = request.getEmail();
            String telephone = request.getTelephone();
            String password = request.getPassword();
            String nom = request.getNom();
            String prenom = request.getPrenom();
            String raisonSociale = request.getRaisonSociale();
            String matriculeFiscal = request.getMatriculeFiscal();

            // Corriger les valeurs "undefined"
            if (email == null || email.equals("undefined") || email.isEmpty()) {
                log.error("❌ Email invalide: '{}'", email);
                return ResponseEntity.badRequest().body(Map.of("error", "L'email est requis"));
            }

            if (telephone == null || telephone.equals("undefined") || telephone.isEmpty()) {
                log.warn("⚠️ Téléphone invalide: '{}', sera corrigé", telephone);
                telephone = "";
            }

            if (password == null || password.equals("undefined") || password.isEmpty()) {
                log.error("❌ Mot de passe invalide");
                return ResponseEntity.badRequest().body(Map.of("error", "Le mot de passe est requis"));
            }

            if (nom == null || nom.equals("undefined")) {
                nom = "";
            }

            if (prenom == null || prenom.equals("undefined")) {
                prenom = "";
            }

            if (raisonSociale == null || raisonSociale.equals("undefined")) {
                raisonSociale = "";
            }

            if (matriculeFiscal == null || matriculeFiscal.equals("undefined")) {
                matriculeFiscal = "";
            }

            log.info("📝 Email validé: {}", email);
            log.info("📝 Téléphone: {}", telephone);
            log.info("📝 Nom: {}", nom);
            log.info("📝 Prénom: {}", prenom);

            // ✅ 2. VALIDATION ET CORRECTION DES VALEURS DES ENUMS
            String typeCompteStr = request.getTypeCompte();
            String typeInscriptionStr = request.getTypeInscription();

            // Vérifier et corriger typeCompte
            if (typeCompteStr == null || typeCompteStr.equals("undefined") || typeCompteStr.isEmpty()) {
                log.warn("⚠️ typeCompte invalide: '{}', forcé à PARTICULIER", typeCompteStr);
                typeCompteStr = "PARTICULIER";
            }

            // Vérifier et corriger typeInscription
            if (typeInscriptionStr == null || typeInscriptionStr.equals("undefined") || typeInscriptionStr.isEmpty()) {
                log.warn("⚠️ typeInscription invalide: '{}', forcé à ESSAI", typeInscriptionStr);
                typeInscriptionStr = "ESSAI";
            }

            // Vérifier que les valeurs sont bien dans les enums
            boolean isValidTypeCompte = false;
            for (Client.TypeCompte type : Client.TypeCompte.values()) {
                if (type.name().equals(typeCompteStr)) {
                    isValidTypeCompte = true;
                    break;
                }
            }
            if (!isValidTypeCompte) {
                log.warn("⚠️ typeCompte inconnu: '{}', forcé à PARTICULIER", typeCompteStr);
                typeCompteStr = "PARTICULIER";
            }

            boolean isValidTypeInscription = false;
            for (Client.TypeInscription type : Client.TypeInscription.values()) {
                if (type.name().equals(typeInscriptionStr)) {
                    isValidTypeInscription = true;
                    break;
                }
            }
            if (!isValidTypeInscription) {
                log.warn("⚠️ typeInscription inconnu: '{}', forcé à ESSAI", typeInscriptionStr);
                typeInscriptionStr = "ESSAI";
            }

            log.info("📝 Valeurs corrigées - typeCompte: {}, typeInscription: {}", typeCompteStr, typeInscriptionStr);

            // 3. Créer le client avec les informations de base
            Client client = new Client();
            client.setEmail(email);
            client.setTelephone(telephone);
            client.setTypeCompte(Client.TypeCompte.valueOf(typeCompteStr));
            client.setTypeInscription(Client.TypeInscription.valueOf(typeInscriptionStr));

            // 4. Remplir les champs selon le type de compte
            if (client.getTypeCompte() == Client.TypeCompte.ENTREPRISE) {
                client.setRaisonSociale(raisonSociale);
                client.setMatriculeFiscal(matriculeFiscal);
                client.setNom(nom);
                client.setPrenom(prenom);
            } else {
                client.setNom(nom);
                client.setPrenom(prenom);
            }

            // TOUS les clients ont 30 connexions gratuites immédiatement
            client.setConnexionsMax(30);
            client.setConnexionsRestantes(30);
            client.setIsActive(true);

            // ✅ Récupérer l'offreId si présent
            Long offreId = request.getOffreId();
            OffreAbonnement offreChoisie = null;

            if (offreId != null && offreId > 0) {
                offreChoisie = offreAbonnementRepository.findById(offreId)
                        .orElseThrow(() -> new RuntimeException("Offre non trouvée avec ID: " + offreId));
                log.info("📦 Offre sélectionnée: {} - {} mois - {} TND",
                        offreChoisie.getNom(), offreChoisie.getDureeMois(), offreChoisie.getPrix());
            }

            // == DÉFINIR LE STATUT ET JUSTIFICATIFS ==
            if (client.getTypeInscription() == Client.TypeInscription.ESSAI) {
                client.setStatut(Client.StatutClient.ACTIF);
                client.setJustificatifsValides(true);
                log.info("📝 ESSAI - Statut ACTIF, justificatifs non requis");
            } else {
                client.setStatut(Client.StatutClient.EN_ATTENTE);
                client.setJustificatifsValides(false);
                log.info("📝 DEFINITIF - Statut EN_ATTENTE, justificatifs requis");
            }

            // 5. Créer le client AVEC le logo (si fourni)
            Client newClient = clientPlatformService.createClient(client, password, logoFile);

            // ✅ 6. Upload des documents si présents et si client DEFINITIF
            if (newClient.getTypeInscription() == Client.TypeInscription.DEFINITIF && !documents.isEmpty()) {
                log.info("📤 Upload des {} document(s) pour le client: {}", documents.size(), newClient.getEmail());

                for (Map.Entry<String, MultipartFile> docEntry : documents.entrySet()) {
                    String docType = docEntry.getKey();
                    MultipartFile docFile = docEntry.getValue();

                    try {
                        DocumentUploadService.DocumentType docTypeEnum = mapToDocumentType(docType);
                        String filePath = documentUploadService.uploadJustificatif(newClient.getId(), docFile, docTypeEnum);
                        updateDocumentUrl(newClient, docTypeEnum, filePath);
                        log.info("✅ Document {} uploadé avec succès", docType);
                    } catch (Exception e) {
                        log.error("❌ Erreur upload document {}: {}", docType, e.getMessage());
                    }
                }

                // Sauvegarder les URLs des documents
                clientRepository.save(newClient);
            }

            // ✅ 7. CRÉER L'ABONNEMENT via le service
            if (offreChoisie != null && newClient.getTypeInscription() == Client.TypeInscription.DEFINITIF) {
                subscriptionService.createSubscriptionFromOffer(newClient.getId(), offreChoisie.getId());
                log.info("✅ Demande d'abonnement créée pour client {} avec offre {}",
                        newClient.getEmail(), offreChoisie.getNom());
            }

            // 8. Créer la base de données ET l'utilisateur admin
            databaseCreationService.createClientDatabaseWithAdmin(newClient.getId(), password);

            // 9. Construire la réponse
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("clientId", newClient.getId());
            response.put("statut", newClient.getStatut().getLabel());
            response.put("connexionsRestantes", newClient.getConnexionsRestantes());
            response.put("typeInscription", newClient.getTypeInscription().name());
            response.put("justificatifsValides", newClient.getJustificatifsValides());

            if (newClient.getLogoUrl() != null) {
                response.put("logoUrl", newClient.getLogoUrl());
            }

            if (offreChoisie != null) {
                response.put("offreDemande", Map.of(
                        "id", offreChoisie.getId(),
                        "nom", offreChoisie.getNom(),
                        "dureeMois", offreChoisie.getDureeMois(),
                        "prix", offreChoisie.getPrix()
                ));
            }

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
                if (offreChoisie != null) {
                    response.put("message", "✅ Inscription réussie ! Votre demande d'abonnement " + offreChoisie.getNom() +
                            " est en attente de validation. Vous disposez de 30 connexions gratuites en attendant.");
                } else {
                    response.put("message", "✅ Inscription réussie ! Vous disposez de 30 connexions gratuites en attendant la validation de vos documents par l'administrateur.");
                }
            }

            log.info("✅ Inscription réussie - Client: {} - Type: {} - Statut: {} - Connexions: {}",
                    newClient.getEmail(), newClient.getTypeInscription(),
                    newClient.getStatut(), newClient.getConnexionsRestantes());

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

    // ✅ AJOUTEZ CET ENDPOINT
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");

        log.info("🔍 Vérification OTP pour email: {}", email);
        log.info("🔍 Code reçu: {}", code);

        boolean isValid = otpService.verifyOtp(email, code);

        if (isValid) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Code OTP valide"
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Code OTP invalide ou expiré"
            ));
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

    @GetMapping("/all")
    public ResponseEntity<?> getAllClients() {
        try {
            log.info("GET /api/platform/clients/all - Récupération de tous les clients");

            List<Client> clients = clientRepository.findAll();

            List<ClientResponseDTO> clientDTOs = clients.stream().map(client -> {
                ClientResponseDTO dto = ClientResponseDTO.builder()
                        .id(client.getId())
                        .nom(client.getNom())
                        .prenom(client.getPrenom())
                        .email(client.getEmail())
                        .telephone(client.getTelephone())
                        .raisonSociale(client.getRaisonSociale())
                        .matriculeFiscal(client.getMatriculeFiscal())
                        .typeCompte(client.getTypeCompte() != null ? client.getTypeCompte().name() : null)
                        .typeInscription(client.getTypeInscription() != null ? client.getTypeInscription().name() : null)
                        .statut(client.getStatut() != null ? client.getStatut().name() : null)
                        .dateInscription(client.getDateInscription())
                        .createdAt(client.getCreatedAt())
                        .motifRefus(client.getMotifRefus())
                        .cinUrl(client.getCinUrl())
                        .gerantCinUrl(client.getGerantCinUrl())
                        .patenteUrl(client.getPatenteUrl())
                        .rneUrl(client.getRneUrl())
                        .isActive(client.getIsActive())
                        .connexionsRestantes(client.getConnexionsRestantes())
                        .connexionsMax(client.getConnexionsMax())
                        .build();

                // Récupérer tous les abonnements du client triés par date de début DESC
                List<Abonnement> abonnements = abonnementRepository.findByClientIdOrderByDateDebutDesc(client.getId());

                Abonnement abonnementPertinent = null;

                // 1. Priorité à l'abonnement ACTIF
                for (Abonnement ab : abonnements) {
                    if (ab.getStatut() == Abonnement.StatutAbonnement.ACTIF) {
                        abonnementPertinent = ab;
                        break;
                    }
                }

                // 2. Sinon abonnement EN_ATTENTE_VALIDATION
                if (abonnementPertinent == null) {
                    for (Abonnement ab : abonnements) {
                        if (ab.getStatut() == Abonnement.StatutAbonnement.EN_ATTENTE_VALIDATION) {
                            abonnementPertinent = ab;
                            break;
                        }
                    }
                }

                // 3. Sinon abonnement SUSPENDU
                if (abonnementPertinent == null) {
                    for (Abonnement ab : abonnements) {
                        if (ab.getStatut() == Abonnement.StatutAbonnement.SUSPENDU) {
                            abonnementPertinent = ab;
                            break;
                        }
                    }
                }

                // 4. Sinon le plus récent (ANNULE ou EXPIRE)
                if (abonnementPertinent == null && !abonnements.isEmpty()) {
                    abonnementPertinent = abonnements.get(0);
                }

                // Ajouter l'offre au DTO si trouvée
                if (abonnementPertinent != null) {
                    OffreAbonnement offre = abonnementPertinent.getOffreAbonnement();
                    if (offre != null) {
                        Map<String, Object> offreInfo = new HashMap<>();
                        offreInfo.put("id", offre.getId());
                        offreInfo.put("nom", offre.getNom());
                        offreInfo.put("dureeMois", offre.getDureeMois());
                        offreInfo.put("prix", offre.getPrix());
                        offreInfo.put("devise", offre.getDevise());
                        offreInfo.put("statutAbonnement", abonnementPertinent.getStatut().name());
                        offreInfo.put("dateDebut", abonnementPertinent.getDateDebut());
                        offreInfo.put("dateFin", abonnementPertinent.getDateFin());
                        dto.setOffreDemande(offreInfo);

                        log.debug("✅ Offre trouvée pour client {}: {} ({})",
                                client.getId(), offre.getNom(), abonnementPertinent.getStatut());
                    }
                }

                return dto;
            }).collect(Collectors.toList());

            log.info("✅ {} client(s) récupéré(s)", clientDTOs.size());
            return ResponseEntity.ok(clientDTOs);

        } catch (Exception e) {
            log.error("❌ Erreur getAllClients: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> convertClientToMap(Client client) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", client.getId());
        map.put("email", client.getEmail());
        map.put("telephone", client.getTelephone());
        map.put("nom", client.getNom());
        map.put("prenom", client.getPrenom());
        map.put("raisonSociale", client.getRaisonSociale());
        map.put("matriculeFiscal", client.getMatriculeFiscal());
        map.put("typeCompte", client.getTypeCompte().toString());
        map.put("typeInscription", client.getTypeInscription().toString());
        map.put("statut", client.getStatut().toString());
        map.put("connexionsMax", client.getConnexionsMax());
        map.put("connexionsRestantes", client.getConnexionsRestantes());
        map.put("justificatifsValides", client.getJustificatifsValides());
        map.put("motifRefus", client.getMotifRefus());
        map.put("dateInscription", client.getDateInscription());
        map.put("createdAt", client.getCreatedAt());
        map.put("cinUrl", client.getCinUrl());
        map.put("gerantCinUrl", client.getGerantCinUrl());
        map.put("patenteUrl", client.getPatenteUrl());
        map.put("rneUrl", client.getRneUrl());
        return map;
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
    public ResponseEntity<?> validateClient(@PathVariable Long id,
                                            @RequestBody(required = false) Map<String, String> body) {
        try {
            log.info("🔍 Validation des documents du client ID: {}", id);

            String adminComment = body != null ? body.get("comment") : null;

            // 1. Valider le client
            Client validatedClient = clientPlatformService.validateClientManually(id, adminComment);

            // 2. Si client DEFINITIF, déclencher le paiement
            if (validatedClient.getTypeInscription() == Client.TypeInscription.DEFINITIF) {

                // Récupérer l'abonnement en attente
                Abonnement abonnement = abonnementRepository
                        .findByClientIdAndStatut(validatedClient.getId(), Abonnement.StatutAbonnement.EN_ATTENTE_VALIDATION)
                        .orElseThrow(() -> new RuntimeException("Aucun abonnement en attente trouvé"));

                // ✅ Déclencher le paiement (envoi email)
                paiementService.initierPaiementParEmail(abonnement.getId());

                log.info("📧 Email de paiement envoyé à {}", validatedClient.getEmail());

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Client validé. Un email de paiement a été envoyé au client.",
                        "clientId", validatedClient.getId(),
                        "statut", validatedClient.getStatut().getLabel()
                ));
            } else {
                // Client ESSAI
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Client ESSAI validé avec succès.",
                        "clientId", validatedClient.getId(),
                        "statut", validatedClient.getStatut().getLabel()
                ));
            }

        } catch (IllegalStateException e) {
            log.error("Erreur validation: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur inattendue: {}", e.getMessage(), e);
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