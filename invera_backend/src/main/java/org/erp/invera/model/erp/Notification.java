package org.erp.invera.model.erp;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // example: "PASSWORD_CREATED", "PASSWORD_CHANGED"
    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String message;

    @Column(nullable = false)
    private boolean read = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "user_email")
    private String userEmail;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "target_role", nullable = true)
    private String targetRole;

    @Column(nullable = true, length = 100)
    private String entityType;

    @Column(nullable = true)
    private Long entityId;

    @Column(nullable = true, length = 100)
    private String entityReference;

    public Notification() {}

    public Notification(String type, String message, String userEmail, String userName) {
        this(type, message, userEmail, userName, "ADMIN");
    }

    public Notification(String type, String message, String userEmail, String userName, String targetRole) {
        this(type, message, userEmail, userName, targetRole, null, null, null);
    }

    public Notification(String type, String message, String userEmail, String userName, String targetRole,
                        String entityType, Long entityId, String entityReference) {
        this.type = type;
        this.message = message;
        this.userEmail = userEmail;
        this.userName = userName;
        this.targetRole = targetRole;
        this.entityType = entityType;
        this.entityId = entityId;
        this.entityReference = entityReference;
        this.read = false;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }

    public String getEntityReference() { return entityReference; }
    public void setEntityReference(String entityReference) { this.entityReference = entityReference; }
}
