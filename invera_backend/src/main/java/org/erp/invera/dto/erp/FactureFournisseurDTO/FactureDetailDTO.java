package org.erp.invera.dto.erp.FactureFournisseurDTO;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.erp.Fournisseurs.CommandeFournisseur;
import org.erp.invera.model.erp.Fournisseurs.Fournisseur;
import org.erp.invera.model.erp.Fournisseurs.LigneCommandeFournisseur;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class FactureDetailDTO {

    private Integer idFactureFournisseur;
    private String reference;
    private LocalDateTime dateFacture;
    private BigDecimal montantTotal;
    private String statut;

    @JsonIgnoreProperties({"lignesCommande", "commandes", "factures"})
    private Fournisseur fournisseur;

    @JsonIgnoreProperties({"lignesCommande", "fournisseur", "commandeFournisseur", "factures"})
    private CommandeFournisseur commande;

    @JsonProperty("lignesCommande")
    private List<LigneCommandeFournisseur> lignes;

    private LocalDateTime createdAt;
    private String createdBy;
}