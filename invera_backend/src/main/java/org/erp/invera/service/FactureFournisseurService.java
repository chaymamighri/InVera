package org.erp.invera.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.FactureFournisseurDTO.FactureDetailDTO;
import org.erp.invera.dto.FactureFournisseurDTO.FactureGenerationDTO;
import org.erp.invera.dto.FactureFournisseurDTO.FactureListeDTO;
import org.erp.invera.dto.FactureFournisseurDTO.FactureStatutDTO;

import org.erp.invera.model.Fournisseurs.CommandeFournisseur;
import org.erp.invera.model.Fournisseurs.FactureFournisseur;
import org.erp.invera.model.Fournisseurs.LigneCommandeFournisseur;
import org.erp.invera.repository.CommandeFournisseurRepository;
import org.erp.invera.repository.FactureFournisseurRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Random;


/**
 * Service de gestion des factures fournisseurs.
 *
 * Ce fichier gère tout le cycle de vie des factures fournisseurs :
 *
 * 1. GÉNÉRATION D'UNE FACTURE :
 *    - À partir d'une commande réceptionnée (statut RECUE)
 *    - Vérifie qu'une facture n'existe pas déjà
 *    - Génère une référence unique (ex: FAC-2025-0412-1234)
 *    - Statut initial : NON_PAYE
 *
 * 2. EXPORT PDF :
 *    - Génère un PDF professionnel de la facture
 *    - Utilise PdfGenerationService pour la mise en page
 *    - Retourne le fichier en byte[] pour téléchargement
 *
 * 3. CONSULTATION :
 *    - Détail complet d'une facture (avec lignes de commande)
 *    - Liste paginée des factures (sans les lignes pour performance)
 *
 * 4. GESTION DES PAIEMENTS :
 *    - Mise à jour du statut (NON_PAYE → PAYE)
 *
 * Règles métier :
 * - Une facture ne peut être créée que si la commande est réceptionnée (RECUE)
 * - Une seule facture par commande
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FactureFournisseurService {

    private final CommandeFournisseurRepository commandeRepository;
    private final FactureFournisseurRepository factureRepository;
    private final PdfGenerationService pdfGenerationService;

    @Transactional
    public FactureGenerationDTO genererEtSauvegarderFacture(Integer commandeId) {
        log.info("Génération et sauvegarde facture pour commande ID: {}", commandeId);

        CommandeFournisseur commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        if (commande.getStatut() != CommandeFournisseur.StatutCommande.RECUE) {
            throw new RuntimeException("Seules les commandes réceptionnées peuvent être facturées");
        }

        if (factureRepository.existsByCommandeFournisseurId(commandeId)) {
            throw new RuntimeException("Une facture existe déjà pour cette commande");
        }

        FactureFournisseur facture = new FactureFournisseur();
        facture.setReferenceFactureFournisseur(genererReferenceFacture());
        facture.setDateFacture(LocalDateTime.now());
        facture.setFournisseur(commande.getFournisseur());
        facture.setCommandeFournisseur(commande);
        facture.setMontantTotal(commande.getTotalTTC());
        facture.setStatut(FactureFournisseur.StatutFacture.NON_PAYE);

        FactureFournisseur savedFacture = factureRepository.save(facture);
        log.info("✅ Facture sauvegardée en BD avec ID: {}", savedFacture.getIdFactureFournisseur());

        FactureGenerationDTO dto = new FactureGenerationDTO();
        dto.setIdFactureFournisseur(savedFacture.getIdFactureFournisseur());
        dto.setReference(savedFacture.getReferenceFactureFournisseur());
        dto.setDateFacture(savedFacture.getDateFacture());
        dto.setMontantTotal(savedFacture.getMontantTotal());
        dto.setStatut(savedFacture.getStatut().toString());
        dto.setFournisseurNom(commande.getFournisseur().getNomFournisseur());
        dto.setCommandeNumero(commande.getNumeroCommande());

        return dto;
    }

    @Transactional(readOnly = true)
    public byte[] exporterPDF(Integer factureId) {
        log.info("Export PDF facture ID: {}", factureId);

        long startTime = System.currentTimeMillis();

        FactureFournisseur facture = factureRepository.findByIdWithDetails(factureId)
                .orElseThrow(() -> new RuntimeException("Facture non trouvée"));

        CommandeFournisseur commande = facture.getCommandeFournisseur();

        // ✅ FORCER le chargement des lignes avant de fermer la session
        if (commande != null && commande.getLignesCommande() != null) {
            // Force l'initialisation de la collection
            int nbLignes = commande.getLignesCommande().size();
            log.info("Nombre de lignes chargées: {}", nbLignes);

            // Force le chargement de chaque produit
            for (LigneCommandeFournisseur ligne : commande.getLignesCommande()) {
                if (ligne.getProduit() != null) {
                    // Force le chargement du produit et de sa catégorie
                    ligne.getProduit().getLibelle();
                    if (ligne.getProduit().getCategorie() != null) {
                        ligne.getProduit().getCategorie().getTauxTVA();
                    }
                }
            }
        }

        FactureDetailDTO dto = new FactureDetailDTO();
        dto.setIdFactureFournisseur(facture.getIdFactureFournisseur());
        dto.setReference(facture.getReferenceFactureFournisseur());
        dto.setDateFacture(facture.getDateFacture());
        dto.setMontantTotal(facture.getMontantTotal());
        dto.setStatut(facture.getStatut().toString());
        dto.setFournisseur(facture.getFournisseur());
        dto.setCommande(commande);
        dto.setLignes(commande != null ? commande.getLignesCommande() : null);

        byte[] pdfBytes = pdfGenerationService.genererPdfFacture(dto);
        long endTime = System.currentTimeMillis();

        log.info("✅ PDF généré en {} ms, taille: {} bytes", (endTime - startTime), pdfBytes.length);
        return pdfBytes;
    }

    @Transactional(readOnly = true)
    public FactureDetailDTO getFactureById(Integer factureId) {
        FactureFournisseur facture = factureRepository.findByIdWithDetails(factureId)
                .orElseThrow(() -> new RuntimeException("Facture non trouvée"));

        CommandeFournisseur commande = facture.getCommandeFournisseur();

        // ✅ LOGS DE DEBUG
        System.out.println("=== DÉBUT DEBUG ===");
        System.out.println("Facture ID: " + facture.getIdFactureFournisseur());
        System.out.println("Commande ID: " + (commande != null ? commande.getIdCommandeFournisseur() : "null"));
        System.out.println("Lignes de commande: " + (commande != null && commande.getLignesCommande() != null ? commande.getLignesCommande().size() : "null"));
        System.out.println("Lignes size: " + (commande != null && commande.getLignesCommande() != null ? commande.getLignesCommande().size() : 0));

        if (commande != null && commande.getLignesCommande() != null) {
            // ✅ FORCER le chargement des lignes
            int nbLignes = commande.getLignesCommande().size();
            System.out.println("Nombre de lignes chargées: " + nbLignes);

            for (LigneCommandeFournisseur ligne : commande.getLignesCommande()) {
                System.out.println("  - Ligne ID: " + ligne.getIdLigneCommandeFournisseur());
                System.out.println("    Produit: " + (ligne.getProduit() != null ? ligne.getProduit().getLibelle() : "null"));
                System.out.println("    Quantité: " + ligne.getQuantite());
                System.out.println("    Prix unitaire: " + ligne.getPrixUnitaire());

                // Force le chargement du produit
                if (ligne.getProduit() != null) {
                    ligne.getProduit().getLibelle();
                    if (ligne.getProduit().getCategorie() != null) {
                        System.out.println("    TVA: " + ligne.getProduit().getCategorie().getTauxTVA());
                    }
                }
            }
        } else {
            System.out.println("⚠️ Aucune ligne trouvée pour cette commande");
        }
        System.out.println("=== FIN DEBUG ===");

        FactureDetailDTO dto = new FactureDetailDTO();
        dto.setIdFactureFournisseur(facture.getIdFactureFournisseur());
        dto.setReference(facture.getReferenceFactureFournisseur());
        dto.setDateFacture(facture.getDateFacture());
        dto.setMontantTotal(facture.getMontantTotal());
        dto.setStatut(facture.getStatut().toString());
        dto.setFournisseur(facture.getFournisseur());
        dto.setCommande(commande);
        dto.setLignes(commande != null ? commande.getLignesCommande() : null);  // ← Important

        return dto;
    }

    @Transactional(readOnly = true)
    public Page<FactureListeDTO> getAllFacturesListe(Pageable pageable) {
        log.info("Récupération paginée des factures (sans lignes)");

        long startTime = System.currentTimeMillis();
        Page<FactureListeDTO> factures = factureRepository.findAllFactureListe(pageable);
        long endTime = System.currentTimeMillis();

        log.info("Récupéré {} factures en {} ms", factures.getTotalElements(), (endTime - startTime));

        return factures;
    }

    @Transactional
    public FactureStatutDTO updateStatutPaiement(Integer factureId, FactureFournisseur.StatutFacture statut) {
        FactureFournisseur facture = factureRepository.findById(factureId)
                .orElseThrow(() -> new RuntimeException("Facture non trouvée"));

        facture.setStatut(statut);
        FactureFournisseur updated = factureRepository.save(facture);
        log.info("✅ Statut paiement mis à jour: {}", updated.getIdFactureFournisseur());

        FactureStatutDTO dto = new FactureStatutDTO();
        dto.setIdFactureFournisseur(updated.getIdFactureFournisseur());
        dto.setReference(updated.getReferenceFactureFournisseur());
        dto.setDateFacture(updated.getDateFacture());
        dto.setMontantTotal(updated.getMontantTotal());
        dto.setStatut(updated.getStatut().toString());

        return dto;
    }

    private String genererReferenceFacture() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MMdd");
        String datePart = LocalDateTime.now().format(formatter);
        String randomPart = String.format("%04d", new Random().nextInt(10000));
        return String.format("FAC-%s-%s", datePart, randomPart);
    }
}