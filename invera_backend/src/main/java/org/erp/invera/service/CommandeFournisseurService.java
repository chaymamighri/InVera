package org.erp.invera.service;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.commandeFornisseurdto.CommandeFournisseurDTO;
import org.erp.invera.dto.commandeFornisseurdto.LigneCommandeDTO;
import org.erp.invera.dto.commandeFornisseurdto.ReceptionDTO;
import org.erp.invera.dto.fournisseurdto.FournisseurDTO;
import org.erp.invera.model.Fournisseurs.CommandeFournisseur;
import org.erp.invera.model.Fournisseurs.Fournisseur;
import org.erp.invera.model.Fournisseurs.LigneCommandeFournisseur;
import org.erp.invera.model.Produit;
import org.erp.invera.repository.CommandeFournisseurRepository;
import org.erp.invera.repository.LigneCommandeFournisseurRepository;
import org.erp.invera.repository.FournisseurRepository;
import org.erp.invera.repository.ProduitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CommandeFournisseurService {

    private final CommandeFournisseurRepository commandeRepository;
    private final FournisseurRepository fournisseurRepository;
    private final ProduitRepository produitRepository;
    private final LigneCommandeFournisseurRepository ligneRepository;


    private static final BigDecimal TVA_PAR_DEFAUT = new BigDecimal("20");

    public List<CommandeFournisseurDTO> getAll() {
        return commandeRepository.findByActifTrue()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public CommandeFournisseurDTO creerCommande(CommandeFournisseurDTO dto) {
        Fournisseur fournisseur = fournisseurRepository.findById(dto.getFournisseur().getIdFournisseur())
                .orElseThrow(() -> new RuntimeException("Fournisseur non trouvé"));

        CommandeFournisseur commande = new CommandeFournisseur();
        commande.setNumeroCommande(genererNumeroCommande());
        commande.setDateCommande(LocalDateTime.now());
        commande.setDateLivraisonPrevue(dto.getDateLivraisonPrevue());
        commande.setAdresseLivraison(dto.getAdresseLivraison());
        commande.setFournisseur(fournisseur);
        commande.setStatut(CommandeFournisseur.StatutCommande.BROUILLON);
        commande.setActif(true);
        commande.setTauxTVA(dto.getTauxTVA() != null ? dto.getTauxTVA() : TVA_PAR_DEFAUT);

        List<LigneCommandeFournisseur> lignes = dto.getLignesCommande()
                .stream()
                .map(ligneDTO -> {
                    if (ligneDTO.getProduitId() == null) {
                        throw new RuntimeException("L'ID du produit est obligatoire");
                    }

                    Produit produit = produitRepository.findById(ligneDTO.getProduitId())
                            .orElseThrow(() -> new RuntimeException(
                                    "Produit non trouvé avec l'ID: " + ligneDTO.getProduitId()));

                    if (ligneDTO.getQuantite() <= 0) {
                        throw new RuntimeException("La quantité doit être supérieure à 0");
                    }
                    if (ligneDTO.getPrixUnitaire() == null || ligneDTO.getPrixUnitaire().compareTo(BigDecimal.ZERO) <= 0) {
                        throw new RuntimeException("Le prix unitaire doit être supérieur à 0");
                    }

                    LigneCommandeFournisseur ligne = new LigneCommandeFournisseur();
                    ligne.setCommandeFournisseur(commande);
                    ligne.setProduit(produit);
                    ligne.setQuantite(ligneDTO.getQuantite());
                    ligne.setPrixUnitaire(ligneDTO.getPrixUnitaire());

                    BigDecimal sousTotalHT = ligneDTO.getPrixUnitaire()
                            .multiply(BigDecimal.valueOf(ligneDTO.getQuantite()))
                            .setScale(3, RoundingMode.HALF_UP);

                    BigDecimal montantTVA = sousTotalHT
                            .multiply(commande.getTauxTVA())
                            .divide(new BigDecimal("100"), 3, RoundingMode.HALF_UP);

                    BigDecimal sousTotalTTC = sousTotalHT.add(montantTVA)
                            .setScale(3, RoundingMode.HALF_UP);

                    ligne.setSousTotalHT(sousTotalHT);
                    ligne.setMontantTVA(montantTVA);
                    ligne.setSousTotalTTC(sousTotalTTC);

                    if (ligneDTO.getNotes() != null && !ligneDTO.getNotes().isEmpty()) {
                        ligne.setNotes(ligneDTO.getNotes());
                    }

                    return ligne;
                }).toList();

        commande.setLignesCommande(lignes);

        BigDecimal totalHT = lignes.stream()
                .map(LigneCommandeFournisseur::getSousTotalHT)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);

        BigDecimal totalTVA = lignes.stream()
                .map(LigneCommandeFournisseur::getMontantTVA)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);

        BigDecimal totalTTC = lignes.stream()
                .map(LigneCommandeFournisseur::getSousTotalTTC)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);

        commande.setTotalHT(totalHT);
        commande.setTotalTVA(totalTVA);
        commande.setTotalTTC(totalTTC);

        CommandeFournisseur saved = commandeRepository.save(commande);
        return convertToDTO(saved);
    }

    public CommandeFournisseurDTO getCommandeById(Integer id) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id: " + id));
        return convertToDTO(commande);
    }

    public CommandeFournisseurDTO modifierCommande(Integer id, CommandeFournisseurDTO dto) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id: " + id));

        if (commande.getStatut() != CommandeFournisseur.StatutCommande.BROUILLON) {
            throw new RuntimeException("Seules les commandes en brouillon peuvent être modifiées");
        }

        commande.setDateLivraisonPrevue(dto.getDateLivraisonPrevue());
        commande.setAdresseLivraison(dto.getAdresseLivraison());

        CommandeFournisseur saved = commandeRepository.save(commande);
        return convertToDTO(saved);
    }

    public CommandeFournisseurDTO validerCommande(Integer id) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        if (commande.getStatut() != CommandeFournisseur.StatutCommande.BROUILLON) {
            throw new RuntimeException("Seules les commandes en brouillon peuvent être validées");
        }

        commande.setStatut(CommandeFournisseur.StatutCommande.VALIDEE);
        return convertToDTO(commandeRepository.save(commande));
    }

    public CommandeFournisseurDTO envoyerCommande(Integer id) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        if (commande.getStatut() != CommandeFournisseur.StatutCommande.VALIDEE) {
            throw new RuntimeException("Seules les commandes validées peuvent être envoyées");
        }

        commande.setStatut(CommandeFournisseur.StatutCommande.ENVOYEE);
        return convertToDTO(commandeRepository.save(commande));
    }

    public CommandeFournisseurDTO recevoirCommande(Integer id, ReceptionDTO receptionData) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        if (commande.getStatut() != CommandeFournisseur.StatutCommande.ENVOYEE) {
            throw new RuntimeException("Seules les commandes envoyées peuvent être reçues");
        }

        // Mettre à jour les informations de réception
        commande.setNumeroBonLivraison(receptionData.getNumeroBL());
        commande.setNotesReception(receptionData.getNotes());
        commande.setDateLivraisonReelle(LocalDateTime.now());
        commande.setStatut(CommandeFournisseur.StatutCommande.RECUE);

        for (LigneCommandeFournisseur ligne : commande.getLignesCommande()) {
            Integer ligneId = ligne.getIdLigneCommandeFournisseur();

            // Récupérer la quantité reçue pour cette ligne depuis le DTO
            Integer quantiteRecue = receptionData.getQuantitesRecues().get(ligneId);

            // Si la ligne n'est pas dans la map ou quantité = 0, on passe
            if (quantiteRecue == null || quantiteRecue <= 0) {
                continue;
            }

            // Enregistrer la quantité reçue
            ligne.setQuantiteRecue(quantiteRecue);

            Produit produit = ligne.getProduit();

            if (produit != null) {
                int stockAvant = produit.getQuantiteStock() != null ? produit.getQuantiteStock() : 0;
                int nouvelleQuantite = stockAvant + quantiteRecue;
                produit.setQuantiteStock(nouvelleQuantite);

                // Vérifier si le produit doit être réactivé
                Boolean doitReactiver = receptionData.getProduitsAReactiver() != null
                        ? receptionData.getProduitsAReactiver().get(ligneId)
                        : false;

                if (!Boolean.TRUE.equals(produit.getActive()) && doitReactiver) {
                    produit.setActive(true);
                    System.out.println("✅ Produit réactivé: " + produit.getLibelle()
                            + " (ID: " + produit.getIdProduit()
                            + ") suite à réception commande " + commande.getNumeroCommande());
                }

                produitRepository.save(produit);
            } else {
                System.err.println("❌ Ligne " + ligne.getIdLigneCommandeFournisseur()
                        + " sans produit associé");
            }

            ligneRepository.save(ligne);
        }

        CommandeFournisseur savedCommande = commandeRepository.save(commande);
        return convertToDTO(savedCommande);
    }

    public CommandeFournisseurDTO facturerCommande(Integer id) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        if (commande.getStatut() != CommandeFournisseur.StatutCommande.RECUE) {
            throw new RuntimeException("Seules les commandes reçues peuvent être facturées");
        }

        commande.setStatut(CommandeFournisseur.StatutCommande.FACTUREE);
        return convertToDTO(commandeRepository.save(commande));
    }

    public CommandeFournisseurDTO annulerCommande(Integer id, String raison) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        if (commande.getStatut() == CommandeFournisseur.StatutCommande.FACTUREE ||
                commande.getStatut() == CommandeFournisseur.StatutCommande.RECUE) {
            throw new RuntimeException("Impossible d'annuler une commande déjà reçue ou facturée");
        }

        commande.setStatut(CommandeFournisseur.StatutCommande.ANNULEE);

        if (raison != null && !raison.isEmpty()) {
            String notesActuelles = commande.getNotesReception();
            String raisonAnnotation = "Annulation: " + raison;
            commande.setNotesReception(notesActuelles != null
                    ? notesActuelles + " | " + raisonAnnotation
                    : raisonAnnotation);
        }

        return convertToDTO(commandeRepository.save(commande));
    }

    public void supprimerCommande(Integer id) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        if (commande.getStatut() != CommandeFournisseur.StatutCommande.BROUILLON &&
                commande.getStatut() != CommandeFournisseur.StatutCommande.ANNULEE) {
            throw new RuntimeException("Seules les commandes en brouillon ou annulées peuvent être supprimées");
        }

        commande.setActif(false);
        commandeRepository.save(commande);
    }

    public CommandeFournisseurDTO restoreCommande(Integer id) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        commande.setActif(true);
        return convertToDTO(commandeRepository.save(commande));
    }

    public List<CommandeFournisseurDTO> getArchivedCommandes() {
        return commandeRepository.findByActifFalse()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public CommandeFournisseurDTO getCommandeByNumero(String numero) {
        CommandeFournisseur commande = commandeRepository.findByNumeroCommande(numero)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec le numéro: " + numero));
        return convertToDTO(commande);
    }

    public List<CommandeFournisseurDTO> getCommandesByPeriode(LocalDateTime debut, LocalDateTime fin) {
        return commandeRepository.findByDateCommandeBetweenOrderByDateCommandeDesc(debut, fin)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private String genererNumeroCommande() {
        LocalDateTime now = LocalDateTime.now();
        String anneeMois = now.format(DateTimeFormatter.ofPattern("yyyyMM"));
        Long count = commandeRepository.countByNumeroCommandeStartingWith("CMD-" + anneeMois);
        int nextNum = count != null ? count.intValue() + 1 : 1;
        return String.format("CMD-%s-%04d", anneeMois, nextNum);
    }

    private CommandeFournisseurDTO convertToDTO(CommandeFournisseur commande) {
        CommandeFournisseurDTO dto = new CommandeFournisseurDTO();

        dto.setIdCommandeFournisseur(commande.getIdCommandeFournisseur());
        dto.setNumeroCommande(commande.getNumeroCommande());
        dto.setDateCommande(commande.getDateCommande());
        dto.setDateLivraisonPrevue(commande.getDateLivraisonPrevue());
        dto.setDateLivraisonReelle(commande.getDateLivraisonReelle());
        dto.setAdresseLivraison(commande.getAdresseLivraison());
        dto.setStatut(commande.getStatut());
        dto.setTotalHT(commande.getTotalHT());
        dto.setTotalTVA(commande.getTotalTVA());
        dto.setTotalTTC(commande.getTotalTTC());
        dto.setTauxTVA(commande.getTauxTVA());
        dto.setActif(commande.getActif());

        if (commande.getFournisseur() != null) {
            dto.setFournisseur(new FournisseurDTO(commande.getFournisseur()));
        }

        if (commande.getLignesCommande() != null) {
            dto.setLignesCommande(commande.getLignesCommande()
                    .stream()
                    .map(this::convertLigneToDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    private LigneCommandeDTO convertLigneToDTO(LigneCommandeFournisseur ligne) {
        LigneCommandeDTO dto = new LigneCommandeDTO();

        dto.setIdLigneCommandeFournisseur(ligne.getIdLigneCommandeFournisseur());
        dto.setProduitId(ligne.getProduit().getIdProduit());
        dto.setProduitLibelle(ligne.getProduit().getLibelle());
        dto.setQuantite(ligne.getQuantite());
        dto.setPrixUnitaire(ligne.getPrixUnitaire());
        dto.setSousTotalHT(ligne.getSousTotalHT());
        dto.setMontantTVA(ligne.getMontantTVA());
        dto.setSousTotalTTC(ligne.getSousTotalTTC());
        dto.setQuantiteRecue(ligne.getQuantiteRecue());
        dto.setNotes(ligne.getNotes());

        // ✅ AJOUTER LA CATÉGORIE
        if (ligne.getProduit().getCategorie() != null) {
            dto.setCategorie(ligne.getProduit().getCategorie().getNomCategorie());
        }

        // ✅ AJOUTER LE STATUT D'INACTIVITÉ
        // Récupérer le produit et vérifier s'il est actif
        Produit produit = ligne.getProduit();
        if (produit != null) {
            // Selon comment vous stockez l'état du produit
            // Option 1: si vous avez un champ 'active'
            boolean estActif = produit.getActive() != null ? produit.getActive() : true;
            dto.setEstInactif(!estActif);

            // Option 2: si vous avez un champ 'estActif'
            // dto.setEstInactif(!produit.getEstActif());
        } else {
            dto.setEstInactif(false);
        }

        return dto;
    }
}