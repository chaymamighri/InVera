package org.erp.invera.repository;

import org.erp.invera.dto.DashboardDTO;
import org.erp.invera.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Integer> {

    // ========================
    // RECHERCHES PAR CHAMPS
    // ========================

    // Vérifier l'existence par téléphone
    boolean existsByTelephone(String telephone);

    // Rechercher par email
    Optional<Client> findByEmail(String email);

    // Vérifier l'existence par email
    boolean existsByEmail(String email);


    // ClientRepository.java
    @Query("SELECT AVG(c.remiseClientVIP) FROM Client c WHERE c.typeClient = 'VIP'")
    Double findAverageRemiseVIP();

    @Query("SELECT AVG(c.remiseClientFidele) FROM Client c WHERE c.typeClient = 'FIDELE'")
    Double findAverageRemiseFidele();

    @Query("SELECT AVG(c.remiseClientProfessionnelle) FROM Client c WHERE c.typeClient = 'PROFESSIONNEL'")
    Double findAverageRemiseProfessionnelle();

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

}





