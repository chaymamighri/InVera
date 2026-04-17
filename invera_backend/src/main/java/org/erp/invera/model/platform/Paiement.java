package org.erp.invera.model.platform;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "paiements")
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "client_id")
    private Client client;

    @ManyToOne
    @JoinColumn(name = "abonnement_id")
    private Abonnement abonnement;

    private String transactionId;      // ID transaction fournisseur
    private String factureNumero;

    @Enumerated(EnumType.STRING)
    private MoyenPaiement moyenPaiement;  // CARTE, E_DINAR, FLOUCI, WALLET

    private Double montant;
    private String devise;

    @Enumerated(EnumType.STRING)
    private StatutPaiement statut;  // EN_ATTENTE, SUCCES, ECHEC, REMBOURSE

    private String codeAutorisation;
    private String messageErreur;

    private LocalDateTime dateDemande;
    private LocalDateTime dateConfirmation;

    // Tunisie spécifique
    private String cin;              // Pour e-Dinar
    private String telephone;        // Pour paiement mobile

    public enum MoyenPaiement {
        CARTE_BANCAIRE("Carte bancaire"),
        E_DINAR("e-Dinar"),
        FLOUCI("Flouci"),
        D17("D17"),
        WALLET("Porte-monnaie électronique");

        public final String label;
        MoyenPaiement(String label) { this.label = label; }
    }

    public enum StatutPaiement {
        EN_ATTENTE, SUCCES, ECHEC, REMBOURSE
    }
}