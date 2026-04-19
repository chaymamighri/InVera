package org.erp.invera.dto.platform.superAdmindto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateSuperAdminProfileRequest {

    @NotBlank
    @Size(min = 2, max = 100)
    private String nom;

    @NotBlank
    @Email
    private String email;
}
