package org.erp.invera.service;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.commandeFornisseurdto.CommandeFournisseurDTO;
import org.erp.invera.dto.commandeFornisseurdto.LigneCommandeDTO;
import org.erp.invera.dto.fournisseurdto.FournisseurDTO;
import org.erp.invera.model.Fournisseurs.CommandeFournisseur;
import org.erp.invera.model.Fournisseurs.Fournisseur;
import org.erp.invera.model.Fournisseurs.LigneCommandeFournisseur;
import org.erp.invera.model.Produit;
import org.erp.invera.repository.CommandeFournisseurRepository;
import org.erp.invera.repository.FournisseurRepository;
import org.erp.invera.repository.LigneCommandeFournisseurRepository;
import org.erp.invera.repository.ProduitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CommandeFournisseurService {

    private final CommandeFournisseurRepository commandeRepository;
    private final LigneCommandeFournisseurRepository ligneRepository;
    private final FournisseurRepository fournisseurRepository;
    private final ProduitRepository produitRepository;

    // ========= GET ALL COMMANDES =========

    // ========= GET ALL COMMANDES ACTIVES =========
    public List<CommandeFournisseurDTO> getAll() {
        // Ne retourner que les commandes actives (non supprimées)
        List<CommandeFournisseur> commandes = commandeRepository.findByActifTrue();
        return commandes.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    // ========= CREATE =========

    public CommandeFournisseurDTO creerCommande(CommandeFournisseurDTO dto) {

        Fournisseur fournisseur = fournisseurRepository.findById(dto.getFournisseur().getIdFournisseur())
                .orElseThrow(() -> new RuntimeException("Fournisseur non trouvé"));

        CommandeFournisseur commande = new CommandeFournisseur();

        commande.setNumeroCommande("CMD-" + System.currentTimeMillis());
        commande.setDateCommande(LocalDateTime.now());
        commande.setDateLivraisonPrevue(dto.getDateLivraisonPrevue());
        commande.setFournisseur(fournisseur);
        commande.setStatut(CommandeFournisseur.StatutCommande.BROUILLON);
        commande.setActif(true);

        List<LigneCommandeFournisseur> lignes = dto.getLignesCommande()
                .stream()
                .map(ligneDTO -> {

                    Produit produit = produitRepository.findById(ligneDTO.getProduitId())
                            .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

                    LigneCommandeFournisseur ligne = new LigneCommandeFournisseur();

                    ligne.setCommandeFournisseur(commande);
                    ligne.setProduit(produit);
                    ligne.setQuantite(ligneDTO.getQuantite());
                    ligne.setPrixUnitaire(ligneDTO.getPrixUnitaire());

                    BigDecimal sousTotal = ligneDTO.getPrixUnitaire()
                            .multiply(BigDecimal.valueOf(ligneDTO.getQuantite()));

                    ligne.setSousTotal(sousTotal);

                    return ligne;

                }).toList();

        commande.setLignesCommande(lignes);

        CommandeFournisseur saved = commandeRepository.save(commande);
        return convertToDTO(saved);
    }

    // ========= GET BY ID =========

    public CommandeFournisseurDTO getCommandeById(Integer id) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id: " + id));
        return convertToDTO(commande);
    }

    // ========= UPDATE =========

    public CommandeFournisseurDTO modifierCommande(Integer id, CommandeFournisseurDTO dto) {

        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id: " + id));

        commande.setDateLivraisonPrevue(dto.getDateLivraisonPrevue());
        // Ajoutez d'autres champs modifiables si nécessaire

        CommandeFournisseur saved = commandeRepository.save(commande);
        return convertToDTO(saved);
    }

    // ========= SOFT DELETE =========

    public void supprimerCommande(Integer id) {

        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id: " + id));

        commande.setActif(false);
        commandeRepository.save(commande);
    }

    // ========= VALIDER COMMANDE =========
    public CommandeFournisseurDTO validerCommande(Integer id) {

        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id: " + id));

        commande.setStatut(CommandeFournisseur.StatutCommande.VALIDEE);

        CommandeFournisseur saved = commandeRepository.save(commande);
        return convertToDTO(saved);
    }

    // ========= ENVOYER COMMANDE =========
    public CommandeFournisseurDTO envoyerCommande(Integer id) {

        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id: " + id));

        commande.setStatut(CommandeFournisseur.StatutCommande.ENVOYEE);

        CommandeFournisseur saved = commandeRepository.save(commande);
        return convertToDTO(saved);
    }

    // ========= RECEVOIR COMMANDE =========
    public CommandeFournisseurDTO recevoirCommande(Integer id) {

        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id: " + id));

        commande.setStatut(CommandeFournisseur.StatutCommande.RECUE);
        commande.setDateLivraisonReelle(LocalDateTime.now());

        CommandeFournisseur saved = commandeRepository.save(commande);
        return convertToDTO(saved);
    }

    // ========= ANNULER COMMANDE =========
    public CommandeFournisseurDTO annulerCommande(Integer id, String raison) {

        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id: " + id));

        commande.setStatut(CommandeFournisseur.StatutCommande.ANNULEE);
        // Si vous avez un champ pour stocker la raison d'annulation, ajoutez-le ici

        CommandeFournisseur saved = commandeRepository.save(commande);
        return convertToDTO(saved);
    }

    // ========= RECHERCHE PAR PERIODE =========
    public List<CommandeFournisseur> getCommandesByPeriode(LocalDateTime debut, LocalDateTime fin) {
        return commandeRepository.findByDateCommandeBetweenOrderByDateCommandeDesc(debut, fin);
    }

    // ========= RECHERCHE PAR NUMERO =========
    public CommandeFournisseurDTO getCommandeByNumero(String numero) {
        CommandeFournisseur commande = commandeRepository.findByNumeroCommande(numero)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec le numéro: " + numero));
        return convertToDTO(commande);
    }

    // ========= CONVERSION EN DTO =========
    private CommandeFournisseurDTO convertToDTO(CommandeFournisseur commande) {
        CommandeFournisseurDTO dto = new CommandeFournisseurDTO();

        dto.setIdCommandeFournisseur(commande.getIdCommandeFournisseur());
        dto.setNumeroCommande(commande.getNumeroCommande());
        dto.setDateCommande(commande.getDateCommande());
        dto.setDateLivraisonPrevue(commande.getDateLivraisonPrevue());
        dto.setDateLivraisonReelle(commande.getDateLivraisonReelle());

        // Fournisseur
        if (commande.getFournisseur() != null) {
            dto.setFournisseur(new FournisseurDTO(commande.getFournisseur()));
        }

        dto.setStatut(commande.getStatut());
        dto.setTotalHT(commande.getTotalHT());
        dto.setTotalTVA(commande.getTotalTVA());
        dto.setTotalTTC(commande.getTotalTTC());
        dto.setActif(commande.getActif());

        // Lignes de commande
        if (commande.getLignesCommande() != null && !commande.getLignesCommande().isEmpty()) {
            List<LigneCommandeDTO> lignes = commande.getLignesCommande()
                    .stream()
                    .map(this::convertLigneToDTO)
                    .collect(Collectors.toList());
            dto.setLignesCommande(lignes);
        }

        return dto;
    }

    // ========= CONVERSION LIGNE EN DTO =========
    private LigneCommandeDTO convertLigneToDTO(LigneCommandeFournisseur ligne) {
        LigneCommandeDTO l = new LigneCommandeDTO();

        l.setIdLigneCommandeFournisseur(ligne.getIdLigneCommandeFournisseur());

        if (ligne.getProduit() != null) {
            l.setProduitId(ligne.getProduit().getIdProduit());
            l.setProduitLibelle(ligne.getProduit().getLibelle());
            l.setProduitReference(String.valueOf(ligne.getProduit().getIdProduit()));
        }

        l.setQuantite(ligne.getQuantite());
        l.setPrixUnitaire(ligne.getPrixUnitaire());
        l.setSousTotal(ligne.getSousTotal());
        l.setRemise(ligne.getRemise());
        l.setQuantiteRecue(ligne.getQuantiteRecue());
        l.setNotes(ligne.getNotes());

        return l;
    }
    /**
     * Récupère toutes les commandes archivées (soft delete)
     */
    public List<CommandeFournisseurDTO> getArchivedCommandes() {
        List<CommandeFournisseur> commandes = commandeRepository.findByActifFalse();
        return commandes.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    /**
     * COMMANDES ACTIVES (actif = true)
     */
    public List<CommandeFournisseurDTO> getActiveCommandes() {
        List<CommandeFournisseur> commandes = commandeRepository.findByActifTrue();
        return commandes.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /**
     * Restaure une commande archivée
     */
    public CommandeFournisseurDTO restoreCommande(Integer id) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id: " + id));

        commande.setActif(true);
        CommandeFournisseur saved = commandeRepository.save(commande);
        return convertToDTO(saved);
    }

    /**
     * Suppression physique (hard delete) - Optionnel, à utiliser avec précaution
     */
    public void hardDeleteCommande(Integer id) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id: " + id));

        commandeRepository.delete(commande);
    }

}