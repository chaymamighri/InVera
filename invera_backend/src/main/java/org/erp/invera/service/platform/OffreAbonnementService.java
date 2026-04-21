package org.erp.invera.service.platform;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.platform.abonnementdto.OffreAbonnementRequest;
import org.erp.invera.dto.platform.abonnementdto.OffreAbonnementResponse;
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
        List<OffreAbonnement> offres = activeOnly
                ? offreAbonnementRepository.findByDeletedFalseAndActiveTrueOrderByPrixAsc()
                : offreAbonnementRepository.findByDeletedFalseOrderByCreatedAtDesc();

        return offres.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public OffreAbonnementResponse getOfferById(Long id) {
        return toResponse(getEntityById(id));
    }

    @Transactional
    public OffreAbonnementResponse createOffer(OffreAbonnementRequest request) {
        validateRequest(request, null);

        OffreAbonnement offre = OffreAbonnement.builder()
                .nom(request.getNom().trim())
                .typeOffre(request.getTypeOffre())
                .dureeMois(request.getDureeMois())
                .prix(request.getPrix())
                .devise(normalizeDevise(request.getDevise()))
                .description(normalizeDescription(request.getDescription()))
                .active(request.getActive() == null || request.getActive())
                .deleted(false)
                .build();

        return toResponse(offreAbonnementRepository.save(offre));
    }

    @Transactional
    public OffreAbonnementResponse updateOffer(Long id, OffreAbonnementRequest request) {
        OffreAbonnement offre = getEntityById(id);
        validateRequest(request, id);

        offre.setNom(request.getNom().trim());
        offre.setTypeOffre(request.getTypeOffre());
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
        offre.setActive(false);
        return toResponse(offreAbonnementRepository.save(offre));
    }

    @Transactional
    public OffreAbonnementResponse softDeleteOffer(Long id) {
        OffreAbonnement offre = getEntityById(id);
        offre.setActive(false);
        offre.setDeleted(true);
        return toResponse(offreAbonnementRepository.save(offre));
    }

    @Transactional(readOnly = true)
    public OffreAbonnement getEntityById(Long id) {
        return offreAbonnementRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Offre d'abonnement non trouvee"));
    }

    @Transactional(readOnly = true)
    public OffreAbonnement getAvailableOfferEntityById(Long id) {
        OffreAbonnement offre = getEntityById(id);
        if (!Boolean.TRUE.equals(offre.getActive())) {
            throw new RuntimeException("Cette offre est desactivee et ne peut plus etre attribuee");
        }
        return offre;
    }

    private void validateRequest(OffreAbonnementRequest request, Long currentId) {
        if (request.getNom() == null || request.getNom().trim().length() < 2) {
            throw new RuntimeException("Le nom de l'offre est requis");
        }
        if (request.getTypeOffre() == null) {
            throw new RuntimeException("Le type d'offre est requis");
        }
        if (request.getDureeMois() == null || request.getDureeMois() <= 0) {
            throw new RuntimeException("La duree en mois doit etre superieure a zero");
        }
        if (request.getPrix() == null || request.getPrix() <= 0) {
            throw new RuntimeException("Le prix doit etre superieur a zero");
        }

        boolean duplicate = offreAbonnementRepository
                .existsByNomIgnoreCaseAndTypeOffreAndDureeMoisAndDeletedFalse(
                        request.getNom().trim(),
                        request.getTypeOffre(),
                        request.getDureeMois()
                );

        if (duplicate && currentId == null) {
            throw new RuntimeException("Une offre avec ce nom, type et duree existe deja");
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

    private String formatDurationLabel(Integer dureeMois) {
        if (dureeMois == null) {
            return null;
        }
        return dureeMois == 1 ? "1 mois" : dureeMois + " mois";
    }

    private OffreAbonnementResponse toResponse(OffreAbonnement offre) {
        String durationLabel = formatDurationLabel(offre.getDureeMois());
        return OffreAbonnementResponse.builder()
                .id(offre.getId())
                .nom(offre.getNom())
                .typeOffre(offre.getTypeOffre().name())
                .typeOffreLabel(offre.getTypeOffre().getLabel())
                .duree(durationLabel)
                .dureeLabel(durationLabel)
                .dureeMois(offre.getDureeMois())
                .prix(offre.getPrix())
                .devise(offre.getDevise())
                .description(offre.getDescription())
                .active(offre.getActive())
                .deleted(offre.getDeleted())
                .createdAt(offre.getCreatedAt())
                .updatedAt(offre.getUpdatedAt())
                .abonnementsAssocies(abonnementRepository.countByOffreAbonnementId(offre.getId()))
                .build();
    }
}
