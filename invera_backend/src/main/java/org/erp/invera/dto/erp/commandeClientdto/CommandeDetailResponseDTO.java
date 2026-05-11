package org.erp.invera.dto.erp.commandeClientdto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

// Créez une nouvelle classe CommandeDetailResponseDTO
public class CommandeDetailResponseDTO {
    private Integer idCommandeClient;
    private String referenceCommandeClient;
    private String statut;
    private LocalDateTime dateCommande;
    private BigDecimal sousTotal;
    private BigDecimal tauxRemise;
    private BigDecimal total;

    // Client avec les champs nécessaires
    private Integer clientId;
    private String clientNom;
    private String clientPrenom;
    private String clientEmail;
    private String clientTelephone;
    private String clientAdresse;
    private String clientType;

    // Lignes de commande
    private List<Map<String, Object>> lignes;

    // Constructeur et getters/setters
}