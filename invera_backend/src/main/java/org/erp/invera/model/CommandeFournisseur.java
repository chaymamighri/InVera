package org.erp.invera.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;
@Entity
@Table(name = "commande_fournisseur")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommandeFournisseur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idCommande;

    @Temporal(TemporalType.DATE)
    private Date dateCommande;

    private String statut;

    private Boolean receptionPartielle;

    // ✅ ADD THIS (VERY IMPORTANT)
    @ManyToOne
    @JoinColumn(name = "demande_achat_id")
    private DemandeAchat demandeAchat;
}

