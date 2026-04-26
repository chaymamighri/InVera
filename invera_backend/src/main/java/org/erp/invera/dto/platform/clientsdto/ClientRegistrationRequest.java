package org.erp.invera.dto.platform.clientsdto;

import lombok.Data;

@Data
public class ClientRegistrationRequest {
    // Champs existants
    private String email;
    private String telephone;
    private String typeCompte; // PARTICULIER / ENTREPRISE
    private String typeInscription;   //(ESSAI / DEFINITIF)


    private Long offreId;        // ID de l'offre choisie

    // Particulier
    private String nom;
    private String prenom;

    // Entreprise
    private String raisonSociale;
    private String matriculeFiscal;

    // Authentification
    private String otp;
    private String password;


    // getters et setters
}