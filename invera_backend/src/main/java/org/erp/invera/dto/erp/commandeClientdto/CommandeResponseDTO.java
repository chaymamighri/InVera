package org.erp.invera.dto.erp.commandeClientdto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.dto.erp.clientdto.ClientDTO;
import org.erp.invera.dto.erp.Produitdto.ProduitCommandeDetailDTO;
import org.erp.invera.model.erp.client.CommandeClient;
import org.erp.invera.model.erp.client.LigneCommandeClient;
import org.erp.invera.service.erp.ClientService;
import org.erp.invera.service.erp.ProduitService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.ALWAYS)
public class CommandeResponseDTO {

    // Informations de base
    private Integer idCommandeClient;
    private String referenceCommandeClient;

    // Client
    private ClientDTO client;

    // Statut
    private String statut;
    private String statutDisplay;

    // Dates
    private LocalDateTime dateCommande;
    private String dateCommandeFormatted;

    // Totaux financiers
    private BigDecimal sousTotal;
    private BigDecimal tauxRemise;      // Remise client appliquée
    private BigDecimal total;

    // ✅ AJOUTER CE CHAMP POUR LA REMISE CLIENT EN POURCENTAGE
    private BigDecimal tauxRemiseClient;  // Pour plus de clarté

    // Lignes de commande
    private List<LigneCommandeClientDTO> lignesCommande;

    // Produits (pour compatibilité avec l'ancien code)
    private List<ProduitCommandeDetailDTO> produits;

    // ==========================
    // MÉTHODES DE CONVERSION
    // ==========================

    public static CommandeResponseDTO fromEntity(CommandeClient commande,
                                                 ClientService clientService,
                                                 ProduitService produitService) {
        if (commande == null) {
            System.out.println("⚠️ [fromEntity] commande est null");
            return null;
        }

        System.out.println("🔍 [fromEntity] Début conversion - Lignes dans commande: " +
                (commande.getLignesCommande() != null ? commande.getLignesCommande().size() : 0));

        CommandeResponseDTO dto = new CommandeResponseDTO();

        dto.setIdCommandeClient(commande.getIdCommandeClient());
        dto.setReferenceCommandeClient(commande.getReferenceCommandeClient());

        // Client
        if (commande.getClient() != null) {
            dto.setClient(ClientDTO.fromEntity(commande.getClient()));
        }

        // Statut
        if (commande.getStatut() != null) {
            dto.setStatut(commande.getStatut().name());
            dto.setStatutDisplay(commande.getStatut().getDisplayName());
        }

        // Date
        dto.setDateCommande(commande.getDateCommande());
        if (commande.getDateCommande() != null) {
            dto.setDateCommandeFormatted(
                    commande.getDateCommande()
                            .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
            );
        }

        // Totaux
        dto.setSousTotal(commande.getSousTotal());
        // ✅ Utiliser directement le tauxRemise déjà stocké dans la commande
        // (Il a été défini dans chargerClientComplet)
        dto.setTauxRemise(commande.getTauxRemise() != null ? commande.getTauxRemise() : BigDecimal.ZERO);
        dto.setTauxRemiseClient(commande.getTauxRemise() != null ? commande.getTauxRemise() : BigDecimal.ZERO);
        dto.setTotal(commande.getTotal());

        System.out.println("✅ Taux remise client depuis commande: " + dto.getTauxRemise() + "%");

        // ✅ CONVERSION MANUELLE DES LIGNES
        List<LigneCommandeClientDTO> lignesDTO = new ArrayList<>();
        List<ProduitCommandeDetailDTO> produitsDTO = new ArrayList<>();

        if (commande.getLignesCommande() != null && !commande.getLignesCommande().isEmpty()) {
            System.out.println("🔍 [fromEntity] Conversion de " + commande.getLignesCommande().size() + " lignes");

            for (LigneCommandeClient ligne : commande.getLignesCommande()) {
                // Créer le DTO de ligne
                LigneCommandeClientDTO ligneDTO = new LigneCommandeClientDTO();
                ligneDTO.setIdLigneCommandeClient(ligne.getIdLigneCommandeClient());
                ligneDTO.setQuantite(ligne.getQuantite());
                ligneDTO.setPrixUnitaire(ligne.getPrixUnitaire());
                ligneDTO.setSousTotal(ligne.getSousTotal());

                // Ajouter les infos produit
                if (ligne.getProduit() != null) {
                    ligneDTO.setProduitId(ligne.getProduit().getIdProduit());
                    ligneDTO.setProduitLibelle(ligne.getProduit().getLibelle());
                    ligneDTO.setPrixVente(BigDecimal.valueOf(ligne.getProduit().getPrixVente()));
                    ligneDTO.setImageUrl(ligne.getProduit().getImageUrl());

                    // Ajouter les infos de la catégorie avec la remise
                    if (ligne.getProduit().getCategorie() != null) {
                        ligneDTO.setCategorieNom(ligne.getProduit().getCategorie().getNomCategorie());
                        ligneDTO.setRemiseStandard(ligne.getProduit().getCategorie().getRemiseStandard());
                        ligneDTO.setTauxTVA(ligne.getProduit().getCategorie().getTauxTVA());
                    }
                }
                lignesDTO.add(ligneDTO);

                // Créer le DTO produit (pour compatibilité)
                ProduitCommandeDetailDTO produitDTO = new ProduitCommandeDetailDTO();
                produitDTO.setId(ligne.getProduit().getIdProduit());
                produitDTO.setLibelle(ligne.getProduit().getLibelle());
                produitDTO.setQuantite(ligne.getQuantite());
                produitDTO.setPrixUnitaire(ligne.getPrixUnitaire());
                produitDTO.setSousTotal(ligne.getSousTotal());
                produitDTO.setImageUrl(ligne.getProduit().getImageUrl());

                // Ajouter la remise au produit DTO
                if (ligne.getProduit().getCategorie() != null) {
                    produitDTO.setCategorieNom(ligne.getProduit().getCategorie().getNomCategorie());
                    produitDTO.setRemiseStandard(ligne.getProduit().getCategorie().getRemiseStandard());
                    produitDTO.setTauxTVA(ligne.getProduit().getCategorie().getTauxTVA());
                }
                produitsDTO.add(produitDTO);

                System.out.println("   ✅ Ligne convertie: " + ligne.getProduit().getLibelle() +
                        " x" + ligne.getQuantite() +
                        " (Remise categorie: " + (ligne.getProduit().getCategorie() != null ?
                        ligne.getProduit().getCategorie().getRemiseStandard() : 0) + "%)");
            }
        } else {
            System.out.println("⚠️ [fromEntity] Aucune ligne à convertir");
        }

        dto.setLignesCommande(lignesDTO);
        dto.setProduits(produitsDTO);

        System.out.println("🔍 [fromEntity] Final - Remise client: " + dto.getTauxRemise() + "%");
        System.out.println("🔍 [fromEntity] Final - LignesDTO: " + lignesDTO.size() +
                ", ProduitsDTO: " + produitsDTO.size());

        return dto;
    }
}