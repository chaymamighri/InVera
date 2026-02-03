package org.erp.invera.service;

import org.erp.invera.model.Produit;
import org.erp.invera.repository.ProduitRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;


@Service
public class ProduitService {

    private final ProduitRepository produitRepository;

    public ProduitService(ProduitRepository produitRepository) {
        this.produitRepository = produitRepository;
    }

    public Produit createProduit(Produit produit) {
        return produitRepository.save(produit);
    }

    public List<Produit> getAllProduits() {
        return produitRepository.findAll();
    }

    public Optional<Produit> getProduitById(Integer id) {
        return produitRepository.findById(id);
    }

    public Produit updateProduit(Integer id, Produit details) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

        produit.setLibelle(details.getLibelle());
        produit.setPrix(details.getPrix());
        produit.setQuantiteStock(details.getQuantiteStock());
        produit.setSeuilMinimum(details.getSeuilMinimum());
        produit.setUniteMesure(details.getUniteMesure());

        return produitRepository.save(produit);
    }

    public void deleteProduit(Integer id) {
        produitRepository.deleteById(id);
    }
}

