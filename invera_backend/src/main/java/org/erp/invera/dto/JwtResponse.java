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
    private String username;
    private String role;
    private String nom;
    private String prenom;

    /**
     * Constructeur pratique sans le type (utilise "Bearer" par défaut)
     */
    public JwtResponse(String token, String username, String role, String nom, String prenom) {
        this.token = token;
        this.type = "Bearer";
        this.username = username;
        this.role = role;
        this.nom = nom;
        this.prenom = prenom;
    }
}