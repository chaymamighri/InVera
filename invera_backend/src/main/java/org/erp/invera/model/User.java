package org.erp.invera.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column
    private String password; // BCrypt hashed

    private String nom;
    private String prenom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role; // ADMIN, COMMERCIAL, RESPONSABLE_ACHAT

    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    // 🔥 CASCADE DELETE FOR PASSWORD RESET TOKENS
    @OneToMany(
            mappedBy = "user",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<PasswordResetToken> passwordResetTokens;

    // Optional custom constructor
    public User(String username, String nom, String prenom,
                String email, String password, Role role) {
        this.username = username;
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    // ================= SPRING SECURITY =================

    /**
     * 🔥 CRITICAL
     * Spring expects ROLE_ prefix
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    /**
     * Login is done using EMAIL
     */
    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /**
     * User enabled/disabled
     */
    @Override
    public boolean isEnabled() {
        return active;
    }
}
