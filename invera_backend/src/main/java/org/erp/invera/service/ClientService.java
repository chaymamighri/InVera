package org.erp.invera.service;

import org.erp.invera.dto.clientdto.NouveauClientDTO;
import org.erp.invera.model.client.Client;
import org.erp.invera.model.client.ClientTypeDiscount;
import org.erp.invera.repository.ClientRepository;
import org.erp.invera.repository.ClientTypeDiscountRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;


/**
 * Service de gestion des clients.
 *
 * Ce fichier gère tout ce qui concerne les clients :
 *
 * 1. CRÉATION D'UN CLIENT :
 *    - Vérifie l'unicité du téléphone et de l'email
 *    - Enregistre automatiquement la date de création et l'utilisateur connecté
 *    - Applique la remise selon le type de client (VIP, FIDÈLE, ENTREPRISE...)
 *
 * 2. MODIFICATION :
 *    - Met à jour les informations personnelles
 *    - Change le type de client (et ajuste la remise automatiquement)
 *
 * 3. RECHERCHE :
 *    - Liste complète des clients
 *    - Recherche par mot-clé (nom, prénom, téléphone, email)
 *
 * 4. GESTION DES REMISES PAR TYPE :
 *    - Chaque type de client a une remise configurable (ex: VIP = 15%)
 *    - Mise à jour dynamique de la remise pour tous les clients d'un même type
 *    - Le type PARTICULIER a toujours 0% de remise
 *
 * 5. SUPPRESSION :
 *    - Suppression définitive d'un client
 *
 * Types de clients disponibles :
 * - PARTICULIER (remise 0%)
 * - VIP (remise configurable)
 * - FIDELE (remise configurable)
 * - ENTREPRISE (remise configurable)
 */
@Service
@Transactional
public class ClientService {

    private final ClientRepository clientRepository;
    private final ClientTypeDiscountRepository clientTypeDiscountRepository;

    public ClientService(ClientRepository clientRepository,
                         ClientTypeDiscountRepository clientTypeDiscountRepository) {
        this.clientRepository = clientRepository;
        this.clientTypeDiscountRepository = clientTypeDiscountRepository;
    }


    // ====================
    // CRUD Operations
    // ====================


