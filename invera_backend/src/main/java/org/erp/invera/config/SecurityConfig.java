package org.erp.invera.config;

import org.erp.invera.security.JwtAuthenticationFilter;
import org.erp.invera.service.CustomUserDetailsService;
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
@EnableMethodSecurity
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    public SecurityConfig(CustomUserDetailsService userDetailsService,
                          JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.userDetailsService = userDetailsService;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * CORS for local dev, Flutter Web, Vite, React and LAN access.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Use allowedOriginPatterns to support wildcard ports.
        // With allowCredentials(true), do not use "*".
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
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/create-password",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password",
                                "/api/auth/create-admin-temp"
                        ).permitAll()

                        .requestMatchers(HttpMethod.PUT, "/api/auth/change-password").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/auth/update-profile").authenticated()

                        .requestMatchers("/api/notifications/**").hasAnyRole("ADMIN", "RESPONSABLE_ACHAT")

                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/activate/**",
                                "/api/auth/filter",
                                "/api/auth/all",
                                "/api/auth/delete/**",
                                "/api/auth/update/**"
                        ).hasRole("ADMIN")

                        .requestMatchers("/uploads/**").permitAll()

                        .requestMatchers("/api/commandes/**").hasRole("COMMERCIAL")
                        .requestMatchers("/api/clients/**").hasAnyRole("COMMERCIAL", "ADMIN")
                        .requestMatchers("/api/categories/**").hasAnyRole("ADMIN", "RESPONSABLE_ACHAT")
                        .requestMatchers("/api/factures/**").hasAnyRole("ADMIN", "COMMERCIAL")
                        .requestMatchers("/api/dashboard/**").hasAnyRole("ADMIN", "COMMERCIAL", "RESPONSABLE_ACHAT")
                        .requestMatchers("/api/fournisseurs/**").hasAnyRole("ADMIN", "RESPONSABLE_ACHAT")
                        .requestMatchers("/api/commandes-fournisseurs/**").hasRole("RESPONSABLE_ACHAT")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
