package org.erp.invera.service;

import lombok.RequiredArgsConstructor;
import org.erp.invera.model.Produit;
import org.erp.invera.model.stock.StockMovement;
import org.erp.invera.repository.StockMovementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service de gestion des mouvements de stock.
 *
 * Ce fichier gère l'historique des entrées et sorties de stock.
 * Il permet de :
 * - Consulter tous les mouvements (avec ou sans filtres)
 * - Voir l'historique d'un produit spécifique
 * - Calculer le stock théorique d'un produit (entrées - sorties)
 *
 * Chaque fois qu'un produit entre ou sort du stock, un enregistrement
 * est créé pour tracer l'opération (date, quantité, type, utilisateur...).
 */
@Service
@RequiredArgsConstructor
public class StockMovementService {

    private final StockMovementRepository stockMovementRepository;

    /**
     * Récupère les mouvements avec filtres optionnels (période et type)
     *
     * @param debut date de début (optionnel)
     * @param fin   date de fin (optionnel)
     * @param type  type de mouvement : "ENTREE" ou "SORTIE" (optionnel)
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
     * Récupère les mouvements sur une période donnée
     */
    public List<StockMovement> getHistoriqueProduit(Integer produitId) {
        return stockMovementRepository.findByProduit_IdProduitOrderByDateMouvementDesc(produitId);
    }

    /**
     * Calcule le stock théorique actuel d'un produit
     *
     * Formule : Total des entrées - Total des sorties
     *
     * @return quantité restante en stock (peut être négative si anomalie)
     */
    public Integer calculerStockTheorique(Integer produitId) {
        Integer entrees = stockMovementRepository.sumEntreesByProduit(produitId);
        Integer sorties = stockMovementRepository.sumSortiesByProduit(produitId);

        return (entrees != null ? entrees : 0) - (sorties != null ? sorties : 0);
    }
}