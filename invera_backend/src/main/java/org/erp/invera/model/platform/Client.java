package org.erp.invera.model.platform;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "clients")
public class Client {

    // ========== IDENTIFIANT ==========
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ========== INFORMATIONS CONTACT ==========
    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true)
    private String telephone;

    @Column(nullable = false)
    private String nom;

    private String prenom;

    // ========== TYPE DE COMPTE ==========
    @Column(name = "type_compte", nullable = false)
    private String typeCompte;  // PARTICULIER, ENTREPRISE

    @Column(name = "type_inscription", nullable = false)
    private String typeInscription;  // ESSAI, DEFINITIF

    // ========== JUSTIFICATIFS ==========
    // Pour PARTICULIER
    @Column(name = "cin_url")
    private String cinUrl;

    // Pour ENTREPRISE
    @Column(name = "gerant_cin_url")
    private String gerantCinUrl;

    @Column(name = "patente_url")
    private String patenteUrl;

    @Column(name = "rne_url")
    private String rneUrl;  // Registre National des Entreprises

    @Column(name = "rne_date")
    private LocalDateTime rneDate;  // Date du RNE (doit être < 3 mois)

    // ========== STATUT ==========
    @Column(name = "statut", nullable = false)
    @Builder.Default
    private String statut = "EN_ATTENTE";

    @Column(name = "motif_refus")
    private String motifRefus;

    @Column(name = "justificatifs_valides")
    @Builder.Default
    private Boolean justificatifsValides = false;

    // ========== BASE DE DONNEES ==========
    @Column(name = "nom_base_donnees")
    private String nomBaseDonnees;

    // ========== COMPTE ESSAI ==========
    @Column(name = "connexions_restantes")
    @Builder.Default
    private Integer connexionsRestantes = 0;

    @Column(name = "connexions_max")
    @Builder.Default
    private Integer connexionsMax = 30;

    // ========== DATES ==========
    @Column(name = "date_inscription", nullable = false)
    @Builder.Default
    private LocalDateTime dateInscription = LocalDateTime.now();

    @Column(name = "date_validation")
    private LocalDateTime dateValidation;

    @Column(name = "date_activation")
    private LocalDateTime dateActivation;

    // ========== AUDIT ==========
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = false;
}