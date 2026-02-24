package org.erp.invera.service;

import org.erp.invera.dto.ClientDTO;
import org.erp.invera.dto.NouveauClientDTO;
import org.erp.invera.model.Client;
import org.erp.invera.repository.ClientRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ClientService {

    private final ClientRepository clientRepository;

    public ClientService(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
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
        client.setTypeClient(Client.TypeClient.valueOf(clientDTO.getType().toUpperCase()));
        client.setEmail(clientDTO.getEmail());

        // Initialiser les remises à null (nullable)
        client.setRemiseClientFidele(null);
        client.setRemiseClientVIP(null);
        client.setRemiseClientProfessionnelle(null);

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
     * Créer un client à partir de l'entité
     */
    public Client createClient(Client client) {
        if (clientRepository.existsByTelephone(client.getTelephone())) {
            throw new RuntimeException("Un client avec ce numéro de téléphone existe déjà");
        }

        if (client.getEmail() != null && !client.getEmail().isEmpty()) {
            Optional<Client> existingEmail = clientRepository.findByEmail(client.getEmail());
            if (existingEmail.isPresent()) {
                throw new RuntimeException("Un client avec cet email existe déjà");
            }
        }

        return clientRepository.save(client);
    }

    /**
     * Récupérer tous les clients en DTO
     */
    public List<ClientDTO> getAllClientsDTO() {
        return clientRepository.findAll()
                .stream()
                .map(ClientDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer tous les clients en entités
     */
    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }

    /**
     * Récupérer un client par ID en DTO
     */
    public ClientDTO getClientDTOById(Integer id) {
        Client client = getClientById(id);
        return ClientDTO.fromEntity(client);
    }

    /**
     * Récupérer un client par ID en entité
     */
    public Client getClientById(Integer id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouvé avec l'ID: " + id));
    }

    /**
     * Rechercher des clients par mot-clé en DTO
     */
    public List<ClientDTO> searchClientsDTO(String keyword) {
        List<Client> clients;
        if (keyword == null || keyword.trim().isEmpty()) {
            clients = clientRepository.findAll();
        } else {
            clients = clientRepository.searchClients(keyword);
        }
        return clients.stream()
                .map(ClientDTO::fromEntity)
                .collect(Collectors.toList());
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
                Client.TypeClient.PROFESSIONNEL.name(),
                Client.TypeClient.ENTREPRISE.name(),
                Client.TypeClient.FIDELE.name()
        );
    }

    /**
     * Mettre à jour les remises d'un client
     */
    public ClientDTO updateClientRemises(Integer clientId,
                                         Double remiseFidele,
                                         Double remiseVIP,
                                         Double remiseProfessionnelle) {
        Client client = getClientById(clientId);

        client.setRemiseClientFidele(remiseFidele);
        client.setRemiseClientVIP(remiseVIP);
        client.setRemiseClientProfessionnelle(remiseProfessionnelle);

        Client updatedClient = clientRepository.save(client);
        return ClientDTO.fromEntity(updatedClient);
    }

    /**
     * Récupérer les remises d'un client via DTO
     */
    public ClientDTO getClientRemises(Integer clientId) {
        Client client = getClientById(clientId);
        return ClientDTO.fromEntity(client);
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
            Client.TypeClient nouveauType = Client.TypeClient.valueOf(clientDTO.getType().toUpperCase());
            client.setTypeClient(nouveauType);
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
            Client.TypeClient type = Client.TypeClient.valueOf(typeClient.toUpperCase());

            switch (type) {
                case VIP:
                    return clientRepository.findAverageRemiseVIP();

                case FIDELE:
                    return clientRepository.findAverageRemiseFidele();

                case PROFESSIONNEL:
                    return clientRepository.findAverageRemiseProfessionnelle();

                case ENTREPRISE:
                    // Pour ENTREPRISE, pas de colonne dédiée, retourner null
                    return null;

                case PARTICULIER:
                default:
                    return null; // Les particuliers n'ont pas de remise par défaut
            }
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * ✅ Méthode utilitaire pour vérifier si un type a des remises configurées
     */
    public boolean hasRemiseConfigured(String typeClient) {
        Double remise = getRemiseForClientType(typeClient);
        return remise != null && remise > 0;
    }

    /**
     * Obtenir la remise effective d'un client (priorité à la valeur personnalisée)
     */
    public Double getRemiseEffective(Client client) {
        if (client == null) return null;

        switch (client.getTypeClient()) {
            case VIP:
                return client.getRemiseClientVIP();
            case PROFESSIONNEL:
                return client.getRemiseClientProfessionnelle();
            case FIDELE:
                return client.getRemiseClientFidele();
            case ENTREPRISE:
                return client.getRemiseClientProfessionnelle(); // Ou null selon votre logique
            case PARTICULIER:
            default:
                return null;
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