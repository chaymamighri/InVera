package org.erp.invera.dto.platform.abonnementdto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AbonnementResponse {
    private Long id;
    private Long clientId;
    private String clientNom;
    private String clientEmail;
    private Long offreId;
    private String offreNom;
    private String duree;
    private Integer dureeMois;
    private Double montant;
    private String devise;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private String statut;

    // ✅ Nouveaux champs
    private String motifAction;
    private LocalDateTime dateDerniereAction;
}