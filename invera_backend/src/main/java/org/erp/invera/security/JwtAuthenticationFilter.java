package org.erp.invera.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.erp.invera.model.Role;
import org.erp.invera.model.User;
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
                || path.equals("/api/auth/create-admin-temp");
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
        System.out.println("🔍 Méthode: " + request.getMethod());

        String jwt = getJwtFromRequest(request);
        System.out.println("🔍 JWT présent: " + (jwt != null ? "OUI" : "NON"));

        if (jwt != null) {
            System.out.println("🔍 JWT (premiers 20 chars): " + jwt.substring(0, Math.min(20, jwt.length())) + "...");

            boolean isValid = jwtTokenProvider.validateToken(jwt);
            System.out.println("🔍 Token valide: " + isValid);

            if (isValid) {
                Map<String, Object> claims = jwtTokenProvider.getUserInfoFromToken(jwt);

                String username = (String) claims.get("sub");
                String role = (String) claims.get("role");
                String email = (String) claims.get("email");
                String nom = (String) claims.get("nom");
                String prenom = (String) claims.get("prenom");
                Integer userId = (Integer) claims.get("userId");

                System.out.println("✅ Infos extraites du token:");
                System.out.println("   - Username: " + username);
                System.out.println("   - Email: " + email);
                System.out.println("   - Nom: " + nom);
                System.out.println("   - Prénom: " + prenom);
                System.out.println("   - Rôle: " + role);
                System.out.println("   - UserId: " + userId);

                // ✅ Vérifier que le rôle est présent
                if (role == null) {
                    System.out.println("❌ ERREUR: Rôle manquant dans le token");
                    filterChain.doFilter(request, response);
                    return;
                }

                // ✅ Créer l'utilisateur
                User user = new User();
                if (userId != null) {
                    user.setId(Long.valueOf(userId));
                }
                user.setEmail(email != null ? email : username);
                user.setNom(nom);
                user.setPrenom(prenom);

                // ✅ CORRECTION: Gérer le préfixe ROLE_
                try {
                    String roleValue = role;

                    // Si le rôle commence par "ROLE_", enlever le préfixe
                    if (roleValue != null && roleValue.startsWith("ROLE_")) {
                        roleValue = roleValue.substring(5); // Enlève "ROLE_"
                        System.out.println("🔍 Rôle après suppression du préfixe: " + roleValue);
                    }

                    // Vérifier que le rôle existe dans l'enum
                    boolean roleExists = false;
                    for (Role r : Role.values()) {
                        if (r.name().equals(roleValue)) {
                            roleExists = true;
                            break;
                        }
                    }

                    if (!roleExists) {
                        System.out.println("❌ Rôle '" + roleValue + "' n'existe pas dans l'enum");
                        System.out.println("   Rôles disponibles: " + Arrays.toString(Role.values()));
                        filterChain.doFilter(request, response);
                        return;
                    }

                    user.setRole(Role.valueOf(roleValue));

                } catch (IllegalArgumentException e) {
                    System.out.println("❌ Rôle invalide: " + role);
                    System.out.println("   Rôles disponibles: " + Arrays.toString(Role.values()));
                    filterChain.doFilter(request, response);
                    return;
                }

                // ✅ Créer les autorités (utiliser le rôle avec préfixe pour Spring Security)
                List<SimpleGrantedAuthority> authorities =
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

                System.out.println("🔍 Autorités créées: " + authorities);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                user, null, authorities
                        );

                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // ✅ AVANT de placer l'authentification
                System.out.println("🔍 AVANT setAuthentication - Contexte actuel: " +
                        SecurityContextHolder.getContext().getAuthentication());

                SecurityContextHolder.getContext().setAuthentication(authentication);

                // ✅ APRÈS avoir placé l'authentification
                System.out.println("🔍 APRÈS setAuthentication - Contexte: " +
                        SecurityContextHolder.getContext().getAuthentication());
                System.out.println("🔍 Principal: " +
                        SecurityContextHolder.getContext().getAuthentication().getPrincipal());
                System.out.println("🔍 Authorities: " +
                        SecurityContextHolder.getContext().getAuthentication().getAuthorities());

            } else {
                System.out.println("❌ Token invalide");
            }
        } else {
            System.out.println("❌ Aucun JWT trouvé dans Authorization header");
        }

        System.out.println("=== FIN JWT FILTER ===\n");
        filterChain.doFilter(request, response);
    }
}