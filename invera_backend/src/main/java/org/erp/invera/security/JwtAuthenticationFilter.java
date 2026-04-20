package org.erp.invera.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.erp.invera.model.platform.Client;
import org.erp.invera.model.platform.Utilisateur;
import org.erp.invera.service.platform.SessionManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
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

            // Vérifier si c'est un SUPER_ADMIN
            boolean isSuperAdmin = (adminId != null) ||
                    ("SUPER_ADMIN".equals(type)) ||
                    (role != null && role.equals("ROLE_SUPER_ADMIN"));

            if (isSuperAdmin) {
                // ===== TRAITEMENT SUPER_ADMIN =====
                handleSuperAdmin(request, response, claims, jwt);
                if (!response.isCommitted()) {
                    filterChain.doFilter(request, response);
                }
                return;
            }
            else if ("CLIENT".equals(type)) {
                // ===== TRAITEMENT CLIENT =====
                boolean authenticated = handleClient(request, response, claims, jwt);
                if (!authenticated) {
                    return;
                }
            }
            else {
                // ===== TRAITEMENT ERP =====
                boolean authenticated = handleErp(request, response, claims, jwt);
                if (!authenticated) {
                    return;
                }
            }
        } else if (jwt != null) {
            System.out.println("Invalid token");
        } else {
            System.out.println("No JWT found in Authorization header");
        }

        System.out.println("=== END JWT FILTER ===\n");
        filterChain.doFilter(request, response);
    }

    /**
     * Traitement pour SUPER_ADMIN avec vérification session unique
     */
    private void handleSuperAdmin(HttpServletRequest request,
                                  HttpServletResponse response,
                                  Map<String, Object> claims,
                                  String jwt) throws IOException {
        Integer adminId = (Integer) claims.get("adminId");
        String email = (String) claims.get("email");
        String nom = (String) claims.get("nom");
        String role = (String) claims.get("role");
        String type = (String) claims.get("type");

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

        // ✅ Vérification session unique pour SUPER_ADMIN
        if (!sessionManagementService.isSessionValid(superAdminPrincipal.getEmail(), jwt)) {
            System.out.println("🔒 Session invalide pour " + superAdminPrincipal.getEmail());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"SESSION_EXPIRED\",\"message\":\"Vous êtes connecté depuis un autre appareil. Veuillez vous reconnecter.\"}");
            return;
        }

        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")
        );

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(superAdminPrincipal, null, authorities);
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        System.out.println("✅ Super admin authenticated successfully");
    }

    /**
     * Traitement pour les utilisateurs CLIENT avec vérification session unique
     */
    private boolean handleClient(HttpServletRequest request,
                                 HttpServletResponse response,
                                 Map<String, Object> claims,
                                 String jwt) throws IOException {
        String email = (String) claims.get("email");
        String nom = (String) claims.get("nom");
        String prenom = (String) claims.get("prenom");
        String role = (String) claims.get("role");
        Long clientId = null;

        Object clientIdObj = claims.get("clientId");
        if (clientIdObj instanceof Integer) {
            clientId = ((Integer) clientIdObj).longValue();
        } else if (clientIdObj instanceof Long) {
            clientId = (Long) clientIdObj;
        }

        System.out.println("CLIENT user detected:");
        System.out.println(" - Email: " + email);
        System.out.println(" - Role: " + role);
        System.out.println(" - ClientId: " + clientId);

        if (role == null) {
            System.out.println("❌ Missing role in client token");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }

        // Extraire le nom du rôle sans préfixe ROLE_
        String roleValue = role;
        if (roleValue.startsWith("ROLE_")) {
            roleValue = roleValue.substring(5);
        }

        // Vérifier si le rôle existe dans ClientUser.RoleUtilisateur
        boolean roleExists = false;
        Utilisateur.RoleUtilisateur clientRole = null;
        for (Utilisateur.RoleUtilisateur r : Utilisateur.RoleUtilisateur.values()) {
            if (r.name().equals(roleValue)) {
                roleExists = true;
                clientRole = r;
                break;
            }
        }

        if (!roleExists) {
            System.out.println("❌ Role '" + roleValue + "' does not exist for client users");
            System.out.println("✅ Valid client roles: " + Arrays.toString(Utilisateur.RoleUtilisateur.values()));
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }

        // Créer l'objet ClientUser
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail(email);
        utilisateur.setNom(nom);
        utilisateur.setPrenom(prenom);
        utilisateur.setRole(clientRole);
        utilisateur.setEstActif(true);

        // Associer le client (entreprise)
        if (clientId != null) {
            Client client = new Client();
            client.setId(clientId);
            utilisateur.setClient(client);
        }

        // ✅ Vérification session unique pour CLIENT
        if (!sessionManagementService.isSessionValid(utilisateur.getEmail(), jwt)) {
            System.out.println("🔒 Session invalide pour client: " + utilisateur.getEmail());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"SESSION_EXPIRED\",\"message\":\"Vous êtes connecté depuis un autre appareil. Veuillez vous reconnecter.\"}");
            return false;
        }

        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + utilisateur.getRole().name())
        );

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(utilisateur, null, authorities);
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        System.out.println("✅ Client user authenticated successfully: " + email);
        return true;
    }

    /**
     * Traitement pour les utilisateurs ERP avec vérification session unique
     */
    private boolean handleErp(HttpServletRequest request,
                              HttpServletResponse response,
                              Map<String, Object> claims,
                              String jwt) throws IOException {
        String username = (String) claims.get("sub");
        String email = (String) claims.get("email");
        String nom = (String) claims.get("nom");
        String prenom = (String) claims.get("prenom");
        Integer userId = (Integer) claims.get("userId");
        String role = (String) claims.get("role");

        System.out.println("ERP user detected:");
        System.out.println(" - Email: " + email);
        System.out.println(" - Role: " + role);

        if (role == null) {
            System.out.println("❌ Missing role in ERP token");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }

        Utilisateur user = new Utilisateur();
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

            // Vérifier si le rôle existe dans l'enum ERP Role
            boolean roleExists = false;
            for (Utilisateur.RoleUtilisateur existingRole : Utilisateur.RoleUtilisateur.values()) {
                if (existingRole.name().equals(roleValue)) {
                    roleExists = true;
                    break;
                }
            }

            if (!roleExists) {
                System.out.println("❌ Role '" + roleValue + "' does not exist in ERP roles");
                System.out.println("✅ Valid ERP roles: " + Arrays.toString(Utilisateur.RoleUtilisateur.values()));
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return false;
            }

            user.setRole(Utilisateur.RoleUtilisateur.valueOf(roleValue));
        } catch (IllegalArgumentException e) {
            System.out.println("❌ Invalid role: " + role);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }

        // ✅ Vérification session unique pour ERP
        if (!sessionManagementService.isSessionValid(user.getEmail(), jwt)) {
            System.out.println("🔒 Session invalide pour ERP user: " + user.getEmail());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"SESSION_EXPIRED\",\"message\":\"Vous êtes connecté depuis un autre appareil. Veuillez vous reconnecter.\"}");
            return false;
        }

        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
        );

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(user, null, authorities);
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        System.out.println("✅ ERP user authenticated: " + email);
        return true;
    }
}