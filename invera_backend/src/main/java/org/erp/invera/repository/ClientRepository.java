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

    // Trouver par téléphone
    Optional<Client> findByTelephone(String telephone);

    // Vérifier l'existence par téléphone
    boolean existsByTelephone(String telephone);

    // Rechercher par nom
    List<Client> findByNomContainingIgnoreCase(String nom);

    // Rechercher par prénom
    List<Client> findByPrenomContainingIgnoreCase(String prenom);

    // Rechercher par type de client
    List<Client> findByType(Client.TypeClient type);

    // Recherche combinée nom et prénom
    List<Client> findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCase(String nom, String prenom);

    // Recherche par email
    Optional<Client> findByEmail(String email);

    // Recherche avancée avec JPQL
    @Query("SELECT c FROM Client c WHERE " +
            "LOWER(c.nom) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.prenom) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.telephone) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.email) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Client> searchClients(@Param("keyword") String keyword);

    // Compter par type
    Long countByType(Client.TypeClient type);

    // Vérifier si email existe (sauf pour un client donné)
    boolean existsByEmailAndIdNot(String email, Integer id);

    // Vérifier si téléphone existe (sauf pour un client donné)
    boolean existsByTelephoneAndIdNot(String telephone, Integer id);
}