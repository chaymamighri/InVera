package org.erp.invera.service;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.commandeFornisseurDTO.CommandeFournisseurDTO;
import org.erp.invera.dto.commandeFornisseurDTO.LigneCommandeDTO;
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

@Service
@RequiredArgsConstructor
@Transactional
public class CommandeFournisseurService {

    private final CommandeFournisseurRepository commandeRepository;
    private final LigneCommandeFournisseurRepository ligneRepository;
    private final FournisseurRepository fournisseurRepository;
    private final ProduitRepository produitRepository;

    // ========= GET ALL COMMANDES =========

    public List<CommandeFournisseurDTO> getAll() {

        List<CommandeFournisseur> commandes = commandeRepository.findAll();

        return commandes.stream().map(cmd -> {

            CommandeFournisseurDTO dto = new CommandeFournisseurDTO();

            dto.setIdCommandeFournisseur(cmd.getIdCommandeFournisseur());
            dto.setNumeroCommande(cmd.getNumeroCommande());
            dto.setDateCommande(cmd.getDateCommande());
            dto.setDateLivraisonPrevue(cmd.getDateLivraisonPrevue());
            dto.setDateLivraisonReelle(cmd.getDateLivraisonReelle());

            if (cmd.getFournisseur() != null) {
                dto.setFournisseurId(cmd.getFournisseur().getIdFournisseur());
                dto.setFournisseurNom(cmd.getFournisseur().getNomFournisseur());
            }

            dto.setStatut(cmd.getStatut());
            dto.setTotalHT(cmd.getTotalHT());
            dto.setTotalTVA(cmd.getTotalTVA());
            dto.setTotalTTC(cmd.getTotalTTC());
            dto.setActif(cmd.getActif());

            // 🔹 Mapping lignes de commande
            if (cmd.getLignesCommande() != null) {

                List<LigneCommandeDTO> lignes = cmd.getLignesCommande()
                        .stream()
                        .map(ligne -> {

                            LigneCommandeDTO l = new LigneCommandeDTO();

                            l.setIdLigneCommandeFournisseur(ligne.getIdLigneCommandeFournisseur());

                            if (ligne.getProduit() != null) {
                                l.setProduitId(ligne.getProduit().getIdProduit());
                                l.setProduitLibelle(ligne.getProduit().getLibelle());
                                l.setProduitReference(String.valueOf(ligne.getProduit().getIdProduit()));                            }

                            l.setQuantite(ligne.getQuantite());
                            l.setPrixUnitaire(ligne.getPrixUnitaire());
                            l.setSousTotal(ligne.getSousTotal());
                            l.setRemise(ligne.getRemise());
                            l.setQuantiteRecue(ligne.getQuantiteRecue());
                            l.setNotes(ligne.getNotes());

                            return l;

                        }).toList();

                dto.setLignesCommande(lignes);
            }

            return dto;

        }).toList();
    }



    // ========= CREATE =========

    public CommandeFournisseur creerCommande(CommandeFournisseurDTO dto) {

        Fournisseur fournisseur = fournisseurRepository.findById(dto.getFournisseurId())
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

        return commandeRepository.save(commande);
    }

    // ========= GET BY ID =========

    public CommandeFournisseur getCommandeById(Integer id) {
        return commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id: " + id));
    }
    public CommandeFournisseur modifierCommande(Integer id, CommandeFournisseurDTO dto) {

        CommandeFournisseur commande = getCommandeById(id);

        commande.setDateLivraisonPrevue(dto.getDateLivraisonPrevue());

        return commandeRepository.save(commande);
    }

    public void supprimerCommande(Integer id) {

        CommandeFournisseur commande = getCommandeById(id);

        commande.setActif(false);

        commandeRepository.save(commande);
    }

    public CommandeFournisseur validerCommande(Integer id) {

        CommandeFournisseur commande = getCommandeById(id);

        commande.setStatut(CommandeFournisseur.StatutCommande.VALIDEE);

        return commandeRepository.save(commande);
    }

    public CommandeFournisseur envoyerCommande(Integer id) {

        CommandeFournisseur commande = getCommandeById(id);

        commande.setStatut(CommandeFournisseur.StatutCommande.ENVOYEE);

        return commandeRepository.save(commande);
    }

    public CommandeFournisseur recevoirCommande(Integer id) {

        CommandeFournisseur commande = getCommandeById(id);

        commande.setStatut(CommandeFournisseur.StatutCommande.RECUE);

        return commandeRepository.save(commande);
    }


    public CommandeFournisseur annulerCommande(Integer id, String raison) {

        CommandeFournisseur commande = getCommandeById(id);

        commande.setStatut(CommandeFournisseur.StatutCommande.ANNULEE);

        return commandeRepository.save(commande);
    }


    public List<CommandeFournisseur> getCommandesByPeriode(LocalDateTime debut, LocalDateTime fin) {

        return commandeRepository.findByDateCommandeBetweenOrderByDateCommandeDesc(debut, fin);
    }

    public CommandeFournisseur getCommandeByNumero(String numero) {

        return commandeRepository.findByNumeroCommande(numero)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));
    }


}