package org.erp.invera.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password; // Sera hashé avec BCrypt

    private String nom;
    private String prenom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleName role; // ADMIN, COMMERCIAL, ou RESPONSABLE_ACHAT

    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    // Constructeur personnalisé OK
    public User(String username, String nom, String prenom, String email, String password, RoleName role) {
        this.username = username;
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.password = password;
        this.role = role;
    }
}