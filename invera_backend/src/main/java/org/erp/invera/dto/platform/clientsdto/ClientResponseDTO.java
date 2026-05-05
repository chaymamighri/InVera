package org.erp.invera.dto.platform.clientsdto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientResponseDTO {
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private String raisonSociale;
    private String matriculeFiscal;
    private String typeCompte;
    private String typeInscription;
    private String statut;
    private LocalDateTime dateInscription;
    private LocalDateTime createdAt;
    private String motifRefus;
    private String cinUrl;
    private String gerantCinUrl;
    private String patenteUrl;
    private String rneUrl;
    private Map<String, Object> offreDemande;
    private Boolean isActive;
    private Integer connexionsRestantes;
    private Integer connexionsMax;
}