package org.erp.invera.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Entity
@Table(name = "demande_achat")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DemandeAchat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idRapport;

    @Temporal(TemporalType.DATE)
    private Date dateDebut;

    @Temporal(TemporalType.DATE)
    private Date dateFin;

    private Double totalAchats;

    private String statut;

    // Relation with CommandeFournisseur (1..*)
    @OneToMany(mappedBy = "demandeAchat", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CommandeFournisseur> listeCommandesFournisseurs;
}