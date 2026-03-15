package org.erp.invera.service;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.commandeFornisseurdto.CommandeFournisseurDTO;
import org.erp.invera.dto.commandeFornisseurdto.LigneCommandeDTO;
import org.erp.invera.dto.commandeFornisseurdto.ProduitManuelDTO;
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
import java.time.format.DateTimeFormatter;
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

    // ========= GET ALL COMMANDES ACTIVES =========
    public List<CommandeFournisseurDTO> getAll() {
        // Ne retourner que les commandes actives (non supprimées)
        List<CommandeFournisseur> commandes = commandeRepository.findByActifTrue();
        return commandes.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    // ========= CREATE =========
    // ========= CREATE =========
    public CommandeFournisseurDTO creerCommande(CommandeFournisseurDTO dto) {

        Fournisseur fournisseur = fournisseurRepository.findById(dto.getFournisseur().getIdFournisseur())
                .orElseThrow(() -> new RuntimeException("Fournisseur non trouvé"));

        CommandeFournisseur commande = new CommandeFournisseur();

        // ✅ Générer le numéro de commande au format CMD-202603-0005
        commande.setNumeroCommande(genererNumeroCommande());

        commande.setDateCommande(LocalDateTime.now());
        commande.setDateLivraisonPrevue(dto.getDateLivraisonPrevue());
        commande.setFournisseur(fournisseur);
        commande.setStatut(CommandeFournisseur.StatutCommande.BROUILLON);
        commande.setActif(true);

        List<LigneCommandeFournisseur> lignes = dto.getLignesCommande()
                .stream()
                .map(ligneDTO -> {

                    LigneCommandeFournisseur ligne = new LigneCommandeFournisseur();
                    ligne.setCommandeFournisseur(commande);
                    ligne.setQuantite(ligneDTO.getQuantite());
                    ligne.setPrixUnitaire(ligneDTO.getPrixUnitaire());

                    // 🔍 LOG
                    System.out.println("📦 Traitement ligne DTO - produitLibelle: " + ligneDTO.getProduitLibelle());

                    // ✅ Gestion des deux types de produits
                    if (ligneDTO.getProduitId() != null) {
                        // Cas 1: Produit existant dans le catalogue
                        Produit produit = produitRepository.findById(ligneDTO.getProduitId())
                                .orElseThrow(() -> new RuntimeException(
                                        "Produit non trouvé avec l'ID: " + ligneDTO.getProduitId()));
                        ligne.setProduit(produit);
                        System.out.println("✅ Produit catalogue ajouté: " + produit.getLibelle());

                    } else {
                        // ✅ Cas 2: Produit saisi manuellement
                        // Utiliser produitLibelle du DTO
                        String nomProduit = ligneDTO.getProduitLibelle();
                        if (nomProduit == null || nomProduit.isEmpty()) {
                            nomProduit = "Produit sans nom";
                        }

                        // Stocker les informations du produit manuel dans les notes
                        String infosProduit = String.format("Produit manuel: %s", nomProduit);

                        // Ajouter la référence si elle existe
                        if (ligneDTO.getProduitReference() != null && !ligneDTO.getProduitReference().isEmpty()) {
                            infosProduit += String.format(" (Réf: %s)", ligneDTO.getProduitReference());
                        }

                        ligne.setNotes(infosProduit);
                        ligne.setProduit(null);  // Pas de produit en base

                        System.out.println("✅ Produit manuel ajouté: " + infosProduit);
                    }

                    // Calcul du sous-total
                    BigDecimal sousTotal = ligneDTO.getPrixUnitaire()
                            .multiply(BigDecimal.valueOf(ligneDTO.getQuantite()));
                    ligne.setSousTotal(sousTotal);

                    return ligne;

                }).toList();

        commande.setLignesCommande(lignes);

        // ✅ CALCUL DES TOTAUX GLOBAUX DE LA COMMANDE
        BigDecimal totalHT = lignes.stream()
                .map(LigneCommandeFournisseur::getSousTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalTVA = totalHT.multiply(new BigDecimal("0.20"));
        BigDecimal totalTTC = totalHT.add(totalTVA);

        commande.setTotalHT(totalHT);
        commande.setTotalTVA(totalTVA);
        commande.setTotalTTC(totalTTC);

        CommandeFournisseur saved = commandeRepository.save(commande);
        return convertToDTO(saved);
    }

    // method pour génere le num de commande de fournisseur
    private String genererNumeroCommande() {
        // Format: CMD-YYYYMM-XXXX
        // Exemple: CMD-202603-0005

        LocalDateTime now = LocalDateTime.now();
        String prefix = "CMD";
        String anneeMois = now.format(DateTimeFormatter.ofPattern("yyyyMM"));

        // Récupérer le dernier compteur pour le mois en cours
        String pattern = prefix + "-" + anneeMois + "-%";
        Long count = commandeRepository.countByNumeroCommandeStartingWith(prefix + "-" + anneeMois);

        // Générer le numéro avec 4 chiffres (ex: 0001, 0002, ...)
        int nextNum = count != null ? count.intValue() + 1 : 1;
        String numero = String.format("%s-%s-%04d", prefix, anneeMois, nextNum);

        return numero;
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

    // ========= Marque une commande comme VALIDER =========
    public CommandeFournisseurDTO validerCommande(Integer id) {

        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id: " + id));

        commande.setStatut(CommandeFournisseur.StatutCommande.VALIDEE);

        CommandeFournisseur saved = commandeRepository.save(commande);
        return convertToDTO(saved);
    }

    // ========= Marque une commande comme ENVOYER =========
    public CommandeFournisseurDTO envoyerCommande(Integer id) {

        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id: " + id));

        commande.setStatut(CommandeFournisseur.StatutCommande.ENVOYEE);

        CommandeFournisseur saved = commandeRepository.save(commande);
        return convertToDTO(saved);
    }

    /**
     *  Enregistrer la réception d'une commande
     * C'est ici que la date de livraison réelle est définie
     */
    public CommandeFournisseurDTO recevoirCommande(Integer id) {
        // 1. Récupérer la commande
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        // 2. Vérifier que la commande peut être reçue (statut ENVOYEE)
        if (commande.getStatut() != CommandeFournisseur.StatutCommande.ENVOYEE) {
            throw new RuntimeException("Seules les commandes envoyées peuvent être reçues");
        }

        // 3. ÉFINIR LA DATE DE LIVRAISON RÉELLE (MAINTENANT)
        commande.setDateLivraisonReelle(LocalDateTime.now());

        // 4. Changer le statut
        commande.setStatut(CommandeFournisseur.StatutCommande.RECUE);

        // 5. Sauvegarder
        CommandeFournisseur savedCommande = commandeRepository.save(commande);

        // 6. Retourner le DTO
        return convertToDTO(savedCommande);
    }


    // ========= Marque une commande comme ANNULER =========
    public CommandeFournisseurDTO annulerCommande(Integer id, String raison) {

        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id: " + id));

        commande.setStatut(CommandeFournisseur.StatutCommande.ANNULEE);

        CommandeFournisseur saved = commandeRepository.save(commande);
        return convertToDTO(saved);
    }

    public CommandeFournisseurDTO facturerCommande(Integer id) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'ID: " + id));

        if (commande.getStatut() != CommandeFournisseur.StatutCommande.RECUE) {
            throw new RuntimeException(
                    String.format("Impossible de facturer une commande au statut %s. Le statut doit être RECUE.",
                            commande.getStatut())
            );
        }

        commande.setStatut(CommandeFournisseur.StatutCommande.FACTUREE);
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

        // ✅ VÉRIFIEZ QUE CES LIGNES SONT PRÉSENTES
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

        // 🔍 AJOUTEZ CE LOG POUR DEBUG
        System.out.println("🔄 Conversion DTO - ID: " + commande.getIdCommandeFournisseur() +
                ", totalTTC: " + commande.getTotalTTC() +
                " → DTO totalTTC: " + dto.getTotalTTC());

        return dto;
    }


    private LigneCommandeDTO convertLigneToDTO(LigneCommandeFournisseur ligne) {
        LigneCommandeDTO l = new LigneCommandeDTO();

        l.setIdLigneCommandeFournisseur(ligne.getIdLigneCommandeFournisseur());
        l.setQuantite(ligne.getQuantite());
        l.setPrixUnitaire(ligne.getPrixUnitaire());
        l.setSousTotal(ligne.getSousTotal());
        l.setQuantiteRecue(ligne.getQuantiteRecue());
        l.setNotes(ligne.getNotes());

        // 🔍 LOG POUR DEBUG
        System.out.println("🔄 Conversion ligne ID: " + ligne.getIdLigneCommandeFournisseur());
        System.out.println("   Produit: " + (ligne.getProduit() != null ? ligne.getProduit().getLibelle() : "null"));
        System.out.println("   Notes: " + ligne.getNotes());

        // ✅ CAS 1: Produit du catalogue
        if (ligne.getProduit() != null) {
            l.setProduitId(ligne.getProduit().getIdProduit());
            l.setProduitLibelle(ligne.getProduit().getLibelle());
            l.setProduitReference("REF-" + ligne.getProduit().getIdProduit()); // Ou utilisez l'ID comme référence
            l.setIsManual(false);
            System.out.println("✅ Produit catalogue: " + ligne.getProduit().getLibelle());
        }
        // ✅ CAS 2: Produit manuel (depuis les notes)
        else if (ligne.getNotes() != null && ligne.getNotes().startsWith("Produit manuel:")) {
            String notes = ligne.getNotes();
            System.out.println("📝 Traitement notes produit manuel: " + notes);

            // Extraire les informations du format "Produit manuel: Nom (Réf: REF123)"
            String contenu = notes.substring("Produit manuel:".length()).trim();

            String nom = contenu;
            String reference = "";

            if (contenu.contains("(Réf:")) {
                String[] parts = contenu.split("\\(Réf:");
                nom = parts[0].trim();
                reference = parts[1].replace(")", "").trim();
            }

            l.setProduitLibelle(nom);
            l.setProduitReference(reference);
            l.setIsManual(true);
            l.setProduitId(null);

            System.out.println("✅ Produit manuel extrait - Nom: '" + nom + "', Réf: '" + reference + "'");
        }
        // ✅ CAS 3: Notes simples (fallback)
        else if (ligne.getNotes() != null && !ligne.getNotes().isEmpty()) {
            l.setProduitLibelle(ligne.getNotes());
            l.setIsManual(true);
            System.out.println("📝 Produit depuis notes simples: " + ligne.getNotes());
        }
        // ✅ CAS 4: Aucune information
        else {
            l.setProduitLibelle("Produit sans nom");
            l.setIsManual(true);
            System.out.println("⚠️ Produit sans informations");
        }

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