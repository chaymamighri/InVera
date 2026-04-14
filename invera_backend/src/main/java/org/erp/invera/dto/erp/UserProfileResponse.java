package org.erp.invera.dto.erp;

import java.time.LocalDateTime;

public class UserProfileResponse {
    private Long id;
    private String email;
    private String nom;
    private String prenom;
    private String role;
    private boolean active;
    private LocalDateTime memberSince;
    private LocalDateTime lastLogin;
    private long sessionsThisWeek;

    public UserProfileResponse() {}

    public UserProfileResponse(Long id, String email, String nom, String prenom,
                               String role, boolean active, LocalDateTime memberSince,
                               LocalDateTime lastLogin, long sessionsThisWeek) {
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

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public LocalDateTime getMemberSince() { return memberSince; }
    public void setMemberSince(LocalDateTime memberSince) { this.memberSince = memberSince; }

    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }

    public long getSessionsThisWeek() { return sessionsThisWeek; }
    public void setSessionsThisWeek(long sessionsThisWeek) { this.sessionsThisWeek = sessionsThisWeek; }
}