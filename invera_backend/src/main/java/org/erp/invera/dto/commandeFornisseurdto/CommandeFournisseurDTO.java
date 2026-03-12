// CommandeFournisseurDTO.java
package org.erp.invera.dto.commandeFornisseurdto;

import lombok.Data;
import org.erp.invera.dto.fournisseurdto.FournisseurDTO;
import org.erp.invera.model.Fournisseurs.CommandeFournisseur;
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

    // ✅ Remplacer les champs séparés par un OBJET FournisseurDTO
    private FournisseurDTO fournisseur;

    private CommandeFournisseur.StatutCommande statut;
    private BigDecimal totalHT;
    private BigDecimal totalTVA;
    private BigDecimal totalTTC;
    private Boolean actif;
    private List<LigneCommandeDTO> lignesCommande;
}