package org.erp.invera.model.platform;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "offres_abonnement")
public class OffreAbonnement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nom libre : Basic, Premium, Trial...
    @Column(nullable = false, unique = true)
    private String nom;

    // Durée en mois (1, 12, etc.)
    @Min(value = 1, message = "La durée doit être au moins 1 mois")
    @Max(value = 36, message = "La durée ne peut pas dépasser 36 mois")
    private Integer dureeMois;

    // Prix de l'offre
    @Column(nullable = false)
    @Min(value = 0, message = "Le prix ne peut pas être négatif")
    private Double prix;

    @Column(nullable = false)
    @Builder.Default
    private String devise = "TND";

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "offreAbonnement")
    @Builder.Default
    private List<Abonnement> abonnements = new ArrayList<>();
}