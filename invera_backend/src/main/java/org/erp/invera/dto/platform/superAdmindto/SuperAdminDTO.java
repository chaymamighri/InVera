package org.erp.invera.dto.platform.superAdmindto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SuperAdminDTO {
    private Integer id;
    private String nom;
    private String email;
    private String motDePasse;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
}