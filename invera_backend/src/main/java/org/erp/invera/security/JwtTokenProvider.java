package org.erp.invera.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration:86400000}")
    private long jwtExpirationMs;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    // ============================================================
    // GÉNÉRATION POUR SUPER ADMIN
    // ============================================================

    /**
     * Génère un token pour Super Admin
     */
    public String generateTokenForSuperAdmin(String email, String role, Long clientId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", email);
        // ✅ Ajouter le préfixe ROLE_ pour Spring Security
        claims.put("role", "ROLE_" + role);  // "ROLE_SUPER_ADMIN"
        claims.put("clientId", clientId);
        claims.put("type", "SUPER_ADMIN");

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

    // ============================================================
    // GÉNÉRATION POUR CLIENTS (ClientUser)
    // ============================================================

    /**
     * Génère un token pour ClientUser (admin client, commercial, responsable achat)
     */
    public String generateTokenForClient(String email, String role, Long clientId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", email);
        // ✅ Ajouter le préfixe ROLE_ pour Spring Security
        claims.put("role", "ROLE_" + role);  // "ROLE_ADMIN_CLIENT", "ROLE_COMMERCIAL", etc.
        claims.put("clientId", clientId);
        claims.put("type", "CLIENT");

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

    // ============================================================
    // GÉNÉRATION GÉNÉRIQUE
    // ============================================================

    /**
     * Génère un token générique (détecte automatiquement le type)
     */
    public String generateToken(String email, String role, Long clientId) {
        if (clientId == null) {
            return generateTokenForSuperAdmin(email, role, null);
        } else {
            return generateTokenForClient(email, role, clientId);
        }
    }

    // ============================================================
    // EXTRACTION DES INFORMATIONS
    // ============================================================

    /**
     * Extrait l'email du token
     */
    public String getEmailFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("email", String.class);
    }

    /**
     * Extrait le rôle du token (sans le préfixe ROLE_)
     */
    public String getRoleFromToken(String token) {
        Claims claims = getClaims(token);
        String role = claims.get("role", String.class);
        // ✅ Enlever le préfixe ROLE_ pour l'utilisation interne
        if (role != null && role.startsWith("ROLE_")) {
            return role.substring(5);
        }
        return role;
    }

    /**
     * Extrait le rôle complet (avec préfixe) pour Spring Security
     */
    public String getFullRoleFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("role", String.class);
    }

    /**
     * Extrait le clientId du token (peut être null pour Super Admin)
     */
    public Long getClientIdFromToken(String token) {
        Claims claims = getClaims(token);
        Object clientId = claims.get("clientId");
        if (clientId == null) {
            return null;
        }
        if (clientId instanceof Integer) {
            return ((Integer) clientId).longValue();
        }
        return (Long) clientId;
    }

    /**
     * Extrait le type d'utilisateur (SUPER_ADMIN ou CLIENT)
     */
    public String getTypeFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("type", String.class);
    }

    /**
     * Vérifie si l'utilisateur est un Super Admin
     */
    public boolean isSuperAdmin(String token) {
        return "SUPER_ADMIN".equals(getTypeFromToken(token));
    }

    /**
     * Vérifie si l'utilisateur est un Client
     */
    public boolean isClient(String token) {
        return "CLIENT".equals(getTypeFromToken(token));
    }

    /**
     * Extrait tous les claims du token
     */
    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Valide le token
     */
    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}