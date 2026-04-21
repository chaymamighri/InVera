package org.erp.invera.model.platform;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "abonnements")
public class Abonnement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "client_id")
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offre_abonnement_id")
    private OffreAbonnement offreAbonnement;

    @Enumerated(EnumType.STRING)
    private PeriodType periodType;

    @Column(name = "duree_mois")
    private Integer dureeMois;

    private Double montant;
    private String devise;

    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private LocalDateTime dateProchainRenouvellement;

    @Enumerated(EnumType.STRING)
    private StatutAbonnement statut;

    private Boolean autoRenouvellement = true;

    public enum PeriodType {
        MENSUEL("1 mois", 1, 29.0),
        TROIS_MOIS("3 mois", 3, 79.0),
        ANNUEL("1 an", 12, 313.2);

        private final String label;
        private final int mois;
        private final double prix;

        PeriodType(String label, int mois, double prix) {
            this.label = label;
            this.mois = mois;
            this.prix = prix;
        }

        public String getLabel() { return label; }
        public int getMois() { return mois; }
        public double getPrix() { return prix; }
    }

    public enum StatutAbonnement {
        ACTIF, EXPIRE, SUSPENDU, ANNULE
    }
}
