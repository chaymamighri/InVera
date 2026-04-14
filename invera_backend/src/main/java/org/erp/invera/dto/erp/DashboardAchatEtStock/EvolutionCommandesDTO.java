package org.erp.invera.dto.erp.DashboardAchatEtStock;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class EvolutionCommandesDTO {
    private String label;  // Mois: Jan, Fév, etc.
    private Long valeur;    // Nombre de commandes
    private Double montant; // Montant total
}
