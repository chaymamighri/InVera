package org.erp.invera.dto.erp.clientdto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NouveauClientDTO {
    private String nom;
    private String prenom;
    private String telephone;
    private String adresse;
    private String type;
    private String email;
}