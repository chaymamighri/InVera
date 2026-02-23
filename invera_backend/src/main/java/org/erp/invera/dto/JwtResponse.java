package org.erp.invera.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la réponse après authentification réussie
 * Contient le token JWT et les informations de l'utilisateur
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Long id;           // ← AJOUTER
    private String email;         // ← AJOUTER
    private String role;
    private String nom;
    private String prenom;

    /**
     * Constructeur avec toutes les informations
     */
    public JwtResponse(String token, Long id, String email, String role, String nom, String prenom) {
        this.token = token;
        this.type = "Bearer";
        this.id = id;
        this.email = email;
        this.role = role;
        this.nom = nom;
        this.prenom = prenom;
    }

    /**
     * Constructeur sans ID et email (pour compatibilité)
     */
    public JwtResponse(String token, String role, String nom, String prenom) {
        this.token = token;
        this.type = "Bearer";
        this.role = role;
        this.nom = nom;
        this.prenom = prenom;
    }
}