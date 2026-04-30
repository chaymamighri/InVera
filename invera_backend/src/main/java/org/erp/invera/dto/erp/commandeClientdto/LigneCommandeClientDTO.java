package org.erp.invera.dto.erp.commandeClientdto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.erp.client.LigneCommandeClient;
import org.erp.invera.model.erp.Produit;
import org.erp.invera.service.erp.ProduitService;

import java.math.BigDecimal;
import java.util.Optional;

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

    // ==================== ANCIENNES MÉTHODES (DÉPRÉCIÉES) ====================

    /**
     * @deprecated Utilisez fromEntity(ligne, produitService, token) à la place
     */
    @Deprecated
    public static LigneCommandeClientDTO fromEntity(LigneCommandeClient ligne) {
        return fromEntity(ligne, null, null);
    }

    /**
     * @deprecated Utilisez fromEntity(ligne, produitService, token) à la place
     */
    @Deprecated
    public static LigneCommandeClientDTO fromEntity(LigneCommandeClient ligne, ProduitService produitService) {
        return fromEntity(ligne, produitService, null);
    }

    // ==================== NOUVELLES MÉTHODES (AVEC TOKEN) ====================

    /**
     * Convertit une ligne de commande en DTO (AVEC TOKEN)
     */
    public static LigneCommandeClientDTO fromEntity(LigneCommandeClient ligne,
                                                    ProduitService produitService,
                                                    String token) {
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
            // ✅ Passer le token
            Optional<Produit> produitOpt = produitService.getProduitById(dto.getProduitId(), token);

            if (produitOpt.isPresent()) {
                Produit produit = produitOpt.get();
                dto.setProduitLibelle(produit.getLibelle());
                dto.setProduitImageUrl(produit.getImageUrl());
                if (produit.getCategorie() != null) {
                    dto.setProduitCategorie(produit.getCategorie().getNomCategorie());
                }
            }
        }

        dto.setQuantite(ligne.getQuantite());
        dto.setPrixUnitaire(ligne.getPrixUnitaire());
        dto.setSousTotal(ligne.getSousTotal());

        return dto;
    }

    /**
     * Convertit une ligne de commande en DTO avec ID produit uniquement
     */
    public static LigneCommandeClientDTO fromEntitySimple(LigneCommandeClient ligne) {
        if (ligne == null) {
            return null;
        }

        LigneCommandeClientDTO dto = new LigneCommandeClientDTO();
        dto.setIdLigneCommandeClient(ligne.getIdLigneCommandeClient());
        dto.setProduitId(ligne.getProduit() != null ? ligne.getProduit().getIdProduit() : null);
        dto.setQuantite(ligne.getQuantite());
        dto.setPrixUnitaire(ligne.getPrixUnitaire());
        dto.setSousTotal(ligne.getSousTotal());

        return dto;
    }
}