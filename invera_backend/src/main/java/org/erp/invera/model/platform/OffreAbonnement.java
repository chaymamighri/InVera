package org.erp.invera.model.platform;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
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

    @Column(nullable = false)
    private String nom;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_offre", nullable = false)
    private TypeOffre typeOffre;

    @Column(name = "duree_mois", nullable = false)
    private Integer dureeMois;

    @Column(nullable = false)
    private Double prix;

    @Column(nullable = false)
    @Builder.Default
    private String devise = "TND";

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "offreAbonnement")
    @Builder.Default
    private List<Abonnement> abonnements = new ArrayList<>();

    public enum TypeOffre {
        CLIENT("Client"),
        ENTREPRISE("Entreprise");

        private final String label;

        TypeOffre(String label) {
            this.label = label;
        }

        public String getLabel() {
            return label;
        }
    }
}
