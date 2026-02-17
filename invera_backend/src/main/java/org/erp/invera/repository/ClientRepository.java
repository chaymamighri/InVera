package org.erp.invera.repository;

import org.erp.invera.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Integer> {

    // ========================
    // RECHERCHES PAR CHAMPS
    // ========================

    // Trouver par téléphone
    Optional<Client> findByTelephone(String telephone);

    // Vérifier l'existence par téléphone
    boolean existsByTelephone(String telephone);

    // Vérifier si téléphone existe (sauf pour un client donné) - CORRIGÉ
    boolean existsByTelephoneAndIdClientNot(String telephone, Integer idClient);

    // Rechercher par email
    Optional<Client> findByEmail(String email);

    // Vérifier l'existence par email
    boolean existsByEmail(String email);

    // Vérifier si email existe (sauf pour un client donné) - CORRIGÉ
    boolean existsByEmailAndIdClientNot(String email, Integer idClient);

    // Rechercher par nom (insensible à la casse)
    List<Client> findByNomContainingIgnoreCase(String nom);

    // Rechercher par prénom (insensible à la casse)
    List<Client> findByPrenomContainingIgnoreCase(String prenom);

    // Rechercher par type de client - CORRIGÉ (type → typeClient)
    List<Client> findByTypeClient(Client.TypeClient typeClient);

    // Recherche combinée nom ET prénom
    List<Client> findByNomContainingIgnoreCaseAndPrenomContainingIgnoreCase(String nom, String prenom);

    // Recherche combinée nom OU prénom
    List<Client> findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCase(String nom, String prenom);

    // ========================
    // RECHERCHES AVANCÉES
    // ========================

    // Recherche avancée avec JPQL sur tous les champs texte
    @Query("SELECT c FROM Client c WHERE " +
            "LOWER(c.nom) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.prenom) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "c.telephone LIKE CONCAT('%', :keyword, '%') OR " +
            "LOWER(c.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.adresse) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Client> searchClients(@Param("keyword") String keyword);

    // ========================
    // STATISTIQUES
    // ========================

    // Compter par type de client - CORRIGÉ
    Long countByTypeClient(Client.TypeClient typeClient);

    // Compter tous les clients
    Long countBy();

    // ========================
    // RECHERCHES SPÉCIFIQUES REMISES
    // ========================

    // Trouver les clients avec remise standard personnalisée
    List<Client> findByRemiseStandardIsNotNull();

    // Trouver les clients avec remise fidèle personnalisée
    List<Client> findByRemiseClientFideleIsNotNull();

    // Trouver les clients avec remise VIP personnalisée
    List<Client> findByRemiseClientVIPIsNotNull();

    // Trouver les clients avec remise professionnelle personnalisée
    List<Client> findByRemiseClientProfessionnelleIsNotNull();

    // Trouver les clients avec au moins une remise personnalisée
    @Query("SELECT c FROM Client c WHERE " +
            "c.remiseStandard IS NOT NULL OR " +
            "c.remiseClientFidele IS NOT NULL OR " +
            "c.remiseClientVIP IS NOT NULL OR " +
            "c.remiseClientProfessionnelle IS NOT NULL")
    List<Client> findClientsWithCustomRemises();

    // Trouver les clients sans aucune remise personnalisée
    @Query("SELECT c FROM Client c WHERE " +
            "c.remiseStandard IS NULL AND " +
            "c.remiseClientFidele IS NULL AND " +
            "c.remiseClientVIP IS NULL AND " +
            "c.remiseClientProfessionnelle IS NULL")
    List<Client> findClientsWithoutCustomRemises();

    // ========================
    // VÉRIFICATIONS D'EXISTENCE
    // ========================

    // Vérifier si un client existe avec un certain nom et prénom
    boolean existsByNomAndPrenom(String nom, String prenom);

    // Vérifier si un client existe avec un certain nom et prénom (sauf ID)
    boolean existsByNomAndPrenomAndIdClientNot(String nom, String prenom, Integer idClient);
}