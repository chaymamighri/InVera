package org.erp.invera.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommandeRequestDTO {
    private Integer clientId;
    private List<ProduitCommandeRequestDTO> produits; // Utiliser la nouvelle classe
    private BigDecimal remiseTotale;
    private LocalDateTime dateCommande;
    private String statut;
    private String notes;
}