package org.erp.invera.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.fournisseurdto.FournisseurDTO;
import org.erp.invera.model.Fournisseurs.Fournisseur;
import org.erp.invera.repository.FournisseurRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FournisseurServices {

    private final FournisseurRepository fournisseurRepository;

    /**
     * Récupère tous les fournisseurs (y compris inactifs)
     */
    @Transactional(readOnly = true)
    public List<FournisseurDTO> getAllFournisseurs() {
        log.info("Récupération de tous les fournisseurs");
        return fournisseurRepository.findAll()
                .stream()
                .map(FournisseurDTO::new)
                .toList();
    }

    /**
     * Récupère uniquement les fournisseurs actifs
     */
    @Transactional(readOnly = true)
    public List<FournisseurDTO> getActiveFournisseurs() {
        log.info("Récupération des fournisseurs actifs");
        return fournisseurRepository.findByActifTrue()
                .stream()
                .map(FournisseurDTO::new)
                .toList();
    }


    /**
     * Récupère uniquement les fournisseurs inactifs (soft delete)
     */
    @Transactional(readOnly = true)
    public List<FournisseurDTO> getInactiveFournisseurs() {
        log.info("Récupération des fournisseurs inactifs");
        return fournisseurRepository.findByActifFalse()
                .stream()
                .map(FournisseurDTO::new)
                .toList();
    }


    /**
     * Récupère un fournisseur par son ID (vérifie s'il est actif)
     */
    @Transactional(readOnly = true)
    public FournisseurDTO getFournisseurById(Integer id) {
        log.info("Récupération du fournisseur avec l'id: {}", id);
        Fournisseur fournisseur = fournisseurRepository.findByIdFournisseurAndActifTrue(id)
                .orElseThrow(() -> new RuntimeException(
                        String.format("Fournisseur actif non trouvé avec l'id: %d", id)));
        return new FournisseurDTO(fournisseur);
    }

    /**
     * Récupère un fournisseur par son ID (même si inactif - pour admin)
     */
    @Transactional(readOnly = true)
    public FournisseurDTO getFournisseurByIdAdmin(Integer id) {
        log.info("Récupération admin du fournisseur avec l'id: {}", id);
        Fournisseur fournisseur = fournisseurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        String.format("Fournisseur non trouvé avec l'id: %d", id)));
        return new FournisseurDTO(fournisseur);
    }

    /**
     * Crée un nouveau fournisseur avec paramètres individuels
     */
    public FournisseurDTO createFournisseur(
            String nomFournisseur,
            String email,
            String adresse,
            String telephone,
            String ville,
            String pays) {

        log.info("Création d'un nouveau fournisseur: {}", nomFournisseur);

        // Vérifier si l'email existe déjà
        if (email != null && !email.isEmpty()) {
            fournisseurRepository.findByEmail(email)
                    .ifPresent(f -> {
                        throw new RuntimeException(
                                String.format("Un fournisseur avec l'email '%s' existe déjà", email));
                    });
        }

        Fournisseur fournisseur = new Fournisseur();
        fournisseur.setNomFournisseur(nomFournisseur);
        fournisseur.setEmail(email);
        fournisseur.setAdresse(adresse);
        fournisseur.setTelephone(telephone);
        fournisseur.setVille(ville);
        fournisseur.setPays(pays);
        fournisseur.setActif(true);

        Fournisseur saved = fournisseurRepository.save(fournisseur);
        log.info("Fournisseur créé avec succès, id: {}", saved.getIdFournisseur());
        return new FournisseurDTO(saved);
    }

    /**
     * Met à jour un fournisseur existant avec paramètres individuels
     */
    public FournisseurDTO updateFournisseur(
            Integer id,
            String nomFournisseur,
            String email,
            String adresse,
            String telephone,
            String ville,
            String pays,
            Boolean actif) {

        log.info("Mise à jour du fournisseur avec l'id: {}", id);

        Fournisseur fournisseur = fournisseurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        String.format("Fournisseur non trouvé avec l'id: %d", id)));

        // Vérifier si l'email est modifié et n'existe pas déjà
        if (email != null && !email.isEmpty() && !email.equals(fournisseur.getEmail())) {
            fournisseurRepository.findByEmail(email)
                    .ifPresent(f -> {
                        if (!f.getIdFournisseur().equals(id)) {
                            throw new RuntimeException(
                                    String.format("Un autre fournisseur avec l'email '%s' existe déjà", email));
                        }
                    });
        }

        // Mise à jour des champs
        if (nomFournisseur != null) fournisseur.setNomFournisseur(nomFournisseur);
        if (email != null) fournisseur.setEmail(email);
        if (adresse != null) fournisseur.setAdresse(adresse);
        if (telephone != null) fournisseur.setTelephone(telephone);
        if (ville != null) fournisseur.setVille(ville);
        if (pays != null) fournisseur.setPays(pays);
        if (actif != null) fournisseur.setActif(actif);

        Fournisseur updated = fournisseurRepository.save(fournisseur);
        log.info("Fournisseur mis à jour avec succès");
        return new FournisseurDTO(updated);
    }

    /**
     * Soft delete - Désactive un fournisseur
     */
    public void softDeleteFournisseur(Integer id) {
        log.info("Soft delete (désactivation) du fournisseur avec l'id: {}", id);

        Fournisseur fournisseur = fournisseurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        String.format("Fournisseur non trouvé avec l'id: %d", id)));

        if (!fournisseur.getActif()) {
            throw new RuntimeException("Le fournisseur est déjà désactivé");
        }

        fournisseur.setActif(false);
        fournisseurRepository.save(fournisseur);
        log.info("Fournisseur désactivé avec succès");
    }

    /**
     * Hard delete - Suppression physique (réservé admin)
     */
    public void hardDeleteFournisseur(Integer id) {
        log.warn("⚠️ HARD DELETE du fournisseur avec l'id: {} - Action réservée admin", id);

        Fournisseur fournisseur = fournisseurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        String.format("Fournisseur non trouvé avec l'id: %d", id)));

        fournisseurRepository.delete(fournisseur);
        log.warn("Fournisseur supprimé définitivement");
    }

    /**
     * Réactive un fournisseur désactivé
     */
    public FournisseurDTO reactivateFournisseur(Integer id) {
        log.info("Réactivation du fournisseur avec l'id: {}", id);

        Fournisseur fournisseur = fournisseurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        String.format("Fournisseur non trouvé avec l'id: %d", id)));

        if (fournisseur.getActif()) {
            throw new RuntimeException("Le fournisseur est déjà actif");
        }

        fournisseur.setActif(true);
        Fournisseur reactivated = fournisseurRepository.save(fournisseur);
        log.info("Fournisseur réactivé avec succès");

        return new FournisseurDTO(reactivated);
    }

    /**
     * Recherche paginée des fournisseurs actifs
     */
    @Transactional(readOnly = true)
    public Page<FournisseurDTO> searchActiveFournisseurs(String searchTerm, Pageable pageable) {
        log.info("Recherche de fournisseurs actifs avec le terme: '{}'", searchTerm);
        return fournisseurRepository.searchActive(searchTerm, pageable)
                .map(FournisseurDTO::new);
    }

    /**
     * Recherche paginée de tous les fournisseurs (admin)
     */
    @Transactional(readOnly = true)
    public Page<FournisseurDTO> searchAllFournisseurs(String searchTerm, Pageable pageable) {
        log.info("Recherche admin de fournisseurs avec le terme: '{}'", searchTerm);
        return fournisseurRepository.searchAll(searchTerm, pageable)
                .map(FournisseurDTO::new);
    }

    /**
     * Récupère les statistiques des fournisseurs
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        log.info("Récupération des statistiques des fournisseurs");

        Map<String, Object> stats = new HashMap<>();

        long total = fournisseurRepository.count();
        long actifs = fournisseurRepository.countActive();
        long inactifs = total - actifs;

        stats.put("total", total);
        stats.put("actifs", actifs);
        stats.put("inactifs", inactifs);

        // Statistiques par ville
        List<Object[]> villeStats = fournisseurRepository.countByVille();
        Map<String, Long> villeMap = new HashMap<>();
        for (Object[] row : villeStats) {
            villeMap.put((String) row[0], (Long) row[1]);
        }
        stats.put("parVille", villeMap);

        // Statistiques par pays
        List<Object[]> paysStats = fournisseurRepository.countByPays();
        Map<String, Long> paysMap = new HashMap<>();
        for (Object[] row : paysStats) {
            paysMap.put((String) row[0], (Long) row[1]);
        }
        stats.put("parPays", paysMap);

        return stats;
    }
}