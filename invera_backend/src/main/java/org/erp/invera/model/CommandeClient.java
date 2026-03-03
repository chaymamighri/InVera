package org.erp.invera.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "commande_client")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)

public class CommandeClient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idCommandeClient;

    @Column(name = "reference_commande_client", nullable = false, unique = true)
    private String referenceCommandeClient;

    @ManyToOne
    @JsonIgnore
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false)
    private StatutCommande statut;

    @Column(name = "date_commande", nullable = false)
    private LocalDateTime dateCommande;

    @Column(name = "sous_total", nullable = false, precision = 19, scale = 2)
    private BigDecimal sousTotal;

    @Column(name = "taux_remise", nullable = false, precision = 19, scale = 2)
    private BigDecimal tauxRemise;

    @Column(name = "total", nullable = false, precision = 19, scale = 2)
    private BigDecimal total;


    // --- champs d'audit ---
    @CreatedBy
    @JoinColumn(name = "created_by", nullable = false,  updatable = false)
    private String  createdBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false,  updatable = false)
    private LocalDateTime createdAt;
    // ------------------------------


    @OneToMany(mappedBy = "commandeClient", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LigneCommandeClient> lignesCommande = new ArrayList<>();

    public enum StatutCommande {
        EN_ATTENTE("En attente"),
        CONFIRMEE("Confirmée"),
        ANNULEE("Annulée");

        private final String displayName;

        StatutCommande(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    // Méthodes utilitaires pour gérer la relation bidirectionnelle
    public void addLigneCommande(LigneCommandeClient ligne) {
        lignesCommande.add(ligne);
        ligne.setCommandeClient(this);
    }

    public void removeLigneCommande(LigneCommandeClient ligne) {
        lignesCommande.remove(ligne);
        ligne.setCommandeClient(null);
    }
}