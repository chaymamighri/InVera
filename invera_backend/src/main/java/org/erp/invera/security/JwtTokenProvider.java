package org.erp.invera.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.erp.invera.model.erp.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Gestionnaire des tokens JWT (JSON Web Tokens).
 *
 * Ce fichier s'occupe de :
 * - Générer un token JWT quand l'utilisateur se connecte
 * - Stocker les infos de l'utilisateur dans le token (id, email, nom, rôle...)
 * - Extraire ces infos depuis un token reçu
 * - Vérifier qu'un token est valide (non expiré, signature correcte)
 *
 * Le token JWT est comme une carte d'identité sécurisée que l'utilisateur
 * présente à chaque requête pour prouver qu'il est authentifié.
 */
@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration:86400000}")
    private long jwtExpirationMs;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    // ✅ GÉNÉRATION DU TOKEN à partir de l'objet User directement
    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();

        // Ajouter TOUTES les informations nécessaires
        claims.put("userId", user.getId());
        claims.put("email", user.getEmail());
        claims.put("nom", user.getNom());
        claims.put("prenom", user.getPrenom());
        claims.put("role", "ROLE_" + user.getRole().name());

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getEmail())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    // ✅ GÉNÉRATION À PARTIR DE L'AUTHENTIFICATION (pour compatibilité)
    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // Il faudrait récupérer l'utilisateur complet depuis la DB
        // Ou utiliser une autre approche
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", userDetails.getUsername());

        // Extraire le rôle
        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(auth -> auth.getAuthority())
                .orElse("ROLE_USER");
        claims.put("role", role);

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    // ✅ EXTRAIRE L'ID
    public Integer getUserIdFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.get("userId", Integer.class);
    }

    // ✅ EXTRAIRE L'EMAIL
    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.get("email", String.class);
    }

    // ✅ EXTRAIRE LE NOM
    public String getNomFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.get("nom", String.class);
    }

    // ✅ EXTRAIRE LE PRÉNOM
    public String getPrenomFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.get("prenom", String.class);
    }

    // ✅ EXTRAIRE LE RÔLE
    public String getRoleFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        String role = claims.get("role", String.class);
        // Retirer le préfixe "ROLE_" si présent
        if (role != null && role.startsWith("ROLE_")) {
            return role.substring(5);
        }
        return role;
    }

    // ✅ MÉTHODE UNIQUE POUR TOUTES LES INFOS
    public Map<String, Object> getUserInfoFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("userId", claims.get("userId"));
        userInfo.put("email", claims.get("email"));
        userInfo.put("nom", claims.get("nom"));
        userInfo.put("prenom", claims.get("prenom"));
        userInfo.put("role", claims.get("role"));

        return userInfo;
    }

    // ✅ VALIDATION DU TOKEN
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    // ✅ Génération pour Super Admin (version ultra simple)
    public String generateTokenForSuperAdmin(Integer id, String email, String nom) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("adminId", id);
        claims.put("email", email);
        claims.put("nom", nom);
        // ❌ Pas besoin de "type" ni de "role"

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getKey(), SignatureAlgorithm.HS512)
                .compact();
    }
}