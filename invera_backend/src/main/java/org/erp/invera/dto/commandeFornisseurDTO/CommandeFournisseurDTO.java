package org.erp.invera.dto.commandeFornisseurDTO;



import lombok.Data;
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
    private Integer fournisseurId;
    private String fournisseurNom;
    private CommandeFournisseur.StatutCommande statut;
    private BigDecimal totalHT;
    private BigDecimal totalTVA;
    private BigDecimal totalTTC;
    private Boolean actif;
    private List<LigneCommandeDTO> lignesCommande;


}
