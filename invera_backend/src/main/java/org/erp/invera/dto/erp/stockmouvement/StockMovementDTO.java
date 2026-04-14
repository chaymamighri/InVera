package org.erp.invera.dto.erp.stockmouvement;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockMovementDTO {
    private Long id;
    private Integer produitId;
    private String produitLibelle;
    private String produitReference;
    private String typeMouvement;
    private Integer quantite;
    private Integer stockAvant;
    private Integer stockApres;
    private String reference;
    private String typeDocument;
    private Long idDocument;
    private String commentaire;
    private LocalDateTime dateMouvement;
}