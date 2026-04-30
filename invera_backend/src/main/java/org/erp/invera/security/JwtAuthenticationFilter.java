package org.erp.invera.security;

import jakarta.annotation.PostConstruct;
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
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private SessionManagementService sessionManagementService;

    // LISTE DES ENDPOINTS PUBLICS (sans authentification)
    private static final List<String> PUBLIC_ENDPOINTS = List.of(
            "/api/auth/login",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/create-password",
            "/api/auth/activation-link",
            "/api/auth/activation-link-info",
            "/api/auth/activate-account",
            "/api/auth/create-admin-temp",
            "/api/super-admin/login",
            "/api/super-admin/register",
            "/api/otp/request",
            "/api/otp/verify",
            "/api/otp/login",
            "/api/platform/clients/register",
            "/api/platform/clients/login",
            "/api/platform/clients/request-otp",
            "/api/platform/clients/verify-otp",
            "/api/public/offres"
    );

    public JwtAuthenticationFilter() {
        // Constructeur vide pour Spring
    }

    @PostConstruct
    public void init() {
        System.out.println("✅ JwtAuthenticationFilter initialisé");
        System.out.println("   - jwtTokenProvider: " + (jwtTokenProvider != null ? "✅ OK" : "❌ NULL"));
        System.out.println("   - sessionManagementService: " + (sessionManagementService != null ? "✅ OK" : "❌ NULL"));
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        for (String endpoint : PUBLIC_ENDPOINTS) {
            if (path.startsWith(endpoint)) {
                System.out.println("🔓 [PUBLIC] " + path);
                return true;
            }
        }

        if (path.matches("/api/platform/clients/\\d+/justificatifs")) {
            System.out.println("🔓 [UPLOAD] " + path + " - autorisé sans JWT");
            return true;
        }

        if (path.startsWith("/api/public/")) {
            System.out.println("🔓 [PUBLIC API] " + path);
            return true;
        }

        System.out.println("🔒 [PROTECTED] " + path);
        return false;
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

        if (shouldNotFilter(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        System.out.println("\n=== JWT FILTER EXECUTE ===");
        System.out.println("Path: " + path);

        String jwt = getJwtFromRequest(request);
        System.out.println("JWT present: " + (jwt != null ? "YES" : "NO"));

        if (jwt != null && jwtTokenProvider.validateToken(jwt)) {
            Map<String, Object> claims = jwtTokenProvider.getUserInfoFromToken(jwt);

            Integer adminId = (Integer) claims.get("adminId");
            String role = (String) claims.get("role");
            String type = (String) claims.get("type");

            boolean isSuperAdmin = (adminId != null) ||
                    ("SUPER_ADMIN".equals(type)) ||
                    (role != null && role.equals("ROLE_SUPER_ADMIN"));

            if (isSuperAdmin) {
                handleSuperAdmin(request, response, claims, jwt);
                if (!response.isCommitted()) {
                    filterChain.doFilter(request, response);
                }
                return;
            } else if ("CLIENT".equals(type)) {
                if (!handleClient(request, response, claims, jwt)) {
                    return;
                }
            } else {
                if (!handleErp(request, response, claims, jwt)) {
                    return;
                }
            }
        } else if (jwt != null) {
            System.out.println("❌ Invalid token");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"INVALID_TOKEN\",\"message\":\"Token invalide\"}");
            return;
        } else {
            System.out.println("❌ No JWT found in Authorization header");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"NO_TOKEN\",\"message\":\"Authentification requise\"}");
            return;
        }

        System.out.println("=== END JWT FILTER ===\n");
        filterChain.doFilter(request, response);
    }

    // ==================== TRAITEMENT SUPER ADMIN ====================

    private void handleSuperAdmin(HttpServletRequest request,
                                  HttpServletResponse response,
                                  Map<String, Object> claims,
                                  String jwt) throws IOException {
        Integer adminId = (Integer) claims.get("adminId");
        String email = (String) claims.get("email");
        String nom = (String) claims.get("nom");

        if (adminId == null) {
            adminId = (Integer) claims.get("userId");
            if (adminId == null) {
                adminId = 0;
            }
        }

        System.out.println("👑 SUPER ADMIN detected:");
        System.out.println("   - AdminId: " + adminId);
        System.out.println("   - Email: " + email);
        System.out.println("   - Nom: " + nom);

        // ✅ Enregistrer la session
        if (email != null) {
            sessionManagementService.registerSession(email, jwt);
        }

        // ✅ Vérifier la session
        if (email == null || !sessionManagementService.isSessionValid(email, jwt)) {
            System.out.println("🔒 Session invalide pour " + email);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"SESSION_EXPIRED\",\"message\":\"Session expirée\"}");
            return;
        }

        SuperAdminPrincipal superAdminPrincipal = new SuperAdminPrincipal();
        superAdminPrincipal.setId(adminId);
        superAdminPrincipal.setEmail(email != null ? email : (String) claims.get("sub"));
        superAdminPrincipal.setNom(nom);

        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")
        );

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(superAdminPrincipal, null, authorities);
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        System.out.println("✅ Super admin authenticated");
    }

    // ==================== TRAITEMENT CLIENT ====================

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

        System.out.println("👤 CLIENT user detected:");
        System.out.println("   - Email: " + email);
        System.out.println("   - Role: " + role);
        System.out.println("   - ClientId: " + clientId);

        if (role == null || email == null) {
            System.out.println("❌ Missing email or role in client token");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }

        // ✅ AJOUT : Enregistrer la session AVANT de la vérifier
        sessionManagementService.registerSession(email, jwt);

        // ✅ Vérifier la session
        if (!sessionManagementService.isSessionValid(email, jwt)) {
            System.out.println("🔒 Session invalide pour client: " + email);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"SESSION_EXPIRED\",\"message\":\"Session expirée\"}");
            return false;
        }

        // Extraire le nom du rôle sans préfixe ROLE_
        String roleValue = role;
        if (roleValue.startsWith("ROLE_")) {
            roleValue = roleValue.substring(5);
        }

        // Vérifier si le rôle existe
        Utilisateur.RoleUtilisateur clientRole = null;
        for (Utilisateur.RoleUtilisateur r : Utilisateur.RoleUtilisateur.values()) {
            if (r.name().equals(roleValue)) {
                clientRole = r;
                break;
            }
        }

        if (clientRole == null) {
            System.out.println("❌ Invalid role: " + roleValue);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }

        // Créer l'utilisateur
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail(email);
        utilisateur.setNom(nom);
        utilisateur.setPrenom(prenom);
        utilisateur.setRole(clientRole);
        utilisateur.setEstActif(true);

        if (clientId != null) {
            Client client = new Client();
            client.setId(clientId);
            utilisateur.setClient(client);
        }

        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + utilisateur.getRole().name())
        );

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(utilisateur, null, authorities);
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        System.out.println("✅ Client authenticated: " + email);
        return true;
    }

    // ==================== TRAITEMENT ERP ====================

    private boolean handleErp(HttpServletRequest request,
                              HttpServletResponse response,
                              Map<String, Object> claims,
                              String jwt) throws IOException {
        String email = (String) claims.get("email");
        String nom = (String) claims.get("nom");
        String prenom = (String) claims.get("prenom");
        Integer userId = (Integer) claims.get("userId");
        String role = (String) claims.get("role");

        System.out.println("💼 ERP user detected:");
        System.out.println("   - Email: " + email);
        System.out.println("   - Role: " + role);

        if (role == null || email == null) {
            System.out.println("❌ Missing email or role in ERP token");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }

        // ✅ AJOUT : Enregistrer la session AVANT de la vérifier
        sessionManagementService.registerSession(email, jwt);

        // ✅ Vérifier la session
        if (!sessionManagementService.isSessionValid(email, jwt)) {
            System.out.println("🔒 Session invalide pour ERP user: " + email);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"SESSION_EXPIRED\",\"message\":\"Session expirée\"}");
            return false;
        }

        Utilisateur user = new Utilisateur();
        if (userId != null) {
            user.setId(Long.valueOf(userId));
        }
        user.setEmail(email);
        user.setNom(nom);
        user.setPrenom(prenom);

        // Vérifier le rôle
        String roleValue = role;
        if (roleValue.startsWith("ROLE_")) {
            roleValue = roleValue.substring(5);
        }

        try {
            user.setRole(Utilisateur.RoleUtilisateur.valueOf(roleValue));
        } catch (IllegalArgumentException e) {
            System.out.println("❌ Invalid role: " + roleValue);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
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