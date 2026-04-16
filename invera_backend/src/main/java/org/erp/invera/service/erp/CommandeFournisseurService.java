package org.erp.invera.service.erp;

import lombok.RequiredArgsConstructor;

import org.erp.invera.dto.erp.commandeFornisseurdto.CommandeFournisseurDTO;
import org.erp.invera.dto.erp.commandeFornisseurdto.LigneCommandeDTO;
import org.erp.invera.dto.erp.commandeFornisseurdto.ReceptionDTO;
import org.erp.invera.dto.erp.fournisseurdto.FournisseurDTO;

import org.erp.invera.model.erp.Fournisseurs.CommandeFournisseur;
import org.erp.invera.model.erp.Fournisseurs.Fournisseur;
import org.erp.invera.model.erp.Fournisseurs.LigneCommandeFournisseur;
import org.erp.invera.model.erp.Produit;
import org.erp.invera.model.erp.stock.StockMovement;
import org.erp.invera.model.erp.Notification;
import org.erp.invera.model.erp.Role;
import org.erp.invera.model.erp.User;

import org.erp.invera.repository.erp.*;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional
public class CommandeFournisseurService {

    private final CommandeFournisseurRepository commandeRepository;
    private final FournisseurRepository fournisseurRepository;
    private final ProduitRepository produitRepository;
    private final LigneCommandeFournisseurRepository ligneRepository;
    private final StockMovementRepository stockMovementRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final BonCommandePdfService bonCommandePdfService;
    private final EmailService emailService;
    private final ProduitService produitService;

    private static final BigDecimal TVA_PAR_DEFAUT = new BigDecimal("20");

    // ==================== MÉTHODE POUR OBTENIR LE FOURNISSEUR D'UNE COMMANDE ====================
    /**
     * Récupère le fournisseur à partir des produits de la commande.
     * Tous les produits doivent avoir le même fournisseur.
     */
    private Fournisseur getFournisseurFromCommande(CommandeFournisseur commande) {
        if (commande.getLignesCommande() == null || commande.getLignesCommande().isEmpty()) {
            throw new RuntimeException("Impossible de déterminer le fournisseur : la commande n'a aucun produit");
        }

        Fournisseur premierFournisseur = commande.getLignesCommande().get(0).getProduit().getFournisseur();
        if (premierFournisseur == null) {
            throw new RuntimeException("Le produit '" + commande.getLignesCommande().get(0).getProduit().getLibelle() + "' n'a pas de fournisseur associé");
        }

        // Vérifier que tous les produits ont le même fournisseur
        for (LigneCommandeFournisseur ligne : commande.getLignesCommande()) {
            Fournisseur f = ligne.getProduit().getFournisseur();
            if (f == null) {
                throw new RuntimeException("Le produit '" + ligne.getProduit().getLibelle() + "' n'a pas de fournisseur associé");
            }
            if (!f.getIdFournisseur().equals(premierFournisseur.getIdFournisseur())) {
                throw new RuntimeException("Tous les produits doivent appartenir au même fournisseur. "
                        + "Produit '" + ligne.getProduit().getLibelle() + "' appartient à '" + f.getNomFournisseur()
                        + "' mais le premier produit appartient à '" + premierFournisseur.getNomFournisseur() + "'");
            }
        }

        return premierFournisseur;
    }

