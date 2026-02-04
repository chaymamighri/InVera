package org.erp.invera.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "client")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "nom", nullable = false)
    private String nom;

    @Column(name = "prenom")
    private String prenom;

    @Column(name = "telephone", nullable = false, unique = true)
    private String telephone;

    @Column(name = "adresse")
    private String adresse;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_client", nullable = false)
    private TypeClient type;

    @Column(name = "email")
    private String email;

    public enum TypeClient {
        PARTICULIER("Particulier"),
        VIP("VIP"),
        PROFESSIONNEL("Professionnel"),
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





