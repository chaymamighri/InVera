package org.erp.invera.dto.DashboardAchatEtStock;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StockValeurDTO {
    private String categorie;
    private Double valeur;
    private Integer nombreProduits;
}
