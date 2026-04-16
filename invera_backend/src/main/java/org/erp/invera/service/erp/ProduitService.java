package org.erp.invera.service.erp;

import org.erp.invera.model.erp.Categorie;
import org.erp.invera.model.erp.Fournisseurs.Fournisseur;
import org.erp.invera.model.erp.Produit;
import org.erp.invera.model.erp.stock.StockMovement;
import org.erp.invera.repository.erp.CategorieRepository;
import org.erp.invera.repository.erp.FournisseurRepository;
import org.erp.invera.repository.erp.ProduitRepository;
import org.erp.invera.repository.erp.StockMovementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class ProduitService {

    private final ProduitRepository produitRepository;
    private final CategorieRepository categorieRepository;
    private final FournisseurRepository fournisseurRepository;
    private final StockNotificationService stockNotificationService;
    private final StockMovementRepository stockMovementRepository;

    public ProduitService(ProduitRepository produitRepository,
                          CategorieRepository categorieRepository,
                          FournisseurRepository fournisseurRepository,
                          StockNotificationService stockNotificationService,
                          StockMovementRepository stockMovementRepository) {
        this.produitRepository = produitRepository;
        this.categorieRepository = categorieRepository;
        this.fournisseurRepository = fournisseurRepository;
        this.stockNotificationService = stockNotificationService;
        this.stockMovementRepository = stockMovementRepository;
    }

    /**
     * Créer un nouveau produit avec son fournisseur
     */
    @Transactional
    public Produit createProduit(Produit produit, Integer fournisseurId, BigDecimal prixAchat) {
        // 1. Gérer la catégorie
        if (produit.getCategorie() != null && produit.getCategorie().getIdCategorie() != null) {
            Categorie categorie = categorieRepository.findById(produit.getCategorie().getIdCategorie())
                    .orElseThrow(() -> new RuntimeException(
                            "Categorie non trouvée avec l'id: " + produit.getCategorie().getIdCategorie()
                    ));
            produit.setCategorie(categorie);
        }

        // 2. Gérer le fournisseur
        if (fournisseurId != null) {
            Fournisseur fournisseur = fournisseurRepository.findById(fournisseurId)
                    .orElseThrow(() -> new RuntimeException("Fournisseur non trouvé avec l'id: " + fournisseurId));
            produit.setFournisseur(fournisseur);
        }

        // 3. Définir le prix d'achat
        produit.setPrixAchat(prixAchat != null ? prixAchat : BigDecimal.ZERO);

        // 4. Initialiser le stock à 0 pour les nouveaux produits
        if (produit.getQuantiteStock() == null) {
            produit.setQuantiteStock(0);
        }

        // 5. Mettre à jour le statut du stock
        updateStockStatus(produit);

        // 6. Sauvegarder le produit
        Produit savedProduit = produitRepository.save(produit);

        // 7. Créer le mouvement de stock initial (si stock > 0)
        if (savedProduit.getQuantiteStock() != null && savedProduit.getQuantiteStock() > 0) {
            StockMovement movement = new StockMovement();
            movement.setProduit(savedProduit);
            movement.setTypeMouvement(StockMovement.MovementType.INIT_STOCK);
            movement.setQuantite(savedProduit.getQuantiteStock());
            movement.setStockAvant(0);
            movement.setStockApres(savedProduit.getQuantiteStock());
            movement.setPrixUnitaire(prixAchat != null ? prixAchat : BigDecimal.ZERO);
            movement.setValeurTotale((prixAchat != null ? prixAchat : BigDecimal.ZERO)
                    .multiply(BigDecimal.valueOf(savedProduit.getQuantiteStock())));
            movement.setTypeDocument("INIT_STOCK");
            movement.setCommentaire("Stock initial à la création du produit");
            movement.setDateMouvement(LocalDateTime.now());
            stockMovementRepository.save(movement);
        }

        return savedProduit;
    }

    /**
     * Récupérer tous les produits
     */
    public List<Produit> getAllProduits() {
        return produitRepository.findAll();
    }

    /**
     * Récupérer les produits actifs
     */
    public List<Produit> getProduitsActifs() {
        return produitRepository.findByActiveTrue();
    }

    /**
     * Récupérer un produit par son ID avec son fournisseur
     */
    @Transactional(readOnly = true)
    public Produit getProduitByIdWithFournisseur(Integer id) {
        return produitRepository.findByIdWithFournisseur(id)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'id: " + id));
    }

    /**
     * Récupérer un produit par son ID (version existante)
     */
    public Optional<Produit> getProduitById(Integer id) {
        return produitRepository.findById(id);
    }

    /**
     * Mettre à jour un produit
     */
    @Transactional
    public Produit updateProduit(Integer id, Produit produitDetails, Integer fournisseurId, BigDecimal prixAchat) {
        return produitRepository.findById(id)
                .map(produit -> {
                    Integer previousQuantity = produit.getQuantiteStock();

                    // Mise à jour des champs
                    if (produitDetails.getLibelle() != null) {
                        produit.setLibelle(produitDetails.getLibelle());
                    }
                    if (produitDetails.getPrixVente() != null) {
                        produit.setPrixVente(produitDetails.getPrixVente());
                    }
                    if (prixAchat != null) {
                        produit.setPrixAchat(prixAchat);
                    }
                    if (produitDetails.getImageUrl() != null) {
                        produit.setImageUrl(produitDetails.getImageUrl());
                    }
                    if (produitDetails.getRemiseTemporaire() != null) {
                        produit.setRemiseTemporaire(produitDetails.getRemiseTemporaire());
                    }
                    if (produitDetails.getSeuilMinimum() != null) {
                        produit.setSeuilMinimum(produitDetails.getSeuilMinimum());
                    }
                    if (produitDetails.getUniteMesure() != null) {
                        produit.setUniteMesure(produitDetails.getUniteMesure());
                    }
                    if (produitDetails.getQuantiteStock() != null) {
                        produit.setQuantiteStock(produitDetails.getQuantiteStock());
                    }

                    // Mise à jour de la catégorie
                    if (produitDetails.getCategorie() != null && produitDetails.getCategorie().getIdCategorie() != null) {
                        Categorie categorie = categorieRepository.findById(produitDetails.getCategorie().getIdCategorie())
                                .orElseThrow(() -> new RuntimeException(
                                        "Categorie non trouvée avec l'id: " + produitDetails.getCategorie().getIdCategorie()
                                ));
                        produit.setCategorie(categorie);
                    }

                    // Mise à jour du fournisseur
                    if (fournisseurId != null) {
                        Fournisseur fournisseur = fournisseurRepository.findById(fournisseurId)
                                .orElseThrow(() -> new RuntimeException("Fournisseur non trouvé avec l'id: " + fournisseurId));
                        produit.setFournisseur(fournisseur);
                    }

                    // Mise à jour du statut du stock
                    updateStockStatus(produit);

                    Produit savedProduit = produitRepository.save(produit);

                    // Notification si besoin de réapprovisionnement
                    stockNotificationService.notifyIfStockNeedsReorder(
                            savedProduit,
                            previousQuantity,
                            savedProduit.getQuantiteStock()
                    );

                    return savedProduit;
                })
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'id: " + id));
    }

    /**
     * Mettre à jour un produit (sans modifier le fournisseur)
     */
    @Transactional
    public Produit updateProduit(Integer id, Produit produitDetails) {
        return updateProduit(id, produitDetails, null, null);
    }

    /**
     * Désactiver un produit
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
     * Rechercher des produits
     */
    public List<Produit> searchProduits(String keyword, Produit.StockStatus status, Integer categorieId, Boolean actif) {
        String statusStr = status != null ? status.name() : null;
        // ✅ Pas besoin de forcer le chargement
        return produitRepository.searchProduits(keyword, statusStr, categorieId, actif);
    }

    /**
     * Récupérer les produits par catégorie
     */
    public List<Produit> getProduitsByCategorie(Integer categorieId) {
        Categorie categorie = categorieRepository.findById(categorieId)
                .orElseThrow(() -> new RuntimeException("Categorie non trouvée avec l'id: " + categorieId));
        return produitRepository.findByCategorieAndActiveTrue(categorie);
    }

    /**
     * Récupérer les produits d'un fournisseur spécifique
     */
    public List<Produit> getProduitsByFournisseur(Integer fournisseurId) {
        return produitRepository.findByFournisseur_IdFournisseur(fournisseurId);
    }

    /**
     * Récupérer les produits avec stock faible
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
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'id: " + id));
    }

    /**
     * Vérifier la disponibilité d'un produit
     */
    public boolean verifierDisponibilite(Integer produitId, Integer quantiteDemandee) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'id: " + produitId));

        return produit.getActive() && produit.getQuantiteStock() >= quantiteDemandee;
    }

    /**
     * Mettre à jour le statut du stock
     */
    public void updateStockStatus(Produit produit) {
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