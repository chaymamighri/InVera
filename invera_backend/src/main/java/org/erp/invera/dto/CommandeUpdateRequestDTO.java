package org.erp.invera.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CommandeUpdateRequestDTO {
    private String statut;
    private List<ProduitCommandeUpdateDTO> produits;
    private BigDecimal sousTotal;
    private BigDecimal montantRemise;
    private BigDecimal total;

    // Informations client à mettre à jour
    private Integer clientId;
    private String clientAdresse;
    private String clientTelephone;
    private String clientEmail;
}