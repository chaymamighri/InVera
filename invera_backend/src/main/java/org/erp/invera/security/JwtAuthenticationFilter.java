package org.erp.invera.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider,
                                   UserDetailsService userDetailsService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.equals("/api/auth/login")
                || path.equals("/api/auth/forgot-password")
                || path.equals("/api/auth/reset-password")
                || path.equals("/api/auth/create-admin-temp");
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

        if (jwt != null) {
            System.out.println("🔍 JWT (début): " + jwt.substring(0, Math.min(20, jwt.length())) + "...");

            boolean isValid = jwtTokenProvider.validateToken(jwt);
            System.out.println("🔍 Token valide: " + isValid);

            if (isValid) {
                String username = jwtTokenProvider.getUsernameFromToken(jwt);
                System.out.println("🔍 Username du token: " + username);

                boolean alreadyAuthenticated = SecurityContextHolder.getContext().getAuthentication() != null;
                System.out.println("🔍 Déjà authentifié: " + alreadyAuthenticated);

                if (!alreadyAuthenticated) {
                    try {
                        System.out.println("🔍 Chargement UserDetails pour: " + username);
                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                        System.out.println("✅ UserDetails chargé!");
                        System.out.println("   - Username: " + userDetails.getUsername());
                        System.out.println("   - Authorities: " + userDetails.getAuthorities());
                        System.out.println("   - Enabled: " + userDetails.isEnabled());

                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        userDetails, null, userDetails.getAuthorities()
                                );

                        authentication.setDetails(
                                new WebAuthenticationDetailsSource().buildDetails(request)
                        );

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        System.out.println("✅ Authentication placée dans le contexte");

                    } catch (Exception e) {
                        System.out.println("❌ ERREUR chargement UserDetails: " + e.getMessage());
                        e.printStackTrace();
                    }
                }
            } else {
                System.out.println("❌ Token invalide - vérifiez JwtTokenProvider");
            }
        } else {
            System.out.println("❌ Aucun JWT trouvé dans Authorization header");
            System.out.println("   Headers: " + Collections.list(request.getHeaderNames()));
        }

        System.out.println("=== FIN JWT FILTER ===\n");
        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}