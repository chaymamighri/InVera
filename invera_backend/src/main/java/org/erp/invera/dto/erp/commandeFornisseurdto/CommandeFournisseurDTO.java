package org.erp.invera.dto.erp.commandeFornisseurdto;

import lombok.Data;
import org.erp.invera.dto.erp.fournisseurdto.FournisseurDTO;
import org.erp.invera.model.erp.Fournisseurs.CommandeFournisseur;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CommandeFournisseurDTO {
    private Integer idCommandeFournisseur;
    private String numeroCommande;
    private LocalDateTime dateCommande;
    private LocalDateTime dateLivraisonPrevue;
    private LocalDateTime dateLivraisonReelle;
    private String adresseLivraison;
    private FournisseurDTO fournisseur;
    private CommandeFournisseur.StatutCommande statut;

    // Totaux
    private BigDecimal totalHT;
    private BigDecimal totalTVA;
    private BigDecimal totalTTC;

    // TVA par défaut
    private BigDecimal tauxTVA;

    private Boolean actif;
    private List<LigneCommandeDTO> lignesCommande;

    private String motifRejet;
    private LocalDateTime dateRejet;
}