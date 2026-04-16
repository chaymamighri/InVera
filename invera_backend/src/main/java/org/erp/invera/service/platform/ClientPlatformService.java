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

    // ========== CRUD DE BASE ==========

    /**
     * Créer un nouveau client
     */
    @Transactional
    public Client createClient(Client client) {
        if (clientRepository.existsByEmail(client.getEmail())) {
            throw new RuntimeException("Email déjà utilisé: " + client.getEmail());
        }

        if (client.getTelephone() != null && clientRepository.existsByTelephone(client.getTelephone())) {
            throw new RuntimeException("Téléphone déjà utilisé: " + client.getTelephone());
        }

        client.setStatut("EN_ATTENTE");
        client.setDateInscription(LocalDateTime.now());
        client.setIsActive(false);

        // Configuration compte essai
        if ("ESSAI".equals(client.getTypeInscription())) {
            client.setConnexionsMax(30);
            client.setConnexionsRestantes(30);
        }

        return clientRepository.save(client);
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

        // Changer le statut si tous les documents sont soumis
        client.setStatut("DOCUMENTS_SOUMIS");

        log.info("Document {} uploadé pour client {}", typeDocument, client.getEmail());
        return clientRepository.save(client);
    }

    /**
     * Upload de tous les justificatifs en une fois (particulier)
     */
    @Transactional
    public Client uploadJustificatifsParticulier(Long clientId, String cinUrl) {
        Client client = getClientById(clientId);

        if (!"PARTICULIER".equals(client.getTypeCompte())) {
            throw new RuntimeException("Cette méthode est réservée aux particuliers");
        }

        client.setCinUrl(cinUrl);
        client.setStatut("DOCUMENTS_SOUMIS");

        log.info("Justificatifs uploadés pour client particulier {}", client.getEmail());
        return clientRepository.save(client);
    }

    /**
     * Upload de tous les justificatifs en une fois (entreprise)
     */
    @Transactional
    public Client uploadJustificatifsEntreprise(Long clientId, String gerantCinUrl, String patenteUrl, String rneUrl, LocalDateTime rneDate) {
        Client client = getClientById(clientId);

        if (!"ENTREPRISE".equals(client.getTypeCompte())) {
            throw new RuntimeException("Cette méthode est réservée aux entreprises");
        }

        // Vérifier que le RNE date de moins de 3 mois
        if (rneDate != null && rneDate.isBefore(LocalDateTime.now().minusMonths(3))) {
            throw new RuntimeException("Le RNE doit dater de moins de 3 mois");
        }

        client.setGerantCinUrl(gerantCinUrl);
        client.setPatenteUrl(patenteUrl);
        client.setRneUrl(rneUrl);
        client.setRneDate(rneDate);
        client.setStatut("DOCUMENTS_SOUMIS");

        log.info("Justificatifs uploadés pour client entreprise {}", client.getEmail());
        return clientRepository.save(client);
    }

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
        client.setStatut("SUPPRIME");
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
        client.setStatut("VALIDE");
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
        client.setStatut("REFUSE");
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

        if (!"VALIDE".equals(client.getStatut())) {
            throw new RuntimeException("Le client doit être validé avant activation");
        }

        client.setNomBaseDonnees(dbName);
        client.setStatut("ACTIF");
        client.setDateActivation(LocalDateTime.now());
        client.setIsActive(true);

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

        if (!"ACTIF".equals(client.getStatut())) {
            throw new RuntimeException("Compte non actif. Statut: " + client.getStatut());
        }

        // Gestion compte essai
        if ("ESSAI".equals(client.getTypeInscription())) {
            if (client.getConnexionsRestantes() <= 0) {
                throw new RuntimeException("Période d'essai expirée");
            }
            client.setConnexionsRestantes(client.getConnexionsRestantes() - 1);
            log.info("Client {} - Connexions restantes: {}", client.getEmail(), client.getConnexionsRestantes());
        }

        return clientRepository.save(client);
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
    public List<Client> getClientsByStatut(String statut) {
        return clientRepository.findByStatut(statut);
    }

    /**
     * Clients en attente de validation
     */
    public List<Client> getPendingValidationClients() {
        return clientRepository.findPendingValidationClients();
    }

    /**
     * Clients actifs avec base de données
     */
    public List<Client> getActiveClientsWithDatabase() {
        return clientRepository.findClientsWithDatabase();
    }

}
