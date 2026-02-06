package org.erp.invera.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;

/**
 * Classe utilitaire pour générer et valider les tokens JWT
 */
@Component
public class JwtTokenProvider {

    // Clé fixe pour le développement
    private static final String FIXED_SECRET = "votre_clé_secrète_très_longue_et_complexe_pour_hs512_au_moins_64_caractères_1234567890";

    private final SecretKey jwtSecret;

    public JwtTokenProvider() {
        // Convertir la clé fixe en SecretKey
        byte[] keyBytes = FIXED_SECRET.getBytes(StandardCharsets.UTF_8);
        this.jwtSecret = Keys.hmacShaKeyFor(keyBytes);

        System.out.println("=== JWT CONFIG ===");
        System.out.println("Using FIXED secret key");
        System.out.println("Key length: " + FIXED_SECRET.length());
        System.out.println("==================");
    }


    // Durée de validité du token en millisecondes (24 heures par défaut)
    @Value("${app.jwt.expiration:86400000}")
    private long jwtExpirationMs;

    /**
     * Génère un token JWT à partir de l'authentification
     */
    public String generateToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        // Récupérer le rôle
        String role = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("ROLE_USER"); // fallback

        return Jwts.builder()
                .setSubject(userPrincipal.getUsername())
                .claim("role", role) // <-- ajouter le rôle ici
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(jwtSecret, SignatureAlgorithm.HS512)
                .compact();
    }

    /**
     * Extrait le username du token JWT
     */
    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(jwtSecret)
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    /**
     * Valide le token JWT
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(jwtSecret)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (SecurityException ex) {
            System.err.println("Invalid JWT signature");
        } catch (MalformedJwtException ex) {
            System.err.println("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            System.err.println("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            System.err.println("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            System.err.println("JWT claims string is empty");
        } catch (JwtException ex) {
            System.err.println("JWT validation error: " + ex.getMessage());
        }
        return false;
    }

    /**
     * Méthode optionnelle pour obtenir la clé en Base64 (pour le débogage)
     */
    public String getSecretKeyBase64() {
        return Base64.getEncoder().encodeToString(jwtSecret.getEncoded());
    }
}