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

    public List<Produit> getAllProduits() {
        return produitRepository.findAll();
    }

    public Optional<Produit> getProduitById(Integer id) {
        return produitRepository.findById(id);
    }

    public Produit updateProduit(Integer id, Produit produitDetails) {
        return produitRepository.findById(id)
                .map(produit -> {
                    produit.setLibelle(produitDetails.getLibelle());
                    produit.setPrixVente(produitDetails.getPrixVente());
                    produit.setPrixAchat(produitDetails.getPrixAchat());

                    // Mise à jour de la catégorie si spécifiée
                    if (produitDetails.getCategorie() != null && produitDetails.getCategorie().getIdCategorie() != null) {
                        Categorie categorie = categorieRepository.findById(produitDetails.getCategorie().getIdCategorie())
                                .orElseThrow(() -> new RuntimeException("Catégorie non trouvée avec l'id: " + produitDetails.getCategorie().getIdCategorie()));
                        produit.setCategorie(categorie);
                    }

                    produit.setQuantiteStock(produitDetails.getQuantiteStock());
                    produit.setSeuilMinimum(produitDetails.getSeuilMinimum());
                    produit.setUniteMesure(produitDetails.getUniteMesure());
                    produit.setImageUrl(produitDetails.getImageUrl());

                    // Mise à jour de la remise temporaire (seule remise dans Produit)
                    produit.setRemiseTemporaire(produitDetails.getRemiseTemporaire());

                    // Recalculer le statut
                    updateStockStatus(produit);

                    return produitRepository.save(produit);
                })
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'id: " + id));
    }

    public void deleteProduit(Integer id) {
        if (!produitRepository.existsById(id)) {
            throw new RuntimeException("Produit non trouvé avec l'id: " + id);
        }
        produitRepository.deleteById(id);
    }

    // Nouvelle méthode pour mettre à jour le stock
    public Produit updateStock(Integer id, Integer quantite) {
        return produitRepository.findById(id)
                .map(produit -> {
                    produit.setQuantiteStock(quantite);
                    updateStockStatus(produit);
                    return produitRepository.save(produit);
                })
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'id: " + id));
    }

    // Méthodes de recherche avec catégorie
    public List<Produit> searchProduits(String keyword, Produit.StockStatus status, Integer categorieId) {
        if (keyword != null && status != null && categorieId != null) {
            return produitRepository.findByLibelleContainingIgnoreCaseAndStatusAndCategorieIdCategorie(
                    keyword, status, categorieId);
        } else if (keyword != null && status != null) {
            return produitRepository.findByLibelleContainingIgnoreCaseAndStatus(keyword, status);
        } else if (keyword != null && categorieId != null) {
            return produitRepository.findByLibelleContainingIgnoreCaseAndCategorieIdCategorie(keyword, categorieId);
        } else if (status != null && categorieId != null) {
            return produitRepository.findByStatusAndCategorieIdCategorie(status, categorieId);
        } else if (keyword != null) {
            return produitRepository.findByLibelleContainingIgnoreCase(keyword);
        } else if (status != null) {
            return produitRepository.findByStatus(status);
        } else if (categorieId != null) {
            return produitRepository.findByCategorieIdCategorie(categorieId);
        }
        return produitRepository.findAll();
    }

    // Recherche par catégorie
    public List<Produit> getProduitsByCategorie(Integer categorieId) {
        Categorie categorie = categorieRepository.findById(categorieId)
                .orElseThrow(() -> new RuntimeException("Catégorie non trouvée avec l'id: " + categorieId));
        return produitRepository.findByCategorie(categorie);
    }

    // Méthode pour récupérer les produits avec stock faible
    public List<Produit> getLowStockProduits() {
        return produitRepository.findByStatusIn(
                List.of(Produit.StockStatus.FAIBLE, Produit.StockStatus.CRITIQUE)
        );
    }

    public boolean verifierDisponibilite(Integer produitId, Integer quantiteDemandee) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'id: " + produitId));

        return produit.getQuantiteStock() >= quantiteDemandee;
    }

    // Méthode pour ajuster le stock après une vente
    @Transactional
    public void decrementerStock(Integer produitId, Integer quantiteVendue) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'id: " + produitId));

        if (produit.getQuantiteStock() < quantiteVendue) {
            throw new RuntimeException("Stock insuffisant pour le produit: " + produit.getLibelle());
        }

        produit.setQuantiteStock(produit.getQuantiteStock() - quantiteVendue);
        updateStockStatus(produit);
        produitRepository.save(produit);
    }

    // Méthode pour réapprovisionner le stock
    @Transactional
    public void incrementerStock(Integer produitId, Integer quantiteAjoutee) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'id: " + produitId));

        produit.setQuantiteStock(produit.getQuantiteStock() + quantiteAjoutee);
        updateStockStatus(produit);
        produitRepository.save(produit);
    }

    // Méthode privée pour mettre à jour le statut du stock
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
        } else if (quantite <= seuil * 0.5) {
            produit.setStatus(Produit.StockStatus.FAIBLE);
        } else {
            produit.setStatus(Produit.StockStatus.EN_STOCK);
        }
    }
}