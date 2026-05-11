package org.erp.invera.service.platform;

import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Abonnement;
import org.erp.invera.model.platform.Client;
import org.erp.invera.model.platform.OffreAbonnement;
import org.erp.invera.model.platform.Paiement;
import org.erp.invera.repository.platform.AbonnementRepository;
import org.erp.invera.repository.platform.PaiementRepository;
import org.erp.invera.service.erp.EmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import org.hibernate.Hibernate;

@Slf4j
@Service
public class PaiementService {

    private final PaiementRepository paiementRepository;
    private final AbonnementRepository abonnementRepository;
    private final SubscriptionService subscriptionService;
    private final RestTemplate restTemplate;
    private final EmailService emailService;

    // Cache pour stocker les tokens temporaires
    private final Map<String, Long> tokenCache = new ConcurrentHashMap<>();

    @Value("${konnect.api.key}")
    private String konnectApiKey;

    @Value("${konnect.api.url}")
    private String konnectApiUrl;

    @Value("${konnect.wallet.id}")
    private String konnectWalletId;

    @Value("${app.url:http://localhost:8081}")
    private String appUrl;

    public PaiementService(PaiementRepository paiementRepository,
                           AbonnementRepository abonnementRepository,
                           SubscriptionService subscriptionService,
                           EmailService emailService) {
        this.paiementRepository = paiementRepository;
        this.abonnementRepository = abonnementRepository;
        this.subscriptionService = subscriptionService;
        this.restTemplate = new RestTemplate();
        this.emailService = emailService;
    }
    /**
     * Etape 1 : Creer un paiement et envoyer email de validation avec lien de paiement
     */
    @Transactional
    public void initierPaiementParEmail(Long abonnementId) {

        System.out.println("=========================================");
        System.out.println("📧 DÉBUT initierPaiementParEmail");
        System.out.println("📧 Abonnement ID: " + abonnementId);
        System.out.println("=========================================");

        Abonnement abonnement = abonnementRepository.findByIdWithOffre(abonnementId)
                .orElseThrow(() -> new RuntimeException("Abonnement non trouve"));

        // ✅ FORCER LE CHARGEMENT DE L'OFFRE IMMÉDIATEMENT
        OffreAbonnement offre = abonnement.getOffreAbonnement();

        // ✅ Accéder aux propriétés de l'offre PENDANT que la session est ouverte
        Double prix = offre.getPrix();
        String devise = offre.getDevise();
        String offreNom = offre.getNom();
        Boolean offreActive = offre.getActive();

        System.out.println("📦 Offre: " + offreNom);
        System.out.println("💰 Prix: " + prix + " " + devise);
        System.out.println("✅ Offre active: " + offreActive);

        // Verifier que l'abonnement est en attente de validation
        if (abonnement.getStatut() != Abonnement.StatutAbonnement.EN_ATTENTE_VALIDATION) {
            throw new RuntimeException("Seul un abonnement en attente de validation peut etre paye. Statut actuel: " + abonnement.getStatut());
        }

        System.out.println("✅ Abonnement en attente de validation");

        // Verifier qu'il n'y a pas deja un paiement en cours
        if (paiementRepository.existsByAbonnementIdAndStatut(abonnementId, Paiement.StatutPaiement.EN_ATTENTE)) {
            throw new RuntimeException("Un paiement est deja en cours pour cet abonnement");
        }

        System.out.println("✅ Aucun paiement en cours existant");

        // Verifier que l'offre existe et est active
        if (offre == null) {
            throw new RuntimeException("Aucune offre associee a cet abonnement");
        }

        if (!offreActive) {
            throw new RuntimeException("L'offre associee n'est plus disponible");
        }

        // Creer le paiement
        Paiement paiement = new Paiement();
        paiement.setAbonnement(abonnement);
        paiement.setMontant(prix);
        paiement.setDevise(devise != null ? devise : "TND");
        paiement.setStatut(Paiement.StatutPaiement.EN_ATTENTE);
        paiement.setDateDemande(LocalDateTime.now());
        paiementRepository.save(paiement);

        System.out.println("✅ Paiement créé avec ID: " + paiement.getId());

        // Generer token unique pour le lien
        String token = UUID.randomUUID().toString();

        System.out.println("🔑 Token généré: " + token);

        // Stocker token dans cache avec l'ID du paiement
        tokenCache.put(token, paiement.getId());

        System.out.println("📊 Taille du cache après ajout: " + tokenCache.size());
        System.out.println("🔑 Tokens dans cache: " + tokenCache.keySet());

        // Construire le lien de paiement complet
        String paymentLink = appUrl + "/paiement/checkout?token=" + token;

        System.out.println("🔗 LIEN DE PAIEMENT: " + paymentLink);

        // Preparer les informations pour l'email
        Client client = abonnement.getClient();
        String clientNom = (client.getPrenom() != null ? client.getPrenom() + " " : "") + client.getNom();

        System.out.println("📧 Préparation envoi email à: " + client.getEmail());
        System.out.println("📧 Client nom: " + clientNom);

        // Envoyer l'email avec le lien de paiement
        emailService.sendValidationEmail(
                client.getEmail(),
                clientNom.trim(),
                paymentLink,
                prix,
                offreNom,
                paiement.getId()
        );

        System.out.println("📧 Email envoyé avec succès à " + client.getEmail());
        System.out.println("🔗 Lien dans l'email: " + paymentLink);
        System.out.println("=========================================");
        System.out.println("✅ FIN initierPaiementParEmail");
        System.out.println("=========================================");
    }
    /**
     * Étape 2 : Récupérer les infos de paiement via token
     */
    public Paiement getPaiementParToken(String token) {
        System.out.println("=========================================");
        System.out.println("🔍 getPaiementParToken - Recherche token: " + token);
        System.out.println("📊 Taille du cache: " + tokenCache.size());
        System.out.println("🔑 Tokens dans cache: " + tokenCache.keySet());

        Long paiementId = tokenCache.get(token);

        if (paiementId == null) {
            System.err.println("❌ Token NON trouvé dans le cache!");
            System.err.println("   Token recherché: " + token);
            System.err.println("   Tokens disponibles: " + tokenCache.keySet());
            throw new RuntimeException("Lien invalide ou expiré - Token: " + token);
        }

        System.out.println("✅ Token trouvé! Paiement ID: " + paiementId);

        // ✅ Utiliser findWithDetailsById qui charge toutes les relations
        Paiement paiement = paiementRepository.findWithDetailsById(paiementId)
                .orElseThrow(() -> new RuntimeException("Paiement non trouvé pour ID: " + paiementId));

        System.out.println("✅ Paiement chargé - Statut: " + paiement.getStatut());
        System.out.println("📅 Date demande: " + paiement.getDateDemande());

        // ✅ Forcer le chargement de l'offre (au cas où)
        Hibernate.initialize(paiement.getAbonnement().getOffreAbonnement());

        // Vérifier expiration (24h)
        if (paiement.getDateDemande().plusHours(24).isBefore(LocalDateTime.now())) {
            System.err.println("❌ Lien expiré! Date demande: " + paiement.getDateDemande());
            System.err.println("   Date expiration: " + paiement.getDateDemande().plusHours(24));
            System.err.println("   Date actuelle: " + LocalDateTime.now());
            tokenCache.remove(token);
            throw new RuntimeException("Ce lien a expiré (plus de 24h)");
        }

        System.out.println("✅ Lien valide - Pas expiré");

        // Vérifier que le paiement n'est pas déjà réussi
        if (paiement.getStatut() == Paiement.StatutPaiement.SUCCES) {
            System.err.println("❌ Paiement déjà effectué!");
            throw new RuntimeException("Ce paiement a déjà été effectué");
        }

        // ✅ Log pour vérifier que l'offre est chargée
        String offreNom = paiement.getAbonnement().getOffreAbonnement() != null ?
                paiement.getAbonnement().getOffreAbonnement().getNom() : "null";

        log.info("Paiement chargé - Offre: {}", offreNom);
        System.out.println("📦 Offre: " + offreNom);
        System.out.println("💰 Montant: " + paiement.getMontant() + " " + paiement.getDevise());
        System.out.println("=========================================");

        return paiement;
    }

