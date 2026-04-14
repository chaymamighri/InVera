package org.erp.invera.model.platform;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "clients")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(length = 20)
    private String telephone;

    @Column(name = "mot_de_passe", nullable = false)
    private String password;

    @Column(length = 20)
    private String type;  // 'particulier' ou 'entreprise'

    @Column(length = 20)
    private String status = "PENDING";  // PENDING, TRIAL, ACTIVE, BLOCKED, REFUSED

    @Column(name = "database_name", length = 100)
    private String databaseName;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Méthode pour mettre à jour automatiquement updatedAt
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}