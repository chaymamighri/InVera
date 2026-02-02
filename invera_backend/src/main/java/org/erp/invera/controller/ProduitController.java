package org.erp.invera.controller;

import org.erp.invera.model.Produit;
import org.erp.invera.service.ProduitService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/produits")
public class ProduitController {

    private final ProduitService produitService;

    public ProduitController(ProduitService produitService) {
        this.produitService = produitService;
    }

    // CRUD
    @PostMapping
    public Produit createProduit(@RequestBody Produit produit) {
        return produitService.createProduit(produit);
    }

    @GetMapping
    public List<Produit> getAllProduits() {
        return produitService.getAllProduits();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Produit> getProduitById(@PathVariable Integer id) {
        return produitService.getProduitById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public Produit updateProduit(@PathVariable Integer id, @RequestBody Produit produit) {
        return produitService.updateProduit(id, produit);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduit(@PathVariable Integer id) {
        produitService.deleteProduit(id);
        return ResponseEntity.noContent().build();
    }

    // Logique métier
    @PutMapping("/{id}/remise")
    public Produit appliquerRemise(@PathVariable Integer id, @RequestParam double pourcentage) {
        return produitService.appliquerRemise(id, pourcentage);
    }

    @PutMapping("/{id}/prix")
    public Produit miseAJourPrix(@PathVariable Integer id, @RequestParam double nouveauPrix) {
        return produitService.miseAJourPrix(id, nouveauPrix);
    }
}
