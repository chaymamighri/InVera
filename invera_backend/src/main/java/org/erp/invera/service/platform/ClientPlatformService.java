package org.erp.invera.service.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Abonnement;
import org.erp.invera.model.platform.Client;
import org.erp.invera.model.platform.OffreAbonnement;
import org.erp.invera.repository.platform.AbonnementRepository;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.erp.invera.repository.platform.OffreAbonnementRepository;
import org.erp.invera.service.logo.LogoUploadService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service de gestion des clients
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ClientPlatformService {

    private final ClientPlatformRepository clientRepository;
    private final LogoUploadService logoUploadService;


    // ========== CRÉATION ==========
    /**
     * Créer un nouveau client (TOUS les clients commencent avec 30 connexions gratuites)
     * ⚠️ Ne crée PAS l'utilisateur - la base et l'utilisateur seront créés par DatabaseCreationService
     */
    @Transactional
    public Client createClient(Client client, String plainPassword, MultipartFile logoFile) {

        // Vérifier l'unicité de l'email
        if (clientRepository.existsByEmail(client.getEmail())) {
            throw new RuntimeException("Email déjà utilisé: " + client.getEmail());
        }

        client.setDateInscription(LocalDateTime.now());

        // ✅ TOUS les clients commencent avec 30 connexions gratuites
        client.setConnexionsMax(30);
        client.setConnexionsRestantes(30);
        client.setIsActive(true);
        client.setTelegramLinkToken(UUID.randomUUID().toString());

        // Différence selon le type d'inscription
        if (client.getTypeInscription() == Client.TypeInscription.DEFINITIF) {
            client.setStatut(Client.StatutClient.EN_ATTENTE);
            client.setJustificatifsValides(false);
            log.info("🔍 Client DEFINITIF - Statut EN_ATTENTE, documents requis");
        } else {
            client.setStatut(Client.StatutClient.ACTIF);
            client.setJustificatifsValides(true);
            log.info("🔍 Client ESSAI - Statut ACTIF - 30 connexions gratuites");
        }

        client.setAbonnementActif(null);

        // Sauvegarder le client dans la base centrale
        Client savedClient = clientRepository.save(client);

        // ✅ Uploader le logo si fourni
        if (logoFile != null && !logoFile.isEmpty()) {
            try {
                String logoPath = logoUploadService.uploadLogo(savedClient.getId(), logoFile);
                savedClient.setLogoUrl(logoPath);
                savedClient = clientRepository.save(savedClient);
                log.info("✅ Logo uploadé pour le client: {}", savedClient.getEmail());
            } catch (Exception e) {
                log.error("❌ Erreur lors de l'upload du logo pour le client {}: {}", savedClient.getEmail(), e.getMessage());
                // On continue quand même la création du client même si le logo échoue
            }
        }

        log.info("✅ Client créé dans base centrale: {} - Type: {} - Statut: {} - Connexions gratuites: {}/{}",
                savedClient.getEmail(),
                savedClient.getTypeInscription(),
                savedClient.getStatut(),
                savedClient.getConnexionsRestantes(),
                savedClient.getConnexionsMax());

        return savedClient;
    }

    // ========== VALIDATION ADMIN (POUR DEFINITIF) ==========
    /**
     * VALIDATION manuelle par le Super Admin
     * Met à jour le statut du client (EN_ATTENTE → VALIDE)
     * Le paiement sera déclenché par le contrôleur après cette méthode
     */
    @Transactional
    public Client validateClientManually(Long id, String adminComment) {
        Client client = getClientById(id);

        if (client.getStatut() != Client.StatutClient.EN_ATTENTE) {
            throw new IllegalStateException("Client non en attente");
        }

        if (client.getTypeInscription() == Client.TypeInscription.DEFINITIF) {
            // Vérifier les documents pour DEFINITIF
            if (!hasAllRequiredDocuments(client)) {
                throw new IllegalStateException("Documents justificatifs incomplets");
            }
            client.setJustificatifsValides(true);
            client.setStatut(Client.StatutClient.VALIDE);  // En attente de paiement
            client.setDateValidation(LocalDateTime.now());
            client = clientRepository.save(client);

            log.info("✅ Client DEFINITIF validé - En attente de paiement");

            // ❌ NE PAS déclencher le paiement ici (créerait une dépendance circulaire)
            // Le paiement sera déclenché par le contrôleur après l'appel à cette méthode

        } else {
            // ESSAI : validation directe (pas de paiement)
            client.setStatut(Client.StatutClient.ACTIF);
            client.setDateValidation(LocalDateTime.now());
            client = clientRepository.save(client);
            log.info("✅ Client ESSAI validé - Compte actif avec 30 connexions");
        }

        return client;
    }

    /**
     * REFUS manuel par le Super Admin
     */
    @Transactional
    public Client refuseClientManually(Long id, String refusalReason) {
        Client client = getClientById(id);

        if (client.getStatut() != Client.StatutClient.EN_ATTENTE) {
            throw new IllegalStateException(
                    "Impossible de refuser un client qui n'est pas en attente. Statut actuel: " +
                            client.getStatut().getLabel()
            );
        }

        client.setStatut(Client.StatutClient.REFUSE);
        client.setMotifRefus(refusalReason);
        client.setJustificatifsValides(false);
        client.setIsActive(false);

        log.warn("❌ Client {} REFUSÉ. Motif: {}", client.getEmail(), refusalReason);

        return clientRepository.save(client);
    }

// ========== GESTION DES CONNEXIONS ==========
    /**
     * Enregistrer une connexion et décrémenter le compteur
     *
     * RÈGLES D'ACCÈS :
     * - ACTIF avec abonnement : Accès illimité
     * - ACTIF sans abonnement (ESSAI) : Accès limité à 30 connexions
     * - EN_ATTENTE (DEFINITIF en attente validation) : Accès limité à 30 connexions
     * - VALIDE : Accès refusé (en attente de paiement)
     * - REFUSE : Accès refusé
     * - INACTIF : Accès refusé
     */
    @Transactional
    public Client recordLogin(String email) {
        log.info("========== RECORD LOGIN ==========");
        log.info(" Tentative de connexion pour: {}", email);

        // ============================================================
        // ÉTAPE 1 : Récupérer le client
        // ============================================================
        Client client = clientRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Client non trouvé pour cet email: " + email));

        log.info(" Client trouvé: ID={}, Statut={}, TypeInscription={}, Connexions restantes={}/{}",
                client.getId(), client.getStatut(), client.getTypeInscription(),
                client.getConnexionsRestantes(), client.getConnexionsMax());

        // ============================================================
        // ÉTAPE 2 : Vérifier l'expiration de l'abonnement (si actif)
        // ============================================================
        checkAndUpdateStatus(client);

        // ============================================================
        // ÉTAPE 3 : Vérifier si le client a le droit de se connecter
        // ============================================================
        boolean isAbonne = client.getAbonnementActif() != null;
        boolean isEnAttente = client.getStatut() == Client.StatutClient.EN_ATTENTE;
        boolean isActifWithoutSubscription = client.getStatut() == Client.StatutClient.ACTIF && !isAbonne;
        boolean isEssai = client.getTypeInscription() == Client.TypeInscription.ESSAI;

        // Clients avec accès refusé
        if (client.getStatut() == Client.StatutClient.VALIDE) {
            log.warn(" Client VALIDE - En attente de paiement, accès refusé");
            throw new RuntimeException("Vos documents ont été validés. Veuillez finaliser votre paiement pour accéder à la plateforme.");

        } else if (client.getStatut() == Client.StatutClient.REFUSE) {
            log.warn(" Client REFUSÉ - Inscription rejetée, accès refusé");
            String motif = client.getMotifRefus() != null ? " Motif: " + client.getMotifRefus() : "";
            throw new RuntimeException("Votre inscription a été refusée." + motif);

        } else if (client.getStatut() == Client.StatutClient.INACTIF) {
            log.warn(" Client INACTIF - Compte désactivé, accès refusé");
            throw new RuntimeException("Votre compte a été désactivé. Veuillez contacter l'administrateur.");

        } else if (client.getStatut() == Client.StatutClient.ACTIF || client.getStatut() == Client.StatutClient.EN_ATTENTE) {
            // Clients autorisés à se connecter
            if (isAbonne) {
                log.info(" Client ABONNÉ (ACTIF avec abonnement) - Accès illimité");
            } else if (isActifWithoutSubscription || isEnAttente) {
                log.info(" Client EN PÉRIODE D'ESSAI - Accès avec {} connexions restantes",
                        client.getConnexionsRestantes());
            } else {
                log.warn(" Client non éligible - Statut: {}, Abonné: {}", client.getStatut(), isAbonne);
                throw new RuntimeException("Vous n'êtes pas autorisé à vous connecter. Statut: " + client.getStatut().getLabel());
            }

        } else {
            log.error(" Statut non reconnu: {}", client.getStatut());
            throw new RuntimeException("Compte non actif. Statut: " + client.getStatut().getLabel());
        }

        // ============================================================
        // ÉTAPE 4 : Gérer la consommation des connexions
        // ============================================================
        log.info(" Vérification: isAbonne={}, isEnAttente={}, isActifWithoutSubscription={}",
                isAbonne, isEnAttente, isActifWithoutSubscription);

        if (isAbonne) {
            // Cas 1: Client abonné → connexions illimitées (ne pas décrémenter)
            log.info(" Client ABONNÉ - Connexions illimitées (aucune consommation)");

        } else if (isEnAttente || isActifWithoutSubscription) {
            // Cas 2: Client en période d'essai (EN_ATTENTE ou ACTIF sans abonnement) → consomme 1 connexion

            if (client.getConnexionsRestantes() <= 0) {
                // Plus de connexions disponibles
                client.setStatut(Client.StatutClient.INACTIF);
                client.setIsActive(false);
                clientRepository.save(client);
                log.warn(" Période d'essai expirée pour client {}", client.getEmail());
                throw new RuntimeException("Votre période d'essai de " + client.getConnexionsMax() +
                        " connexions est expirée. Veuillez souscrire un abonnement pour continuer.");
            }

            int anciennesConnexions = client.getConnexionsRestantes();
            client.setConnexionsRestantes(anciennesConnexions - 1);
            clientRepository.save(client);

            log.info(" Connexion consommée: {} → {} restantes sur {}",
                    anciennesConnexions, client.getConnexionsRestantes(), client.getConnexionsMax());

            // Alerter si plus que 5 connexions restantes
            if (client.getConnexionsRestantes() <= 5 && client.getConnexionsRestantes() > 0) {
                log.warn("⚠ Attention: Plus que {} connexions restantes pour le client {}",
                        client.getConnexionsRestantes(), client.getEmail());
            }

        } else {
            // Cas 3: Autres statuts (normalement déjà filtrés plus haut)
            log.warn(" Client non éligible à la consommation de connexion - Statut: {}", client.getStatut());
            throw new RuntimeException("Vous n'êtes pas autorisé à vous connecter. Statut: " + client.getStatut().getLabel());
        }

        // ============================================================
        // ÉTAPE 5 : Mettre à jour la dernière date de connexion
        // ============================================================
        client.setLastLoginDate(LocalDateTime.now());
        Client saved = clientRepository.save(client);

        log.info(" Connexion enregistrée avec succès pour {}", client.getEmail());
        log.info("========== FIN RECORD LOGIN ==========");

        return saved;
    }

    // ========== MÉTHODES UTILITAIRES ==========

    public Client getClientById(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouvé: " + id));
    }

    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }

    public List<Client> getPendingValidationClients() {
        return clientRepository.findByStatut(Client.StatutClient.EN_ATTENTE);
    }

    public List<Client> getClientsByStatut(Client.StatutClient statut) {
        return clientRepository.findByStatut(statut);
    }

    @Transactional
    public Client updateTelegramChatId(Long clientId, Long telegramChatId) {
        Client client = getClientById(clientId);
        client.setTelegramChatId(telegramChatId);
        return clientRepository.save(client);
    }

    @Transactional
    public Client refreshTelegramLinkToken(Long clientId) {
        Client client = getClientById(clientId);

        if (client.getTelegramChatId() != null) {
            return client;
        }

        client.setTelegramLinkToken(UUID.randomUUID().toString());
        return clientRepository.save(client);
    }

    // ========== MÉTHODES PRIVÉES ==========

    private boolean hasAllRequiredDocuments(Client client) {
        if (client.getTypeCompte() == null) return true;

        if (client.getTypeCompte() == Client.TypeCompte.ENTREPRISE) {
            return client.getGerantCinUrl() != null &&
                    client.getPatenteUrl() != null &&
                    client.getRneUrl() != null;
        } else {
            return client.getCinUrl() != null;
        }
    }

    private void checkAndUpdateStatus(Client client) {
        // Vérifier l'expiration de l'abonnement pour les clients ACTIF
        if (client.getAbonnementActif() != null &&
                client.getAbonnementActif().getDateFin() != null &&
                client.getStatut() == Client.StatutClient.ACTIF) {

            if (client.getAbonnementActif().getDateFin().isBefore(LocalDateTime.now())) {
                client.setStatut(Client.StatutClient.INACTIF);
                clientRepository.save(client);
                log.warn(" Abonnement expiré pour client {}", client.getEmail());
            }
        }
    }
}
