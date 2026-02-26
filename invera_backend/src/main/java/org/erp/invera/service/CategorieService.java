package org.erp.invera.service;

import org.erp.invera.model.Categorie;
import org.erp.invera.repository.CategorieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CategorieService {

    @Autowired
    private CategorieRepository categorieRepository;


    public Categorie save(Categorie categorie) {
        // Vérifier si le nom existe déjà
        if (categorieRepository.findByNomCategorieIgnoreCase(categorie.getNomCategorie()).isPresent()) {
            throw new RuntimeException("Une catégorie avec ce nom existe déjà");
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


    public Categorie update(Integer id, Categorie categorieDetails) {
        Categorie categorie = findById(id);

        // Vérifier si le nouveau nom n'est pas déjà utilisé
        if (!categorie.getNomCategorie().equalsIgnoreCase(categorieDetails.getNomCategorie())) {
            if (categorieRepository.findByNomCategorieIgnoreCase(categorieDetails.getNomCategorie()).isPresent()) {
                throw new RuntimeException("Une catégorie avec ce nom existe déjà");
            }
        }

        categorie.setNomCategorie(categorieDetails.getNomCategorie());
        categorie.setDescription(categorieDetails.getDescription());

        return categorieRepository.save(categorie);
    }


    public void deleteById(Integer id) {
        Categorie categorie = findById(id);

        // Vérifier si la catégorie a des produits associés
        if (categorie.getProduits() != null && !categorie.getProduits().isEmpty()) {
            throw new RuntimeException("Impossible de supprimer cette catégorie car elle contient des produits");
        }

        categorieRepository.delete(categorie);
    }


    public List<Categorie> search(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return findAll();
        }
        return categorieRepository.findByNomCategorieContainingIgnoreCase(keyword);
    }
}