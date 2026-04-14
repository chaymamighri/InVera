package org.erp.invera.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.erp.invera.model.erp.Role;
import org.erp.invera.model.erp.User;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.equals("/api/auth/login")
                || path.equals("/api/auth/forgot-password")
                || path.equals("/api/auth/reset-password")
                || path.equals("/api/auth/create-admin-temp")
                || path.equals("/api/super-admin/login")
                || path.equals("/api/super-admin/register");
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        System.out.println("\n=== JWT FILTER EXÉCUTÉ ===");
        System.out.println("🔍 Path: " + path);

        String jwt = getJwtFromRequest(request);
        System.out.println("🔍 JWT présent: " + (jwt != null ? "OUI" : "NON"));

        if (jwt != null && jwtTokenProvider.validateToken(jwt)) {
            Map<String, Object> claims = jwtTokenProvider.getUserInfoFromToken(jwt);

            // ✅ Vérifier si c'est un Super Admin (présence de adminId)
            Integer adminId = (Integer) claims.get("adminId");

            if (adminId != null) {
                // ========== GESTION SUPER ADMIN ==========
                String email = (String) claims.get("email");
                String nom = (String) claims.get("nom");

                System.out.println("✅ SUPER ADMIN détecté:");
                System.out.println("   - AdminId: " + adminId);
                System.out.println("   - Email: " + email);
                System.out.println("   - Nom: " + nom);

                // Créer le principal pour Super Admin
                SuperAdminPrincipal superAdminPrincipal = new SuperAdminPrincipal();
                superAdminPrincipal.setId(adminId);
                superAdminPrincipal.setEmail(email);
                superAdminPrincipal.setNom(nom);

                // Pas besoin d'autorités, juste authentifié
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(superAdminPrincipal, null, null);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

                System.out.println("✅ Super Admin authentifié avec succès");

            } else {
                // ========== GESTION USER ERP ==========
                String username = (String) claims.get("sub");
                String role = (String) claims.get("role");
                String email = (String) claims.get("email");
                String nom = (String) claims.get("nom");
                String prenom = (String) claims.get("prenom");
                Integer userId = (Integer) claims.get("userId");

                System.out.println("✅ User ERP détecté:");
                System.out.println("   - Email: " + email);
                System.out.println("   - Rôle: " + role);

                if (role == null) {
                    System.out.println("❌ ERREUR: Rôle manquant dans le token");
                    filterChain.doFilter(request, response);
                    return;
                }

                User user = new User();
                if (userId != null) {
                    user.setId(Long.valueOf(userId));
                }
                user.setEmail(email != null ? email : username);
                user.setNom(nom);
                user.setPrenom(prenom);

                try {
                    String roleValue = role;
                    if (roleValue != null && roleValue.startsWith("ROLE_")) {
                        roleValue = roleValue.substring(5);
                    }

                    boolean roleExists = false;
                    for (Role r : Role.values()) {
                        if (r.name().equals(roleValue)) {
                            roleExists = true;
                            break;
                        }
                    }

                    if (!roleExists) {
                        System.out.println("❌ Rôle '" + roleValue + "' n'existe pas");
                        filterChain.doFilter(request, response);
                        return;
                    }

                    user.setRole(Role.valueOf(roleValue));

                } catch (IllegalArgumentException e) {
                    System.out.println("❌ Rôle invalide: " + role);
                    filterChain.doFilter(request, response);
                    return;
                }

                List<SimpleGrantedAuthority> authorities =
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(user, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

                System.out.println("✅ User ERP authentifié: " + email);
            }
        } else if (jwt != null) {
            System.out.println("❌ Token invalide");
        } else {
            System.out.println("❌ Aucun JWT trouvé dans Authorization header");
        }

        System.out.println("=== FIN JWT FILTER ===\n");
        filterChain.doFilter(request, response);
    }
}