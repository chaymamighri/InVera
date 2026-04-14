package org.erp.invera.dto.erp.fournisseurdto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.erp.Fournisseurs.Fournisseur;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FournisseurDTO {
    private Integer idFournisseur;
    private String nomFournisseur;
    private String email;
    private String adresse;
    private String telephone;
    private String ville;
    private String pays;
    private Boolean actif;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructeur à partir de l'entité
    public FournisseurDTO(Fournisseur fournisseur) {
        this.idFournisseur = fournisseur.getIdFournisseur();
        this.nomFournisseur = fournisseur.getNomFournisseur();
        this.email = fournisseur.getEmail();
        this.adresse = fournisseur.getAdresse();
        this.telephone = fournisseur.getTelephone();
        this.ville = fournisseur.getVille();
        this.pays = fournisseur.getPays();
        this.actif = fournisseur.getActif();
        this.createdAt = fournisseur.getCreatedAt();
        this.updatedAt = fournisseur.getUpdatedAt();
    }
}