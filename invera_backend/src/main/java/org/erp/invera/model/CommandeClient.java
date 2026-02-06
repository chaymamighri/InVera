package org.erp.invera.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "commande_client")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommandeClient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "numero_commande", unique = true, nullable = false)
    private String numeroCommande;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false)
    private StatutCommande statut = StatutCommande.EN_ATTENTE;

    @CreationTimestamp
    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_livraison")
    private LocalDateTime dateLivraison;

    @Column(name = "sous_total", precision = 10, scale = 2)
    private BigDecimal sousTotal;

    @Column(name = "montant_remise", precision = 10, scale = 2)
    private BigDecimal montantRemise = BigDecimal.ZERO;

    @Column(name = "taux_remise", precision = 5, scale = 2)
    private BigDecimal tauxRemise = BigDecimal.ZERO;

    @Column(name = "total", precision = 10, scale = 2, nullable = false)
    private BigDecimal total;

    @Column(name = "notes")
    private String notes;

    // Stockage des produits sous forme de JSON ou Map
    @ElementCollection
    @CollectionTable(name = "commande_produits",
            joinColumns = @JoinColumn(name = "commande_id"))
    @MapKeyColumn(name = "produit_id")
    @Column(name = "quantite")
    private Map<Integer, Integer> produits = new HashMap<>(); // produitId -> quantite

    // Méthode pour générer le numéro de commande
    @PrePersist
    public void generateNumeroCommande() {
        if (this.numeroCommande == null) {
            this.numeroCommande = "CMD-" + LocalDateTime.now().getYear() + "-" +
                    java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }
    }


    public enum StatutCommande {
        EN_ATTENTE("En attente"),
        CONFIRMEE("Confirmée"),
        EN_PREPARATION("En préparation"),
        LIVREE("Livrée"),
        ANNULEE("Annulée");

        private final String displayName;

        StatutCommande(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}