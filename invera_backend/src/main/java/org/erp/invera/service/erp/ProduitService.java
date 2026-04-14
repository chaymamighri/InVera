package org.erp.invera.service.erp;

import org.erp.invera.model.erp.Categorie;
import org.erp.invera.model.erp.Produit;
import org.erp.invera.model.erp.stock.StockMovement;
import org.erp.invera.repository.erp.CategorieRepository;
import org.erp.invera.repository.erp.ProduitRepository;
import org.erp.invera.repository.erp.StockMovementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service de gestion des produits.
 *
 * Ce fichier gère tout ce qui concerne les produits :
 * - Création, modification, suppression (désactivation)
 * - Gestion du stock (quantités, seuils d'alerte)
 * - Recherche et filtrage (par catégorie, statut, mot-clé)
 * - Vérification de disponibilité
 * - Mise à jour automatique du statut (EN_STOCK, FAIBLE, CRITIQUE, RUPTURE)
 * - Création d'un mouvement de stock initial à la création
 * - Déclenchement de notifications quand le stock devient critique
 */
@Service
@Transactional
public class ProduitService {

    private final ProduitRepository produitRepository;
    private final CategorieRepository categorieRepository;
    private final StockNotificationService stockNotificationService;
    private final StockMovementRepository stockMovementRepository;


    public ProduitService(ProduitRepository produitRepository,
                          CategorieRepository categorieRepository,
                          StockNotificationService stockNotificationService,
                          StockMovementRepository stockMovementRepository) {
        this.produitRepository = produitRepository;
        this.categorieRepository = categorieRepository;
        this.stockNotificationService = stockNotificationService;
        this.stockMovementRepository = stockMovementRepository;
    }

    public Produit createProduit(Produit produit) {
        if (produit.getCategorie() != null && produit.getCategorie().getIdCategorie() != null) {
            Categorie categorie = categorieRepository.findById(produit.getCategorie().getIdCategorie())
                    .orElseThrow(() -> new RuntimeException(
                            "Categorie non trouvee avec l'id: " + produit.getCategorie().getIdCategorie()
                    ));
            produit.setCategorie(categorie);
        }

        updateStockStatus(produit);
        Produit savedProduit = produitRepository.save(produit);

        // ✅ Créer le mouvement de stock initial
        if (savedProduit.getQuantiteStock() != null && savedProduit.getQuantiteStock() > 0) {
            StockMovement movement = new StockMovement();
            movement.setProduit(savedProduit);
            movement.setTypeMouvement(StockMovement.MovementType.INIT_STOCK);
            movement.setQuantite(savedProduit.getQuantiteStock());
            movement.setStockAvant(0);
            movement.setStockApres(savedProduit.getQuantiteStock());
            movement.setTypeDocument("init_stock");
            movement.setCommentaire("Stock initial à la création du produit");
            movement.setDateMouvement(LocalDateTime.now());
            stockMovementRepository.save(movement);
        }

        return savedProduit;
    }

    public List<Produit> getAllProduits() {
        return produitRepository.findAll();
    }

    public List<Produit> getProduitsActifs() {
        return produitRepository.findByActiveTrue();
    }

    public Optional<Produit> getProduitById(Integer id) {
        return produitRepository.findById(id);
    }

    public Produit updateProduit(Integer id, Produit produitDetails) {
        return produitRepository.findById(id)
                .map(produit -> {
                    Integer previousQuantity = produit.getQuantiteStock();

                    if (produitDetails.getLibelle() != null) {
                        produit.setLibelle(produitDetails.getLibelle());
                    }

                    if (produitDetails.getPrixVente() != null) {
                        produit.setPrixVente(produitDetails.getPrixVente());
                    }

                    if (produitDetails.getPrixAchat() != null) {
                        produit.setPrixAchat(produitDetails.getPrixAchat());
                    }

                    if (produitDetails.getCategorie() != null && produitDetails.getCategorie().getIdCategorie() != null) {
                        Categorie categorie = categorieRepository.findById(produitDetails.getCategorie().getIdCategorie())
                                .orElseThrow(() -> new RuntimeException(
                                        "Categorie non trouvee avec l'id: "
                                                + produitDetails.getCategorie().getIdCategorie()
                                ));
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

                    updateStockStatus(produit);

                    Produit savedProduit = produitRepository.save(produit);
                    stockNotificationService.notifyIfStockNeedsReorder(
                            savedProduit,
                            previousQuantity,
                            savedProduit.getQuantiteStock()
                    );
                    return savedProduit;
                })
                .orElseThrow(() -> new RuntimeException("Produit non trouve avec l'id: " + id));
    }

    public void desactiverProduit(Integer id) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit non trouve avec l'id: " + id));

        produit.setActive(false);
        produitRepository.save(produit);
    }

    public Produit reactiverProduit(Integer id) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit non trouve avec l'id: " + id));

        produit.setActive(true);
        return produitRepository.save(produit);
    }

    public List<Produit> searchProduits(String keyword, Produit.StockStatus status, Integer categorieId, Boolean actif) {
        String statusStr = status != null ? status.name() : null;
        return produitRepository.searchProduits(keyword, statusStr, categorieId, actif);
    }

    public List<Produit> getProduitsByCategorie(Integer categorieId) {
        Categorie categorie = categorieRepository.findById(categorieId)
                .orElseThrow(() -> new RuntimeException("Categorie non trouvee avec l'id: " + categorieId));
        return produitRepository.findByCategorieAndActiveTrue(categorie);
    }

    public List<Produit> getLowStockProduits() {
        return produitRepository.findByStatusInAndActiveTrue(
                List.of(Produit.StockStatus.FAIBLE, Produit.StockStatus.CRITIQUE)
        );
    }

    public Produit updateStock(Integer id, Integer nouvelleQuantite) {
        return produitRepository.findById(id)
                .map(produit -> {
                    Integer previousQuantity = produit.getQuantiteStock();
                    produit.setQuantiteStock(nouvelleQuantite);
                    updateStockStatus(produit);

                    Produit savedProduit = produitRepository.save(produit);
                    stockNotificationService.notifyIfStockNeedsReorder(
                            savedProduit,
                            previousQuantity,
                            savedProduit.getQuantiteStock()
                    );
                    return savedProduit;
                })
                .orElseThrow(() -> new RuntimeException("Produit non trouve avec l'id: " + id));
    }

    public boolean verifierDisponibilite(Integer produitId, Integer quantiteDemandee) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit non trouve avec l'id: " + produitId));

        return produit.getActive() && produit.getQuantiteStock() >= quantiteDemandee;
    }

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