    /**
     * Étape 3 : Appeler Konnect pour créer le checkout
     */
    @Transactional
    public String creerCheckoutKonnect(Long paiementId) {
        Paiement paiement = paiementRepository.findWithDetailsById(paiementId)
                .orElseThrow(() -> new RuntimeException("Paiement non trouvé"));

        // Vérifier que le paiement est en attente
        if (paiement.getStatut() != Paiement.StatutPaiement.EN_ATTENTE) {
            throw new RuntimeException("Ce paiement n'est plus en attente");
        }

        Client client = paiement.getAbonnement().getClient();

        // ✅ HEADERS : seulement x-api-key (pas X-Wallet-ID)
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", konnectApiKey);
        // ❌ NE PAS AJOUTER headers.set("X-Wallet-ID", konnectWalletId);

        // ✅ BODY : receiverWalletId est dans le body, pas dans les headers
        Map<String, Object> konnectRequest = new HashMap<>();
        konnectRequest.put("receiverWalletId", konnectWalletId);  // ← Ici dans le body
        konnectRequest.put("amount", (int)(paiement.getMontant() * 1000));
        konnectRequest.put("token", paiement.getDevise());
        konnectRequest.put("type", "immediate");
        konnectRequest.put("description", "Abonnement Invera ERP - ref:" + paiement.getId());
        konnectRequest.put("acceptedPaymentMethods", new String[]{"wallet", "bank_card", "e-DINAR"});
        konnectRequest.put("lifespan", 60);
        konnectRequest.put("checkoutForm", true);
        konnectRequest.put("firstName", client.getPrenom() != null ? client.getPrenom() : "");
        konnectRequest.put("lastName", client.getNom() != null ? client.getNom() : "");
        konnectRequest.put("email", client.getEmail());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(konnectRequest, headers);

        // ✅ Endpoint correct selon la documentation interactive
        String konnectEndpoint = konnectApiUrl + "/api/v2/payments/init-payment";

        try {
            log.info("📦 Appel Konnect: {}", konnectEndpoint);
            log.info("Requête: {}", konnectRequest);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    konnectEndpoint,
                    entity,
                    Map.class
            );

            Map<String, Object> konnectResponse = response.getBody();
            log.info("Réponse Konnect: {}", konnectResponse);

            if (konnectResponse != null && konnectResponse.containsKey("payUrl")) {
                String checkoutUrl = (String) konnectResponse.get("payUrl");

                // ✅ AJOUT : Sauvegarde du paymentRef pour le webhook
                String konnectPaymentId = (String) konnectResponse.get("paymentRef");
                if (konnectPaymentId != null) {
                    paiement.setKonnectPaymentId(konnectPaymentId);
                    paiementRepository.save(paiement);
                    log.info("💾 Konnect Payment ID sauvegardé: {}", konnectPaymentId);
                }

                log.info("✅ Checkout Konnect créé - URL: {}", checkoutUrl);
                return checkoutUrl;
            } else {
                throw new RuntimeException("Réponse Konnect sans payUrl: " + konnectResponse);
            }

        } catch (Exception e) {
            log.error("❌ Erreur appel Konnect: {}", e.getMessage(), e);
            throw new RuntimeException("Impossible de créer le checkout Konnect: " + e.getMessage());
        }
    }

    /**
     * Étape 4 : Webhook appelé par Konnect (confirmation)
     * Konnect envoie une requête GET avec payment_ref dans l'URL
     */
    @Transactional
    public void traiterWebhookKonnect(String paymentRef) {
        log.info("📨 Traitement webhook Konnect - payment_ref: {}", paymentRef);

        // 1. Récupérer le paiement via konnectPaymentId
        Paiement paiement = paiementRepository.findByKonnectPaymentId(paymentRef)
                .orElseThrow(() -> new RuntimeException("Paiement non trouvé pour payment_ref: " + paymentRef));

        // 2. Vérifier que le paiement est en attente
        if (paiement.getStatut() != Paiement.StatutPaiement.EN_ATTENTE) {
            log.info("Paiement déjà traité (statut: {}), webhook ignoré", paiement.getStatut());
            return;
        }

        // 3. Marquer le paiement comme réussi
        paiement.setStatut(Paiement.StatutPaiement.SUCCES);
        paiement.setDateConfirmation(LocalDateTime.now());
        paiementRepository.save(paiement);

        // 4. Activer l'abonnement
        Long abonnementId = paiement.getAbonnement().getId();
        subscriptionService.activateAfterPayment(abonnementId);

        log.info("✅ Paiement et abonnement activés - Paiement ID: {}, Abonnement ID: {}",
                paiement.getId(), abonnementId);
    }


    // Récupérer tous les paiements avec relations
    public List<Paiement> getAllPaiements() {
        return paiementRepository.findAllWithRelations();
    }

    @Transactional(readOnly = true)
    public Paiement getPaiementById(Long id) {
        System.out.println("🔍 Recherche paiement ID: " + id);
        Paiement paiement = paiementRepository.findByIdWithAllRelations(id)
                .orElseThrow(() -> new RuntimeException("Paiement non trouvé avec l'ID: " + id));

        System.out.println("✅ Paiement trouvé: " + paiement.getId());
        System.out.println("   - Abonnement: " + (paiement.getAbonnement() != null));
        if (paiement.getAbonnement() != null) {
            System.out.println("   - Client: " + (paiement.getAbonnement().getClient() != null));
            if (paiement.getAbonnement().getClient() != null) {
                System.out.println("   - Nom client: " + paiement.getAbonnement().getClient().getNom());
            }
            System.out.println("   - Offre: " + (paiement.getAbonnement().getOffreAbonnement() != null));
        }

        return paiement;
    }
}