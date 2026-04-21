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

    public Client createClient(Client client, String otpCode, String plainPassword) {
        if (!otpService.verifyOtp(client.getEmail(), otpCode)) {
            throw new RuntimeException("Code OTP invalide ou expire");
        }

        if (clientRepository.existsByEmail(client.getEmail())) {
            throw new RuntimeException("Email deja utilise: " + client.getEmail());
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
            client.setConnexionsMax(999999);
            client.setConnexionsRestantes(999999);
            client.setNomBaseDonnees(null);
            client.setStatut(Client.StatutClient.EN_ATTENTE);
            client.setIsActive(false);
            client.setJustificatifsValides(false);

            return clientRepository.save(client);
        }
    }

    public void requestOtp(String email) {
        if (clientRepository.existsByEmail(email)) {
            throw new RuntimeException("Email deja utilise");
        }

        otpService.sendOtpByEmail(email);
        log.info("OTP envoye a {}", email);
    }

    @Transactional
    public Client uploadJustificatifs(Long clientId, String typeDocument, String fileUrl) {
        Client client = getClientById(clientId);

        switch (typeDocument.toUpperCase()) {
            case "CIN" -> client.setCinUrl(fileUrl);
            case "GERANT_CIN" -> client.setGerantCinUrl(fileUrl);
            case "PATENTE" -> client.setPatenteUrl(fileUrl);
            case "RNE" -> client.setRneUrl(fileUrl);
            default -> throw new RuntimeException("Type de document inconnu: " + typeDocument);
        }

        log.info("Document {} uploade pour client {}", typeDocument, client.getEmail());
        return clientRepository.save(client);
    }

    public Client getClientById(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouve: " + id));
    }

    public Client getClientByEmail(String email) {
        return clientRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Client non trouve: " + email));
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
    public Client saveClient(Client client) {
        return clientRepository.save(client);
    }

    @Transactional
    public void deleteClient(Long id) {
        Client client = getClientById(id);
        client.setIsActive(false);
        client.setStatut(Client.StatutClient.INACTIF);
        clientRepository.save(client);
    }

    @Transactional
    public Client validateClient(Long id, String commentaire) {
        Client client = getClientById(id);
        client.setJustificatifsValides(true);
        client.setStatut(Client.StatutClient.VALIDE);
        client.setDateValidation(LocalDateTime.now());
        client.setMotifRefus(null);
        log.info("Client {} valide par admin", client.getEmail());
        return clientRepository.save(client);
    }

    @Transactional
    public Client refuseClient(Long id, String motif) {
        Client client = getClientById(id);
        client.setJustificatifsValides(false);
        client.setStatut(Client.StatutClient.REFUSE);
        client.setMotifRefus(motif);
        client.setIsActive(false);
        log.info("Client {} refuse: {}", client.getEmail(), motif);
        return clientRepository.save(client);
    }

    @Transactional
    public Client activateClient(Long id, String dbName) {
        Client client = getClientById(id);

        if (client.getStatut() != Client.StatutClient.VALIDE) {
            throw new RuntimeException("Le client doit etre valide avant activation. Statut actuel: " + client.getStatut().getLabel());
        }

        client.setNomBaseDonnees(dbName);
        client.setStatut(Client.StatutClient.ACTIF);
        client.setDateActivation(LocalDateTime.now());
        client.setIsActive(true);
        client.setConnexionsMax(999999);
        client.setConnexionsRestantes(999999);

        log.info("Client {} active avec base {}", client.getEmail(), dbName);
        return clientRepository.save(client);
    }

    @Transactional
    public Client recordLogin(String email) {
        String domaine = email.substring(email.indexOf('@') + 1);

        Client client = clientRepository.findByDomaine(domaine)
                .orElseThrow(() -> new RuntimeException("Aucune entreprise trouvee pour ce domaine: " + domaine));

        checkAndUpdateStatus(client);

        if (client.getStatut() != Client.StatutClient.ACTIF) {
            throw new RuntimeException("Compte non actif. Statut: " + client.getStatut().getLabel());
        }

        if (client.getTypeInscription() == Client.TypeInscription.ESSAI) {
            if (client.getConnexionsRestantes() <= 0) {
                client.setStatut(Client.StatutClient.INACTIF);
                clientRepository.save(client);
                throw new RuntimeException(
                        "Periode d'essai expiree pour l'entreprise " + client.getNom() +
                                ". Veuillez souscrire un abonnement."
                );
            }

            client.setConnexionsRestantes(client.getConnexionsRestantes() - 1);
            clientRepository.save(client);

            log.info("Entreprise {} ({}) - Connexion de {} - Connexions restantes: {}/{}",
                    client.getNom(),
                    domaine,
                    email,
                    client.getConnexionsRestantes(),
                    client.getConnexionsMax());
        }

        return client;
    }

    private void checkAndUpdateStatus(Client client) {
        if (client.getAbonnementActif() != null && client.getAbonnementActif().getDateFin() != null) {
            if (client.getAbonnementActif().getDateFin().isBefore(LocalDateTime.now())) {
                client.setStatut(Client.StatutClient.INACTIF);
                clientRepository.save(client);
                log.warn("Abonnement expire pour client {}", client.getEmail());
            }
        }
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
