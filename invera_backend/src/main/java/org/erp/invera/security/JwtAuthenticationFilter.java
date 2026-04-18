package org.erp.invera.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.erp.invera.model.erp.Role;
import org.erp.invera.model.erp.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
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

        String jwt = getJwtFromRequest(request);
        System.out.println("JWT present: " + (jwt != null ? "YES" : "NO"));

        if (jwt != null && jwtTokenProvider.validateToken(jwt)) {
            Map<String, Object> claims = jwtTokenProvider.getUserInfoFromToken(jwt);

            Integer adminId = (Integer) claims.get("adminId");

            if (adminId != null) {
                String email = (String) claims.get("email");
                String nom = (String) claims.get("nom");

                System.out.println("SUPER ADMIN detected:");
                System.out.println(" - AdminId: " + adminId);
                System.out.println(" - Email: " + email);
                System.out.println(" - Nom: " + nom);

                SuperAdminPrincipal superAdminPrincipal = new SuperAdminPrincipal();
                superAdminPrincipal.setId(adminId);
                superAdminPrincipal.setEmail(email);
                superAdminPrincipal.setNom(nom);

                List<SimpleGrantedAuthority> authorities =
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"));

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(superAdminPrincipal, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

                System.out.println("Super admin authenticated successfully");
            } else {
                String username = (String) claims.get("sub");
                String role = (String) claims.get("role");
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

                    boolean roleExists = false;
                    for (Role existingRole : Role.values()) {
                        if (existingRole.name().equals(roleValue)) {
                            roleExists = true;
                            break;
                        }
                    }

                    if (!roleExists) {
                        System.out.println("Role '" + roleValue + "' does not exist");
                        filterChain.doFilter(request, response);
                        return;
                    }

                    user.setRole(Role.valueOf(roleValue));
                } catch (IllegalArgumentException e) {
                    System.out.println("Invalid role: " + role);
                    filterChain.doFilter(request, response);
                    return;
                }

                List<SimpleGrantedAuthority> authorities =
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

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