package org.erp.invera.model.erp;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categorie")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Categorie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_categorie")
    private Integer idCategorie;

    @Column(name = "nom_categorie", nullable = false, unique = true)
    private String nomCategorie;

    @Column(name = "description")
    private String description;

    @Column(name = "taux_tva", precision = 5, scale = 2)
    private BigDecimal tauxTVA;

    @OneToMany(mappedBy = "categorie")
    @JsonIgnore
    private List<Produit> produits = new ArrayList<>();


    // Constructeur pour faciliter la création
    public Categorie(String nomCategorie, String description) {
        this.nomCategorie = nomCategorie;
        this.description = description;
    }
}
