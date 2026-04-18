package org.erp.invera.dto.erp;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ActivateAccountRequest {

    @NotBlank
    private String token;

    @NotBlank
    private String newPassword;
}
