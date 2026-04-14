package org.erp.invera.dto.erp.commandeClientdto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.erp.client.LigneCommandeClient;
import org.erp.invera.service.erp.ProduitService;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LigneCommandeClientDTO {

    private Integer idLigneCommandeClient;
    private Integer commandeClientId;
    private Integer produitId;
    private String produitLibelle;
    private String produitImageUrl;
    private String produitCategorie;
    private Integer quantite;
    private BigDecimal prixUnitaire;
    private BigDecimal sousTotal;

    public static LigneCommandeClientDTO fromEntity(LigneCommandeClient ligne) {
        return fromEntity(ligne, null);
    }

    public static LigneCommandeClientDTO fromEntity(LigneCommandeClient ligne, ProduitService produitService) {
        if (ligne == null) {
            return null;
        }

        LigneCommandeClientDTO dto = new LigneCommandeClientDTO();

        dto.setIdLigneCommandeClient(ligne.getIdLigneCommandeClient());

        if (ligne.getCommandeClient() != null) {
            dto.setCommandeClientId(ligne.getCommandeClient().getIdCommandeClient());
        }

        if (ligne.getProduit() != null) {
            dto.setProduitId(ligne.getProduit().getIdProduit());
            dto.setProduitLibelle(ligne.getProduit().getLibelle());
            dto.setProduitImageUrl(ligne.getProduit().getImageUrl());

            if (ligne.getProduit().getCategorie() != null) {
                dto.setProduitCategorie(ligne.getProduit().getCategorie().getNomCategorie());
            }
        } else if (produitService != null && dto.getProduitId() != null) {
            // Fallback: récupérer les infos du produit via le service si nécessaire
            produitService.getProduitById(dto.getProduitId()).ifPresent(produit -> {
                dto.setProduitLibelle(produit.getLibelle());
                dto.setProduitImageUrl(produit.getImageUrl());
                if (produit.getCategorie() != null) {
                    dto.setProduitCategorie(produit.getCategorie().getNomCategorie());
                }
            });
        }

        dto.setQuantite(ligne.getQuantite());
        dto.setPrixUnitaire(ligne.getPrixUnitaire());
        dto.setSousTotal(ligne.getSousTotal());

        return dto;
    }
}