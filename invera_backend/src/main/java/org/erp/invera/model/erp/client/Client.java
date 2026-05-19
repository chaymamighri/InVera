package org.erp.invera.model.erp.client;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedBy;

import java.time.LocalDateTime;

@Entity
@Table(name = "client")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_client")
    private Integer idClient;

    @Column(name = "nom", nullable = false)
    private String nom;

    @Column(name = "prenom")
    private String prenom;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "telephone", nullable = false, unique = true)
    private String telephone;

    @Column(name = "adresse", nullable = false)
    private String adresse;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_client", nullable = false)
    private TypeClient typeClient;

    @Column(name = "raison_sociale")
    private String raisonSociale;

    @Column(name = "matricule_fiscale", unique = true, length = 50)
    private String matriculeFiscale;

    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum TypeClient {
        PARTICULIER("Particulier"),
        VIP("VIP"),
        ENTREPRISE("Entreprise"),
        FIDELE("Fidèle");

        private final String displayName;

        TypeClient(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}



