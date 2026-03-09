package org.erp.invera.service;

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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class CommandeFournisseurService {

    @Autowired
    private CommandeFournisseurRepository commandeRepository;

    @Autowired
    private LigneCommandeFournisseurRepository ligneRepository;

    @Autowired
    private FournisseurRepository fournisseurRepository;

    @Autowired
    private ProduitRepository produitRepository;

    // ========== CRUD ==========

    public List<CommandeFournisseur> getAllCommandes() {
        return commandeRepository.findAllByOrderByDateCommandeDesc();
    }

    public CommandeFournisseur getCommandeById(Integer id) {
        return commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id: " + id));
    }

    @Transactional
    public CommandeFournisseur creerCommande(CommandeFournisseurDTO dto) {
        System.out.println("🛠️ Création de commande fournisseur...");

        // 1. Vérifier le fournisseur
        Fournisseur fournisseur = fournisseurRepository.findById(dto.getFournisseurId())
                .orElseThrow(() -> new RuntimeException("Fournisseur non trouvé avec l'ID: " + dto.getFournisseurId()));

        // 2. Créer la commande
        CommandeFournisseur commande = new CommandeFournisseur();
        commande.setFournisseur(fournisseur);
        commande.setDateCommande(LocalDateTime.now());
        commande.setDateLivraisonPrevue(dto.getDateLivraisonPrevue());
        commande.setStatut(CommandeFournisseur.StatutCommande.BROUILLON);
        commande.setNumeroCommande(genererNumeroCommande());

        // 3. Créer les lignes de commande
        List<LigneCommandeFournisseur> lignes = new ArrayList<>();
        BigDecimal totalHT = BigDecimal.ZERO;

        if (dto.getLignesCommande() != null) {
            for (LigneCommandeDTO ligneDTO : dto.getLignesCommande()) {
                Produit produit = produitRepository.findById(ligneDTO.getProduitId())
                        .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

                LigneCommandeFournisseur ligne = new LigneCommandeFournisseur();
                ligne.setCommandeFournisseur(commande);
                ligne.setProduit(produit);
                ligne.setQuantite(ligneDTO.getQuantite());

                // Prix unitaire (si non fourni, prendre le prix d'achat du produit)
                BigDecimal prixUnitaire;
                if (ligneDTO.getPrixUnitaire() != null) {
                    prixUnitaire = ligneDTO.getPrixUnitaire();
                } else {
                    prixUnitaire = BigDecimal.valueOf(produit.getPrixAchat());  // ✅ Double → BigDecimal
                }
                ligne.setPrixUnitaire(prixUnitaire);
                ligne.calculerSousTotal();
                lignes.add(ligne);

                totalHT = totalHT.add(ligne.getSousTotal());
            }
        }

        // 4. Calculer les totaux
        commande.setLignesCommande(lignes);
        commande.calculerTotaux();

        // 5. Sauvegarder
        CommandeFournisseur savedCommande = commandeRepository.save(commande);
        System.out.println("✅ Commande fournisseur créée: " + savedCommande.getNumeroCommande());

        return savedCommande;
    }

    @Transactional
    public CommandeFournisseur modifierCommande(Integer id, CommandeFournisseurDTO dto) {
        CommandeFournisseur commande = getCommandeById(id);

        if (commande.getStatut() != CommandeFournisseur.StatutCommande.BROUILLON) {
            throw new RuntimeException("Impossible de modifier une commande déjà " + commande.getStatut());
        }

        // Mettre à jour les champs
        commande.setDateLivraisonPrevue(dto.getDateLivraisonPrevue());

        return commandeRepository.save(commande);
    }

    @Transactional
    public void supprimerCommande(Integer id) {
        CommandeFournisseur commande = getCommandeById(id);
        commande.setActif(false);
        commandeRepository.save(commande);
    }

    // ========== GESTION DES STATUTS ==========

    @Transactional
    public CommandeFournisseur validerCommande(Integer id) {
        CommandeFournisseur commande = getCommandeById(id);
        commande.validerCommande();
        return commandeRepository.save(commande);
    }

    @Transactional
    public CommandeFournisseur envoyerCommande(Integer id) {
        CommandeFournisseur commande = getCommandeById(id);

        if (commande.getStatut() != CommandeFournisseur.StatutCommande.VALIDEE) {
            throw new RuntimeException("Seules les commandes validées peuvent être envoyées");
        }

        commande.envoyerCommande();
        return commandeRepository.save(commande);
    }

    @Transactional
    public CommandeFournisseur recevoirCommande(Integer id) {
        CommandeFournisseur commande = getCommandeById(id);
        commande.enregistrerReception();
        return commandeRepository.save(commande);
    }

    @Transactional
    public CommandeFournisseur annulerCommande(Integer id, String raison) {
        CommandeFournisseur commande = getCommandeById(id);

        if (commande.getStatut() == CommandeFournisseur.StatutCommande.FACTUREE ||
                commande.getStatut() == CommandeFournisseur.StatutCommande.RECUE) {
            throw new RuntimeException("Impossible d'annuler une commande déjà reçue ou facturée");
        }

        commande.annulerCommande();

        return commandeRepository.save(commande);
    }

    // ========== RECHERCHES ==========

    public List<CommandeFournisseur> getCommandesByPeriode(LocalDateTime debut, LocalDateTime fin) {
        if (debut.isAfter(fin)) {
            throw new RuntimeException("La date de début doit être antérieure à la date de fin");
        }
        return commandeRepository.findByDateCommandeBetweenOrderByDateCommandeDesc(debut, fin);
    }

    public CommandeFournisseur getCommandeByNumero(String numero) {
        return commandeRepository.findByNumeroCommande(numero)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec le numéro: " + numero));
    }

    // ========== MÉTHODES PRIVÉES ==========

    private String genererNumeroCommande() {
        String prefix = "CMD";
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        Long count = commandeRepository.countByNumeroCommandeStartingWith(prefix + "-" + date);
        int nextNum = count != null ? count.intValue() + 1 : 1;
        return String.format("%s-%s-%04d", prefix, date, nextNum);
    }
}