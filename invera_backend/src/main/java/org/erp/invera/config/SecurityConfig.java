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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

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

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://localhost:5174"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET","POST","PUT","DELETE","OPTIONS","PATCH"));
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization","Content-Type","X-Requested-With","Accept","Origin",
                "Access-Control-Request-Method","Access-Control-Request-Headers"
        ));
        configuration.setExposedHeaders(Arrays.asList("Authorization","Content-Disposition"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
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
                        // public
                        .requestMatchers("/api/auth/login",
                                "/api/auth/create-password",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password",
                                "/api/auth/create-admin-temp").permitAll()

                        // authenticated user endpoints (profile)
                        .requestMatchers(HttpMethod.PUT, "/api/auth/change-password").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/auth/update-profile").authenticated()

                        // admin notifications
                        .requestMatchers("/api/notifications/**").hasRole("ADMIN")

                        // admin only
                        .requestMatchers("/api/auth/register",
                                "/api/auth/activate/**",
                                "/api/auth/filter",
                                "/api/auth/all",
                                "/api/auth/delete/**",
                                "/api/auth/update/**").hasRole("ADMIN")

                        // roles
                        .requestMatchers("/api/commandes/**").hasRole("COMMERCIAL")
                        .requestMatchers("/api/clients/**").hasRole("COMMERCIAL")
                        .requestMatchers("/api/categories/**").hasRole("ADMIN")
                        .requestMatchers("/api/factures/**").hasAnyRole("ADMIN", "COMMERCIAL")
                        .requestMatchers("/api/dashboard/**").hasAnyRole("ADMIN", "COMMERCIAL")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}