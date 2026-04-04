package org.erp.invera.dto.DashboardAchatEtStock;


import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class KPIsDTO {
    private Double chiffreAffairesMois;
    private Double chiffreAffairesAnnee;
    private Integer nombreCommandesMois;
    private Double panierMoyen;
    private Double tauxRotationStock;
    private Double tauxCouvertureStock;
    private Integer joursStockMoyen;
    private Double tauxService;
}