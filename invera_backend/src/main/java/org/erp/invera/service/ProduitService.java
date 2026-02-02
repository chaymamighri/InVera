package org.erp.invera.service;

import org.erp.invera.model.Produit;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ProduitService {

    // ✅ Remplacement du repository par une liste en mémoire
    private final List<Produit> produits = new ArrayList<>();
    private int nextId = 1; // Pour simuler un auto-increment comme en base

    // CRUD de base
    public Produit createProduit(Produit produit) {
        produit.setIdProduit(nextId++); // On génère un ID
        produits.add(produit);
        return produit;
    }

    public List<Produit> getAllProduits() {
        return produits;
    }

    public Optional<Produit> getProduitById(Integer id) {
        return produits.stream()
                .filter(p -> p.getIdProduit().equals(id))
                .findFirst();
    }

    public Produit updateProduit(Integer id, Produit produitDetails) {
        Produit produit = getProduitById(id)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

        produit.setLibelle(produitDetails.getLibelle());
        produit.setPrix(produitDetails.getPrix());
        produit.setQuantiteStock(produitDetails.getQuantiteStock());
        produit.setSeuilMinimum(produitDetails.getSeuilMinimum());
        produit.setUniteMesure(produitDetails.getUniteMesure());

        return produit;
    }

    public void deleteProduit(Integer id) {
        produits.removeIf(p -> p.getIdProduit().equals(id));
    }

    // Logique métier
    public Produit appliquerRemise(Integer id, double pourcentage) {
        Produit produit = getProduitById(id)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

        double nouveauPrix = produit.getPrix() - (produit.getPrix() * pourcentage / 100);
        produit.setPrix(nouveauPrix);

        return produit;
    }

    public Produit miseAJourPrix(Integer id, double nouveauPrix) {
        Produit produit = getProduitById(id)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

        produit.setPrix(nouveauPrix);
        return produit;
    }
}
