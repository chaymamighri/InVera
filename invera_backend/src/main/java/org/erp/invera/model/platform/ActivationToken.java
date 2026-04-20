package org.erp.invera.model.platform;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "activation_tokens")
public class ActivationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String token;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private Utilisateur user;

    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    public ActivationToken() {
        this.token = UUID.randomUUID().toString();
    }
}
