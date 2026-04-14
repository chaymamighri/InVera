package org.erp.invera.dto.erp.DashboardAchatEtStock;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AlerteStockDTO {
    private Long produitId;
    private String produitNom;
    private String produitReference;
    private Integer stockActuel;
    private Integer stockMin;
    private String typeAlerte; // RUPTURE, CRITIQUE
    private String emplacement;
}