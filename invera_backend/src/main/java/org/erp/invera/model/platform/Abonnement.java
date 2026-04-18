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

    @Enumerated(EnumType.STRING)
    private PeriodType periodType;  // MENSUEL ou ANNUEL

    private Double montant;
    private String devise;

    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private LocalDateTime dateProchainRenouvellement;

    @Enumerated(EnumType.STRING)
    private StatutAbonnement statut;

    private Boolean autoRenouvellement = true;

    public enum PeriodType {
        MENSUEL("Mensuel", 1, 29.0),      // 29 TND/mois
        ANNUEL("Annuel", 12, 313.2);       // 29 * 12 * 0.9 = 313.2 TND/an

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