package org.erp.invera.service.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Abonnement;
import org.erp.invera.model.platform.Client;
import org.erp.invera.model.platform.OffreAbonnement;
import org.erp.invera.repository.platform.AbonnementRepository;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.erp.invera.repository.platform.OffreAbonnementRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service de gestion des clients
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ClientPlatformService {

    private final ClientPlatformRepository clientRepository;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;
    private final AsyncDatabaseService asyncDatabaseService;
    private final OffreAbonnementRepository offreAbonnementRepository;
    private final AbonnementRepository abonnementRepository;

    // ========== CRÉATION ==========

    /**
     * Créer un nouveau client (TOUS les clients commencent avec 30 connexions gratuites)
     * ⚠️ Ne crée PAS l'utilisateur - la base et l'utilisateur seront créés par DatabaseCreationService
     */
    @Transactional
    public Client createClient(Client client, String otpCode, String plainPassword) {
        // Vérifier l'OTP
        if (!otpService.verifyOtp(client.getEmail(), otpCode)) {
            throw new RuntimeException("Code OTP invalide ou expiré");
        }

        // Vérifier l'unicité
        if (clientRepository.existsByEmail(client.getEmail())) {
            throw new RuntimeException("Email déjà utilisé: " + client.getEmail());
        }

        client.setDateInscription(LocalDateTime.now());

        // ✅ TOUS les clients commencent avec 30 connexions gratuites
        client.setConnexionsMax(30);
        client.setConnexionsRestantes(30);
        client.setIsActive(true);

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

        log.info("✅ Client créé dans base centrale: {} - Type: {} - Statut: {} - Connexions gratuites: {}/{}",
                savedClient.getEmail(),
                savedClient.getTypeInscription(),
                savedClient.getStatut(),
                savedClient.getConnexionsRestantes(),
                savedClient.getConnexionsMax());

        return savedClient;
    }

    /**
     * Sauvegarder un client (utile pour les mises à jour mineures)
     */
    @Transactional
    public Client saveClient(Client client) {
        return clientRepository.save(client);
    }

    // ========== VALIDATION ADMIN (POUR DEFINITIF) ==========

    /**
     * VALIDATION manuelle par le Super Admin
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
            log.info("✅ Client DEFINITIF validé - En attente de paiement");
        } else {
            // ESSAI : validation directe
            client.setStatut(Client.StatutClient.ACTIF);
            log.info("✅ Client ESSAI validé - Compte actif avec 30 connexions");
        }

        client.setDateValidation(LocalDateTime.now());
        return clientRepository.save(client);
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

    // ========== ACTIVATION APRÈS PAIEMENT ==========

    @Transactional
    public Client activateAfterPayment(Long clientId, Long offreId) {
        Client client = getClientById(clientId);

        if (client.getTypeInscription() != Client.TypeInscription.DEFINITIF) {
            throw new RuntimeException("Ce client n'est pas un abonnement DEFINITIF");
        }

        if (client.getStatut() != Client.StatutClient.VALIDE) {
            throw new RuntimeException("Client non encore validé par l'administrateur");
        }

        OffreAbonnement offre = offreAbonnementRepository.findById(offreId)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));

        // Créer l'abonnement
        Abonnement abonnement = Abonnement.builder()
                .client(client)
                .offreAbonnement(offre)
                .dateDebut(LocalDateTime.now())
                .dateFin(LocalDateTime.now().plusMonths(offre.getDureeMois()))
                .statut(Abonnement.StatutAbonnement.ACTIF)
                .build();
        abonnementRepository.save(abonnement);

        // Mettre à jour le client avec connexions illimitées
        client.setStatut(Client.StatutClient.ACTIF);
        client.setConnexionsMax(999999);  // Illimité
        client.setConnexionsRestantes(999999);  // Illimité
        client.setAbonnementActif(abonnement);
        client.setJustificatifsValides(true);
        client.setDateActivation(LocalDateTime.now());

        clientRepository.save(client);

        log.info("💰 Client activé après paiement: {} - Offre: {} - Connexions illimitées",
                client.getEmail(), offre.getNom());

        return client;
    }

    // ========== GESTION DES CONNEXIONS ==========

    /**
     * Enregistrer une connexion et décrémenter le compteur
     * TOUS les clients commencent avec 30 connexions gratuites
     */
    @Transactional
    public Client recordLogin(String email) {
        log.info("========== RECORD LOGIN ==========");
        log.info("Email reçu: {}", email);

        Client client = clientRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Client non trouvé pour cet email: " + email));

        log.info("Client trouvé: ID={}, Email={}, Type={}, Statut={}, Connexions restantes={}/{}",
                client.getId(),
                client.getEmail(),
                client.getTypeInscription(),
                client.getStatut(),
                client.getConnexionsRestantes(),
                client.getConnexionsMax());

        // Vérifier et mettre à jour le statut (expiration)
        checkAndUpdateStatus(client);

        // Vérifier que le client peut se connecter
        if (client.getStatut() != Client.StatutClient.ACTIF &&
                client.getStatut() != Client.StatutClient.EN_ATTENTE &&
                client.getStatut() != Client.StatutClient.VALIDE) {
            log.error("❌ Client non autorisé à se connecter - Statut: {}", client.getStatut());
            throw new RuntimeException("Compte non actif. Statut: " + client.getStatut().getLabel());
        }

        // ✅ Vérifier les connexions restantes pour TOUS les clients non abonnés
        boolean isAbonne = client.getAbonnementActif() != null;
        boolean isEnAttente = client.getStatut() == Client.StatutClient.EN_ATTENTE;
        boolean isEssai = client.getTypeInscription() == Client.TypeInscription.ESSAI;

        log.info("Conditions: isAbonne={}, isEnAttente={}, isEssai={}", isAbonne, isEnAttente, isEssai);

        // Décrémenter seulement si non abonné
        if (!isAbonne && (isEnAttente || isEssai)) {
            if (client.getConnexionsRestantes() <= 0) {
                client.setStatut(Client.StatutClient.INACTIF);
                client.setIsActive(false);
                clientRepository.save(client);
                throw new RuntimeException("❌ Période d'essai expirée. Plus de connexions disponibles.");
            }

            int anciennesConnexions = client.getConnexionsRestantes();
            client.setConnexionsRestantes(anciennesConnexions - 1);
            clientRepository.save(client);

            log.info("🔐 Connexion consommée: {} → {} restantes sur {}",
                    anciennesConnexions, client.getConnexionsRestantes(), client.getConnexionsMax());
        } else if (isAbonne) {
            log.info("🔐 Client abonné - Connexions illimitées (aucune consommation)");
        } else {
            log.info("⚠️ Client non éligible à la décrémentation - Pas de changement");
        }

        client.setLastLoginDate(LocalDateTime.now());
        Client saved = clientRepository.save(client);

        log.info("========== FIN RECORD LOGIN ==========");

        return saved;
    }

    /**
     * Vérifie si le client peut se connecter
     */
    public boolean peutSeConnecter(String email) {
        Client client = clientRepository.findByEmail(email)
                .orElse(null);

        if (client == null) return false;

        // Abonné = toujours possible
        if (client.getAbonnementActif() != null) return true;

        // Non abonné = vérifier les connexions restantes
        return client.getConnexionsRestantes() > 0;
    }

    /**
     * Récupère les connexions restantes
     */
    public int getConnexionsRestantes(String email) {
        Client client = clientRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));

        if (client.getAbonnementActif() != null) {
            return Integer.MAX_VALUE; // Illimité
        }

        return client.getConnexionsRestantes();
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
                log.warn("⏰ Abonnement expiré pour client {}", client.getEmail());
            }
        }
    }
}