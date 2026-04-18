package org.erp.invera.dto.platform.superAdmindto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChangeSuperAdminPasswordRequest {

    @NotBlank
    private String oldPassword;

    @NotBlank
    private String newPassword;
}
