package org.erp.invera.dto.platform.clientsdto;

import lombok.Data;

@Data
public class ClientRegistrationRequest {
    // Informations contact
    private String email;
    private String telephone;
    private String nom;
    private String prenom;

    // Types obligatoires
    private String typeCompte;        // PARTICULIER, ENTREPRISE
    private String typeInscription;   // ESSAI, DEFINITIF
    private String typeAbonnement;    // MENSUEL, ANNUEL (si DEFINITIF)
}