package org.erp.invera.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class UserInfoResponse {
    private Long id;
    private String email;
    private String nom;
    private String prenom;
    private String role;
    private boolean active;

    private LocalDateTime memberSince;
    private LocalDateTime lastLogin;
    private long sessionsThisWeek;

    // Old constructor for /all, /filter, etc.
    public UserInfoResponse(Long id, String email, String nom, String prenom, String role, boolean active) {
        this.id = id;
        this.email = email;
        this.nom = nom;
        this.prenom = prenom;
        this.role = role;
        this.active = active;
    }

    // Full constructor for /me
    public UserInfoResponse(Long id, String email, String nom, String prenom, String role, boolean active,
                            LocalDateTime memberSince, LocalDateTime lastLogin, long sessionsThisWeek) {
        this.id = id;
        this.email = email;
        this.nom = nom;
        this.prenom = prenom;
        this.role = role;
        this.active = active;
        this.memberSince = memberSince;
        this.lastLogin = lastLogin;
        this.sessionsThisWeek = sessionsThisWeek;
    }
}