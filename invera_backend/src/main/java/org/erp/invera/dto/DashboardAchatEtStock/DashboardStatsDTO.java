package org.erp.invera.dto.DashboardAchatEtStock;


import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardStatsDTO {
    private CommandesStats commandes;
    private ProduitsStats produits;
    private StockStats stock;
    private FacturesStats factures;

    @Data
    @Builder
    public static class CommandesStats {
        private Long total;
        private Long enAttente;
        private Long enCours;
        private Long livre;
        private Double tendance;
    }

    @Data
    @Builder
    public static class ProduitsStats {
        private Long total;
        private Long actifs;
        private Long rupture;
        private Long alerte;
        private Double tendance;
    }

    @Data
    @Builder
    public static class StockStats {
        private Long entrees;
        private Long sorties;
        private Long max;
        private Double valeurTotale;
        private Long mouvementsMois;
        private Double rotation;
        private Double tendance;
    }

    @Data
    @Builder
    public static class FacturesStats {
        private Long total;
        private Long payees;
        private Long impayees;
        private Double montantTotal;
        private Double tendance;
    }
}