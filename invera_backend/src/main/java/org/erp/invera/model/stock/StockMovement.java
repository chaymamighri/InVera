package org.erp.invera.model.stock;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.Produit;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_movement")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_mouvement", nullable = false, length = 20)
    private MovementType typeMouvement;

    @Column(name = "quantite", nullable = false)
    private Integer quantite;

    @Column(name = "stock_avant", nullable = false)
    private Integer stockAvant;

    @Column(name = "stock_apres", nullable = false)
    private Integer stockApres;

    @Column(name = "reference", length = 50)
    private String reference;

    // est ce que c'est un commande fournisseur ( entréé ) ou commande client ( sortie )
    @Column(name = "type_document", length = 50)
    private String typeDocument;

    // refrence vers la commande fournisseur spécifier a cet mouvement
    @Column(name = "id_document")
    private Long idDocument;

    @Column(name = "commentaire", length = 500)
    private String commentaire;

    @Column(name = "date_mouvement", nullable = false)
    private LocalDateTime dateMouvement;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (dateMouvement == null) {
            dateMouvement = LocalDateTime.now();
        }
    }

    public enum MovementType {
        ENTREE("Entrée"),
        SORTIE("Sortie");

        private final String libelle;

        MovementType(String libelle) {
            this.libelle = libelle;
        }

        public String getLibelle() {
            return libelle;
        }
    }
}