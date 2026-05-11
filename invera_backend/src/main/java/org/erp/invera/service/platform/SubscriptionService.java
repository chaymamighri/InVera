package org.erp.invera.service.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.platform.abonnementdto.AbonnementResponse;
import org.erp.invera.model.platform.Abonnement;
import org.erp.invera.model.platform.Client;
import org.erp.invera.model.platform.OffreAbonnement;
import org.erp.invera.repository.platform.AbonnementRepository;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.erp.invera.service.erp.EmailService;
import org.hibernate.Hibernate;
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

    @Transactional
    public AbonnementResponse createSubscriptionFromOffer(Long clientId, Long offreId) {
        OffreAbonnement offre = offreAbonnementService.getAvailableOfferEntityById(offreId);
        Client client = clientService.getClientById(clientId);
        assertNoActiveSubscription(clientId);

        // ✅ Créer l'abonnement EN ATTENTE (pas de dates, pas d'activation)
        Abonnement abonnement = Abonnement.builder()
                .client(client)
                .offreAbonnement(offre)
                .dateDebut(null)  // NULL car pas encore payé
                .dateFin(null)     // NULL car pas encore payé
                .statut(Abonnement.StatutAbonnement.EN_ATTENTE_VALIDATION)
                .build();

        Abonnement saved = abonnementRepository.save(abonnement);

        log.info("✅ Abonnement créé en attente de paiement pour client {} - Offre: {}",
                client.getEmail(), offre.getNom());

        return toResponse(saved);
    }

    // ==================== TÂCHE PLANIFIÉE : EXPIRATION ====================

    @Transactional
    public void checkAndExpireSubscriptions() {
        LocalDateTime now = LocalDateTime.now();

        List<Abonnement> expiredSubscriptions = abonnementRepository.findByStatutAndDateFinBefore(
                Abonnement.StatutAbonnement.ACTIF, now
        );

        log.info("Vérification des abonnements expirés : {} abonnements trouvés", expiredSubscriptions.size());

        for (Abonnement abonnement : expiredSubscriptions) {
            abonnement.setStatut(Abonnement.StatutAbonnement.EXPIRE);
            abonnementRepository.save(abonnement);

            Client client = abonnement.getClient();
            client.setAbonnementActif(null);
            client.setStatut(Client.StatutClient.INACTIF);
            client.setIsActive(false);
            clientRepository.save(client);

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

    @Transactional(readOnly = true)
    public void sendExpirationReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = now.withHour(23).withMinute(59).withSecond(59);

        // J-0
        List<Abonnement> expiringToday = abonnementRepository
                .findByStatutAndDateFinBetween(
                        Abonnement.StatutAbonnement.ACTIF,
                        startOfDay,
                        endOfDay
                );

        for (Abonnement abonnement : expiringToday) {
            Client client = abonnement.getClient();
            String clientNom = (client.getPrenom() != null ? client.getPrenom() + " " : "") + client.getNom();
            emailService.sendExpirationReminder(
                    client.getEmail(),
                    clientNom.trim(),
                    abonnement.getOffreAbonnement().getNom(),
                    abonnement.getDateFin(),
                    0
            );
            log.info("⚠️ RAPPEL URGENT - Abonnement expire AUJOURD'HUI pour client {}", client.getEmail());
        }

        // J-1
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
            emailService.sendExpirationReminder(
                    client.getEmail(),
                    clientNom.trim(),
                    abonnement.getOffreAbonnement().getNom(),
                    abonnement.getDateFin(),
                    1
            );
            log.info("📧 Rappel J-1 pour client {}", client.getEmail());
        }

        // J-7
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
     * ✅ Sans motif obligatoire
     */
    @Transactional
    public AbonnementResponse suspendSubscription(Long abonnementId) {
        Abonnement abonnement = getSubscriptionEntity(abonnementId);

        if (abonnement.getStatut() != Abonnement.StatutAbonnement.ACTIF) {
            throw new RuntimeException("Seul un abonnement actif peut être suspendu");
        }

        // ✅ Vérification de null pour dateFin
        if (abonnement.getDateFin() != null && abonnement.getDateFin().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Impossible de suspendre un abonnement expiré");
        }

        abonnement.setStatut(Abonnement.StatutAbonnement.SUSPENDU);
        abonnementRepository.save(abonnement);

        deactivateClientAccess(abonnement.getClient());

        log.warn("Abonnement suspendu pour client {}", abonnement.getClient().getEmail());
        return toResponse(abonnement);
    }

    /**
     * Réactiver un abonnement suspendu (admin seulement)
     * ✅ Sans motif
     */
    @Transactional
    public AbonnementResponse reactivateSubscription(Long abonnementId) {
        Abonnement abonnement = getSubscriptionEntity(abonnementId);

        if (abonnement.getStatut() != Abonnement.StatutAbonnement.SUSPENDU) {
            throw new RuntimeException("Seul un abonnement suspendu peut être réactivé");
        }

        // ✅ Vérification de null pour dateFin
        if (abonnement.getDateFin() != null && abonnement.getDateFin().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Impossible de réactiver un abonnement expiré");
        }

        abonnement.setStatut(Abonnement.StatutAbonnement.ACTIF);
        abonnementRepository.save(abonnement);

        applyActiveSubscriptionToClient(abonnement.getClient(), abonnement);

        log.info("Abonnement réactivé pour client {}", abonnement.getClient().getEmail());
        return toResponse(abonnement);
    }

    /**
     * Annuler un abonnement (admin seulement)
     * ✅ Sans motif obligatoire
     */
    @Transactional
    public AbonnementResponse cancelSubscription(Long abonnementId) {
        Abonnement abonnement = getSubscriptionEntity(abonnementId);

        if (abonnement.getStatut() != Abonnement.StatutAbonnement.ACTIF &&
                abonnement.getStatut() != Abonnement.StatutAbonnement.SUSPENDU) {
            throw new RuntimeException("Seuls les abonnements actifs ou suspendus peuvent être annulés");
        }

        // ✅ Vérification de null pour dateFin
        if (abonnement.getDateFin() != null && abonnement.getDateFin().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Impossible d'annuler un abonnement expiré");
        }

        abonnement.setStatut(Abonnement.StatutAbonnement.ANNULE);
        abonnementRepository.save(abonnement);

        deactivateClientAccess(abonnement.getClient());

        log.info("Abonnement annulé par admin pour client {}", abonnement.getClient().getEmail());
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

    // ==================== ACTIVATION APRÈS PAIEMENT ====================

    /**
     * Active un abonnement après paiement réussi
     * Passe de EN_ATTENTE_VALIDATION à ACTIF
     * À appeler uniquement après confirmation de paiement
     */
    @Transactional
    public AbonnementResponse activateAfterPayment(Long abonnementId) {
        // 1. Récupérer l'abonnement avec ses relations chargées
        Abonnement abonnement = abonnementRepository.findByIdWithOffre(abonnementId)
                .orElseThrow(() -> new RuntimeException("Abonnement non trouvé"));

        // ✅ Force le chargement des relations si nécessaire
        Hibernate.initialize(abonnement.getOffreAbonnement());
        Hibernate.initialize(abonnement.getClient());

        // 2. Vérifier qu'il est bien en attente de validation
        if (abonnement.getStatut() != Abonnement.StatutAbonnement.EN_ATTENTE_VALIDATION) {
            throw new RuntimeException("L'abonnement n'est pas en attente de validation. Statut actuel: " + abonnement.getStatut());
        }

        // 3. Vérifier que l'offre existe et est active
        OffreAbonnement offre = abonnement.getOffreAbonnement();
        if (offre == null || !offre.getActive()) {
            throw new RuntimeException("L'offre associée n'est pas disponible");
        }

        // 4. Activer l'abonnement
        abonnement.setStatut(Abonnement.StatutAbonnement.ACTIF);
        abonnement.setDateDebut(LocalDateTime.now());
        abonnement.setDateFin(LocalDateTime.now().plusMonths(offre.getDureeMois()));

        // 5. Sauvegarder l'abonnement
        Abonnement saved = abonnementRepository.save(abonnement);

        // 6. Mettre à jour le client
        Client client = saved.getClient();
        client.setAbonnementActif(saved);
        client.setStatut(Client.StatutClient.ACTIF);
        client.setIsActive(true);
        client.setConnexionsMax(999999);
        client.setConnexionsRestantes(999999);
        clientRepository.save(client);

        // 7. Envoyer un email de confirmation
        String clientNom = (client.getPrenom() != null ? client.getPrenom() + " " : "") + client.getNom();
        emailService.sendSubscriptionConfirmation(
                client.getEmail(),
                clientNom.trim(),
                offre.getNom(),
                saved.getDateFin()
        );

        log.info("✅ Abonnement {} activé après paiement pour client {} - Expiration le {}",
                saved.getId(), client.getEmail(), saved.getDateFin());

        return toResponse(saved);
    }
}