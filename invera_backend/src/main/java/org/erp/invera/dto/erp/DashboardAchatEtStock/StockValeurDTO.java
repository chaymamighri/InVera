package org.erp.invera.dto.erp.DashboardAchatEtStock;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StockValeurDTO {
    private String categorie;
    private Double valeur;
    private Integer nombreProduits;
}
