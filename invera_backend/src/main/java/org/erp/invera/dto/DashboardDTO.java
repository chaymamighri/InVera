package org.erp.invera.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDTO {
    private boolean success;
    private String message;
    private String period;
    private KPI kpi;
    private Charts charts;


    private List<StatusData> statusRepartition;
    private List<OrdersEvolutionData> ordersEvolution;
    private List<ClientTypeData> clientTypeRepartition;


    // ========================
    // CLASSE KPI
    // ========================
    @Data
    @NoArgsConstructor
    public static class KPI {
        // CA (toujours BigDecimal)
        private BigDecimal caJour;
        private BigDecimal caHier;
        private BigDecimal caSemaine;
        private BigDecimal caMois;
        private BigDecimal caAnnee;

        // Variations (toujours BigDecimal)
        private BigDecimal variationJour;
        private BigDecimal variationSemaine;
        private BigDecimal variationMois;
        private BigDecimal variationAnnee;

        // Commandes (toujours Long pour éviter les problèmes de null)
        private Long commandesJour;
        private Long commandesHier;
        private Long commandesSemaine;
        private Long commandesMois;
        private Long commandesAnnee;

        // Autres métriques
        private BigDecimal panierMoyen;
        private BigDecimal tauxTransformation;
        private BigDecimal creancesTotal;
        private Long creancesNombre;
        private Long facturesEnRetard;

        // Constructeur avec TOUS les champs en types objet
        public KPI(
                BigDecimal caJour, BigDecimal caHier,
                BigDecimal caSemaine, BigDecimal caMois, BigDecimal caAnnee,
                BigDecimal variationJour, BigDecimal variationSemaine,
                BigDecimal variationMois, BigDecimal variationAnnee,
                Long commandesJour, Long commandesHier,
                Long commandesSemaine, Long commandesMois, Long commandesAnnee,
                BigDecimal panierMoyen, BigDecimal tauxTransformation,
                BigDecimal creancesTotal, Long creancesNombre, Long facturesEnRetard
        ) {
            this.caJour = caJour;
            this.caHier = caHier;
            this.caSemaine = caSemaine;
            this.caMois = caMois;
            this.caAnnee = caAnnee;

            this.variationJour = variationJour;
            this.variationSemaine = variationSemaine;
            this.variationMois = variationMois;
            this.variationAnnee = variationAnnee;

            this.commandesJour = commandesJour;
            this.commandesHier = commandesHier;
            this.commandesSemaine = commandesSemaine;
            this.commandesMois = commandesMois;
            this.commandesAnnee = commandesAnnee;

            this.panierMoyen = panierMoyen;
            this.tauxTransformation = tauxTransformation;
            this.creancesTotal = creancesTotal;
            this.creancesNombre = creancesNombre;
            this.facturesEnRetard = facturesEnRetard;
        }
    }

    // ========================
    // CLASSE CHARTS
    // ========================
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Charts {
        private List<Point> evolutionCA;
        private List<ProduitVente> topProduits;
        private List<StatutData> repartitionStatuts;
    }

    // ========================
    // CLASSE POINT
    // ========================
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Point {
        private String date;
        private BigDecimal valeur;
    }

    // ========================
    // CLASSE PRODUITVENTE
    // ========================
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProduitVente {
        private Integer id;
        private String nom;
        private long quantite;
        private BigDecimal montant;
        private String image;

        // Constructeur pour JPQL (conversion Long → long)
        public ProduitVente(Integer id, String nom, Long quantite, BigDecimal montant, String image) {
            this.id = id;
            this.nom = nom;
            this.quantite = quantite != null ? quantite : 0L;
            this.montant = montant != null ? montant : BigDecimal.ZERO;
            this.image = image;
        }
    }

    // ========================
    // CLASSE STATUTDATA
    // ========================
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatutData {
        private String statut;
        private long nombre;
        private BigDecimal montant;
        private double pourcentage;
        private String couleur;

        // Constructeur pour JPQL (conversion Long → long)
        public StatutData(String statut, Long nombre, BigDecimal montant, double pourcentage, String couleur) {
            this.statut = statut;
            this.nombre = nombre != null ? nombre : 0L;
            this.montant = montant != null ? montant : BigDecimal.ZERO;
            this.pourcentage = pourcentage;
            this.couleur = couleur;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusData {
        private String statut;
        private long nombre;
        private BigDecimal montant;
        private double pourcentage;
        private String couleur;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrdersEvolutionData {
        private String date;
        private long commandes;
        private BigDecimal ca;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClientTypeData {
        private String type;
        private long nombre;
        private BigDecimal montant;
        private String couleur;
    }
}
