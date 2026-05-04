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
    @JoinColumn(name = "abonnement_id")
    private Abonnement abonnement;

    private String konnectPaymentId;      // ID chez Konnect (après création checkout)

    private Double montant;
    private String devise;

    @Enumerated(EnumType.STRING)
    private StatutPaiement statut;

    private LocalDateTime dateDemande;
    private LocalDateTime dateConfirmation;

    public enum StatutPaiement {
        EN_ATTENTE,
        SUCCES,
        ECHEC
    }
}