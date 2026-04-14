package org.erp.invera.dto.erp.DashboardAchatEtStock;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CategorieRepartitionDTO {
    private String categorie;
    private Long nombreProduits;
    private Double pourcentage;
}