package org.erp.invera.model.platform;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "clients")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true)
    private String telephone;

    @Column(nullable = false)
    private String nom;

    private String prenom;

    @Column(name = "raison_sociale")
    private String raisonSociale;      // Nom légal de l'entreprise

    @Column(name = "matricule_fiscal", unique = true, nullable = true)
    private String matriculeFiscal;    //  (composé de chiffres et des caractères)

    // ========== TYPES ==========
    @Enumerated(EnumType.STRING)
    @Column(name = "type_compte", nullable = false)
    private TypeCompte typeCompte;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_inscription", nullable = false)
    private TypeInscription typeInscription;

    // ========== JUSTIFICATIFS ==========
    @Column(name = "cin_url")
    private String cinUrl;

    @Column(name = "gerant_cin_url")
    private String gerantCinUrl;

    @Column(name = "patente_url")
    private String patenteUrl;

    @Column(name = "rne_url")
    private String rneUrl;

    // ========== STATUT ==========
    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false)
    @Builder.Default
    private StatutClient statut = StatutClient.EN_ATTENTE;

    @Column(name = "motif_refus")
    private String motifRefus;

    @Column(name = "justificatifs_valides")
    @Builder.Default
    private Boolean justificatifsValides = false;

    // ========== BASE DE DONNEES ==========
    @Column(name = "nom_base_donnees")
    private String nomBaseDonnees;

    // ========== GESTION CONNEXIONS ==========
    @Column(name = "connexions_restantes")
    @Builder.Default
    private Integer connexionsRestantes = 0;

    @Column(name = "connexions_max")
    @Builder.Default
    private Integer connexionsMax = 30;

    // ========== ABONNEMENT ==========
    @OneToOne
    @JoinColumn(name = "abonnement_actif_id")
    private Abonnement abonnementActif;

    @JsonIgnore
    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL)
    private List<Abonnement> abonnements = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL)
    private List<Paiement> paiements = new ArrayList<>();

    // ========== DATES ==========
    @Column(name = "date_inscription", nullable = false)
    @Builder.Default
    private LocalDateTime dateInscription = LocalDateTime.now();

    @Column(name = "date_validation")
    private LocalDateTime dateValidation;

    @Column(name = "date_activation")
    private LocalDateTime dateActivation;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_login_date")
    private LocalDateTime lastLoginDate;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = false;

    // ============================================================
    // ENUMS SIMPLIFIÉS
    // ============================================================

    public enum TypeCompte {
        PARTICULIER("Particulier"),
        ENTREPRISE("Entreprise");

        private final String label;
        TypeCompte(String label) { this.label = label; }
        public String getLabel() { return label; }
    }

    public enum TypeInscription {
        ESSAI("Essai"),
        DEFINITIF("Définitif");

        private final String label;
        TypeInscription(String label) { this.label = label; }
        public String getLabel() { return label; }
    }

    public enum StatutClient {
        EN_ATTENTE("En attente"),
        VALIDE("Validé"),
        ACTIF("Actif"),
        REFUSE("Refusé"),
        INACTIF("Inactif");

        private final String label;
        StatutClient(String label) { this.label = label; }
        public String getLabel() { return label; }
    }


}

