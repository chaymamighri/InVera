package org.erp.invera.service.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Abonnement;
import org.erp.invera.model.platform.Client;
import org.erp.invera.model.platform.OffreAbonnement;
import org.erp.invera.model.platform.Utilisateur;
import org.erp.invera.repository.platform.AbonnementRepository;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.erp.invera.repository.platform.OffreAbonnementRepository;
import org.erp.invera.repository.platform.utilisateurRepository;
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
    private final utilisateurRepository utilisateurRepository;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;
    private final AsyncDatabaseService asyncDatabaseService;
    private final OffreAbonnementRepository offreAbonnementRepository;
    private final AbonnementRepository abonnementRepository;

    // ========== CRÉATION ==========
    /**
     * Créer un nouveau client (ESSAI ou DEFINITIF)
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

        // Définir le domaine
        String domaine = client.getEmail().substring(client.getEmail().indexOf('@') + 1);
        client.setDomaine(domaine);
        client.setDateInscription(LocalDateTime.now());

        // TOUS les clients commencent avec 30 connexions gratuites
        client.setConnexionsMax(30);
        client.setConnexionsRestantes(30);
        client.setIsActive(true);


        // Différence selon le type d'inscription (seulement pour justificatifs)
        if (client.getTypeInscription() == Client.TypeInscription.DEFINITIF) {
            client.setStatut(Client.StatutClient.EN_ATTENTE);
            client.setJustificatifsValides(false);
            log.info("🔍 Client DEFINITIF - Statut EN_ATTENTE, documents requis");
        } else {
            client.setStatut(Client.StatutClient.ACTIF);
            client.setJustificatifsValides(true);
            log.info("🔍 Client ESSAI - Statut ACTIF, documents non requis");
        }

        client.setAbonnementActif(null);
        // Sauvegarder le client
        Client savedClient = clientRepository.save(client);

        // Créer l'utilisateur associé
        Utilisateur utilisateur = Utilisateur.builder()
                .email(client.getEmail())
                .motDePasse(passwordEncoder.encode(plainPassword))
                .role(Utilisateur.RoleUtilisateur.ADMIN_CLIENT)
                .client(savedClient)
                .estActif(true)
                .nom(client.getNom())
                .prenom(client.getPrenom())
                .build();
        utilisateurRepository.save(utilisateur);

        // Créer la base de données pour TOUS les clients
        asyncDatabaseService.createClientDatabaseAsync(savedClient.getId());

        log.info("✅ Client créé: {} - Type: {} - Statut: {} - Justificatifs: {} - Connexions: {}/{}",
                savedClient.getEmail(), savedClient.getTypeInscription(),
                savedClient.getStatut(), savedClient.getJustificatifsValides(),
                savedClient.getConnexionsRestantes(), savedClient.getConnexionsMax());

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
            log.info("✅ Client ESSAI validé - Compte actif");
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

        // Pas besoin de conversion
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

        // Mettre à jour le client
        client.setStatut(Client.StatutClient.ACTIF);
        client.setConnexionsMax(999999);
        client.setConnexionsRestantes(999999);
        client.setAbonnementActif(abonnement);
        client.setJustificatifsValides(true);
        client.setDateActivation(LocalDateTime.now());

        clientRepository.save(client);

        log.info("💰 Client activé après paiement: {} - Offre: {}", client.getEmail(), offre.getNom());

        return client;
    }

    // ========== GESTION DES CONNEXIONS ==========

    /**
     * Enregistrer une connexion et décrémenter le compteur pour TOUS les clients en EN_ATTENTE
     */
    @Transactional
    public Client recordLogin(String email) {
        log.info("========== RECORD LOGIN ==========");
        log.info("Email reçu: {}", email);

        String domaine = email.substring(email.indexOf('@') + 1);
        log.info("Domaine extrait: {}", domaine);

        Client client = clientRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Client non trouvé pour cet email: " + email));

        log.info("Client trouvé: ID={}, Email={}, Type={}, Statut={}, Connexions={}/{}",
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

        // Décrémentation
        boolean isEssai = client.getTypeInscription() == Client.TypeInscription.ESSAI;
        boolean isEnAttente = client.getStatut() == Client.StatutClient.EN_ATTENTE;

        log.info("Conditions: isEssai={}, isEnAttente={}", isEssai, isEnAttente);

        if (isEnAttente || isEssai) {
            log.info("✅ Client éligible à la décrémentation");
            if (client.getConnexionsRestantes() <= 0) {
                client.setStatut(Client.StatutClient.INACTIF);
                client.setIsActive(false);
                clientRepository.save(client);
                throw new RuntimeException("❌ Période d'essai expirée.");
            }
            int anciennesConnexions = client.getConnexionsRestantes();
            client.setConnexionsRestantes(anciennesConnexions - 1);
            clientRepository.save(client);

            log.info("🔐 Connexion: {} → {} restantes", anciennesConnexions, client.getConnexionsRestantes());
        } else {
            log.info("⚠️ Client non éligible à la décrémentation - Pas de changement");
        }

        client.setLastLoginDate(LocalDateTime.now());
        Client saved = clientRepository.save(client);
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

    // ========== MÉTHODES PRIVÉES ==========

    private boolean hasAllRequiredDocuments(Client client) {
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
                log.warn("Abonnement expiré pour client {}", client.getEmail());
            }
        }
    }

}