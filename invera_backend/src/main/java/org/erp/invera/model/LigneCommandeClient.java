package org.erp.invera.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "ligne_commande_client")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LigneCommandeClient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idLigneCommandeClient;

    @ManyToOne
    @JoinColumn(name = "commande_client_id", nullable = false)
    private CommandeClient commandeClient;

    @ManyToOne
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    private Integer quantite;

    private BigDecimal prixUnitaire;

    private BigDecimal sousTotal;
}