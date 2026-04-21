package org.erp.invera.service.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Client;
import org.erp.invera.model.platform.Utilisateur;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.erp.invera.repository.platform.utilisateurRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClientPlatformService {

    private final ClientPlatformRepository clientRepository;
    private final AsyncDatabaseService asyncDatabaseService;
    private final utilisateurRepository utilisateurRepository;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;

    // ========== CRUD DE BASE ==========

    /**
     * Créer un nouveau client
     */
    public Client createClient(Client client, String otpCode, String plainPassword) {
        if (!otpService.verifyOtp(client.getEmail(), otpCode)) {
            throw new RuntimeException("Code OTP invalide ou expiré");
        }

        if (clientRepository.existsByEmail(client.getEmail())) {
            throw new RuntimeException("Email déjà utilisé: " + client.getEmail());
        }

        String domaine = client.getEmail().substring(client.getEmail().indexOf('@') + 1);
        client.setDomaine(domaine);
        client.setDateInscription(LocalDateTime.now());

        if (client.getTypeInscription() == Client.TypeInscription.ESSAI) {
            client.setConnexionsMax(30);
            client.setConnexionsRestantes(30);
            client.setStatut(Client.StatutClient.ACTIF);
            client.setIsActive(true);
            client.setJustificatifsValides(true);

            Client savedClient = clientRepository.save(client);

            Utilisateur utilisateur = Utilisateur.builder()
                    .email(client.getEmail())
                    .motDePasse(passwordEncoder.encode(plainPassword))
                    .role(Utilisateur.RoleUtilisateur.ADMIN_CLIENT)
                    .client(savedClient)
                    .estActif(true)
                    .build();
            utilisateurRepository.save(utilisateur);

            asyncDatabaseService.createClientDatabaseAsync(savedClient.getId());
            return savedClient;
        } else {
            // DEFINITIF - Nécessite justificatifs + validation admin
            client.setConnexionsMax(999999);
            client.setConnexionsRestantes(999999);
            client.setNomBaseDonnees(null);
            client.setStatut(Client.StatutClient.EN_ATTENTE);
            client.setIsActive(false);
            client.setJustificatifsValides(false);

            Client savedClient = clientRepository.save(client);
            log.info("📝 Client DEFINITIF inscrit en attente de validation: {}", client.getEmail());
            return savedClient;
        }
    }

    /**
     * Demander un code OTP pour l'inscription
     */
    public void requestOtp(String email) {
        if (clientRepository.existsByEmail(email)) {
            throw new RuntimeException("Email déjà utilisé");
        }
        otpService.sendOtpByEmail(email);
        log.info("📧 OTP envoyé à {}", email);
    }

    // ========== UPLOAD JUSTIFICATIFS ==========

    /**
     * Upload des justificatifs selon le type de document
     * Le client reste EN_ATTENTE jusqu'à validation manuelle par l'admin
     */
    @Transactional
    public Client uploadJustificatifs(Long clientId, String typeDocument, String fileUrl) {
        Client client = getClientById(clientId);

        if (client.getStatut() != Client.StatutClient.EN_ATTENTE) {
            throw new IllegalStateException(
                    "Le client n'est pas en attente de validation. Statut actuel: " + client.getStatut().getLabel()
            );
        }

        switch (typeDocument.toUpperCase()) {
            case "CIN":
                client.setCinUrl(fileUrl);
                log.info("📄 CIN uploadée pour client {}", client.getEmail());
                break;
            case "GERANT_CIN":
                client.setGerantCinUrl(fileUrl);
                log.info("📄 CIN du gérant uploadée pour client {}", client.getEmail());
                break;
            case "PATENTE":
                client.setPatenteUrl(fileUrl);
                log.info("📄 Patente uploadée pour client {}", client.getEmail());
                break;
            case "RNE":
                client.setRneUrl(fileUrl);
                log.info("📄 RNE uploadé pour client {}", client.getEmail());
                break;
            default:
                throw new RuntimeException("Type de document inconnu: " + typeDocument);
        }

        Client savedClient = clientRepository.save(client);

        if (hasAllRequiredDocuments(savedClient)) {
            log.info("✅ Client {} a soumis tous ses justificatifs. En attente de validation admin.", client.getEmail());
        }

        return savedClient;
    }

    // ========== VALIDATION ADMIN (MANUELLE) ==========

    /**
     * VALIDATION MANUELLE par le Super Admin
     * L'admin doit vérifier visuellement que le RNE date de moins de 3 mois
     */
    @Transactional
    public Client validateClientManually(Long id, String adminComment) {
        Client client = getClientById(id);

        if (client.getStatut() != Client.StatutClient.EN_ATTENTE) {
            throw new IllegalStateException(
                    "Impossible de valider un client qui n'est pas en attente. Statut actuel: " +
                            client.getStatut().getLabel()
            );
        }

        if (!hasAllRequiredDocuments(client)) {
            throw new IllegalStateException(
                    "Documents justificatifs incomplets pour valider le compte."
            );
        }

        client.setStatut(Client.StatutClient.VALIDE);
        client.setJustificatifsValides(true);
        client.setDateValidation(LocalDateTime.now());

        log.info("✅ ADMIN: Client {} VALIDÉ manuellement après vérification visuelle. Commentaire: {}",
                client.getEmail(), adminComment);

        return clientRepository.save(client);
    }

    /**
     * REFUS MANUEL par le Super Admin
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

        log.warn("❌ ADMIN: Client {} REFUSÉ. Motif: {}", client.getEmail(), refusalReason);

        return clientRepository.save(client);
    }

    // ========== MÉTHODES DE COMPATIBILITÉ ==========

    @Deprecated
    @Transactional
    public Client validateClient(Long id, String commentaire) {
        return validateClientManually(id, commentaire);
    }

    @Deprecated
    @Transactional
    public Client refuseClient(Long id, String motif) {
        return refuseClientManually(id, motif);
    }

    // ========== ACTIVATION (après paiement) ==========

    @Transactional
    public Client activateClient(Long id, String dbName) {
        Client client = getClientById(id);

        if (client.getStatut() != Client.StatutClient.VALIDE) {
            throw new RuntimeException(
                    "Le client doit être validé avant activation. Statut actuel: " + client.getStatut().getLabel()
            );
        }

        client.setNomBaseDonnees(dbName);
        client.setStatut(Client.StatutClient.ACTIF);
        client.setDateActivation(LocalDateTime.now());
        client.setIsActive(true);
        client.setConnexionsMax(999999);
        client.setConnexionsRestantes(999999);

        if (utilisateurRepository.findByEmail(client.getEmail()).isEmpty()) {
            Utilisateur utilisateur = Utilisateur.builder()
                    .email(client.getEmail())
                    .role(Utilisateur.RoleUtilisateur.ADMIN_CLIENT)
                    .client(client)
                    .estActif(true)
                    .build();
            utilisateurRepository.save(utilisateur);
        }

        log.info("🚀 Client {} ACTIVÉ avec base {}", client.getEmail(), dbName);
        return clientRepository.save(client);
    }

    // ========== GESTION DES CONNEXIONS ==========

    @Transactional
    public Client recordLogin(String email) {
        String domaine = email.substring(email.indexOf('@') + 1);
        Client client = clientRepository.findByDomaine(domaine)
                .orElseThrow(() -> new RuntimeException("Aucune entreprise trouvée pour ce domaine: " + domaine));

        checkAndUpdateStatus(client);

        if (client.getStatut() != Client.StatutClient.ACTIF) {
            throw new RuntimeException("Compte non actif. Statut: " + client.getStatut().getLabel());
        }

        if (client.getTypeInscription() == Client.TypeInscription.ESSAI) {
            if (client.getConnexionsRestantes() <= 0) {
                client.setStatut(Client.StatutClient.INACTIF);
                clientRepository.save(client);
                throw new RuntimeException("Période d'essai expirée. Veuillez souscrire un abonnement.");
            }
            client.setConnexionsRestantes(client.getConnexionsRestantes() - 1);
            clientRepository.save(client);

            log.info("🔐 Connexion enregistrée pour {} - Reste: {}/{}",
                    client.getNom(), client.getConnexionsRestantes(), client.getConnexionsMax());
        }

        client.setLastLoginDate(LocalDateTime.now());
        return clientRepository.save(client);
    }

    // ========== MÉTHODES UTILITAIRES PRIVÉES ==========

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
        if (client.getAbonnementActif() != null && client.getAbonnementActif().getDateFin() != null) {
            if (client.getAbonnementActif().getDateFin().isBefore(LocalDateTime.now())) {
                client.setStatut(Client.StatutClient.INACTIF);
                clientRepository.save(client);
                log.warn("Abonnement expiré pour client {}", client.getEmail());
            }
        }
    }

    // ========== RECHERCHES ET LISTES ==========

    public Client getClientById(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouvé: " + id));
    }

    public Client getClientByEmail(String email) {
        return clientRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Client non trouvé: " + email));
    }

    @Transactional
    public Client updateClient(Long id, Client updatedClient) {
        Client client = getClientById(id);
        client.setNom(updatedClient.getNom());
        client.setPrenom(updatedClient.getPrenom());
        client.setTelephone(updatedClient.getTelephone());
        return clientRepository.save(client);
    }

    @Transactional
    public void deleteClient(Long id) {
        Client client = getClientById(id);
        client.setIsActive(false);
        client.setStatut(Client.StatutClient.INACTIF);
        clientRepository.save(client);
    }

    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }

    public List<Client> getClientsByStatut(Client.StatutClient statut) {
        return clientRepository.findByStatut(statut);
    }

    public List<Client> getPendingValidationClients() {
        return clientRepository.findByStatut(Client.StatutClient.EN_ATTENTE);
    }

    public List<Client> getActiveClientsWithDatabase() {
        return clientRepository.findClientsWithDatabase();
    }
}