package org.erp.invera.model.client;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "facture_client")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
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

    // --- Nouveaux champs d'audit ---
    @CreatedBy
    @JoinColumn(name = "created_by", nullable = false,  updatable = false)
    private String createdBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false,  updatable = false)
    private LocalDateTime createdAt;

}


