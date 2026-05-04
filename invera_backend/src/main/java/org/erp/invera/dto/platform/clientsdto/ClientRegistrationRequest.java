package org.erp.invera.dto.platform.clientsdto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Data
public class ClientRegistrationRequest {
    // Champs existants
    private String email;
    private String telephone;
    private String typeCompte; // PARTICULIER / ENTREPRISE
    private String typeInscription;   //(ESSAI / DEFINITIF)
    private MultipartFile logo;

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
    private Map<String, MultipartFile> documents;


    // getters et setters
}