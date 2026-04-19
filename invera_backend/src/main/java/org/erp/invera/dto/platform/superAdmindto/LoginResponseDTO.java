package org.erp.invera.dto.platform.superAdmindto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDTO {
    private Integer id;
    private String nom;
    private String email;
    private String token;
    private String warning;

    // Getters et Setters
    public String getWarning() { return warning; }
    public void setWarning(String warning) { this.warning = warning; }
}