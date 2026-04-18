package org.erp.invera.service.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Client;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClientPlatformService {

    private final ClientPlatformRepository clientRepository;
    private final DatabaseCreationService databaseCreationService;
    private final AsyncDatabaseService asyncDatabaseService;



    // ========== CRUD DE BASE ==========

    /**
     * Créer un nouveau client
     */
    public Client createClient(Client client) {
        if (clientRepository.existsByEmail(client.getEmail())) {
            throw new RuntimeException("Email déjà utilisé: " + client.getEmail());
        }

        if (client.getTelephone() != null && clientRepository.existsByTelephone(client.getTelephone())) {
            throw new RuntimeException("Téléphone déjà utilisé: " + client.getTelephone());
        }

        client.setDateInscription(LocalDateTime.now());

        // Configuration selon type d'inscription
        if (client.getTypeInscription() == Client.TypeInscription.ESSAI) {
            // ✅ Mode ESSAI : base créée immédiatement
            client.setConnexionsMax(30);
            client.setConnexionsRestantes(30);
            client.setStatut(Client.StatutClient.ACTIF);  // ← ACTIF directement
            client.setIsActive(true);

            Client savedClient = clientRepository.save(client);

            // Créer la base immédiatement (en asynchrone pour éviter transaction)
            try {
                asyncDatabaseService.createClientDatabaseAsync(savedClient.getId());
                log.info("✅ Base créée pour client ESSAI: {}", savedClient.getEmail());
            } catch (Exception e) {
                log.error("❌ Erreur création base pour client ESSAI: {}", e.getMessage());
            }

            return savedClient;

        } else {
            // ✅ DEFINITIF : PAS de base, juste enregistrement
            client.setConnexionsMax(999999);
            client.setConnexionsRestantes(999999);
            client.setNomBaseDonnees(null);
            return clientRepository.save(client);
        }
    }
    // ========== UPLOAD JUSTIFICATIFS ==========

    /**
     * Upload des justificatifs selon le type de document
     */
    @Transactional
    public Client uploadJustificatifs(Long clientId, String typeDocument, String fileUrl) {
        Client client = getClientById(clientId);

        switch (typeDocument.toUpperCase()) {
            case "CIN":
                client.setCinUrl(fileUrl);
                break;
            case "GERANT_CIN":
                client.setGerantCinUrl(fileUrl);
                break;
            case "PATENTE":
                client.setPatenteUrl(fileUrl);
                break;
            case "RNE":
                client.setRneUrl(fileUrl);
                break;
            default:
                throw new RuntimeException("Type de document inconnu: " + typeDocument);
        }

        // Reste EN_ATTENTE (pas de changement de statut)
        log.info("Document {} uploadé pour client {}", typeDocument, client.getEmail());
        return clientRepository.save(client);
    }

    // ========== RECHERCHES ==========

    /**
     * Trouver un client par ID
     */
    public Client getClientById(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouvé: " + id));
    }

    /**
     * Trouver un client par email
     */
    public Client getClientByEmail(String email) {
        return clientRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Client non trouvé: " + email));
    }

    /**
     * Mettre à jour un client
     */
    @Transactional
    public Client updateClient(Long id, Client updatedClient) {
        Client client = getClientById(id);

        client.setNom(updatedClient.getNom());
        client.setPrenom(updatedClient.getPrenom());
        client.setTelephone(updatedClient.getTelephone());

        return clientRepository.save(client);
    }

    /**
     * Supprimer un client (soft delete)
     */
    @Transactional
    public void deleteClient(Long id) {
        Client client = getClientById(id);
        client.setIsActive(false);
        client.setStatut(Client.StatutClient.INACTIF);
        clientRepository.save(client);
    }

    // ========== GESTION DES STATUTS ==========

    /**
     * Valider un client (après vérification des justificatifs)
     */
    @Transactional
    public Client validateClient(Long id, String commentaire) {
        Client client = getClientById(id);

        client.setJustificatifsValides(true);
        client.setStatut(Client.StatutClient.VALIDE);
        client.setDateValidation(LocalDateTime.now());
        client.setMotifRefus(null);

        log.info("Client {} validé par admin", client.getEmail());
        return clientRepository.save(client);
    }

    /**
     * Refuser un client
     */
    @Transactional
    public Client refuseClient(Long id, String motif) {
        Client client = getClientById(id);

        client.setJustificatifsValides(false);
        client.setStatut(Client.StatutClient.REFUSE);
        client.setMotifRefus(motif);
        client.setIsActive(false);

        log.info("Client {} refusé: {}", client.getEmail(), motif);
        return clientRepository.save(client);
    }

    /**
     * Activer un client (après paiement)
     */
    @Transactional
    public Client activateClient(Long id, String dbName) {
        Client client = getClientById(id);

        if (client.getStatut() != Client.StatutClient.VALIDE) {
            throw new RuntimeException("Le client doit être validé avant activation. Statut actuel: " + client.getStatut().getLabel());
        }

        client.setNomBaseDonnees(dbName);
        client.setStatut(Client.StatutClient.ACTIF);
        client.setDateActivation(LocalDateTime.now());
        client.setIsActive(true);

        // Mettre à jour les limites pour un compte actif (accès complet)
        client.setConnexionsMax(999999);
        client.setConnexionsRestantes(999999);

        log.info("Client {} activé avec base {}", client.getEmail(), dbName);
        return clientRepository.save(client);
    }

    // ========== GESTION DES CONNEXIONS ==========

    /**
     * Enregistrer une connexion client (décrémente compteur essai)
     */
    @Transactional
    public Client recordLogin(String email) {
        Client client = getClientByEmail(email);

        // Vérifier automatiquement l'expiration
        checkAndUpdateStatus(client);

        if (client.getStatut() != Client.StatutClient.ACTIF) {
            throw new RuntimeException("Compte non actif. Statut: " + client.getStatut().getLabel());
        }

        // Gestion compte essai
        if (client.getTypeInscription() == Client.TypeInscription.ESSAI) {
            if (client.getConnexionsRestantes() <= 0) {
                client.setStatut(Client.StatutClient.INACTIF);
                clientRepository.save(client);
                throw new RuntimeException("Période d'essai expirée. Veuillez souscrire un abonnement.");
            }
            client.setConnexionsRestantes(client.getConnexionsRestantes() - 1);
            log.info("Client {} - Connexions restantes: {}/{}",
                    client.getEmail(), client.getConnexionsRestantes(), client.getConnexionsMax());
        }

        return clientRepository.save(client);
    }

    /**
     * Vérifie et met à jour automatiquement le statut
     */
    private void checkAndUpdateStatus(Client client) {
        // Vérifier abonnement expiré
        if (client.getAbonnementActif() != null) {
            if (client.getAbonnementActif().getDateFin().isBefore(LocalDateTime.now())) {
                client.setStatut(Client.StatutClient.INACTIF);
                clientRepository.save(client);
                log.warn("Abonnement expiré pour client {}", client.getEmail());
            }
        }
    }

    // ========== LISTES ET RECHERCHES ==========

    /**
     * Liste tous les clients
     */
    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }

    /**
     * Clients par statut
     */
    public List<Client> getClientsByStatut(Client.StatutClient statut) {
        return clientRepository.findByStatut(statut);
    }

    /**
     * Clients en attente de validation
     */
    public List<Client> getPendingValidationClients() {
        return clientRepository.findByStatut(Client.StatutClient.EN_ATTENTE);
    }

    /**
     * Clients actifs avec base de données
     */
    public List<Client> getActiveClientsWithDatabase() {
        return clientRepository.findClientsWithDatabase();
    }
}