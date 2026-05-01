package org.erp.invera.config;

import org.erp.invera.security.JwtAuthenticationFilter;
import org.erp.invera.security.UnifiedUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = false)
public class SecurityConfig {

    private final UnifiedUserDetailsService unifiedUserDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    public SecurityConfig(UnifiedUserDetailsService unifiedUserDetailsService,
                          JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.unifiedUserDetailsService = unifiedUserDetailsService;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "http://172.20.10.7:*",
                "http://192.168.56.1:*",
                "http://192.168.56.1:8081"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin",
                "Access-Control-Request-Method", "Access-Control-Request-Headers"
        ));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Disposition"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .userDetailsService(unifiedUserDetailsService)

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ========== PUBLIC API ==========
                        .requestMatchers("/api/public/**").permitAll()

                        // ========== AUTH PUBLICS ==========
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/activate-account",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password",
                                "/api/auth/activation-link",
                                "/api/auth/activation-link-info",
                                "/api/auth/create-password",
                                "/api/platform/clients/register",
                                "/api/platform/clients/login",
                                "/api/platform/clients/request-otp",
                                "/api/platform/clients/*/justificatifs",
                                "/api/platform/clients/*/document/*"
                        ).permitAll()

                        // ========== SUPER ADMIN AUTH PUBLIC ==========
                        .requestMatchers(
                                "/api/super-admin/login",
                                "/api/super-admin/register"
                        ).permitAll()

                        // ========== PLATFORM CLIENTS PUBLIC ==========
                        .requestMatchers(
                                "/api/platform/clients/register",
                                "/api/platform/clients/login",
                                "/api/platform/clients/request-otp"
                        ).permitAll()

                        // ========== GESTION DES OFFRES (SUPER ADMIN) ==========
                        .requestMatchers(HttpMethod.GET, "/api/super-admin/offres").hasRole("SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/super-admin/offres/**").hasRole("SUPER_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/super-admin/offres").hasRole("SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/super-admin/offres/**").hasRole("SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/super-admin/offres/**").hasRole("SUPER_ADMIN")

                        // ========== GESTION DES ABONNEMENTS (SUPER ADMIN) ==========
                        .requestMatchers("/api/super-admin/abonnements/**").hasRole("SUPER_ADMIN")

                        // ========== GESTION DES UTILISATEURS (AJOUT) ==========
                        .requestMatchers(
                                "/api/auth/all",
                                "/api/auth/filter",
                                "/api/auth/register",
                                "/api/auth/update/**",
                                "/api/auth/delete/**",
                                "/api/auth/activate/**"
                        ).hasAnyRole("ADMIN_CLIENT", "SUPER_ADMIN")

                        .requestMatchers("/api/users/me/preferences/**")
                        .hasAnyRole("SUPER_ADMIN", "ADMIN_CLIENT", "COMMERCIAL", "RESPONSABLE_ACHAT")

                        // ========== SUPER ADMIN ==========
                        .requestMatchers(
                                "/api/super-admin/me",
                                "/api/super-admin/dashboard/**",
                                "/api/super-admin/clients/**",
                                "/api/super-admin/abonnements/**",
                                "/api/super-admin/paiements/**"
                        ).hasRole("SUPER_ADMIN")


                        // ========== PLATFORM CLIENTS ==========
                        .requestMatchers(
                                "/api/super-admin/clients/register",
                                "/api/super-admin/clients/login",
                                "/api/super-admin/clients/request-otp"
                        ).permitAll()

                        .requestMatchers("/api/super-admin/**")
                        .hasRole("SUPER_ADMIN")


                        // ========== PLATFORM CLIENTS ==========
                        .requestMatchers("/api/platform/clients/**")
                        .hasAnyRole("SUPER_ADMIN")

                        // ========== COMMANDES ==========
                        .requestMatchers("/api/commandes/**")
                        .hasAnyRole("ADMIN_CLIENT", "COMMERCIAL")

                        // ========== CLIENTS ==========
                        .requestMatchers("/api/clients/**")
                        .hasAnyRole("ADMIN_CLIENT", "COMMERCIAL")

                        // ========== FACTURES ==========
                        .requestMatchers("/api/factures/**")
                        .hasAnyRole("ADMIN_CLIENT", "COMMERCIAL")

                        // ========== FOURNISSEURS ==========
                        .requestMatchers("/api/fournisseurs/**")
                        .hasAnyRole("ADMIN_CLIENT", "RESPONSABLE_ACHAT")

                        // ========== COMMANDES FOURNISSEURS ==========
                        .requestMatchers("/api/commandes-fournisseurs/**")
                        .hasAnyRole("ADMIN_CLIENT", "RESPONSABLE_ACHAT")

                        // ========== STOCK ==========
                        .requestMatchers("/api/stock/**")
                        .hasAnyRole("ADMIN_CLIENT", "RESPONSABLE_ACHAT")

                        // ========== DASHBOARD ==========
                        .requestMatchers("/api/dashboard/**")
                        .hasAnyRole("ADMIN_CLIENT", "COMMERCIAL", "RESPONSABLE_ACHAT")

                        // ========== REPORTS ==========
                        .requestMatchers("/api/reports/**")
                        .hasAnyRole("ADMIN_CLIENT", "COMMERCIAL", "ADMIN")

                        // ========== UPLOADS ==========
                        .requestMatchers("/uploads/**").permitAll()

                        // ========== OTHER MODULE RULES ==========
                        .requestMatchers("/api/categories/**").hasAnyRole("ADMIN", "RESPONSABLE_ACHAT")
                        .requestMatchers("/api/commandes-fournisseurs/{id}/valider").hasRole("ADMIN")
                        .requestMatchers("/api/commandes-fournisseurs/{id}/rejeter").hasRole("ADMIN")
                        .requestMatchers("/api/stock/mouvements/**").hasRole("RESPONSABLE_ACHAT")
                        .requestMatchers("/api/stock/etat/**").hasRole("RESPONSABLE_ACHAT")
                        .requestMatchers("/api/factures-fournisseur/**").hasRole("RESPONSABLE_ACHAT")
                        .requestMatchers("/api/procurement/stats/**").hasRole("RESPONSABLE_ACHAT")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}