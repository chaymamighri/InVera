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

    @Column(name = "remise_client_fidele", nullable = true)
    private Double remiseClientFidele;

    @Column(name = "remise_client_vip", nullable = true)
    private Double remiseClientVIP;

    @Column(name = "remise_client_professionnelle", nullable = true)
    private Double remiseClientProfessionnelle;

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




