package org.erp.invera.dto.erp.FactureFournisseurDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface FactureListeDTO {
    Integer getIdFactureFournisseur();
    String getReferenceFactureFournisseur();
    LocalDateTime getDateFacture();
    BigDecimal getMontantTotal();
    String getStatut();
    String getNomFournisseur();
    String getEmail();
    String getNumeroCommande();
    LocalDateTime getDateCommande();
}