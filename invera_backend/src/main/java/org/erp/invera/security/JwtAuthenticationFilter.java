package org.erp.invera.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.erp.invera.service.platform.SessionManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import org.erp.invera.model.erp.Role;
import org.erp.invera.model.erp.User;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private SessionManagementService sessionManagementService;

    private static final List<String> PUBLIC_ENDPOINTS = List.of(
            "/api/auth/login",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/create-password",
            "/api/auth/activation-link",
            "/api/auth/activate-account",
            "/api/auth/create-admin-temp",
            "/api/super-admin/login",
            "/api/super-admin/register",
            "/api/otp/request",
            "/api/otp/verify",
            "/api/otp/login",
            "/api/platform/clients/register",
            "/api/platform/clients/login"
    );

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return PUBLIC_ENDPOINTS.stream().anyMatch(path::startsWith);
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
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        System.out.println("\n=== JWT FILTER EXECUTE ===");
        System.out.println("Path: " + path);

        if (shouldNotFilter(request)) {
            System.out.println("🔓 Endpoint public: " + path + " - skip JWT filter");
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = getJwtFromRequest(request);
        System.out.println("JWT present: " + (jwt != null ? "YES" : "NO"));

        if (jwt != null && jwtTokenProvider.validateToken(jwt)) {
            Map<String, Object> claims = jwtTokenProvider.getUserInfoFromToken(jwt);

            Integer adminId = (Integer) claims.get("adminId");
            String role = (String) claims.get("role");
            String type = (String) claims.get("type");

            // Vérifier si c'est un SUPER_ADMIN (par adminId, par type, ou par rôle)
            boolean isSuperAdmin = (adminId != null) ||
                    ("SUPER_ADMIN".equals(type)) ||
                    (role != null && role.equals("ROLE_SUPER_ADMIN"));

            if (isSuperAdmin) {
                // Récupérer les infos du super admin
                String email = (String) claims.get("email");
                String nom = (String) claims.get("nom");

                // Si adminId est null, utiliser userId ou 0 par défaut
                if (adminId == null) {
                    adminId = (Integer) claims.get("userId");
                    if (adminId == null) {
                        adminId = 0;
                    }
                }

                System.out.println("SUPER ADMIN detected:");
                System.out.println(" - AdminId: " + adminId);
                System.out.println(" - Email: " + email);
                System.out.println(" - Nom: " + nom);
                System.out.println(" - Role: " + role);
                System.out.println(" - Type: " + type);

                SuperAdminPrincipal superAdminPrincipal = new SuperAdminPrincipal();
                superAdminPrincipal.setId(adminId);
                superAdminPrincipal.setEmail(email != null ? email : (String) claims.get("sub"));
                superAdminPrincipal.setNom(nom);

                // Vérification session unique
                if (!sessionManagementService.isSessionValid(superAdminPrincipal.getEmail(), jwt)) {
                    System.out.println("🔒 Session invalide pour " + superAdminPrincipal.getEmail());
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"SESSION_EXPIRED\",\"message\":\"Vous êtes connecté depuis un autre appareil. Veuillez vous reconnecter.\"}");
                    return;
                }

                List<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"));

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(superAdminPrincipal, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

                System.out.println("Super admin authenticated successfully");

            } else {
                // Traitement pour les utilisateurs ERP normaux
                String username = (String) claims.get("sub");
                String email = (String) claims.get("email");
                String nom = (String) claims.get("nom");
                String prenom = (String) claims.get("prenom");
                Integer userId = (Integer) claims.get("userId");

                System.out.println("ERP user detected:");
                System.out.println(" - Email: " + email);
                System.out.println(" - Role: " + role);

                if (role == null) {
                    System.out.println("Missing role in ERP token");
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
                    if (roleValue.startsWith("ROLE_")) {
                        roleValue = roleValue.substring(5);
                    }

                    // Vérifier si le rôle existe (sauf pour SUPER_ADMIN qui est déjà traité)
                    if (!"SUPER_ADMIN".equals(roleValue)) {
                        boolean roleExists = false;
                        for (Role existingRole : Role.values()) {
                            if (existingRole.name().equals(roleValue)) {
                                roleExists = true;
                                break;
                            }
                        }

                        if (!roleExists) {
                            System.out.println("Role '" + roleValue + "' does not exist in ERP roles");
                            filterChain.doFilter(request, response);
                            return;
                        }
                    }

                    user.setRole(Role.valueOf(roleValue));
                } catch (IllegalArgumentException e) {
                    System.out.println("Invalid role: " + role);
                    filterChain.doFilter(request, response);
                    return;
                }

                List<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(user, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

                System.out.println("ERP user authenticated: " + email);
            }
        } else if (jwt != null) {
            System.out.println("Invalid token");
        } else {
            System.out.println("No JWT found in Authorization header");
        }

        System.out.println("=== END JWT FILTER ===\n");
        filterChain.doFilter(request, response);
    }
}