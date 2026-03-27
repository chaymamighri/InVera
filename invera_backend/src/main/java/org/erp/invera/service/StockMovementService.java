package org.erp.invera.service;

import lombok.RequiredArgsConstructor;
import org.erp.invera.model.Produit;
import org.erp.invera.model.stock.StockMovement;
import org.erp.invera.repository.StockMovementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StockMovementService {

    private final StockMovementRepository stockMovementRepository;
    private final StockEtatService stockEtatService;


    /**
     * Récupère les mouvements avec filtres optionnels
     */
    public List<StockMovement> getMovementsWithFilters(LocalDateTime debut, LocalDateTime fin, String type) {
        // ✅ Appeler la méthode native avec le type en String
        return stockMovementRepository.findByFiltersNative(debut, fin, type);
    }

    /**
     * Récupère tous les mouvements
     */
    public List<StockMovement> getAllMovements() {
        return stockMovementRepository.findAll();
    }

    /**
     * Récupère les mouvements par période
     */
    public List<StockMovement> getMovementsByPeriode(LocalDateTime debut, LocalDateTime fin) {
        return stockMovementRepository.findByFiltersNative(debut, fin, null);
    }

    /**
     * Récupère l'historique des mouvements d'un produit
     */
    public List<StockMovement> getHistoriqueProduit(Integer produitId) {
        return stockMovementRepository.findByProduit_IdProduitOrderByDateMouvementDesc(produitId);
    }

    /**
     * Calcule le stock théorique à partir des mouvements
     */
    public Integer calculerStockTheorique(Integer produitId) {
        Integer entrees = stockMovementRepository.sumEntreesByProduit(produitId);
        Integer sorties = stockMovementRepository.sumSortiesByProduit(produitId);

        return (entrees != null ? entrees : 0) - (sorties != null ? sorties : 0);
    }
}