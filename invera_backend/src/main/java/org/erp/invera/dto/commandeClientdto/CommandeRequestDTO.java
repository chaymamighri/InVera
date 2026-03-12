package org.erp.invera.dto.commandeClientdto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.erp.invera.dto.Produitdto.ProduitCommandeRequestDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommandeRequestDTO {
    private Integer clientId;
    private List<ProduitCommandeRequestDTO> produits;
    private BigDecimal remiseTotale;
    private LocalDateTime dateCommande;
    private String statut;
    private String notes;
}