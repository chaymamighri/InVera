package org.erp.invera.dto.DashboardAchatEtStock;


import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MouvementStockPeriodDTO {
    private String label;    // Semaine: Sem 1, Sem 2, etc.
    private Long entrees;    // Nombre d'entrées
    private Long sorties;    // Nombre de sorties
    private Long max;        // Valeur max pour l'affichage
}