package org.erp.invera.service.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Client;
import org.erp.invera.model.platform.Utilisateur;
import org.erp.invera.repository.platform.ClientPlatformRepository;

import org.erp.invera.repository.platform.utilisateurRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private final utilisateurRepository utilisateurRepository;
    private final ClientPlatformRepository clientRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    /**
     * Créer le premier admin client (automatique à l'inscription)
     */
    @Transactional
    public Utilisateur createFirstAdmin(Client client, String tempPassword) {
        Utilisateur adminUser = Utilisateur.builder()
                .email(client.getEmail())
                .motDePasse(passwordEncoder.encode(tempPassword))
                .nom(client.getNom())
                .prenom(client.getPrenom())
                .role(Utilisateur.RoleUtilisateur.ADMIN_CLIENT)
                .client(client)
                .estActif(true)
                .createdAt(LocalDateTime.now())
                .build();

        log.info("✅ Premier admin client créé pour {}", client.getEmail());
        return utilisateurRepository.save(adminUser);
    }

    /**
     * Créer un employé (par l'admin client)
     */
    @Transactional
    public Utilisateur createEmployee(Long clientId, String email, String password,
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
        if (utilisateurRepository.existsByEmail(email)) {
            throw new RuntimeException("Email déjà utilisé: " + email);
        }

        // 4. Vérifier que le rôle est valide
        Utilisateur.RoleUtilisateur roleEnum;
        try {
            roleEnum = Utilisateur.RoleUtilisateur.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Rôle invalide. Valeurs possibles: ADMIN_CLIENT, COMMERCIAL, RESPONSABLE_ACHAT");
        }

        // 5. Créer l'employé
        Utilisateur employee = Utilisateur.builder()
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
        return utilisateurRepository.save(employee);
    }

    /**
     * Récupérer tous les employés d'un client
     */
    public List<Utilisateur> getEmployeesByClient(Long clientId) {
        return utilisateurRepository.findByClientId(clientId);
    }

    /**
     * Récupérer un employé par son ID
     */
    public Utilisateur getEmployeeById(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + id));
    }

    /**
     * Récupérer un employé par email
     */
    public Utilisateur getEmployeeByEmail(String email) {
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + email));
    }

    /**
     * Modifier un employé
     */
    @Transactional
    public Utilisateur updateEmployee(Long id, Long clientId, String nom, String prenom,
                                      String role, Boolean estActif) {

        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + id));

        // Vérifier que l'employé appartient bien au client
        if (!user.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Accès non autorisé à cet employé");
        }

        if (nom != null) user.setNom(nom);
        if (prenom != null) user.setPrenom(prenom);
        if (role != null) {
            try {
                user.setRole(Utilisateur.RoleUtilisateur.valueOf(role.toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Rôle invalide");
            }
        }
        if (estActif != null) user.setEstActif(estActif);

        log.info("✅ Employé modifié: {}", user.getEmail());
        return utilisateurRepository.save(user);
    }

    /**
     * Supprimer un employé
     */
    @Transactional
    public void deleteEmployee(Long id, Long clientId) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + id));

        // Vérifier que l'employé appartient bien au client
        if (!user.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Accès non autorisé à cet employé");
        }

        utilisateurRepository.delete(user);
        log.info("✅ Employé supprimé: {}", user.getEmail());
    }

    /**
     * Activer/Désactiver un employé
     */
    @Transactional
    public Utilisateur toggleEmployeeStatus(Long id, Long clientId) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + id));

        // Vérifier que l'employé appartient bien au client
        if (!user.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Accès non autorisé à cet employé");
        }

        user.setEstActif(!user.getEstActif());
        log.info("{} employé: {}", user.getEstActif() ? "✅ Activé" : "❌ Désactivé", user.getEmail());

        return utilisateurRepository.save(user);
    }

}