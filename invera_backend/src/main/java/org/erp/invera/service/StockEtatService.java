package org.erp.invera.service;

import lombok.RequiredArgsConstructor;

import org.erp.invera.dto.stockmouvement.StockEtatDTO;
import org.erp.invera.model.Produit;
import org.erp.invera.model.Produit.StockStatus;
import org.erp.invera.model.stock.StockMovement;
import org.erp.invera.model.stock.StockMovement.MovementType;
import org.erp.invera.repository.ProduitRepository;
import org.erp.invera.repository.StockMovementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockEtatService {

    private final ProduitRepository produitRepository;
    private final StockMovementRepository stockMovementRepository;

    /**
     * Obtenir l'état de stock complet avec filtres
     */
    public List<StockEtatDTO> getEtatStock(
            Integer categorieId,
            Boolean seuilAlerte,
            Boolean rupture) {

        List<Produit> produits = produitRepository.findAll();
        List<StockMovement> allMovements = stockMovementRepository.findAll();
        Map<Integer, Integer> stockActuelMap = calculerStockActuel(allMovements);

        List<StockEtatDTO> result = produits.stream()
                .map(produit -> {
                    Integer quantiteActuelle = stockActuelMap.getOrDefault(produit.getIdProduit(), 0);

                    // ✅ Mettre à jour le statut du produit dans la base de données
                    mettreAJourStatutProduit(produit, quantiteActuelle);

                    // ✅ Utiliser le statut du produit
                    String statutStock = produit.getStatus().name();

                    return convertToDTO(produit, quantiteActuelle, statutStock);
                })
                .filter(dto -> appliquerFiltres(dto, categorieId, seuilAlerte, rupture))
                .sorted(Comparator.comparing(StockEtatDTO::getLibelle))
                .collect(Collectors.toList());

        return result;
    }

    /**
     * ✅ Mettre à jour le statut du produit en fonction de la quantité actuelle
     */
    @Transactional
    private void mettreAJourStatutProduit(Produit produit, Integer quantiteActuelle) {
        StockStatus nouveauStatut = determinerStatut(produit, quantiteActuelle);

        if (produit.getStatus() != nouveauStatut) {
            produit.setStatus(nouveauStatut);
            produitRepository.save(produit);
        }
    }

    /**
     * ✅ Déterminer le statut en fonction de la quantité et du seuil
     */
    private StockStatus determinerStatut(Produit produit, Integer quantiteActuelle) {
        Integer seuilMinimum = produit.getSeuilMinimum();

        if (quantiteActuelle == 0) {
            return StockStatus.RUPTURE;
        }

        if (seuilMinimum != null) {
            // Critique : moins de 20% du seuil minimum
            int seuilCritique = Math.max(1, seuilMinimum / 5);
            if (quantiteActuelle <= seuilCritique) {
                return StockStatus.CRITIQUE;
            }

            // Faible : inférieur ou égal au seuil minimum
            if (quantiteActuelle <= seuilMinimum) {
                return StockStatus.FAIBLE;
            }
        }

        return StockStatus.EN_STOCK;
    }

    /**
     * Calculer le stock actuel pour tous les produits
     */
    private Map<Integer, Integer> calculerStockActuel(List<StockMovement> mouvements) {
        Map<Integer, Integer> stockMap = new HashMap<>();

        for (StockMovement mouvement : mouvements) {
            Integer produitId = mouvement.getProduit().getIdProduit();
            Integer quantite = mouvement.getQuantite();

            if (mouvement.getTypeMouvement() == MovementType.ENTREE) {
                stockMap.put(produitId, stockMap.getOrDefault(produitId, 0) + quantite);
            } else if (mouvement.getTypeMouvement() == MovementType.SORTIE) {
                stockMap.put(produitId, stockMap.getOrDefault(produitId, 0) - quantite);
            }
        }

        return stockMap;
    }

    /**
     * Convertir Produit en StockEtatDTO
     */
    private StockEtatDTO convertToDTO(Produit produit, Integer quantiteActuelle, String statutStock) {
        StockEtatDTO dto = new StockEtatDTO();
        dto.setProduitId(produit.getIdProduit());
        dto.setReference(String.valueOf(produit.getIdProduit()));
        dto.setLibelle(produit.getLibelle());
        dto.setQuantiteActuelle(quantiteActuelle);
        dto.setUnite(produit.getUniteMesure() != null ? produit.getUniteMesure().name() : "PIECE");

        BigDecimal prixUnitaire = produit.getPrixVente() != null ?
                BigDecimal.valueOf(produit.getPrixVente()) : BigDecimal.ZERO;
        dto.setPrixUnitaire(prixUnitaire);

        dto.setSeuilAlerte(produit.getSeuilMinimum());
        dto.setStatutStock(statutStock);  // ✅ Utiliser le statut du produit

        if (prixUnitaire != null && quantiteActuelle != null) {
            dto.setValeurStock(prixUnitaire.multiply(BigDecimal.valueOf(quantiteActuelle)));
        }

        if (produit.getCategorie() != null) {
            dto.setCategorieId(produit.getCategorie().getIdCategorie());
            dto.setCategorieNom(produit.getCategorie().getNomCategorie());
        }

        return dto;
    }

    /**
     * Appliquer les filtres
     */
    private boolean appliquerFiltres(StockEtatDTO dto,
                                     Integer categorieId,
                                     Boolean seuilAlerte,
                                     Boolean rupture) {
        // Filtre par catégorie
        if (categorieId != null && !categorieId.equals(dto.getCategorieId())) {
            return false;
        }

        // Filtre par seuil d'alerte (produits FAIBLE ou CRITIQUE)
        if (seuilAlerte != null && seuilAlerte &&
                !"FAIBLE".equals(dto.getStatutStock()) &&
                !"CRITIQUE".equals(dto.getStatutStock())) {
            return false;
        }

        // Filtre par rupture
        if (rupture != null && rupture &&
                !"RUPTURE".equals(dto.getStatutStock())) {
            return false;
        }

        return true;
    }

    /**
     * ✅ Méthode pour mettre à jour le statut d'un produit spécifique
     */
    @Transactional
    public void mettreAJourStatutProduit(Integer produitId) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

        List<StockMovement> mouvements = stockMovementRepository.findByProduit_IdProduit(produitId);
        Map<Integer, Integer> stockActuelMap = calculerStockActuel(mouvements);
        Integer quantiteActuelle = stockActuelMap.getOrDefault(produitId, 0);

        mettreAJourStatutProduit(produit, quantiteActuelle);
    }

    /**
     * ✅ Mettre à jour tous les statuts des produits
     */
    @Transactional
    public void mettreAJourTousLesStatuts() {
        List<Produit> produits = produitRepository.findAll();
        List<StockMovement> allMovements = stockMovementRepository.findAll();
        Map<Integer, Integer> stockActuelMap = calculerStockActuel(allMovements);

        for (Produit produit : produits) {
            Integer quantiteActuelle = stockActuelMap.getOrDefault(produit.getIdProduit(), 0);
            mettreAJourStatutProduit(produit, quantiteActuelle);
        }
    }

    /**
     * ✅ Obtenir les produits en alerte (FAIBLE ou CRITIQUE)
     */
    public List<StockEtatDTO> getProduitsEnAlerte() {
        return getEtatStock(null, true, null);
    }

    /**
     * ✅ Obtenir les produits en rupture de stock
     */
    public List<StockEtatDTO> getProduitsEnRupture() {
        return getEtatStock(null, null, true);
    }
}