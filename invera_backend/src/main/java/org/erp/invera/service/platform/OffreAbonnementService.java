package org.erp.invera.service.platform;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.platform.abonnementdto.OffreAbonnementRequest;
import org.erp.invera.dto.platform.abonnementdto.OffreAbonnementResponse;
import org.erp.invera.model.platform.Abonnement;
import org.erp.invera.model.platform.OffreAbonnement;
import org.erp.invera.repository.platform.AbonnementRepository;
import org.erp.invera.repository.platform.OffreAbonnementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OffreAbonnementService {

    private final OffreAbonnementRepository offreAbonnementRepository;
    private final AbonnementRepository abonnementRepository;

    @Transactional(readOnly = true)
    public List<OffreAbonnementResponse> getAllOffers(boolean activeOnly) {
        List<OffreAbonnement> offres;
        if (activeOnly) {
            offres = offreAbonnementRepository.findByActiveTrueOrderByPrixAsc();
        } else {
            offres = offreAbonnementRepository.findAllByOrderByCreatedAtDesc();
        }
        return offres.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public OffreAbonnementResponse getOfferById(Long id) {
        return toResponse(getEntityById(id));
    }

    @Transactional
    public OffreAbonnementResponse createOffer(OffreAbonnementRequest request) {
        validateRequest(request, null);

        if (offreAbonnementRepository.existsByNomIgnoreCase(request.getNom().trim())) {
            throw new RuntimeException("Une offre avec ce nom existe déjà");
        }

        OffreAbonnement offre = OffreAbonnement.builder()
                .nom(request.getNom().trim())
                .dureeMois(request.getDureeMois())
                .prix(request.getPrix())
                .devise(normalizeDevise(request.getDevise()))
                .description(normalizeDescription(request.getDescription()))
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        return toResponse(offreAbonnementRepository.save(offre));
    }

    @Transactional
    public OffreAbonnementResponse updateOffer(Long id, OffreAbonnementRequest request) {
        OffreAbonnement offre = getEntityById(id);
        validateRequest(request, id);

        if (offreAbonnementRepository.existsByNomIgnoreCaseAndIdNot(request.getNom().trim(), id)) {
            throw new RuntimeException("Une autre offre avec ce nom existe déjà");
        }

        offre.setNom(request.getNom().trim());
        offre.setDureeMois(request.getDureeMois());
        offre.setPrix(request.getPrix());
        offre.setDevise(normalizeDevise(request.getDevise()));
        offre.setDescription(normalizeDescription(request.getDescription()));
        if (request.getActive() != null) {
            offre.setActive(request.getActive());
        }

        return toResponse(offreAbonnementRepository.save(offre));
    }

    @Transactional
    public OffreAbonnementResponse activateOffer(Long id) {
        OffreAbonnement offre = getEntityById(id);
        offre.setActive(true);
        return toResponse(offreAbonnementRepository.save(offre));
    }

    @Transactional
    public OffreAbonnementResponse deactivateOffer(Long id) {
        OffreAbonnement offre = getEntityById(id);

        boolean hasActiveSubscriptions = abonnementRepository.existsByOffreAbonnementIdAndStatut(
                id, Abonnement.StatutAbonnement.ACTIF
        );

        if (hasActiveSubscriptions) {
            throw new RuntimeException("Impossible de désactiver : des clients ont un abonnement actif avec cette offre");
        }

        offre.setActive(false);
        return toResponse(offreAbonnementRepository.save(offre));
    }

    @Transactional(readOnly = true)
    public OffreAbonnement getEntityById(Long id) {
        return offreAbonnementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offre d'abonnement non trouvée"));
    }

    @Transactional(readOnly = true)
    public OffreAbonnement getAvailableOfferEntityById(Long id) {
        OffreAbonnement offre = getEntityById(id);
        if (!Boolean.TRUE.equals(offre.getActive())) {
            throw new RuntimeException("Cette offre est désactivée et ne peut plus être attribuée");
        }
        return offre;
    }

    private void validateRequest(OffreAbonnementRequest request, Long currentId) {
        if (request.getNom() == null || request.getNom().trim().length() < 2) {
            throw new RuntimeException("Le nom de l'offre est requis (minimum 2 caractères)");
        }
        if (request.getDureeMois() == null || request.getDureeMois() < 1) {
            throw new RuntimeException("La durée en mois doit être supérieure à 0");
        }
        if (request.getDureeMois() > 36) {
            throw new RuntimeException("La durée ne peut pas dépasser 36 mois");
        }
        if (request.getPrix() == null || request.getPrix() < 0) {
            throw new RuntimeException("Le prix ne peut pas être négatif");
        }
    }

    private String normalizeDevise(String devise) {
        if (devise == null || devise.isBlank()) {
            return "TND";
        }
        return devise.trim().toUpperCase();
    }

    private String normalizeDescription(String description) {
        if (description == null || description.isBlank()) {
            return null;
        }
        return description.trim();
    }

    private OffreAbonnementResponse toResponse(OffreAbonnement offre) {
        Integer dureeMois = offre.getDureeMois() != null ? offre.getDureeMois() : 0;
        String duree = dureeMois == 1 ? "1 mois" : dureeMois + " mois";

        return OffreAbonnementResponse.builder()
                .id(offre.getId())
                .nom(offre.getNom())
                .dureeMois(dureeMois)
                .duree(duree)
                .prix(offre.getPrix())
                .devise(offre.getDevise())
                .description(offre.getDescription())
                .active(offre.getActive())
                .createdAt(offre.getCreatedAt())
                .updatedAt(offre.getUpdatedAt())
                .abonnementsAssocies(abonnementRepository.countByOffreAbonnementId(offre.getId()))
                .build();
    }
}