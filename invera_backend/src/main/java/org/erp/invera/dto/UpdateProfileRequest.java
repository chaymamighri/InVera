package org.erp.invera.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateProfileRequest {

    @NotBlank
    private String username;

    @NotBlank
    private String nom;

    @NotBlank
    private String prenom;

    // getters & setters

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }
}
