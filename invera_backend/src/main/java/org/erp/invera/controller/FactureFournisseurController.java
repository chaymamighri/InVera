/*package org.erp.invera.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.FactureFournisseurDTO.FactureDetailDTO;
import org.erp.invera.dto.FactureFournisseurDTO.FactureGenerationDTO;
import org.erp.invera.dto.FactureFournisseurDTO.FactureListeDTO;
import org.erp.invera.dto.FactureFournisseurDTO.FactureStatutDTO;
import org.erp.invera.model.Fournisseurs.FactureFournisseur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;*/

/**
 * Contrôleur des factures fournisseurs.
 *
 * Endpoints :
 * - POST   /generer/{commandeId}           → Générer une facture à partir d'une commande réceptionnée
 * - GET    /exporter/{factureId}           → Télécharger le PDF de la facture
 * - GET    /liste                          → Liste paginée des factures (sans détails)
 * - GET    /{factureId}                    → Détail complet d'une facture (avec lignes)
 * - PATCH  /{factureId}/statut?statut=...  → Mettre à jour le statut de paiement (PAYE/NON_PAYE)
 */
/*@RestController
@RequestMapping("/api/facture-fournisseur")
@RequiredArgsConstructor
@Slf4j
public class FactureFournisseurController {

    private final FactureFournisseurService factureService;

    @PostMapping("/generer/{commandeId}")
    public ResponseEntity<FactureGenerationDTO> generer(@PathVariable Integer commandeId) {
        return ResponseEntity.ok(factureService.genererEtSauvegarderFacture(commandeId));
    }

    @GetMapping("/exporter/{factureId}")
    public ResponseEntity<byte[]> exporter(@PathVariable Integer factureId) {
        byte[] pdfBytes = factureService.exporterPDF(factureId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=facture_" + factureId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    @GetMapping("/liste")
    public ResponseEntity<Page<FactureListeDTO>> liste(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dateFacture"));
        return ResponseEntity.ok(factureService.getAllFacturesListe(pageRequest));
    }

    @GetMapping("/{factureId}")
    public ResponseEntity<FactureDetailDTO> getById(@PathVariable Integer factureId) {
        return ResponseEntity.ok(factureService.getFactureById(factureId));
    }

    @PatchMapping("/{factureId}/statut")
    public ResponseEntity<FactureStatutDTO> updateStatut(
            @PathVariable Integer factureId,
            @RequestParam FactureFournisseur.StatutFacture statut) {
        return ResponseEntity.ok(factureService.updateStatutPaiement(factureId, statut));
    }
}*/