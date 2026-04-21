package org.erp.invera.service.payment;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.platform.abonnementdto.AbonnementResponse;
import org.erp.invera.model.platform.Abonnement;
import org.erp.invera.model.platform.Client;
import org.erp.invera.model.platform.OffreAbonnement;
import org.erp.invera.repository.platform.AbonnementRepository;
import org.erp.invera.repository.platform.PaiementRepository;
import org.erp.invera.service.platform.ClientPlatformService;
import org.erp.invera.service.platform.DatabaseCreationService;
import org.erp.invera.service.platform.OffreAbonnementService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final AbonnementRepository abonnementRepository;
    private final PaiementRepository paiementRepository;
    private final ClientPlatformService clientService;
    private final DatabaseCreationService databaseCreationService;
    private final OffreAbonnementService offreAbonnementService;

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

    @Transactional
    public Abonnement createSubscription(Long clientId, Abonnement.PeriodType periodType) {
        Client client = clientService.getClientById(clientId);
        assertNoActiveSubscription(client.getId());

        int dureeMois = periodType.getMois();
        Abonnement abonnement = new Abonnement();
        abonnement.setClient(client);
        abonnement.setPeriodType(periodType);
        abonnement.setDureeMois(dureeMois);
        abonnement.setMontant(calculerMontant(periodType));
        abonnement.setDevise("TND");
        abonnement.setDateDebut(LocalDateTime.now());
        abonnement.setDateFin(calculerDateFin(dureeMois));
        abonnement.setDateProchainRenouvellement(abonnement.getDateFin());
        abonnement.setStatut(Abonnement.StatutAbonnement.ACTIF);
        abonnement.setAutoRenouvellement(true);

        Abonnement saved = abonnementRepository.save(abonnement);
        applyActiveSubscriptionToClient(client, saved);

        log.info("Abonnement cree pour client {} - Periodicite: {} - Montant: {} TND - Expiration: {}",
                client.getEmail(), periodType.getLabel(), saved.getMontant(), saved.getDateFin());

        return saved;
    }

    @Transactional
    public AbonnementResponse createSubscriptionFromOffer(Long clientId, Long offreId) {
        OffreAbonnement offre = offreAbonnementService.getAvailableOfferEntityById(offreId);
        Client client = clientService.getClientById(clientId);
        assertNoActiveSubscription(clientId);

        int dureeMois = offre.getDureeMois();
        Abonnement abonnement = new Abonnement();
        abonnement.setClient(client);
        abonnement.setOffreAbonnement(offre);
        abonnement.setPeriodType(null);
        abonnement.setDureeMois(dureeMois);
        abonnement.setMontant(offre.getPrix());
        abonnement.setDevise(offre.getDevise());
        abonnement.setDateDebut(LocalDateTime.now());
        abonnement.setDateFin(LocalDateTime.now().plusMonths(dureeMois));
        abonnement.setDateProchainRenouvellement(abonnement.getDateFin());
        abonnement.setStatut(Abonnement.StatutAbonnement.ACTIF);
        abonnement.setAutoRenouvellement(true);

        Abonnement saved = abonnementRepository.save(abonnement);
        applyActiveSubscriptionToClient(client, saved);

        log.info("Abonnement cree depuis offre {} pour client {}", offre.getNom(), client.getEmail());
        return toResponse(saved);
    }

    @Transactional
    public AbonnementResponse renewSubscription(Long abonnementId) {
        Abonnement oldAbonnement = getSubscriptionEntity(abonnementId);
        return toResponse(renewSubscription(oldAbonnement));
    }

    @Transactional
    public Abonnement renewSubscription(Abonnement oldAbonnement) {
        Client client = oldAbonnement.getClient();
        assertNoOtherActiveSubscription(client.getId(), oldAbonnement.getId());

        int dureeMois = resolveDureeMois(oldAbonnement);
        Abonnement newAbonnement = new Abonnement();
        newAbonnement.setClient(client);
        newAbonnement.setOffreAbonnement(oldAbonnement.getOffreAbonnement());
        newAbonnement.setPeriodType(oldAbonnement.getPeriodType());
        newAbonnement.setDureeMois(dureeMois);
        newAbonnement.setMontant(oldAbonnement.getMontant());
        newAbonnement.setDevise(oldAbonnement.getDevise());
        newAbonnement.setDateDebut(LocalDateTime.now());
        newAbonnement.setDateFin(calculerDateFin(dureeMois));
        newAbonnement.setDateProchainRenouvellement(newAbonnement.getDateFin());
        newAbonnement.setStatut(Abonnement.StatutAbonnement.ACTIF);
        newAbonnement.setAutoRenouvellement(oldAbonnement.getAutoRenouvellement());

        oldAbonnement.setStatut(Abonnement.StatutAbonnement.EXPIRE);
        abonnementRepository.save(oldAbonnement);

        Abonnement saved = abonnementRepository.save(newAbonnement);
        applyActiveSubscriptionToClient(client, saved);

        log.info("Abonnement renouvele pour client {} - Expiration: {}",
                client.getEmail(), saved.getDateFin());
        return saved;
    }

    @Transactional
    public void checkAndRenewSubscriptions() {
        LocalDateTime now = LocalDateTime.now();
        List<Abonnement> expires = abonnementRepository.findByStatutAndDateFinBefore(
                Abonnement.StatutAbonnement.ACTIF, now
        );

        for (Abonnement abonnement : expires) {
            if (Boolean.TRUE.equals(abonnement.getAutoRenouvellement())) {
                try {
                    renewSubscription(abonnement);
                    log.info("Renouvellement reussi pour client {}", abonnement.getClient().getId());
                } catch (Exception e) {
                    abonnement.setStatut(Abonnement.StatutAbonnement.SUSPENDU);
                    abonnementRepository.save(abonnement);
                    deactivateClientAccess(abonnement.getClient());
                    log.error("Echec renouvellement pour client {} - Compte desactive",
                            abonnement.getClient().getId());
                }
            } else {
                abonnement.setStatut(Abonnement.StatutAbonnement.EXPIRE);
                abonnementRepository.save(abonnement);
                deactivateClientAccess(abonnement.getClient());
                log.warn("Abonnement expire pour client {} - Compte desactive",
                        abonnement.getClient().getId());
            }
        }
    }

    @Transactional
    public AbonnementResponse suspendSubscription(Long abonnementId, String motif) {
        Abonnement abonnement = getSubscriptionEntity(abonnementId);
        abonnement.setStatut(Abonnement.StatutAbonnement.SUSPENDU);
        abonnementRepository.save(abonnement);
        deactivateClientAccess(abonnement.getClient());
        log.warn("Abonnement suspendu pour client {} - Motif: {}", abonnement.getClient().getEmail(), motif);
        return toResponse(abonnement);
    }

    @Transactional
    public AbonnementResponse reactivateSubscription(Long abonnementId) {
        Abonnement abonnement = getSubscriptionEntity(abonnementId);
        assertNoOtherActiveSubscription(abonnement.getClient().getId(), abonnement.getId());
        abonnement.setStatut(Abonnement.StatutAbonnement.ACTIF);
        abonnementRepository.save(abonnement);
        applyActiveSubscriptionToClient(abonnement.getClient(), abonnement);
        log.info("Abonnement reactive pour client {}", abonnement.getClient().getEmail());
        return toResponse(abonnement);
    }

    @Transactional
    public AbonnementResponse cancelSubscription(Long abonnementId) {
        Abonnement abonnement = getSubscriptionEntity(abonnementId);
        abonnement.setStatut(Abonnement.StatutAbonnement.ANNULE);
        abonnement.setAutoRenouvellement(false);
        abonnementRepository.save(abonnement);
        deactivateClientAccess(abonnement.getClient());
        log.info("Abonnement annule pour client {}", abonnement.getClient().getEmail());
        return toResponse(abonnement);
    }

    @Transactional
    public AbonnementResponse updateAutoRenewal(Long abonnementId, boolean autoRenouvellement) {
        Abonnement abonnement = getSubscriptionEntity(abonnementId);
        abonnement.setAutoRenouvellement(autoRenouvellement);
        abonnementRepository.save(abonnement);
        return toResponse(abonnement);
    }

    @Transactional(readOnly = true)
    public Abonnement getSubscriptionEntity(Long abonnementId) {
        return abonnementRepository.findWithDetailsById(abonnementId)
                .orElseThrow(() -> new RuntimeException("Abonnement non trouve"));
    }

    private void assertNoActiveSubscription(Long clientId) {
        if (abonnementRepository.existsByClientIdAndStatut(clientId, Abonnement.StatutAbonnement.ACTIF)) {
            throw new RuntimeException("Ce client a deja un abonnement actif");
        }
    }

    private void assertNoOtherActiveSubscription(Long clientId, Long currentAbonnementId) {
        abonnementRepository.findByClientIdAndStatut(clientId, Abonnement.StatutAbonnement.ACTIF)
                .ifPresent(active -> {
                    if (!active.getId().equals(currentAbonnementId)) {
                        throw new RuntimeException("Un autre abonnement actif existe deja pour ce client");
                    }
                });
    }

    private void applyActiveSubscriptionToClient(Client client, Abonnement abonnement) {
        client.setAbonnementActif(abonnement);
        client.setTypeInscription(Client.TypeInscription.DEFINITIF);
        client.setStatut(Client.StatutClient.ACTIF);
        client.setIsActive(true);
        client.setConnexionsMax(999999);
        client.setConnexionsRestantes(999999);
        clientService.saveClient(client);
    }

    private void deactivateClientAccess(Client client) {
        client.setAbonnementActif(null);
        client.setStatut(Client.StatutClient.INACTIF);
        client.setIsActive(false);
        clientService.saveClient(client);
    }

    private double calculerMontant(Abonnement.PeriodType periodType) {
        return periodType.getPrix();
    }

    private LocalDateTime calculerDateFin(int dureeMois) {
        return LocalDateTime.now().plusMonths(dureeMois);
    }

    private int resolveDureeMois(Abonnement abonnement) {
        if (abonnement.getDureeMois() != null && abonnement.getDureeMois() > 0) {
            return abonnement.getDureeMois();
        }
        if (abonnement.getOffreAbonnement() != null && abonnement.getOffreAbonnement().getDureeMois() != null) {
            return abonnement.getOffreAbonnement().getDureeMois();
        }
        if (abonnement.getPeriodType() != null) {
            return abonnement.getPeriodType().getMois();
        }
        throw new RuntimeException("Impossible de determiner la duree de cet abonnement");
    }

    private String formatDurationLabel(int dureeMois) {
        return dureeMois == 1 ? "1 mois" : dureeMois + " mois";
    }

    private AbonnementResponse toResponse(Abonnement abonnement) {
        OffreAbonnement offre = abonnement.getOffreAbonnement();
        Client client = abonnement.getClient();
        Integer dureeMois = resolveDureeMois(abonnement);

        return AbonnementResponse.builder()
                .id(abonnement.getId())
                .clientId(client != null ? client.getId() : null)
                .clientNom(client != null ? ((client.getPrenom() != null ? client.getPrenom() + " " : "") + client.getNom()).trim() : null)
                .clientEmail(client != null ? client.getEmail() : null)
                .offreId(offre != null ? offre.getId() : null)
                .offreNom(offre != null ? offre.getNom() : null)
                .typeOffre(offre != null ? offre.getTypeOffre().name() : null)
                .duree(formatDurationLabel(dureeMois))
                .dureeMois(dureeMois)
                .periodType(abonnement.getPeriodType() != null ? abonnement.getPeriodType().name() : null)
                .montant(abonnement.getMontant())
                .devise(abonnement.getDevise())
                .dateDebut(abonnement.getDateDebut())
                .dateFin(abonnement.getDateFin())
                .dateProchainRenouvellement(abonnement.getDateProchainRenouvellement())
                .statut(abonnement.getStatut().name())
                .autoRenouvellement(abonnement.getAutoRenouvellement())
                .offreToujoursActive(offre != null ? Boolean.TRUE.equals(offre.getActive()) && !Boolean.TRUE.equals(offre.getDeleted()) : null)
                .build();
    }
}
