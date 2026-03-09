package org.erp.invera.model.Fournisseurs;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "fournisseurs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Fournisseur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idFournisseur;

    @Column(nullable = false, length = 100)
    private String nomFournisseur;

    @Column(length = 100, unique = true)
    private String email;

    @Column(length = 255)
    private String adresse;

    @Column(length = 20)
    private String telephone;

    @Column(length = 50)
    private String ville;

    @Column(length = 50)
    private String pays;

    @Column(nullable = false)
    private Boolean actif = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructeur avec paramètres principaux
    public Fournisseur(String nomFournisseur, String telephone, String email, String adresse) {
        this.nomFournisseur = nomFournisseur;
        this.telephone = telephone;
        this.email = email;
        this.adresse = adresse;
        this.actif = true;
    }
}