package org.erp.invera.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.erp.invera.model.platform.Utilisateur;
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

    public String generateToken(Utilisateur user) {
        Map<String, Object> claims = new HashMap<>();
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

    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        Map<String, Object> claims = new HashMap<>();
        claims.put("email", userDetails.getUsername());

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
        Object clientId = claims.get("clientId");
        if (clientId == null) {
            return null;
        }
        if (clientId instanceof Integer) {
            return ((Integer) clientId).longValue();
        }
        return (Long) clientId;
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

    public String generateTokenForSuperAdmin(Integer id, String email, String nom) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("adminId", id);
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

    public String generateTokenForSuperAdmin(String email, String role, Long clientId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", email);
        claims.put("role", "ROLE_" + role);
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
            return generateTokenForSuperAdmin(email, role, null);
        }
        return generateTokenForClient(email, role, clientId);
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
