package org.erp.invera.service;

import org.erp.invera.model.Categorie;
import org.erp.invera.model.Produit;
import org.erp.invera.repository.CategorieRepository;
import org.erp.invera.repository.ProduitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ProduitService {

    private final ProduitRepository produitRepository;
    private final CategorieRepository categorieRepository;

    public ProduitService(ProduitRepository produitRepository, CategorieRepository categorieRepository) {
        this.produitRepository = produitRepository;
        this.categorieRepository = categorieRepository;
    }

    /**
     * Créer un nouveau produit
     */
    public Produit createProduit(Produit produit) {
        // Vérifier que la catégorie existe
        if (produit.getCategorie() != null && produit.getCategorie().getIdCategorie() != null) {
            Categorie categorie = categorieRepository.findById(produit.getCategorie().getIdCategorie())
                    .orElseThrow(() -> new RuntimeException("Catégorie non trouvée avec l'id: " + produit.getCategorie().getIdCategorie()));
            produit.setCategorie(categorie);
        }

        // Calculer le statut du stock avant la sauvegarde
        updateStockStatus(produit);
        return produitRepository.save(produit);
    }

    /**
     * Récupérer tous les produits
     */
    public List<Produit> getAllProduits() {
        return produitRepository.findAll();
    }

    /**
     * Récupérer tous les produits actifs uniquement
     */
    public List<Produit> getProduitsActifs() {
        return produitRepository.findByActiveTrue();
    }

    /**
     * Récupérer un produit par son ID
     */
    public Optional<Produit> getProduitById(Integer id) {
        return produitRepository.findById(id);
    }

    /**
     * Mettre à jour un produit existant
     */
    public Produit updateProduit(Integer id, Produit produitDetails) {
        return produitRepository.findById(id)
                .map(produit -> {
                    // Mise à jour des champs uniquement s'ils sont fournis
                    if (produitDetails.getLibelle() != null) {
                        produit.setLibelle(produitDetails.getLibelle());
                    }

                    if (produitDetails.getPrixVente() != null) {
                        produit.setPrixVente(produitDetails.getPrixVente());
                    }

                    if (produitDetails.getPrixAchat() != null) {
                        produit.setPrixAchat(produitDetails.getPrixAchat());
                    }

                    // Mise à jour de la catégorie si spécifiée
                    if (produitDetails.getCategorie() != null && produitDetails.getCategorie().getIdCategorie() != null) {
                        Categorie categorie = categorieRepository.findById(produitDetails.getCategorie().getIdCategorie())
                                .orElseThrow(() -> new RuntimeException("Catégorie non trouvée avec l'id: " + produitDetails.getCategorie().getIdCategorie()));
                        produit.setCategorie(categorie);
                    }

                    if (produitDetails.getQuantiteStock() != null) {
                        produit.setQuantiteStock(produitDetails.getQuantiteStock());
                    }

                    if (produitDetails.getSeuilMinimum() != null) {
                        produit.setSeuilMinimum(produitDetails.getSeuilMinimum());
                    }

                    if (produitDetails.getUniteMesure() != null) {
                        produit.setUniteMesure(produitDetails.getUniteMesure());
                    }

                    if (produitDetails.getImageUrl() != null) {
                        produit.setImageUrl(produitDetails.getImageUrl());
                    }

                    if (produitDetails.getRemiseTemporaire() != null) {
                        produit.setRemiseTemporaire(produitDetails.getRemiseTemporaire());
                    }

                    // Recalculer le statut du stock
                    updateStockStatus(produit);

                    return produitRepository.save(produit);
                })
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'id: " + id));
    }

    /**
     * Désactiver un produit (soft delete)
     */
    public void desactiverProduit(Integer id) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'id: " + id));

        produit.setActive(false);
        produitRepository.save(produit);
    }

    /**
     * Réactiver un produit
     */
    public Produit reactiverProduit(Integer id) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'id: " + id));

        produit.setActive(true);
        return produitRepository.save(produit);
    }

    /**
     * Rechercher des produits avec filtres
     */

    public List<Produit> searchProduits(String keyword, Produit.StockStatus status, Integer categorieId, Boolean actif) {

        // Logs pour debug
        System.out.println("========== SERVICE SEARCH ==========");
        System.out.println("keyword: " + keyword);
        System.out.println("status (enum): " + status);
        System.out.println("categorieId: " + categorieId);
        System.out.println("actif: " + actif);

        // CONVERSION : enum -> String
        String statusStr = null;
        if (status != null) {
            statusStr = status.name(); // Convertit EN_STOCK -> "EN_STOCK"
            System.out.println("status converti en String: " + statusStr);
        }

        // Appel au repository avec le String
        List<Produit> resultats = produitRepository.searchProduits(keyword, statusStr, categorieId, actif);

        System.out.println("Résultats trouvés: " + resultats.size());
        System.out.println("====================================");

        return resultats;
    }

    /**
     * Récupérer les produits par catégorie
     */
    public List<Produit> getProduitsByCategorie(Integer categorieId) {
        Categorie categorie = categorieRepository.findById(categorieId)
                .orElseThrow(() -> new RuntimeException("Catégorie non trouvée avec l'id: " + categorieId));
        return produitRepository.findByCategorieAndActiveTrue(categorie);
    }

    /**
     * Récupérer les produits avec stock faible (FAIBLE ou CRITIQUE)
     */
    public List<Produit> getLowStockProduits() {
        return produitRepository.findByStatusInAndActiveTrue(
                List.of(Produit.StockStatus.FAIBLE, Produit.StockStatus.CRITIQUE)
        );
    }

    /**
     * Mettre à jour le stock d'un produit
     */
    public Produit updateStock(Integer id, Integer nouvelleQuantite) {
        return produitRepository.findById(id)
                .map(produit -> {
                    produit.setQuantiteStock(nouvelleQuantite);
                    updateStockStatus(produit);
                    return produitRepository.save(produit);
                })
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'id: " + id));
    }

    /**
     * Vérifier la disponibilité d'un produit pour une quantité donnée
     */
    public boolean verifierDisponibilite(Integer produitId, Integer quantiteDemandee) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'id: " + produitId));

        return produit.getActive() && produit.getQuantiteStock() >= quantiteDemandee;
    }

    /**
     * Méthode privée pour mettre à jour le statut du stock
     */
    private void updateStockStatus(Produit produit) {
        if (produit.getQuantiteStock() == null || produit.getSeuilMinimum() == null) {
            produit.setStatus(Produit.StockStatus.RUPTURE);
            return;
        }

        int quantite = produit.getQuantiteStock();
        int seuil = produit.getSeuilMinimum();

        if (quantite <= 0) {
            produit.setStatus(Produit.StockStatus.RUPTURE);
        } else if (quantite <= seuil * 0.25) {
            produit.setStatus(Produit.StockStatus.CRITIQUE);
        } else if (quantite <= seuil) {
            produit.setStatus(Produit.StockStatus.FAIBLE);
        } else {
            produit.setStatus(Produit.StockStatus.EN_STOCK);
        }
    }
}