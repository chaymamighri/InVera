package org.erp.invera.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.erp.invera.service.platform.SessionManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

// JwtAuthenticationFilter.java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private SessionManagementService sessionManagementService;

    // Liste des endpoints publics qui ne doivent pas être filtrés
    private static final List<String> PUBLIC_ENDPOINTS = Arrays.asList(
            "/api/auth/login",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/create-password",
            "/api/super-admin/login",
            "/api/super-admin/register",
            "/api/otp/request",
            "/api/otp/verify",
            "/api/otp/login",
            "/api/platform/clients/register",
            "/api/platform/clients/login"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Ignorer les endpoints publics
        if (isPublicEndpoint(path)) {
            System.out.println("🔓 Endpoint public: " + path + " - skip JWT filter");
            filterChain.doFilter(request, response);
            return;
        }

        String token = extractToken(request);

        if (token != null && jwtTokenProvider.validateToken(token)) {
            try {
                String email = jwtTokenProvider.getEmailFromToken(token);
                String fullRole = jwtTokenProvider.getFullRoleFromToken(token);

                System.out.println("=== JWT FILTER EXÉCUTÉ ===");
                System.out.println("🔍 Path: " + path);
                System.out.println("🔍 Email: " + email);
                System.out.println("🔍 Rôle complet: " + fullRole);

                // ✅ AJOUT - VÉRIFICATION SESSION UNIQUE
                if (!sessionManagementService.isSessionValid(email, token)) {
                    System.out.println("🔒 Session invalide pour " + email + " - Connexion depuis un autre appareil");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"SESSION_EXPIRED\",\"message\":\"Vous êtes connecté depuis un autre appareil. Veuillez vous reconnecter.\"}");
                    return;  // ← Bloque la requête
                }

                List<GrantedAuthority> authorities = AuthorityUtils.createAuthorityList(fullRole);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(email, null, authorities);

                SecurityContextHolder.getContext().setAuthentication(authentication);
                System.out.println("✅ Authentifié: " + email);

            } catch (Exception e) {
                System.err.println("❌ Erreur: " + e.getMessage());
                SecurityContextHolder.clearContext();
            }
        } else {
            System.out.println("⚠️ Pas de token valide pour: " + path);
        }

        filterChain.doFilter(request, response);
    }

    private boolean isPublicEndpoint(String path) {
        return PUBLIC_ENDPOINTS.stream().anyMatch(path::startsWith);
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}