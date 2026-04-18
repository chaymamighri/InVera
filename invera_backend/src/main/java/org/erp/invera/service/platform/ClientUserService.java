package org.erp.invera.service.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Client;
import org.erp.invera.model.platform.ClientUser;
import org.erp.invera.repository.platform.ClientPlatformRepository;

import org.erp.invera.repository.platform.ClientUserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClientUserService {

    private final ClientUserRepository clientUserRepository;
    private final ClientPlatformRepository clientRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    /**
     * Créer le premier admin client (automatique à l'inscription)
     */
    @Transactional
    public ClientUser createFirstAdmin(Client client, String tempPassword) {
        ClientUser adminUser = ClientUser.builder()
                .email(client.getEmail())
                .motDePasse(passwordEncoder.encode(tempPassword))
                .nom(client.getNom())
                .prenom(client.getPrenom())
                .role(ClientUser.RoleUtilisateur.ADMIN_CLIENT)
                .client(client)
                .estActif(true)
                .createdAt(LocalDateTime.now())
                .build();

        log.info("✅ Premier admin client créé pour {}", client.getEmail());
        return clientUserRepository.save(adminUser);
    }

    /**
     * Créer un employé (par l'admin client)
     */
    @Transactional
    public ClientUser createEmployee(Long clientId, String email, String password,
                                     String nom, String prenom, String role) {

        // 1. Vérifier que le client existe
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));

        // 2. Vérifier le domaine de l'email
        String domaineEmail = email.substring(email.indexOf('@') + 1);
        if (!domaineEmail.equals(client.getDomaine())) {
            throw new RuntimeException("L'email doit avoir le domaine: " + client.getDomaine());
        }

        // 3. Vérifier que l'email n'existe pas déjà
        if (clientUserRepository.existsByEmail(email)) {
            throw new RuntimeException("Email déjà utilisé: " + email);
        }

        // 4. Vérifier que le rôle est valide
        ClientUser.RoleUtilisateur roleEnum;
        try {
            roleEnum = ClientUser.RoleUtilisateur.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Rôle invalide. Valeurs possibles: ADMIN_CLIENT, COMMERCIAL, RESPONSABLE_ACHAT");
        }

        // 5. Créer l'employé
        ClientUser employee = ClientUser.builder()
                .email(email)
                .motDePasse(passwordEncoder.encode(password))
                .nom(nom)
                .prenom(prenom)
                .role(roleEnum)
                .client(client)
                .estActif(true)
                .createdAt(LocalDateTime.now())
                .build();

        log.info("✅ Employé créé: {} pour client {}", email, client.getNom());
        return clientUserRepository.save(employee);
    }

    /**
     * Récupérer tous les employés d'un client
     */
    public List<ClientUser> getEmployeesByClient(Long clientId) {
        return clientUserRepository.findByClientId(clientId);
    }

    /**
     * Récupérer un employé par son ID
     */
    public ClientUser getEmployeeById(Long id) {
        return clientUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + id));
    }

    /**
     * Récupérer un employé par email
     */
    public ClientUser getEmployeeByEmail(String email) {
        return clientUserRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + email));
    }

    /**
     * Modifier un employé
     */
    @Transactional
    public ClientUser updateEmployee(Long id, Long clientId, String nom, String prenom,
                                     String role, Boolean estActif) {

        ClientUser user = clientUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + id));

        // Vérifier que l'employé appartient bien au client
        if (!user.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Accès non autorisé à cet employé");
        }

        if (nom != null) user.setNom(nom);
        if (prenom != null) user.setPrenom(prenom);
        if (role != null) {
            try {
                user.setRole(ClientUser.RoleUtilisateur.valueOf(role.toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Rôle invalide");
            }
        }
        if (estActif != null) user.setEstActif(estActif);

        log.info("✅ Employé modifié: {}", user.getEmail());
        return clientUserRepository.save(user);
    }

    /**
     * Supprimer un employé
     */
    @Transactional
    public void deleteEmployee(Long id, Long clientId) {
        ClientUser user = clientUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + id));

        // Vérifier que l'employé appartient bien au client
        if (!user.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Accès non autorisé à cet employé");
        }

        clientUserRepository.delete(user);
        log.info("✅ Employé supprimé: {}", user.getEmail());
    }

    /**
     * Activer/Désactiver un employé
     */
    @Transactional
    public ClientUser toggleEmployeeStatus(Long id, Long clientId) {
        ClientUser user = clientUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + id));

        // Vérifier que l'employé appartient bien au client
        if (!user.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Accès non autorisé à cet employé");
        }

        user.setEstActif(!user.getEstActif());
        log.info("{} employé: {}", user.getEstActif() ? "✅ Activé" : "❌ Désactivé", user.getEmail());

        return clientUserRepository.save(user);
    }

    /**
     * Changer le mot de passe d'un employé
     */
    @Transactional
    public void changePassword(Long id, Long clientId, String oldPassword, String newPassword) {
        ClientUser user = clientUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + id));

        // Vérifier que l'employé appartient bien au client
        if (!user.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Accès non autorisé à cet employé");
        }

        // Vérifier l'ancien mot de passe
        if (!passwordEncoder.matches(oldPassword, user.getMotDePasse())) {
            throw new RuntimeException("Ancien mot de passe incorrect");
        }

        user.setMotDePasse(passwordEncoder.encode(newPassword));
        log.info("🔑 Mot de passe modifié pour: {}", user.getEmail());

        clientUserRepository.save(user);
    }

    /**
     * Réinitialiser le mot de passe (par admin)
     */
    @Transactional
    public void resetPassword(Long id, Long clientId, String newPassword) {
        ClientUser user = clientUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + id));

        // Vérifier que l'employé appartient bien au client
        if (!user.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Accès non autorisé à cet employé");
        }

        user.setMotDePasse(passwordEncoder.encode(newPassword));
        log.info("🔑 Mot de passe réinitialisé pour: {}", user.getEmail());

        clientUserRepository.save(user);
    }

    /**
     * Mettre à jour la date de dernière connexion
     */
    @Transactional
    public void updateLastLogin(String email) {
        ClientUser user = clientUserRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé: " + email));

        user.setLastLogin(LocalDateTime.now());
        clientUserRepository.save(user);
    }
}