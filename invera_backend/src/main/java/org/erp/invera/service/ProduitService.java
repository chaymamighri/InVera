package org.erp.invera.service;

import org.erp.invera.model.Produit;
import org.erp.invera.repository.ProduitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ProduitService {

    private final ProduitRepository produitRepository;

    public ProduitService(ProduitRepository produitRepository) {
        this.produitRepository = produitRepository;
    }

    public Produit createProduit(Produit produit) {
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
                    produit.setQuantiteStock(produitDetails.getQuantiteStock());
                    produit.setSeuilMinimum(produitDetails.getSeuilMinimum());
                    produit.setUniteMesure(produitDetails.getUniteMesure());
                    produit.setImageUrl(produitDetails.getImageUrl());

                    // Mettre à jour les remises
                    produit.setRemiseTemporaire(produitDetails.getRemiseTemporaire());
                    produit.setRemiseParticulier(produitDetails.getRemiseParticulier());
                    produit.setRemiseVIP(produitDetails.getRemiseVIP());
                    produit.setRemiseProfessionnelle(produitDetails.getRemiseProfessionnelle());
                    produit.setRemiseVolumeMin(produitDetails.getRemiseVolumeMin());
                    produit.setTauxRemiseVolume(produitDetails.getTauxRemiseVolume());

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

    // Méthode pour rechercher des produits
    public List<Produit> searchProduits(String keyword, Produit.StockStatus status, String categorie) {
        if (keyword != null && status != null && categorie != null) {
            return produitRepository.findByLibelleContainingIgnoreCaseAndStatusAndCategorie(
                    keyword, status, categorie);
        } else if (keyword != null && status != null) {
            return produitRepository.findByLibelleContainingIgnoreCaseAndStatus(keyword, status);
        } else if (keyword != null && categorie != null) {
            return produitRepository.findByLibelleContainingIgnoreCaseAndCategorie(keyword, categorie);
        } else if (status != null && categorie != null) {
            return produitRepository.findByStatusAndCategorie(status, categorie);
        } else if (keyword != null) {
            return produitRepository.findByLibelleContainingIgnoreCase(keyword);
        } else if (status != null) {
            return produitRepository.findByStatus(status);
        } else if (categorie != null) {
            return produitRepository.findByCategorie(categorie);
        }
        return produitRepository.findAll();
    }

    // Méthode pour récupérer les produits avec stock faible
    public List<Produit> getLowStockProduits() {
        return produitRepository.findByStatusIn(
                List.of(Produit.StockStatus.FAIBLE, Produit.StockStatus.CRITIQUE)
        );
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