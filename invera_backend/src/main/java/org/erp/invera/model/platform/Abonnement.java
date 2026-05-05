package org.erp.invera.model.platform;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Builder
@NoArgsConstructor  // ← Ajouter
@AllArgsConstructor
@Data
@Entity
@Table(name = "abonnements")
public class Abonnement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Client abonné
    @ManyToOne
    @JoinColumn(name = "client_id")
    private Client client;

    // Offre choisie
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offre_abonnement_id")
    private OffreAbonnement offreAbonnement;

    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;


    @Enumerated(EnumType.STRING)
    private StatutAbonnement statut;

    public enum StatutAbonnement {
        EN_ATTENTE_VALIDATION,
        ACTIF,                  // Payé et actif
        SUSPENDU,               // Suspendu temporairement (Super Admin)
        ANNULE,                 // Annulé définitivement (Super Admin/Client)
        EXPIRE,
    }
}
