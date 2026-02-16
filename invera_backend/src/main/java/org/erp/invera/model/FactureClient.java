package org.erp.invera.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "facture_client")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FactureClient {

    public enum StatutFacture {
        PAYE,
        NON_PAYE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idFactureClient;

    @Column(nullable = false, unique = true)
    private String referenceFactureClient;

    @Column(nullable = false)
    private LocalDateTime dateFacture;

    @ManyToOne
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @OneToOne
    @JoinColumn(name = "commande_id", nullable = false)
    private CommandeClient commande;

    @Column(nullable = false)
    private BigDecimal montantTotal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutFacture statut;
}


