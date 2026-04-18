package org.erp.invera.service.payment;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Abonnement;
import org.erp.invera.model.platform.Client;
import org.erp.invera.repository.platform.AbonnementRepository;
import org.erp.invera.repository.platform.PaiementRepository;
import org.erp.invera.service.platform.ClientPlatformService;
import org.erp.invera.service.platform.DatabaseCreationService;
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

    // ========== CRÉATION ABONNEMENT ==========
    /**
     * Crée un abonnement pour un client
     * @param clientId ID du client
     * @param periodType MENSUEL ou ANNUEL
     */
    @Transactional
    public Abonnement createSubscription(Long clientId, Abonnement.PeriodType periodType) {
        Client client = clientService.getClientById(clientId);

        // Créer l'abonnement
        Abonnement abonnement = new Abonnement();
        abonnement.setClient(client);
        abonnement.setPeriodType(periodType);
        abonnement.setMontant(calculerMontant(periodType));
        abonnement.setDevise("TND");
        abonnement.setDateDebut(LocalDateTime.now());
        abonnement.setDateFin(calculerDateFin(periodType));
        abonnement.setDateProchainRenouvellement(abonnement.getDateFin());
        abonnement.setStatut(Abonnement.StatutAbonnement.ACTIF);
        abonnement.setAutoRenouvellement(true);

        Abonnement saved = abonnementRepository.save(abonnement);
        client.setAbonnementActif(saved);

        // Activer le client
        client.setStatut(Client.StatutClient.ACTIF);
        client.setIsActive(true);
        client.setConnexionsMax(999999);
        client.setConnexionsRestantes(999999);
        clientService.updateClient(clientId, client);

        log.info("✅ Abonnement créé pour client {} - Périodicité: {} - Montant: {} TND - Expiration: {}",
                client.getEmail(), periodType.getLabel(), saved.getMontant(), saved.getDateFin());

        return saved;
    }
    // ========== RENOUVELLEMENT ==========

    @Transactional
    public Abonnement renewSubscription(Abonnement oldAbonnement) {
        Client client = oldAbonnement.getClient();

        // Créer le nouvel abonnement
        Abonnement newAbonnement = new Abonnement();
        newAbonnement.setClient(client);
        newAbonnement.setPeriodType(oldAbonnement.getPeriodType());
        newAbonnement.setMontant(oldAbonnement.getMontant());
        newAbonnement.setDevise(oldAbonnement.getDevise());
        newAbonnement.setDateDebut(LocalDateTime.now());
        newAbonnement.setDateFin(calculerDateFin(oldAbonnement.getPeriodType()));
        newAbonnement.setDateProchainRenouvellement(newAbonnement.getDateFin());
        newAbonnement.setStatut(Abonnement.StatutAbonnement.ACTIF);
        newAbonnement.setAutoRenouvellement(oldAbonnement.getAutoRenouvellement());

        Abonnement saved = abonnementRepository.save(newAbonnement);

        // Mettre à jour le client
        client.setAbonnementActif(saved);

        if (client.getStatut() == Client.StatutClient.INACTIF) {
            client.setStatut(Client.StatutClient.ACTIF);
            client.setIsActive(true);
        }

        clientService.updateClient(client.getId(), client);

        // Ancien abonnement expiré
        oldAbonnement.setStatut(Abonnement.StatutAbonnement.EXPIRE);
        abonnementRepository.save(oldAbonnement);

        log.info("🔄 Abonnement renouvelé pour client {} - Expiration: {}",
                client.getEmail(), saved.getDateFin());
        return saved;
    }

    // ========== VÉRIFICATION AUTOMATIQUE ==========

    @Transactional
    public void checkAndRenewSubscriptions() {
        LocalDateTime now = LocalDateTime.now();

        // Trouver abonnements expirés
        List<Abonnement> expires = abonnementRepository.findByStatutAndDateFinBefore(
                Abonnement.StatutAbonnement.ACTIF, now
        );

        for (Abonnement abonnement : expires) {
            if (abonnement.getAutoRenouvellement()) {
                try {
                    renewSubscription(abonnement);
                    log.info("✅ Renouvellement réussi pour client {}", abonnement.getClient().getId());
                } catch (Exception e) {
                    // Échec renouvellement → SUSPENDU + client INACTIF
                    abonnement.setStatut(Abonnement.StatutAbonnement.SUSPENDU);
                    abonnementRepository.save(abonnement);

                    Client client = abonnement.getClient();
                    client.setStatut(Client.StatutClient.INACTIF);
                    client.setIsActive(false);
                    clientService.updateClient(client.getId(), client);

                    log.error("❌ Échec renouvellement pour client {} - Compte désactivé",
                            abonnement.getClient().getId());
                }
            } else {
                // Auto-renouvellement désactivé → EXPIRE + client INACTIF
                abonnement.setStatut(Abonnement.StatutAbonnement.EXPIRE);
                abonnementRepository.save(abonnement);

                Client client = abonnement.getClient();
                client.setStatut(Client.StatutClient.INACTIF);
                client.setIsActive(false);
                clientService.updateClient(client.getId(), client);

                log.warn("⏰ Abonnement expiré pour client {} - Compte désactivé",
                        abonnement.getClient().getId());
            }
        }
    }

    // ========== GESTION MANUELLE ==========

    @Transactional
    public void suspendSubscription(Long abonnementId, String motif) {
        Abonnement abonnement = abonnementRepository.findById(abonnementId)
                .orElseThrow(() -> new RuntimeException("Abonnement non trouvé"));

        abonnement.setStatut(Abonnement.StatutAbonnement.SUSPENDU);
        abonnementRepository.save(abonnement);

        Client client = abonnement.getClient();
        client.setStatut(Client.StatutClient.INACTIF);
        client.setIsActive(false);
        clientService.updateClient(client.getId(), client);

        log.warn("🚫 Abonnement suspendu pour client {} - Motif: {}", client.getEmail(), motif);
    }

    @Transactional
    public void reactivateSubscription(Long abonnementId) {
        Abonnement abonnement = abonnementRepository.findById(abonnementId)
                .orElseThrow(() -> new RuntimeException("Abonnement non trouvé"));

        abonnement.setStatut(Abonnement.StatutAbonnement.ACTIF);
        abonnementRepository.save(abonnement);

        Client client = abonnement.getClient();
        client.setStatut(Client.StatutClient.ACTIF);
        client.setIsActive(true);
        clientService.updateClient(client.getId(), client);

        log.info("🟢 Abonnement réactivé pour client {}", client.getEmail());
    }

    @Transactional
    public void cancelSubscription(Long abonnementId) {
        Abonnement abonnement = abonnementRepository.findById(abonnementId)
                .orElseThrow(() -> new RuntimeException("Abonnement non trouvé"));

        abonnement.setStatut(Abonnement.StatutAbonnement.ANNULE);
        abonnement.setAutoRenouvellement(false);
        abonnementRepository.save(abonnement);

        log.info("✖️ Abonnement annulé pour client {}", abonnement.getClient().getEmail());
    }

    // ========== MÉTHODES PRIVÉES ==========

    /**
     * Calcule le montant selon la périodicité
     * Prix unique: 29 TND/mois
     */
    private double calculerMontant(Abonnement.PeriodType periodType) {
        double prixMensuel = 29.0;

        if (periodType == Abonnement.PeriodType.MENSUEL) {
            return prixMensuel;  // 29 TND
        } else {
            return prixMensuel * 12 * 0.9;  // 29 * 12 * 0.9 = 313.2 TND
        }
    }

    /**
     * Calcule la date de fin selon la périodicité
     * @param periodType MENSUEL ou ANNUEL
     * @return Date de fin de l'abonnement
     */
    private LocalDateTime calculerDateFin(Abonnement.PeriodType periodType) {
        if (periodType == Abonnement.PeriodType.MENSUEL) {
            return LocalDateTime.now().plusMonths(1);
        } else {
            return LocalDateTime.now().plusYears(1);
        }
    }
}