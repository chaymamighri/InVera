package org.erp.invera.dto;

import lombok.Data;

/**
 * DTO used when user submits new password
 */
@Data
public class ResetPasswordRequest {

    /**
     * Token received by email
     */
    private String token;

    /**
     * New password chosen by user
     */
    private String newPassword;
}
