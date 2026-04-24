package org.erp.invera.service.platform;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.platform.abonnementdto.AbonnementResponse;
import org.erp.invera.model.platform.Abonnement;
import org.erp.invera.model.platform.Client;
import org.erp.invera.model.platform.OffreAbonnement;
import org.erp.invera.repository.platform.AbonnementRepository;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.erp.invera.service.erp.EmailService;  // ← AJOUTER L'IMPORT
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final AbonnementRepository abonnementRepository;
    private final ClientPlatformService clientService;
    private final OffreAbonnementService offreAbonnementService;
    private final ClientPlatformRepository clientRepository;
    private final EmailService emailService;

    // ==================== METHODES DE LECTURE ====================

    @Transactional(readOnly = true)
    public List<AbonnementResponse> getAllSubscriptions(String statut) {
        List<Abonnement> abonnements;
        if (statut == null || statut.isBlank()) {
            abonnements = abonnementRepository.findAllByOrderByDateDebutDesc();
        } else {
            abonnements = abonnementRepository.findByStatutOrderByDateDebutDesc(
                    Abonnement.StatutAbonnement.valueOf(statut.toUpperCase())
            );
        }
        return abonnements.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AbonnementResponse> getSubscriptionsByClient(Long clientId) {
        clientService.getClientById(clientId);
        return abonnementRepository.findByClientIdOrderByDateDebutDesc(clientId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AbonnementResponse getSubscriptionById(Long abonnementId) {
        return toResponse(getSubscriptionEntity(abonnementId));
    }

    @Transactional(readOnly = true)
    public Abonnement getSubscriptionEntity(Long abonnementId) {
        return abonnementRepository.findById(abonnementId)
                .orElseThrow(() -> new RuntimeException("Abonnement non trouvé"));
    }

    // ==================== CREATION D'ABONNEMENT ====================

    /**
     * Crée un abonnement APRÈS paiement réussi
     * À appeler uniquement quand le client a payé
     */
    @Transactional
    public AbonnementResponse createSubscriptionFromOffer(Long clientId, Long offreId) {
        // Récupérer l'offre (vérifie que l'offre existe et est active)
        OffreAbonnement offre = offreAbonnementService.getAvailableOfferEntityById(offreId);

        // Récupérer le client
        Client client = clientService.getClientById(clientId);

        // Vérifier qu'il n'a pas déjà un abonnement actif
        assertNoActiveSubscription(clientId);

        // Créer l'abonnement
        Abonnement abonnement = Abonnement.builder()
                .client(client)
                .offreAbonnement(offre)
                .dateDebut(LocalDateTime.now())
                .dateFin(LocalDateTime.now().plusMonths(offre.getDureeMois()))
                .statut(Abonnement.StatutAbonnement.ACTIF)
                .build();

        Abonnement saved = abonnementRepository.save(abonnement);

        // Mettre à jour le client
        applyActiveSubscriptionToClient(client, saved);

        // ⭐ ENVOYER EMAIL DE CONFIRMATION D'ABONNEMENT
        String clientNom = (client.getPrenom() != null ? client.getPrenom() + " " : "") + client.getNom();
        emailService.sendSubscriptionConfirmation(
                client.getEmail(),
                clientNom.trim(),
                offre.getNom(),
                saved.getDateFin()
        );

        log.info("Abonnement créé pour client {} - Offre: {} - Durée: {} mois - Prix: {} {} - Expiration: {}",
                client.getEmail(), offre.getNom(), offre.getDureeMois(),
                offre.getPrix(), offre.getDevise(), saved.getDateFin());

        return toResponse(saved);
    }

    // ==================== TÂCHE PLANIFIÉE : EXPIRATION ====================

    /**
     * Vérifie les abonnements expirés et désactive l'accès
     * À exécuter quotidiennement via @Scheduled(cron = "0 0 1 * * ?") à 1h du matin
     */
    @Transactional
    public void checkAndExpireSubscriptions() {
        LocalDateTime now = LocalDateTime.now();

        // Trouver les abonnements actifs qui ont expiré
        List<Abonnement> expiredSubscriptions = abonnementRepository.findByStatutAndDateFinBefore(
                Abonnement.StatutAbonnement.ACTIF, now
        );

        log.info("Vérification des abonnements expirés : {} abonnements trouvés", expiredSubscriptions.size());

        for (Abonnement abonnement : expiredSubscriptions) {
            // Passer le statut à EXPIRE
            abonnement.setStatut(Abonnement.StatutAbonnement.EXPIRE);
            abonnementRepository.save(abonnement);

            // Désactiver l'accès du client
            Client client = abonnement.getClient();
            client.setAbonnementActif(null);
            client.setStatut(Client.StatutClient.INACTIF);
            client.setIsActive(false);
            clientRepository.save(client);

            // ⭐ ENVOYER EMAIL D'EXPIRATION
            String clientNom = (client.getPrenom() != null ? client.getPrenom() + " " : "") + client.getNom();
            emailService.sendExpirationNotice(
                    client.getEmail(),
                    clientNom.trim(),
                    abonnement.getOffreAbonnement().getNom()
            );

            log.warn("Abonnement expiré pour client {} (ID: {}) - Fin le {}",
                    client.getEmail(), client.getId(), abonnement.getDateFin());
        }
    }

    /**
     * Envoie des rappels d'expiration (à appeler par un CRON séparé)
     */
    @Transactional(readOnly = true)
    public void sendExpirationReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = now.withHour(23).withMinute(59).withSecond(59);

        // 1. Abonnements qui expirent AUJOURD'HUI (J-0)
        List<Abonnement> expiringToday = abonnementRepository
                .findByStatutAndDateFinBetween(
                        Abonnement.StatutAbonnement.ACTIF,
                        startOfDay,
                        endOfDay
                );

        for (Abonnement abonnement : expiringToday) {
            Client client = abonnement.getClient();
            String clientNom = (client.getPrenom() != null ? client.getPrenom() + " " : "") + client.getNom();

            // ⭐ ENVOYER EMAIL RAPPEL URGENT (J-0)
            emailService.sendExpirationReminder(
                    client.getEmail(),
                    clientNom.trim(),
                    abonnement.getOffreAbonnement().getNom(),
                    abonnement.getDateFin(),
                    0  // 0 jour restant
            );

            log.info("⚠️ RAPPEL URGENT - Abonnement expire AUJOURD'HUI pour client {}",
                    client.getEmail());
        }

        // 2. Abonnements qui expirent DEMAIN (J-1)
        LocalDateTime tomorrowStart = now.plusDays(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime tomorrowEnd = now.plusDays(1).withHour(23).withMinute(59).withSecond(59);

        List<Abonnement> expiringTomorrow = abonnementRepository
                .findByStatutAndDateFinBetween(
                        Abonnement.StatutAbonnement.ACTIF,
                        tomorrowStart,
                        tomorrowEnd
                );

        for (Abonnement abonnement : expiringTomorrow) {
            Client client = abonnement.getClient();
            String clientNom = (client.getPrenom() != null ? client.getPrenom() + " " : "") + client.getNom();

            // ⭐ ENVOYER EMAIL RAPPEL J-1
            emailService.sendExpirationReminder(
                    client.getEmail(),
                    clientNom.trim(),
                    abonnement.getOffreAbonnement().getNom(),
                    abonnement.getDateFin(),
                    1
            );

            log.info("📧 Rappel J-1 pour client {}", client.getEmail());
        }

        // 3. Abonnements qui expirent dans 7 jours (J-7)
        LocalDateTime in7DaysStart = now.plusDays(7).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime in7DaysEnd = now.plusDays(7).withHour(23).withMinute(59).withSecond(59);

        List<Abonnement> expiringIn7Days = abonnementRepository
                .findByStatutAndDateFinBetween(
                        Abonnement.StatutAbonnement.ACTIF,
                        in7DaysStart,
                        in7DaysEnd
                );

        for (Abonnement abonnement : expiringIn7Days) {
            Client client = abonnement.getClient();
            String clientNom = (client.getPrenom() != null ? client.getPrenom() + " " : "") + client.getNom();

            // ⭐ ENVOYER EMAIL RAPPEL J-7
            emailService.sendExpirationReminder(
                    client.getEmail(),
                    clientNom.trim(),
                    abonnement.getOffreAbonnement().getNom(),
                    abonnement.getDateFin(),
                    7
            );

            log.info("📧 Rappel J-7 pour client {}", client.getEmail());
        }
    }

    // ==================== GESTION PAR ADMIN ====================

    /**
     * Suspendre un abonnement (admin seulement)
     */
    @Transactional
    public AbonnementResponse suspendSubscription(Long abonnementId, String motif) {
        Abonnement abonnement = getSubscriptionEntity(abonnementId);

        if (abonnement.getStatut() != Abonnement.StatutAbonnement.ACTIF) {
            throw new RuntimeException("Seul un abonnement actif peut être suspendu");
        }

        abonnement.setStatut(Abonnement.StatutAbonnement.SUSPENDU);
        abonnementRepository.save(abonnement);

        deactivateClientAccess(abonnement.getClient());

        log.warn("Abonnement suspendu pour client {} - Motif: {}",
                abonnement.getClient().getEmail(), motif);
        return toResponse(abonnement);
    }

    /**
     * Réactiver un abonnement suspendu (admin seulement)
     */
    @Transactional
    public AbonnementResponse reactivateSubscription(Long abonnementId) {
        Abonnement abonnement = getSubscriptionEntity(abonnementId);

        if (abonnement.getStatut() != Abonnement.StatutAbonnement.SUSPENDU) {
            throw new RuntimeException("Seul un abonnement suspendu peut être réactivé");
        }

        // Vérifier que la date n'est pas dépassée
        if (abonnement.getDateFin().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Impossible de réactiver: abonnement expiré");
        }

        abonnement.setStatut(Abonnement.StatutAbonnement.ACTIF);
        abonnementRepository.save(abonnement);

        applyActiveSubscriptionToClient(abonnement.getClient(), abonnement);

        log.info("Abonnement réactivé pour client {}", abonnement.getClient().getEmail());
        return toResponse(abonnement);
    }

    /**
     * Annuler un abonnement (admin seulement)
     */
    @Transactional
    public AbonnementResponse cancelSubscription(Long abonnementId, String motif) {
        Abonnement abonnement = getSubscriptionEntity(abonnementId);

        abonnement.setStatut(Abonnement.StatutAbonnement.ANNULE);
        abonnementRepository.save(abonnement);

        deactivateClientAccess(abonnement.getClient());

        log.info("Abonnement annulé par admin pour client {} - Motif: {}",
                abonnement.getClient().getEmail(), motif);
        return toResponse(abonnement);
    }

    // ==================== MÉTHODES PRIVÉES ====================

    private void assertNoActiveSubscription(Long clientId) {
        if (abonnementRepository.existsByClientIdAndStatut(clientId, Abonnement.StatutAbonnement.ACTIF)) {
            throw new RuntimeException("Ce client a déjà un abonnement actif");
        }
    }

    private void applyActiveSubscriptionToClient(Client client, Abonnement abonnement) {
        client.setAbonnementActif(abonnement);
        client.setTypeInscription(Client.TypeInscription.DEFINITIF);
        client.setStatut(Client.StatutClient.ACTIF);
        client.setIsActive(true);
        client.setConnexionsMax(999999);
        client.setConnexionsRestantes(999999);
        clientRepository.save(client);
    }

    private void deactivateClientAccess(Client client) {
        client.setAbonnementActif(null);
        client.setStatut(Client.StatutClient.INACTIF);
        client.setIsActive(false);
        client.setConnexionsMax(0);
        client.setConnexionsRestantes(0);
        clientRepository.save(client);
    }

    // ==================== RESPONSE BUILDER ====================

    private AbonnementResponse toResponse(Abonnement abonnement) {
        OffreAbonnement offre = abonnement.getOffreAbonnement();
        Client client = abonnement.getClient();

        return AbonnementResponse.builder()
                .id(abonnement.getId())
                .clientId(client != null ? client.getId() : null)
                .clientNom(client != null ? ((client.getPrenom() != null ? client.getPrenom() + " " : "") + client.getNom()).trim() : null)
                .clientEmail(client != null ? client.getEmail() : null)
                .offreId(offre != null ? offre.getId() : null)
                .offreNom(offre != null ? offre.getNom() : null)
                .duree(offre != null ? (offre.getDureeMois() == 1 ? "1 mois" : offre.getDureeMois() + " mois") : null)
                .dureeMois(offre != null ? offre.getDureeMois() : null)
                .montant(offre != null ? offre.getPrix() : null)
                .devise(offre != null ? offre.getDevise() : "TND")
                .dateDebut(abonnement.getDateDebut())
                .dateFin(abonnement.getDateFin())
                .statut(abonnement.getStatut().name())
                .build();
    }
}