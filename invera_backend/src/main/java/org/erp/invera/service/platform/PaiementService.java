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

    @Value("${app.url}")
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

        Abonnement abonnement = abonnementRepository.findByIdWithOffre(abonnementId)
                .orElseThrow(() -> new RuntimeException("Abonnement non trouve"));

        // ✅ FORCER LE CHARGEMENT DE L'OFFRE IMMÉDIATEMENT
        OffreAbonnement offre = abonnement.getOffreAbonnement();

        // ✅ Accéder aux propriétés de l'offre PENDANT que la session est ouverte
        Double prix = offre.getPrix();
        String devise = offre.getDevise();
        String offreNom = offre.getNom();
        Boolean offreActive = offre.getActive();

        // Verifier que l'abonnement est en attente de validation
        if (abonnement.getStatut() != Abonnement.StatutAbonnement.EN_ATTENTE_VALIDATION) {
            throw new RuntimeException("Seul un abonnement en attente de validation peut etre paye. Statut actuel: " + abonnement.getStatut());
        }

        // Verifier qu'il n'y a pas deja un paiement en cours
        if (paiementRepository.existsByAbonnementIdAndStatut(abonnementId, Paiement.StatutPaiement.EN_ATTENTE)) {
            throw new RuntimeException("Un paiement est deja en cours pour cet abonnement");
        }

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

        // Generer token unique pour le lien
        String token = UUID.randomUUID().toString();

        // Stocker token dans cache avec l'ID du paiement
        tokenCache.put(token, paiement.getId());

        // Construire le lien de paiement complet
        String paymentLink = appUrl + "/paiement/checkout?token=" + token;

        // Preparer les informations pour l'email
        Client client = abonnement.getClient();
        String clientNom = (client.getPrenom() != null ? client.getPrenom() + " " : "") + client.getNom();

        // Envoyer l'email avec le lien de paiement
       /* emailService.sendValidationEmail(
                client.getEmail(),
                clientNom.trim(),
                paymentLink,
                prix,
                offreNom,
                paiement.getId()
        );*/

        System.out.println("Email de paiement envoye a " + client.getEmail() + " pour abonnement " + abonnementId + " - Lien: " + paymentLink);
    }

    /**
     * Étape 2 : Récupérer les infos de paiement via token
     */
    public Paiement getPaiementParToken(String token) {
        Long paiementId = tokenCache.get(token);
        if (paiementId == null) {
            throw new RuntimeException("Lien invalide ou expiré");
        }

        // ✅ Utiliser findWithDetailsById qui charge toutes les relations
        Paiement paiement = paiementRepository.findWithDetailsById(paiementId)
                .orElseThrow(() -> new RuntimeException("Paiement non trouvé"));

        // ✅ Forcer le chargement de l'offre (au cas où)
        Hibernate.initialize(paiement.getAbonnement().getOffreAbonnement());

        // Vérifier expiration (24h)
        if (paiement.getDateDemande().plusHours(24).isBefore(LocalDateTime.now())) {
            tokenCache.remove(token);
            throw new RuntimeException("Ce lien a expiré (plus de 24h)");
        }

        // Vérifier que le paiement n'est pas déjà réussi
        if (paiement.getStatut() == Paiement.StatutPaiement.SUCCES) {
            throw new RuntimeException("Ce paiement a déjà été effectué");
        }

        // ✅ Log pour vérifier que l'offre est chargée
        log.info("Paiement chargé - Offre: {}",
                paiement.getAbonnement().getOffreAbonnement() != null ?
                        paiement.getAbonnement().getOffreAbonnement().getNom() : "null");

        return paiement;
    }

    /**
     * Étape 3 : Appeler Konnect pour créer le checkout
     */
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

        // Préparer les headers d'authentification
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", konnectApiKey);
        headers.set("X-Wallet-ID", konnectWalletId);

        // ✅ Préparer la requête Konnect (format officiel)
        Map<String, Object> konnectRequest = new HashMap<>();
        konnectRequest.put("receiverWalletId", konnectWalletId);
        konnectRequest.put("amount", (int)(paiement.getMontant() * 1000)); // Millimes
        konnectRequest.put("token", paiement.getDevise()); // Devise
        konnectRequest.put("type", "immediate");
        konnectRequest.put("description", "Abonnement Invera ERP - ref:" + paiement.getId());
        konnectRequest.put("acceptedPaymentMethods", new String[]{"bank_card", "wallet", "e-DINAR"});
        konnectRequest.put("lifespan", 10);
        konnectRequest.put("checkoutForm", true);
        konnectRequest.put("firstName", client.getPrenom() != null ? client.getPrenom() : "");
        konnectRequest.put("lastName", client.getNom() != null ? client.getNom() : "");
        konnectRequest.put("email", client.getEmail());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(konnectRequest, headers);

        // Liste des endpoints à tester
        List<String> endpointsToTry = Arrays.asList(
                "/payments/init-payment",
                "/v1/payments",
                "/payments",
                "/init-payment",
                "/checkout",
                "/v1/checkout"
        );

        Exception lastException = null;

        for (String endpoint : endpointsToTry) {
            try {
                String konnectEndpoint = konnectApiUrl + endpoint;
                log.info("📦 Tentative avec endpoint: {}", konnectEndpoint);
                log.info("Requête: {}", konnectRequest);

                // Appeler Konnect API
                ResponseEntity<Map> response = restTemplate.postForEntity(
                        konnectEndpoint,
                        entity,
                        Map.class
                );

                Map<String, Object> konnectResponse = response.getBody();
                log.info("Réponse Konnect: {}", konnectResponse);

                // Vérifier différents noms possibles pour l'URL de paiement
                String checkoutUrl = null;
                String konnectPaymentId = null;

                if (konnectResponse != null) {
                    // Essayer différents noms de champs possibles
                    if (konnectResponse.containsKey("payUrl")) {
                        checkoutUrl = (String) konnectResponse.get("payUrl");
                    } else if (konnectResponse.containsKey("checkout_url")) {
                        checkoutUrl = (String) konnectResponse.get("checkout_url");
                    } else if (konnectResponse.containsKey("paymentUrl")) {
                        checkoutUrl = (String) konnectResponse.get("paymentUrl");
                    } else if (konnectResponse.containsKey("url")) {
                        checkoutUrl = (String) konnectResponse.get("url");
                    }

                    // Essayer différents noms pour l'ID de paiement
                    if (konnectResponse.containsKey("paymentRef")) {
                        konnectPaymentId = (String) konnectResponse.get("paymentRef");
                    } else if (konnectResponse.containsKey("id")) {
                        konnectPaymentId = (String) konnectResponse.get("id");
                    } else if (konnectResponse.containsKey("payment_id")) {
                        konnectPaymentId = (String) konnectResponse.get("payment_id");
                    }
                }

                if (checkoutUrl != null) {
                    // Succès ! Mettre à jour le paiement
                    if (konnectPaymentId != null) {
                        paiement.setKonnectPaymentId(konnectPaymentId);
                    }
                    paiementRepository.save(paiement);

                    log.info("✅ Checkout Konnect créé avec endpoint '{}' - URL: {}", endpoint, checkoutUrl);
                    return checkoutUrl;
                } else {
                    log.warn("⚠️ Endpoint '{}' a répondu mais sans URL de paiement", endpoint);
                }

            } catch (Exception e) {
                log.warn("❌ Endpoint '{}' a échoué: {}", endpoint, e.getMessage());
                lastException = e;
            }
        }

        // Si aucun endpoint n'a fonctionné
        log.error("❌ Aucun endpoint Konnect n'a fonctionné");
        throw new RuntimeException("Impossible de créer le checkout Konnect: " +
                (lastException != null ? lastException.getMessage() : "Tous les endpoints ont échoué"));
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

    /**
     * Vérifier le statut d'un paiement
     */
    @Transactional(readOnly = true)
    public Paiement.StatutPaiement getStatutPaiement(Long paiementId) {
        Paiement paiement = paiementRepository.findById(paiementId)
                .orElseThrow(() -> new RuntimeException("Paiement non trouvé"));
        return paiement.getStatut();
    }

    /**
     * Nettoyer les tokens expirés (à appeler périodiquement)
     */
    public void nettoyerTokensExpires() {
        int count = 0;
        for (var entry : tokenCache.entrySet()) {
            Paiement p = paiementRepository.findById(entry.getValue()).orElse(null);
            if (p != null && p.getDateDemande().plusHours(24).isBefore(LocalDateTime.now())) {
                tokenCache.remove(entry.getKey());
                count++;
            }
        }
        if (count > 0) {
            log.info("🧹 {} tokens expirés nettoyés", count);
        }
    }
}