    // ==================== LISTES ====================
    public List<CommandeFournisseurDTO> getAll() {
        return commandeRepository.findByActifTrue()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ==================== CRÉATION ====================
    public CommandeFournisseurDTO creerCommande(CommandeFournisseurDTO dto) {
        // 1. Vérifier qu'il y a des produits
        if (dto.getLignesCommande() == null || dto.getLignesCommande().isEmpty()) {
            throw new RuntimeException("La commande doit contenir au moins un produit");
        }

        // 2. Créer la commande (SANS fournisseur pour l'instant)
        CommandeFournisseur commande = new CommandeFournisseur();
        commande.setNumeroCommande(genererNumeroCommande());
        commande.setDateCommande(LocalDateTime.now());
        commande.setDateLivraisonPrevue(dto.getDateLivraisonPrevue());
        commande.setAdresseLivraison(dto.getAdresseLivraison());
        // ❌ PAS de commande.setFournisseur()
        commande.setStatut(CommandeFournisseur.StatutCommande.BROUILLON);
        commande.setActif(true);

        // 3. Traiter les lignes et vérifier l'unicité du fournisseur
        Fournisseur fournisseurUnique = null;
        List<LigneCommandeFournisseur> lignes = new ArrayList<>();

        for (LigneCommandeDTO ligneDTO : dto.getLignesCommande()) {
            Produit produit = produitRepository.findById(ligneDTO.getProduitId())
                    .orElseThrow(() -> new RuntimeException("Produit non trouvé: " + ligneDTO.getProduitId()));

            // Vérifier que le produit a un fournisseur
            if (produit.getFournisseur() == null) {
                throw new RuntimeException("Le produit '" + produit.getLibelle() + "' n'a pas de fournisseur associé");
            }

            // Vérifier l'unicité du fournisseur
            if (fournisseurUnique == null) {
                fournisseurUnique = produit.getFournisseur();
            } else if (!fournisseurUnique.getIdFournisseur().equals(produit.getFournisseur().getIdFournisseur())) {
                throw new RuntimeException("Tous les produits doivent appartenir au même fournisseur. "
                        + "Le produit '" + produit.getLibelle() + "' appartient à '" + produit.getFournisseur().getNomFournisseur()
                        + "' mais les autres produits appartiennent à '" + fournisseurUnique.getNomFournisseur() + "'");
            }

            if (ligneDTO.getQuantite() <= 0) {
                throw new RuntimeException("La quantité doit être > 0 pour le produit: " + produit.getLibelle());
            }
            if (ligneDTO.getPrixUnitaire() == null || ligneDTO.getPrixUnitaire().compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("Le prix unitaire doit être > 0 pour le produit: " + produit.getLibelle());
            }

            LigneCommandeFournisseur ligne = new LigneCommandeFournisseur();
            ligne.setCommandeFournisseur(commande);
            ligne.setProduit(produit);
            ligne.setQuantite(ligneDTO.getQuantite());
            ligne.setPrixUnitaire(ligneDTO.getPrixUnitaire());

            // Taux TVA
            BigDecimal tauxTVA;
            if (ligneDTO.getTauxTVA() != null) {
                tauxTVA = ligneDTO.getTauxTVA();
            } else if (produit.getCategorie() != null && produit.getCategorie().getTauxTVA() != null) {
                tauxTVA = produit.getCategorie().getTauxTVA();
            } else {
                tauxTVA = TVA_PAR_DEFAUT;
            }
            ligne.setTauxTVA(tauxTVA);

            // Calculs
            BigDecimal sousTotalHT = ligne.getPrixUnitaire()
                    .multiply(BigDecimal.valueOf(ligne.getQuantite()))
                    .setScale(3, RoundingMode.HALF_UP);
            BigDecimal montantTVA = sousTotalHT.multiply(tauxTVA)
                    .divide(new BigDecimal("100"), 3, RoundingMode.HALF_UP);
            BigDecimal sousTotalTTC = sousTotalHT.add(montantTVA).setScale(3, RoundingMode.HALF_UP);

            ligne.setSousTotalHT(sousTotalHT);
            ligne.setMontantTVA(montantTVA);
            ligne.setSousTotalTTC(sousTotalTTC);
            ligne.setNotes(ligneDTO.getNotes());

            lignes.add(ligne);
        }

        commande.setLignesCommande(lignes);

        // 4. Calcul des totaux
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
        notifierAdminNouvelleDemande(saved, fournisseurUnique);
        return convertToDTO(saved);
    }

    // ==================== LECTURE ====================
    public CommandeFournisseurDTO getCommandeById(Integer id) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));
        return convertToDTO(commande);
    }

    // ==================== MODIFICATION ====================
    public CommandeFournisseurDTO modifierCommande(Integer id, CommandeFournisseurDTO dto) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        if (commande.getStatut() != CommandeFournisseur.StatutCommande.REJETEE) {
            throw new RuntimeException("Seules les commandes rejetées peuvent être modifiées");
        }

        commande.setDateLivraisonPrevue(dto.getDateLivraisonPrevue());
        commande.setAdresseLivraison(dto.getAdresseLivraison());

        // Gestion des lignes
        Map<Integer, LigneCommandeFournisseur> lignesExistantes = commande.getLignesCommande()
                .stream()
                .collect(Collectors.toMap(LigneCommandeFournisseur::getIdLigneCommandeFournisseur, l -> l));

        List<LigneCommandeFournisseur> nouvellesLignes = new ArrayList<>();
        Fournisseur fournisseurUnique = null;

        for (LigneCommandeDTO ligneDTO : dto.getLignesCommande()) {
            LigneCommandeFournisseur ligne;
            if (ligneDTO.getIdLigneCommandeFournisseur() != null &&
                    lignesExistantes.containsKey(ligneDTO.getIdLigneCommandeFournisseur())) {
                ligne = lignesExistantes.get(ligneDTO.getIdLigneCommandeFournisseur());
            } else {
                ligne = new LigneCommandeFournisseur();
                ligne.setCommandeFournisseur(commande);
            }

            Produit produit = produitRepository.findById(ligneDTO.getProduitId())
                    .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

            // Vérifier que le produit a un fournisseur
            if (produit.getFournisseur() == null) {
                throw new RuntimeException("Le produit '" + produit.getLibelle() + "' n'a pas de fournisseur associé");
            }

            // Vérifier l'unicité du fournisseur
            if (fournisseurUnique == null) {
                fournisseurUnique = produit.getFournisseur();
            } else if (!fournisseurUnique.getIdFournisseur().equals(produit.getFournisseur().getIdFournisseur())) {
                throw new RuntimeException("Tous les produits doivent appartenir au même fournisseur");
            }

            ligne.setProduit(produit);
            ligne.setQuantite(ligneDTO.getQuantite());
            ligne.setPrixUnitaire(ligneDTO.getPrixUnitaire());

            BigDecimal tauxTVA;
            if (ligneDTO.getTauxTVA() != null) {
                tauxTVA = ligneDTO.getTauxTVA();
            } else if (produit.getCategorie() != null && produit.getCategorie().getTauxTVA() != null) {
                tauxTVA = produit.getCategorie().getTauxTVA();
            } else {
                tauxTVA = TVA_PAR_DEFAUT;
            }
            ligne.setTauxTVA(tauxTVA);
            ligne.calculerTotaux(tauxTVA);

            nouvellesLignes.add(ligne);
        }

        commande.getLignesCommande().clear();
        commande.getLignesCommande().addAll(nouvellesLignes);

        // Recalcul des totaux
        BigDecimal totalHT = nouvellesLignes.stream()
                .map(LigneCommandeFournisseur::getSousTotalHT)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);
        BigDecimal totalTVA = nouvellesLignes.stream()
                .map(LigneCommandeFournisseur::getMontantTVA)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);
        BigDecimal totalTTC = nouvellesLignes.stream()
                .map(LigneCommandeFournisseur::getSousTotalTTC)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);

        commande.setTotalHT(totalHT);
        commande.setTotalTVA(totalTVA);
        commande.setTotalTTC(totalTTC);

        CommandeFournisseur saved = commandeRepository.save(commande);
        return convertToDTO(saved);
    }

    // ==================== VALIDATION ====================
    public CommandeFournisseurDTO validerCommande(Integer id) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));
        if (commande.getStatut() != CommandeFournisseur.StatutCommande.BROUILLON) {
            throw new RuntimeException("Seules les commandes en brouillon peuvent être validées");
        }
        commande.setStatut(CommandeFournisseur.StatutCommande.VALIDEE);
        return convertToDTO(commandeRepository.save(commande));
    }

    // ==================== ENVOI ====================
    public CommandeFournisseurDTO envoyerCommande(Integer id) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        if (commande.getStatut() != CommandeFournisseur.StatutCommande.VALIDEE) {
            throw new RuntimeException("Seules les commandes validées peuvent être envoyées");
        }

        commande.setStatut(CommandeFournisseur.StatutCommande.ENVOYEE);
        CommandeFournisseur savedCommande = commandeRepository.save(commande);

        // ✅ Récupérer le fournisseur à partir des produits
        final Fournisseur fournisseur = getFournisseurFromCommande(savedCommande);

        new Thread(() -> {
            try {
                byte[] pdfContent = bonCommandePdfService.genererBonCommandePdf(savedCommande);
                emailService.envoyerBonCommande(
                        fournisseur.getEmail(),
                        fournisseur.getNomFournisseur(),
                        savedCommande.getNumeroCommande(),
                        pdfContent
                );
            } catch (Exception e) {
                System.err.println("❌ Erreur envoi email: " + e.getMessage());
                e.printStackTrace();
            }
        }).start();

        return convertToDTO(savedCommande);
    }

    // ==================== RÉCEPTION ====================
    public CommandeFournisseurDTO recevoirCommande(Integer id, ReceptionDTO receptionData) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        if (commande.getStatut() != CommandeFournisseur.StatutCommande.ENVOYEE) {
            throw new RuntimeException("Seules les commandes envoyées peuvent être reçues");
        }

        commande.setNumeroBonLivraison(receptionData.getNumeroBL());
        commande.setNotesReception(receptionData.getNotes());
        commande.setDateLivraisonReelle(LocalDateTime.now());
        commande.setStatut(CommandeFournisseur.StatutCommande.RECUE);

        Map<Integer, Integer> quantitesRecues = receptionData.getQuantitesRecues() != null
                ? receptionData.getQuantitesRecues() : new HashMap<>();
        Map<Integer, Boolean> produitsAReactiver = receptionData.getProduitsAReactiver() != null
                ? receptionData.getProduitsAReactiver() : new HashMap<>();

        List<StockMovement> mouvements = new ArrayList<>();
        int totalProduitsReactives = 0;
        BigDecimal totalValeurStock = BigDecimal.ZERO;

        for (LigneCommandeFournisseur ligne : commande.getLignesCommande()) {
            Integer ligneId = ligne.getIdLigneCommandeFournisseur();
            Integer quantiteRecue = quantitesRecues.get(ligneId);

            if (quantiteRecue == null || quantiteRecue <= 0) {
                continue;
            }

            Integer quantiteCommandee = ligne.getQuantite();
            if (quantiteCommandee != null && quantiteRecue > quantiteCommandee) {
                throw new RuntimeException("Quantité reçue supérieure à la quantité commandée");
            }

            ligne.setQuantiteRecue(quantiteRecue);
            Produit produit = ligne.getProduit();

            if (produit != null) {
                int stockAvant = produit.getQuantiteStock() != null ? produit.getQuantiteStock() : 0;
                int nouvelleQuantite = stockAvant + quantiteRecue;
                produit.setQuantiteStock(nouvelleQuantite);

                BigDecimal prixUnitaire = ligne.getPrixUnitaire() != null ? ligne.getPrixUnitaire() : BigDecimal.ZERO;
                BigDecimal valeurLigne = prixUnitaire.multiply(BigDecimal.valueOf(quantiteRecue));
                totalValeurStock = totalValeurStock.add(valeurLigne);

                StockMovement mouvement = new StockMovement();
                mouvement.setProduit(produit);
                mouvement.setTypeMouvement(StockMovement.MovementType.ENTREE);
                mouvement.setQuantite(quantiteRecue);
                mouvement.setStockAvant(stockAvant);
                mouvement.setStockApres(nouvelleQuantite);
                mouvement.setPrixUnitaire(prixUnitaire);
                mouvement.setValeurTotale(valeurLigne);
                mouvement.setTypeDocument("COMMANDE_FOURNISSEUR");
                mouvement.setCommentaire("Réception commande " + commande.getNumeroCommande() +
                        " - BL: " + receptionData.getNumeroBL());
                mouvement.setDateMouvement(LocalDateTime.now());
                mouvements.add(mouvement);

                Boolean doitReactiver = produitsAReactiver.get(ligneId);
                boolean reactiver = doitReactiver != null && doitReactiver;
                boolean estInactif = produit.getActive() == null || !produit.getActive();

                if (estInactif && reactiver && quantiteRecue > 0) {
                    produit.setActive(true);
                    totalProduitsReactives++;
                }

                produitService.updateStockStatus(produit);
                produitRepository.save(produit);
            }
            ligneRepository.save(ligne);
        }

        if (!mouvements.isEmpty()) {
            stockMovementRepository.saveAll(mouvements);
        }

        CommandeFournisseur savedCommande = commandeRepository.save(commande);
        return convertToDTO(savedCommande);
    }

    // ==================== REJET ====================
    @Transactional
    public CommandeFournisseurDTO rejeterCommande(Integer id, String motifRejet) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        if (commande.getStatut() != CommandeFournisseur.StatutCommande.BROUILLON) {
            throw new RuntimeException("Seules les commandes en attente peuvent être rejetées");
        }
        if (motifRejet == null || motifRejet.trim().isEmpty()) {
            throw new RuntimeException("Le motif de rejet est obligatoire");
        }

        commande.setStatut(CommandeFournisseur.StatutCommande.REJETEE);
        commande.setMotifRejet(motifRejet);
        commande.setDateRejet(LocalDateTime.now());

        CommandeFournisseur saved = commandeRepository.save(commande);
        return convertToDTO(saved);
    }

    @Transactional
    public CommandeFournisseurDTO renvoyerAttente(Integer id) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        if (commande.getStatut() != CommandeFournisseur.StatutCommande.REJETEE) {
            throw new RuntimeException("Seules les commandes rejetées peuvent être renvoyées en attente");
        }

        commande.setStatut(CommandeFournisseur.StatutCommande.BROUILLON);
        commande.setMotifRejet(null);
        commande.setDateRejet(null);

        CommandeFournisseur saved = commandeRepository.save(commande);
        notifierAdminDemandeRenvoyee(saved);
        return convertToDTO(saved);
    }

    // ==================== SUPPRESSION ====================
    public void supprimerCommande(Integer id) {
        CommandeFournisseur commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        if (commande.getStatut() != CommandeFournisseur.StatutCommande.BROUILLON
                && commande.getStatut() != CommandeFournisseur.StatutCommande.REJETEE) {
            throw new RuntimeException("Seules les commandes en brouillon ou rejetées peuvent être supprimées");
        }
        commandeRepository.delete(commande);
    }

    // ==================== ARCHIVAGE ====================
    public List<CommandeFournisseurDTO> getArchivedCommandes() {
        mettreAJourCommandesAnciennes();
        return commandeRepository.findByActifFalse()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void mettreAJourCommandesAnciennes() {
        LocalDateTime dateLimite = LocalDateTime.now().minusYears(5);
        List<CommandeFournisseur> commandesASupprimer = commandeRepository.findByActifTrue()
                .stream()
                .filter(commande -> commande.getDateCommande().isBefore(dateLimite))
                .collect(Collectors.toList());

        for (CommandeFournisseur commande : commandesASupprimer) {
            commande.setActif(false);
            commandeRepository.save(commande);
        }
    }

    // ==================== UTILITAIRES ====================
    public CommandeFournisseurDTO getCommandeByNumero(String numero) {
        CommandeFournisseur commande = commandeRepository.findByNumeroCommande(numero)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));
        return convertToDTO(commande);
    }

    public List<CommandeFournisseurDTO> getCommandesByPeriode(LocalDateTime debut, LocalDateTime fin) {
        return commandeRepository.findByDateCommandeBetweenOrderByDateCommandeDesc(debut, fin)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ==================== NOTIFICATIONS ====================
    private void notifierAdminNouvelleDemande(CommandeFournisseur commande, Fournisseur fournisseur) {
        creerNotificationAdminPourCommande(commande, "PROCUREMENT_REQUEST_CREATED", fournisseur);
    }

    private void notifierAdminDemandeRenvoyee(CommandeFournisseur commande) {
        Fournisseur fournisseur = getFournisseurFromCommande(commande);
        creerNotificationAdminPourCommande(commande, "PROCUREMENT_REQUEST_RESUBMITTED", fournisseur);
    }

    private void creerNotificationAdminPourCommande(CommandeFournisseur commande, String notificationType, Fournisseur fournisseur) {
        User currentUser = getCurrentUser();
        if (currentUser == null || currentUser.getRole() != Role.RESPONSABLE_ACHAT) return;

        String reference = commande.getNumeroCommande();
        String fournisseurNom = fournisseur != null ? fournisseur.getNomFournisseur() : "inconnu";
        String userFullName = buildUserFullName(currentUser);

        String message = "PROCUREMENT_REQUEST_RESUBMITTED".equals(notificationType)
                ? String.format("%s a renvoyé la commande %s pour %s", userFullName, reference, fournisseurNom)
                : String.format("%s a créé la commande %s pour %s", userFullName, reference, fournisseurNom);

        notificationRepository.save(new Notification(
                notificationType, message, currentUser.getEmail(), userFullName,
                "ADMIN", "COMMANDE_FOURNISSEUR",
                Long.valueOf(commande.getIdCommandeFournisseur()), reference
        ));
    }

    // ==================== CONVERSIONS ====================
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
        dto.setMotifRejet(commande.getMotifRejet());
        dto.setDateRejet(commande.getDateRejet());

        // ✅ Récupérer le fournisseur à partir des produits
        try {
            Fournisseur fournisseur = getFournisseurFromCommande(commande);
            dto.setFournisseur(new FournisseurDTO(fournisseur));
        } catch (Exception e) {
            // La commande n'a pas de produits ou pas de fournisseur cohérent
            dto.setFournisseur(null);
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
        dto.setTauxTVA(ligne.getTauxTVA());

        // ✅ AJOUTER LA CATÉGORIE
        if (ligne.getProduit().getCategorie() != null) {
            dto.setCategorie(ligne.getProduit().getCategorie().getNomCategorie());
        }

        // ✅ AJOUTER LE STATUT D'INACTIVITÉ
        Produit produit = ligne.getProduit();
        if (produit != null) {
            dto.setEstInactif(!produit.getActive());
        } else {
            dto.setEstInactif(false);
        }

        // ✅ AJOUTER LES INFORMATIONS DU FOURNISSEUR (optionnel, car déjà dans la commande)
        if (produit != null && produit.getFournisseur() != null) {
            dto.setFournisseurId(produit.getFournisseur().getIdFournisseur());
            dto.setFournisseurNom(produit.getFournisseur().getNomFournisseur());
        }

        return dto;
    }
    // ==================== MÉTHODES PRIVÉES ====================
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    private String buildUserFullName(User user) {
        String fullName = Stream.of(user.getPrenom(), user.getNom())
                .filter(value -> value != null && !value.isBlank())
                .collect(Collectors.joining(" "))
                .trim();
        return fullName.isBlank() ? user.getEmail() : fullName;
    }

    private String genererNumeroCommande() {
        LocalDateTime now = LocalDateTime.now();
        String anneeMois = now.format(DateTimeFormatter.ofPattern("yyyyMM"));
        Long count = commandeRepository.countByNumeroCommandeStartingWith("BC-" + anneeMois);
        int nextNum = count != null ? count.intValue() + 1 : 1;
        return String.format("BC-%s-%04d", anneeMois, nextNum);
    }
}