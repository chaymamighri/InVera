package org.erp.invera.controller.platform;

import lombok.Data;

@Data
public class CreatePasswordRequest {
    private String email;
    private String code;
    private String newPassword;
}