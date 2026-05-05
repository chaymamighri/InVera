package org.erp.invera.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration:86400000}")
    private long jwtExpirationMs;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String email, String role, Long clientId, String databaseName) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(email)
                .claim("email", email)
                .claim("role", role)
                .claim("clientId", clientId)
                .claim("database", databaseName)
                .claim("type", "CLIENT")
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    /**
     * Génère un token d'activation (valable 24h)
     */
    public String generateActivationToken(String email, int i) {
        long activationExpirationMs = 24 * 60 * 60 * 1000; // 24h

        Map<String, Object> claims = new HashMap<>();
        claims.put("email", email);
        claims.put("type", "ACTIVATION");
        claims.put("purpose", "ACCOUNT_ACTIVATION");

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + activationExpirationMs);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getKey(), SignatureAlgorithm.HS512)
                .compact();
    }


    public Integer getUserIdFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("userId", Integer.class);
    }

    public String getEmailFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("email", String.class);
    }

    public String getNomFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("nom", String.class);
    }

    public String getPrenomFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("prenom", String.class);
    }

    public String getRoleFromToken(String token) {
        Claims claims = getClaims(token);
        String role = claims.get("role", String.class);
        if (role != null && role.startsWith("ROLE_")) {
            return role.substring(5);
        }
        return role;
    }

    public String getFullRoleFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("role", String.class);
    }

    public Long getClientIdFromToken(String token) {
        Claims claims = getClaims(token);
        Object clientIdObj = claims.get("clientId");

        if (log.isDebugEnabled()) {
            log.debug("📦 clientId brut dans le token: {} (type: {})", clientIdObj,
                    clientIdObj != null ? clientIdObj.getClass().getSimpleName() : "null");
        }

        if (clientIdObj == null) {
            log.warn("⚠️ clientId non trouvé dans le token");
            return null;
        }

        Long clientId = null;

        if (clientIdObj instanceof Integer) {
            clientId = ((Integer) clientIdObj).longValue();
        } else if (clientIdObj instanceof Long) {
            clientId = (Long) clientIdObj;
        } else if (clientIdObj instanceof String) {
            try {
                clientId = Long.parseLong((String) clientIdObj);
            } catch (NumberFormatException e) {
                return null;
            }
        } else {
            return null;
        }

        if (log.isDebugEnabled()) {
            log.debug("🎯 clientId final extrait: {}", clientId);
        }

        return clientId;
    }

    public String getTypeFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("type", String.class);
    }

    public boolean isSuperAdmin(String token) {
        return "SUPER_ADMIN".equals(getTypeFromToken(token));
    }

    public boolean isClient(String token) {
        return "CLIENT".equals(getTypeFromToken(token));
    }

    public Map<String, Object> getUserInfoFromToken(String token) {
        Claims claims = getClaims(token);

        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("adminId", claims.get("adminId"));
        userInfo.put("userId", claims.get("userId"));
        userInfo.put("sub", claims.getSubject());
        userInfo.put("email", claims.get("email"));
        userInfo.put("nom", claims.get("nom"));
        userInfo.put("prenom", claims.get("prenom"));
        userInfo.put("role", claims.get("role"));
        userInfo.put("clientId", claims.get("clientId"));
        userInfo.put("type", claims.get("type"));

        return userInfo;
    }

    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    public String generateTokenForSuperAdmin(Integer adminId, String email, String nom) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("adminId", adminId);
        claims.put("email", email);
        claims.put("nom", nom);
        claims.put("role", "ROLE_SUPER_ADMIN");
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

    public String generateTokenForClient(String email, String role, Long clientId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", email);
        claims.put("role", "ROLE_" + role);
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

    public String generateToken(String email, String role, Long clientId) {
        if (clientId == null) {
            // Pour les Super Admins, il faut un ID et un nom
            return generateTokenForSuperAdmin(null, email, role);
        }
        return generateTokenForClient(email, role, clientId);
    }

    /**
     * Génère un token pour la réinitialisation du mot de passe (valable X minutes)
     */
    public String generateResetPasswordToken(String email, int expirationMinutes) {
        long expirationMs = expirationMinutes * 60 * 1000;
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        Map<String, Object> claims = new HashMap<>();
        claims.put("email", email);
        claims.put("type", "RESET_PASSWORD");
        claims.put("purpose", "PASSWORD_RESET");

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    /**
     * Valide un token de réinitialisation et retourne l'email
     */
    public String validateResetPasswordToken(String token) {
        try {
            Claims claims = getClaims(token);
            String type = claims.get("type", String.class);
            String purpose = claims.get("purpose", String.class);

            if ("RESET_PASSWORD".equals(type) && "PASSWORD_RESET".equals(purpose)) {
                return claims.get("email", String.class);
            }
            return null;
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