    /**
     * Créer un client à partir du DTO
     */
    public Client creerClient(NouveauClientDTO clientDTO) {
        // Vérifier l'unicité du téléphone
        if (clientRepository.existsByTelephone(clientDTO.getTelephone())) {
            throw new RuntimeException("Un client avec ce numéro de téléphone existe déjà");
        }

        // Vérifier l'email si fourni
        if (clientDTO.getEmail() != null && !clientDTO.getEmail().isEmpty()) {
            Optional<Client> existingEmail = clientRepository.findByEmail(clientDTO.getEmail());
            if (existingEmail.isPresent()) {
                throw new RuntimeException("Un client avec cet email existe déjà");
            }
        }
        // Convertir DTO en entité
        Client client = new Client();
        client.setNom(clientDTO.getNom());
        client.setPrenom(clientDTO.getPrenom());
        client.setTelephone(clientDTO.getTelephone());
        client.setAdresse(clientDTO.getAdresse());
        Client.TypeClient clientType = normalizeClientType(clientDTO.getType());
        client.setTypeClient(clientType);
        client.setEmail(clientDTO.getEmail());

        resetTypeDiscountFields(client);
        applyConfiguredTypeDiscount(client, clientType);

        // ✅ AJOUTER CES LIGNES POUR LES CHAMPS D'AUDIT
        client.setCreatedAt(LocalDateTime.now());  // Date et heure actuelles

        // Récupérer l'utilisateur connecté (si vous avez Spring Security)
        String currentUser = "SYSTEM"; // valeur par défaut
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                currentUser = auth.getName();
            }
        } catch (Exception e) {
            // Pas de contexte de sécurité, on garde "SYSTEM"
        }
        client.setCreatedBy(currentUser);

        return clientRepository.save(client);
    }



    /**
     * Récupérer tous les clients en entités
     */
    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }


    /**
     * Rechercher des clients par mot-clé en entités
     */
    public List<Client> searchClients(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return clientRepository.findAll();
        }
        return clientRepository.searchClients(keyword);
    }

    /**
     * Vérifier si un téléphone existe
     */
    public boolean checkTelephoneExists(String telephone) {
        return clientRepository.existsByTelephone(telephone);
    }

    /**
     * Récupérer les types de clients disponibles
     */
    public List<String> getClientTypes() {
        return List.of(
                Client.TypeClient.PARTICULIER.name(),
                Client.TypeClient.VIP.name(),
                Client.TypeClient.ENTREPRISE.name(),
                Client.TypeClient.FIDELE.name()
        );
    }

    /**
     * Mettre à jour un client complet
     */
    public Client updateClient(Integer id, NouveauClientDTO clientDTO) {
        // Vérifier si le client existe
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouvé avec l'ID: " + id));

        System.out.println("Mise à jour du client: " + client.getNom());

        // Vérifier si le nouveau téléphone est déjà utilisé par un autre client
        if (!client.getTelephone().equals(clientDTO.getTelephone()) &&
                clientRepository.existsByTelephone(clientDTO.getTelephone())) {
            throw new RuntimeException("Un autre client avec ce numéro de téléphone existe déjà");
        }

        // Vérifier si le nouvel email est déjà utilisé par un autre client
        if (clientDTO.getEmail() != null && !clientDTO.getEmail().isEmpty() &&
                !client.getEmail().equals(clientDTO.getEmail()) &&
                clientRepository.existsByEmail(clientDTO.getEmail())) {
            throw new RuntimeException("Un autre client avec cet email existe déjà");
        }

        // Mise à jour des champs avec les données du DTO
        client.setNom(clientDTO.getNom());
        client.setPrenom(clientDTO.getPrenom());
        client.setEmail(clientDTO.getEmail());
        client.setTelephone(clientDTO.getTelephone());
        client.setAdresse(clientDTO.getAdresse());

        // Conversion et mise à jour du type de client
        if (clientDTO.getType() != null) {
            Client.TypeClient nouveauType = normalizeClientType(clientDTO.getType());
            client.setTypeClient(nouveauType);
            resetTypeDiscountFields(client);
            applyConfiguredTypeDiscount(client, nouveauType);
        }

        // Sauvegarde
        Client savedClient = clientRepository.save(client);
        System.out.println("✅ Client mis à jour avec succès: " + savedClient.getIdClient());

        return savedClient;
    }


    /**
     * ✅ NOUVELLE MÉTHODE: Obtenir la remise par type de client (UNIQUEMENT depuis la base)
     * Retourne null si aucune remise n'est configurée en base
     */
    public Double getRemiseForClientType(String typeClient) {
        if (typeClient == null) return null;

        try {
            Client.TypeClient type = normalizeClientType(typeClient);
            if (type == Client.TypeClient.PARTICULIER) {
                return 0.0;
            }
            Optional<ClientTypeDiscount> configuredDiscount = clientTypeDiscountRepository.findById(type);
            if (configuredDiscount.isPresent()) {
                return configuredDiscount.get().getRemise();
            }

            return getLegacyClientAverageDiscount(type);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    public Double updateRemiseForClientType(String typeClient, Double remise) {
        if (typeClient == null || typeClient.isBlank()) {
            throw new IllegalArgumentException("Le type client est obligatoire");
        }
        if (remise == null || remise < 0 || remise > 100) {
            throw new IllegalArgumentException("La remise doit être comprise entre 0 et 100");
        }

        Client.TypeClient type = normalizeClientType(typeClient);
        if (type == Client.TypeClient.PARTICULIER) {
            clientTypeDiscountRepository.deleteById(type);
            if (Double.compare(remise, 0.0) != 0) {
                throw new IllegalArgumentException("Le type PARTICULIER doit conserver une remise de 0%");
            }
            return 0.0;
        }

        clientTypeDiscountRepository.save(new ClientTypeDiscount(type, remise));

        List<Client> clients = clientRepository.findByTypeClient(type);
        if (!clients.isEmpty()) {
            for (Client client : clients) {
                applyTypeDiscount(client, type, remise);
            }
            clientRepository.saveAll(clients);
        }

        return remise;
    }

    private void resetTypeDiscountFields(Client client) {
        client.setRemiseClientFidele(null);
        client.setRemiseClientVIP(null);
        client.setRemiseClientProfessionnelle(null);
    }

    private Client.TypeClient normalizeClientType(String typeClient) {
        if (typeClient == null || typeClient.isBlank()) {
            throw new IllegalArgumentException("Le type client est obligatoire");
        }

        Client.TypeClient parsedType = Client.TypeClient.valueOf(typeClient.toUpperCase());
        if (parsedType == Client.TypeClient.PROFESSIONNEL) {
            return Client.TypeClient.ENTREPRISE;
        }
        return parsedType;
    }

    private void applyConfiguredTypeDiscount(Client client, Client.TypeClient type) {
        Double configuredDiscount = getRemiseForClientType(type.name());
        if (configuredDiscount != null) {
            applyTypeDiscount(client, type, configuredDiscount);
        }
    }

    private Double getLegacyClientAverageDiscount(Client.TypeClient type) {
        switch (type) {
            case VIP:
                return clientRepository.findAverageRemiseVIP();
            case FIDELE:
                return clientRepository.findAverageRemiseFidele();
            case PROFESSIONNEL:
                return clientRepository.findAverageRemiseProfessionnelle();
            case ENTREPRISE:
            case PARTICULIER:
            default:
                return null;
        }
    }

    private void applyTypeDiscount(Client client, Client.TypeClient type, Double remise) {
        switch (type) {
            case VIP:
                client.setRemiseClientVIP(remise);
                break;
            case FIDELE:
                client.setRemiseClientFidele(remise);
                break;
            case PROFESSIONNEL:
                client.setRemiseClientProfessionnelle(remise);
                break;
            default:
                break;
        }
    }

    /**
     * Supprimer un client
     */
    public void deleteClient(Integer id) {
        if (!clientRepository.existsById(id)) {
            throw new RuntimeException("Client non trouvé avec l'ID: " + id);
        }
        clientRepository.deleteById(id);
    }
}
