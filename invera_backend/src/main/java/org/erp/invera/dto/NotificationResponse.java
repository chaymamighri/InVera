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

    public NotificationResponse(Long id, String type, String message, boolean read,
                                LocalDateTime createdAt, String userEmail, String userName) {
        this.id = id;
        this.type = type;
        this.message = message;
        this.read = read;
        this.createdAt = createdAt;
        this.userEmail = userEmail;
        this.userName = userName;
    }

    public Long getId() { return id; }
    public String getType() { return type; }
    public String getMessage() { return message; }
    public boolean isRead() { return read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getUserEmail() { return userEmail; }
    public String getUserName() { return userName; }
}