package org.erp.invera.service;

import org.erp.invera.model.Categorie;
import org.erp.invera.repository.CategorieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class CategorieService {

    private static final BigDecimal DEFAULT_TAUX_TVA = BigDecimal.valueOf(19);

    @Autowired
    private CategorieRepository categorieRepository;

    public Categorie save(Categorie categorie) {
        // Vérifier si le nom existe déjà
        if (categorieRepository.findByNomCategorieIgnoreCase(categorie.getNomCategorie()).isPresent()) {
            throw new RuntimeException("Une catégorie avec ce nom existe déjà");
        }

        // Appliquer le taux TVA par défaut si non fourni
        if (categorie.getTauxTVA() == null) {
            categorie.setTauxTVA(DEFAULT_TAUX_TVA);
        }

        // Nettoyer les données
        categorie.setNomCategorie(categorie.getNomCategorie().trim());
        if (categorie.getDescription() != null) {
            categorie.setDescription(categorie.getDescription().trim());
        }

        return categorieRepository.save(categorie);
    }

    public List<Categorie> findAll() {
        return categorieRepository.findAllByOrderByNomCategorieAsc();
    }

    public Categorie findById(Integer id) {
        return categorieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Catégorie non trouvée avec l'ID: " + id));
    }

    public void deleteById(Integer id) {
        Categorie categorie = findById(id);

        // Vérifier si la catégorie a des produits associés
        if (categorie.getProduits() != null && !categorie.getProduits().isEmpty()) {
            throw new RuntimeException("Impossible de supprimer cette catégorie car elle contient des produits");
        }

        categorieRepository.delete(categorie);
    }

    // MÉTHODE UPDATE AJOUTÉE
    public Categorie update(Integer id, Categorie categorieDetails) {
        // Récupérer la catégorie existante
        Categorie existingCategorie = findById(id);

        // Vérifier si le nouveau nom n'est pas déjà utilisé par une autre catégorie
        if (!existingCategorie.getNomCategorie().equalsIgnoreCase(categorieDetails.getNomCategorie()) &&
                categorieRepository.findByNomCategorieIgnoreCase(categorieDetails.getNomCategorie()).isPresent()) {
            throw new RuntimeException("Une catégorie avec ce nom existe déjà");
        }

        // Mettre à jour les champs
        existingCategorie.setNomCategorie(categorieDetails.getNomCategorie().trim());

        if (categorieDetails.getDescription() != null) {
            existingCategorie.setDescription(categorieDetails.getDescription().trim());
        } else {
            existingCategorie.setDescription(null);
        }

        // Mettre à jour le taux TVA (si null, garder l'ancien)
        if (categorieDetails.getTauxTVA() != null) {
            existingCategorie.setTauxTVA(categorieDetails.getTauxTVA());
        }

        return categorieRepository.save(existingCategorie);
    }


    public List<Categorie> search(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return findAll();
        }
        return categorieRepository.findByNomCategorieContainingIgnoreCase(keyword);
    }
}