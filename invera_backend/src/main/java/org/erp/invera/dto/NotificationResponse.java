// src/main/java/org/erp/invera/dto/NotificationResponse.java
package org.erp.invera.dto;

import java.time.LocalDateTime;

public class NotificationResponse {

    private Long id;
    private String type;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
    private String userEmail;
    private String userName;
    private String entityType;
    private Long entityId;
    private String entityReference;

    public NotificationResponse(Long id, String type, String message, boolean read,
                                LocalDateTime createdAt, String userEmail, String userName,
                                String entityType, Long entityId, String entityReference) {
        this.id = id;
        this.type = type;
        this.message = message;
        this.read = read;
        this.createdAt = createdAt;
        this.userEmail = userEmail;
        this.userName = userName;
        this.entityType = entityType;
        this.entityId = entityId;
        this.entityReference = entityReference;
    }

    public Long getId() { return id; }
    public String getType() { return type; }
    public String getMessage() { return message; }
    public boolean isRead() { return read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getUserEmail() { return userEmail; }
    public String getUserName() { return userName; }
    public String getEntityType() { return entityType; }
    public Long getEntityId() { return entityId; }
    public String getEntityReference() { return entityReference; }
}
