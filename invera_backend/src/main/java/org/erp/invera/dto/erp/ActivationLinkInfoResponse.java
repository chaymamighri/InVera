package org.erp.invera.dto.erp;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ActivationLinkInfoResponse {
    private String email;
    private String nom;
    private String prenom;
}
