package org.erp.invera.model.erp.Fournisseurs;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.erp.Produit;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "fournisseurs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Fournisseur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_fournisseur")
    private Integer idFournisseur;

    @Column(name = "nom_fournisseur", nullable = false, length = 100)
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

    // ✅ Relation One-to-Many avec Produit
    @OneToMany(mappedBy = "fournisseur", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Produit> produits = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Fournisseur(String nomFournisseur, String telephone, String email, String adresse) {
        this.nomFournisseur = nomFournisseur;
        this.telephone = telephone;
        this.email = email;
        this.adresse = adresse;
        this.actif = true;
    }
}