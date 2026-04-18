package org.erp.invera.dto.platform.clientsdto;

import lombok.Data;

@Data
public class ClientRegistrationRequest {
    private String email;
    private String telephone;
    private String nom;
    private String prenom;
    private String typeCompte;        // PARTICULIER, ENTREPRISE
    private String typeInscription;   // ESSAI, DEFINITIF
    private String typeAbonnement;    // MENSUEL, ANNUEL (si DEFINITIF)
    private String otp;               // Code OTP (pour vérification email)
    private String password;          // ← AJOUTER LE MOT DE PASSE
}