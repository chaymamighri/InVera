package org.erp.invera.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO used when user submits OTP + new password
 */
@Data
public class ResetPasswordRequest {

    @NotBlank
    private String email;

    @NotBlank
    private String code;

    @NotBlank
    private String newPassword;
}
