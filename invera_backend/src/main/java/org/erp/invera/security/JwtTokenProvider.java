package org.erp.invera.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
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

    // Solution 1: Clé auto-générée sécurisée
    private final SecretKey jwtSecret = Keys.secretKeyFor(SignatureAlgorithm.HS512);

    // Solution alternative: Stocker la clé en Base64
    // private String jwtSecretBase64 = Base64.getEncoder().encodeToString(
    //     Keys.secretKeyFor(SignatureAlgorithm.HS512).getEncoded()
    // );

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

        return Jwts.builder()
                .setSubject(userPrincipal.getUsername())
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