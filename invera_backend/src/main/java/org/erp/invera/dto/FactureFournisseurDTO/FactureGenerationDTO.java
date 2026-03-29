package org.erp.invera.dto.FactureFournisseurDTO;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FactureGenerationDTO {
    private Integer idFactureFournisseur;
    private String reference;
    private LocalDateTime dateFacture;
    private BigDecimal montantTotal;
    private String statut;
    private String fournisseurNom;
    private String commandeNumero;
}