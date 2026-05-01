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
import org.erp.invera.model.platform.Utilisateur;

import org.erp.invera.repository.erp.*;
import org.erp.invera.repository.platform.utilisateurRepository;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.erp.invera.security.JwtTokenProvider;
import org.springframework.jdbc.core.JdbcTemplate;
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
public class CommandeFournisseurService {

    private final TenantAwareRepository tenantRepo;
    private final JwtTokenProvider jwtTokenProvider;
    private final utilisateurRepository utilisateurRepository;
    private final BonCommandePdfService bonCommandePdfService;
    private final EmailService emailService;
    private final ProduitService produitService;

    private static final BigDecimal TVA_PAR_DEFAUT = new BigDecimal("20");

    // ==================== MÉTHODES MULTI-TENANT ====================

    private Long getClientIdFromToken(String token) {
        return jwtTokenProvider.getClientIdFromToken(token);
    }

    private JdbcTemplate getTenantJdbcTemplate(String token) {
        Long clientId = getClientIdFromToken(token);
        return tenantRepo.getClientJdbcTemplate(clientId, String.valueOf(clientId));
    }

    // ==================== MÉTHODE POUR OBTENIR LE FOURNISSEUR D'UNE COMMANDE ====================
    private Fournisseur getFournisseurFromCommande(CommandeFournisseur commande) {
        if (commande.getLignesCommande() == null || commande.getLignesCommande().isEmpty()) {
            throw new RuntimeException("Impossible de déterminer le fournisseur : la commande n'a aucun produit");
        }

        Fournisseur premierFournisseur = commande.getLignesCommande().get(0).getProduit().getFournisseur();
        if (premierFournisseur == null) {
            throw new RuntimeException("Le produit '" + commande.getLignesCommande().get(0).getProduit().getLibelle() + "' n'a pas de fournisseur associé");
        }

        for (LigneCommandeFournisseur ligne : commande.getLignesCommande()) {
            Fournisseur f = ligne.getProduit().getFournisseur();
            if (f == null) {
                throw new RuntimeException("Le produit '" + ligne.getProduit().getLibelle() + "' n'a pas de fournisseur associé");
            }
            if (!f.getIdFournisseur().equals(premierFournisseur.getIdFournisseur())) {
                throw new RuntimeException("Tous les produits doivent appartenir au même fournisseur.");
            }
        }
        return premierFournisseur;
    }

    // ==================== LISTES ====================
    public List<CommandeFournisseurDTO> getAll(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT * FROM commandes_fournisseurs WHERE actif = true ORDER BY date_commande DESC";

        List<CommandeFournisseur> commandes = tenantRepo.query(sql, (rs, rowNum) -> {
            CommandeFournisseur c = new CommandeFournisseur();
            c.setIdCommandeFournisseur(rs.getInt("id_commande_fournisseur"));
            c.setNumeroCommande(rs.getString("numero_commande"));
            c.setDateCommande(rs.getTimestamp("date_commande") != null ? rs.getTimestamp("date_commande").toLocalDateTime() : null);
            c.setDateLivraisonPrevue(rs.getTimestamp("date_livraison_prevue") != null ? rs.getTimestamp("date_livraison_prevue").toLocalDateTime() : null);
            c.setDateLivraisonReelle(rs.getTimestamp("date_livraison_reelle") != null ? rs.getTimestamp("date_livraison_reelle").toLocalDateTime() : null);
            c.setAdresseLivraison(rs.getString("adresse_livraison"));
            c.setStatut(CommandeFournisseur.StatutCommande.valueOf(rs.getString("statut")));
            c.setTotalHT(rs.getBigDecimal("totalht"));
            c.setTotalTVA(rs.getBigDecimal("totaltva"));
            c.setTotalTTC(rs.getBigDecimal("totalttc"));
            c.setActif(rs.getBoolean("actif"));
            c.setMotifRejet(rs.getString("motif_rejet"));
            c.setDateRejet(rs.getTimestamp("date_rejet") != null ? rs.getTimestamp("date_rejet").toLocalDateTime() : null);
            return c;
        }, clientId, authClientId);

        return commandes.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    // ==================== CRÉATION ====================
    @Transactional
    public CommandeFournisseurDTO creerCommande(CommandeFournisseurDTO dto, String token) {
        if (dto.getLignesCommande() == null || dto.getLignesCommande().isEmpty()) {
            throw new RuntimeException("La commande doit contenir au moins un produit");
        }

        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        JdbcTemplate jdbc = getTenantJdbcTemplate(token);

        String numeroCommande = genererNumeroCommande(jdbc);

        // Insertion commande
        String insertCommandeSql = """
            INSERT INTO commandes_fournisseurs (
                numero_commande, date_commande, date_livraison_prevue,
                adresse_livraison, statut, actif
            ) VALUES (?, ?, ?, ?, ?, ?)
            RETURNING id_commande_fournisseur
            """;

        Integer commandeId = tenantRepo.queryForObject(insertCommandeSql, Integer.class, clientId, authClientId,
                numeroCommande, LocalDateTime.now(), dto.getDateLivraisonPrevue(),
                dto.getAdresseLivraison(), "BROUILLON", true);

        List<LigneCommandeDTO> lignesDTO = new ArrayList<>();
        Fournisseur fournisseurUnique = null;

        for (LigneCommandeDTO ligneDTO : dto.getLignesCommande()) {
            // Récupérer produit avec fournisseur
            String produitSql = """
                SELECT p.*, f.id_fournisseur as fournisseur_id, f.nom_fournisseur, f.email as fournisseur_email
                FROM produit p
                LEFT JOIN fournisseurs f ON p.fournisseur_id = f.id_fournisseur
                WHERE p.id_produit = ?
                """;

            Produit produit = tenantRepo.queryForObject(produitSql, (rs, rowNum) -> {
                Produit p = new Produit();
                p.setIdProduit(rs.getInt("id_produit"));
                p.setLibelle(rs.getString("libelle"));
                p.setPrixAchat(rs.getBigDecimal("prix_achat"));
                p.setActive(rs.getBoolean("is_active"));

                if (rs.getObject("fournisseur_id") != null) {
                    Fournisseur f = new Fournisseur();
                    f.setIdFournisseur(rs.getInt("fournisseur_id"));
                    f.setNomFournisseur(rs.getString("nom_fournisseur"));
                    f.setEmail(rs.getString("fournisseur_email"));
                    p.setFournisseur(f);
                }
                return p;
            }, clientId, authClientId, ligneDTO.getProduitId());

            if (produit == null) {
                throw new RuntimeException("Produit non trouvé: " + ligneDTO.getProduitId());
            }

            if (produit.getFournisseur() == null) {
                throw new RuntimeException("Le produit '" + produit.getLibelle() + "' n'a pas de fournisseur associé");
            }

            if (fournisseurUnique == null) {
                fournisseurUnique = produit.getFournisseur();
            } else if (!fournisseurUnique.getIdFournisseur().equals(produit.getFournisseur().getIdFournisseur())) {
                throw new RuntimeException("Tous les produits doivent appartenir au même fournisseur.");
            }

            BigDecimal tauxTVA = ligneDTO.getTauxTVA() != null ? ligneDTO.getTauxTVA() : TVA_PAR_DEFAUT;
            BigDecimal sousTotalHT = ligneDTO.getPrixUnitaire()
                    .multiply(BigDecimal.valueOf(ligneDTO.getQuantite()))
                    .setScale(3, RoundingMode.HALF_UP);
            BigDecimal montantTVA = sousTotalHT.multiply(tauxTVA)
                    .divide(new BigDecimal("100"), 3, RoundingMode.HALF_UP);
            BigDecimal sousTotalTTC = sousTotalHT.add(montantTVA).setScale(3, RoundingMode.HALF_UP);

            String insertLigneSql = """
                INSERT INTO lignes_commande_fournisseurs (
                    commande_fournisseur_id, produit_id, quantite,
                    prix_unitaire, sous_total_ht, montant_tva, sous_total_ttc, tauxtva, notes, actif
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id_ligne_commande_fournisseur
                """;

            Integer ligneId = tenantRepo.queryForObject(insertLigneSql, Integer.class, clientId, authClientId,
                    commandeId, ligneDTO.getProduitId(), ligneDTO.getQuantite(),
                    ligneDTO.getPrixUnitaire(), sousTotalHT, montantTVA, sousTotalTTC, tauxTVA, ligneDTO.getNotes(), true);

            ligneDTO.setIdLigneCommandeFournisseur(ligneId);
            ligneDTO.setSousTotalHT(sousTotalHT);
            ligneDTO.setMontantTVA(montantTVA);
            ligneDTO.setSousTotalTTC(sousTotalTTC);
            lignesDTO.add(ligneDTO);
        }

        BigDecimal totalHT = lignesDTO.stream()
                .map(LigneCommandeDTO::getSousTotalHT)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalTVA = lignesDTO.stream()
                .map(LigneCommandeDTO::getMontantTVA)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalTTC = lignesDTO.stream()
                .map(LigneCommandeDTO::getSousTotalTTC)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String updateTotauxSql = "UPDATE commandes_fournisseurs SET totalht = ?, totaltva = ?, totalttc = ? WHERE id_commande_fournisseur = ?";
        tenantRepo.update(updateTotauxSql, clientId, authClientId, totalHT, totalTVA, totalTTC, commandeId);

        dto.setIdCommandeFournisseur(commandeId);
        dto.setNumeroCommande(numeroCommande);
        dto.setLignesCommande(lignesDTO);

        return dto;
    }

    // ==================== LECTURE ====================
    public CommandeFournisseurDTO getCommandeById(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT * FROM commandes_fournisseurs WHERE id_commande_fournisseur = ?";

        CommandeFournisseur commande = tenantRepo.queryForObject(sql, (rs, rowNum) -> {
            CommandeFournisseur c = new CommandeFournisseur();
            c.setIdCommandeFournisseur(rs.getInt("id_commande_fournisseur"));
            c.setNumeroCommande(rs.getString("numero_commande"));
            c.setDateCommande(rs.getTimestamp("date_commande") != null ? rs.getTimestamp("date_commande").toLocalDateTime() : null);
            c.setDateLivraisonPrevue(rs.getTimestamp("date_livraison_prevue") != null ? rs.getTimestamp("date_livraison_prevue").toLocalDateTime() : null);
            c.setDateLivraisonReelle(rs.getTimestamp("date_livraison_reelle") != null ? rs.getTimestamp("date_livraison_reelle").toLocalDateTime() : null);
            c.setAdresseLivraison(rs.getString("adresse_livraison"));
            c.setStatut(CommandeFournisseur.StatutCommande.valueOf(rs.getString("statut")));
            c.setTotalHT(rs.getBigDecimal("totalht"));
            c.setTotalTVA(rs.getBigDecimal("totaltva"));
            c.setTotalTTC(rs.getBigDecimal("totalttc"));
            c.setActif(rs.getBoolean("actif"));
            c.setMotifRejet(rs.getString("motif_rejet"));
            c.setDateRejet(rs.getTimestamp("date_rejet") != null ? rs.getTimestamp("date_rejet").toLocalDateTime() : null);
            return c;
        }, clientId, authClientId, id);

        if (commande == null) {
            throw new RuntimeException("Commande non trouvée");
        }

        // Récupérer lignes
        String lignesSql = """
            SELECT l.*, p.libelle as produit_libelle, p.is_active,
                   cat.nom_categorie as categorie_nom
            FROM lignes_commande_fournisseurs l
            JOIN produit p ON l.produit_id = p.id_produit
            LEFT JOIN categorie cat ON p.categorie_id = cat.id_categorie
            WHERE l.commande_fournisseur_id = ? AND l.actif = true
            """;

        List<LigneCommandeDTO> lignes = tenantRepo.query(lignesSql, (rs, rowNum) -> {
            LigneCommandeDTO ligne = new LigneCommandeDTO();
            ligne.setIdLigneCommandeFournisseur(rs.getInt("id_ligne_commande_fournisseur"));
            ligne.setProduitId(rs.getInt("produit_id"));
            ligne.setProduitLibelle(rs.getString("produit_libelle"));
            ligne.setQuantite(rs.getInt("quantite"));
            ligne.setPrixUnitaire(rs.getBigDecimal("prix_unitaire"));
            ligne.setSousTotalHT(rs.getBigDecimal("sous_total_ht"));
            ligne.setMontantTVA(rs.getBigDecimal("montant_tva"));
            ligne.setSousTotalTTC(rs.getBigDecimal("sous_total_ttc"));
            ligne.setQuantiteRecue(rs.getInt("quantite_recue"));
            ligne.setNotes(rs.getString("notes"));
            ligne.setTauxTVA(rs.getBigDecimal("tauxtva"));
            ligne.setCategorie(rs.getString("categorie_nom"));
            ligne.setEstInactif(!rs.getBoolean("is_active"));
            return ligne;
        }, clientId, authClientId, id);

        CommandeFournisseurDTO dto = convertToDTO(commande);
        dto.setLignesCommande(lignes);
        return dto;
    }

    // ==================== MODIFICATION ====================
    @Transactional
    public CommandeFournisseurDTO modifierCommande(Integer id, CommandeFournisseurDTO dto, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        CommandeFournisseurDTO existing = getCommandeById(id, token);
        if (!"REJETEE".equals(existing.getStatut().name())) {
            throw new RuntimeException("Seules les commandes rejetées peuvent être modifiées");
        }

        String updateSql = """
            UPDATE commandes_fournisseurs 
            SET date_livraison_prevue = ?, adresse_livraison = ?
            WHERE id_commande_fournisseur = ?
            """;
        tenantRepo.update(updateSql, clientId, authClientId,
                dto.getDateLivraisonPrevue(), dto.getAdresseLivraison(), id);

        String deleteLignesSql = "DELETE FROM lignes_commande_fournisseurs WHERE commande_fournisseur_id = ?";
        tenantRepo.update(deleteLignesSql, clientId, authClientId, id);

        List<LigneCommandeDTO> nouvellesLignes = new ArrayList<>();
        for (LigneCommandeDTO ligneDTO : dto.getLignesCommande()) {
            BigDecimal tauxTVA = ligneDTO.getTauxTVA() != null ? ligneDTO.getTauxTVA() : TVA_PAR_DEFAUT;
            BigDecimal sousTotalHT = ligneDTO.getPrixUnitaire()
                    .multiply(BigDecimal.valueOf(ligneDTO.getQuantite()))
                    .setScale(3, RoundingMode.HALF_UP);
            BigDecimal montantTVA = sousTotalHT.multiply(tauxTVA)
                    .divide(new BigDecimal("100"), 3, RoundingMode.HALF_UP);
            BigDecimal sousTotalTTC = sousTotalHT.add(montantTVA).setScale(3, RoundingMode.HALF_UP);

            String insertLigneSql = """
                INSERT INTO lignes_commande_fournisseurs (
                    commande_fournisseur_id, produit_id, quantite,
                    prix_unitaire, sous_total_ht, montant_tva, sous_total_ttc, tauxtva, notes, actif
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

            tenantRepo.update(insertLigneSql, clientId, authClientId,
                    id, ligneDTO.getProduitId(), ligneDTO.getQuantite(),
                    ligneDTO.getPrixUnitaire(), sousTotalHT, montantTVA, sousTotalTTC, tauxTVA, ligneDTO.getNotes(), true);

            ligneDTO.setSousTotalHT(sousTotalHT);
            ligneDTO.setMontantTVA(montantTVA);
            ligneDTO.setSousTotalTTC(sousTotalTTC);
            nouvellesLignes.add(ligneDTO);
        }

        BigDecimal totalHT = nouvellesLignes.stream().map(LigneCommandeDTO::getSousTotalHT).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalTVA = nouvellesLignes.stream().map(LigneCommandeDTO::getMontantTVA).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalTTC = nouvellesLignes.stream().map(LigneCommandeDTO::getSousTotalTTC).reduce(BigDecimal.ZERO, BigDecimal::add);

        String updateTotauxSql = "UPDATE commandes_fournisseurs SET totalht = ?, totaltva = ?, totalttc = ? WHERE id_commande_fournisseur = ?";
        tenantRepo.update(updateTotauxSql, clientId, authClientId, totalHT, totalTVA, totalTTC, id);

        return getCommandeById(id, token);
    }

    // ==================== VALIDATION ====================
    @Transactional
    public CommandeFournisseurDTO validerCommande(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String checkSql = "SELECT statut FROM commandes_fournisseurs WHERE id_commande_fournisseur = ?";
        String statut = tenantRepo.queryForObject(checkSql, String.class, clientId, authClientId, id);

        if (!"BROUILLON".equals(statut)) {
            throw new RuntimeException("Seules les commandes en brouillon peuvent être validées");
        }

        String updateSql = "UPDATE commandes_fournisseurs SET statut = 'VALIDEE' WHERE id_commande_fournisseur = ?";
        tenantRepo.update(updateSql, clientId, authClientId, id);

        return getCommandeById(id, token);
    }

    // ==================== ENVOI ====================
    @Transactional
    public CommandeFournisseurDTO envoyerCommande(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String checkSql = "SELECT statut FROM commandes_fournisseurs WHERE id_commande_fournisseur = ?";
        String statut = tenantRepo.queryForObject(checkSql, String.class, clientId, authClientId, id);

        if (!"VALIDEE".equals(statut)) {
            throw new RuntimeException("Seules les commandes validées peuvent être envoyées");
        }

        String updateSql = "UPDATE commandes_fournisseurs SET statut = 'ENVOYEE' WHERE id_commande_fournisseur = ?";
        tenantRepo.update(updateSql, clientId, authClientId, id);

        return getCommandeById(id, token);
    }

    // ==================== RÉCEPTION ====================
    @Transactional
    public CommandeFournisseurDTO recevoirCommande(Integer id, ReceptionDTO receptionData, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        CommandeFournisseurDTO commande = getCommandeById(id, token);
        if (!"ENVOYEE".equals(commande.getStatut().name())) {
            throw new RuntimeException("Seules les commandes envoyées peuvent être reçues");
        }

        String updateSql = """
            UPDATE commandes_fournisseurs 
            SET statut = 'RECUE', date_livraison_reelle = ?, 
                numero_bon_livraison = ?, notes_reception = ?
            WHERE id_commande_fournisseur = ?
            """;

        tenantRepo.update(updateSql, clientId, authClientId,
                LocalDateTime.now(), receptionData.getNumeroBL(), receptionData.getNotes(), id);

        Map<Integer, Integer> quantitesRecues = receptionData.getQuantitesRecues() != null ? receptionData.getQuantitesRecues() : new HashMap<>();

        for (LigneCommandeDTO ligne : commande.getLignesCommande()) {
            Integer quantiteRecue = quantitesRecues.get(ligne.getIdLigneCommandeFournisseur());
            if (quantiteRecue != null && quantiteRecue > 0) {
                String updateStockSql = "UPDATE produit SET quantite_stock = quantite_stock + ? WHERE id_produit = ?";
                tenantRepo.update(updateStockSql, clientId, authClientId, quantiteRecue, ligne.getProduitId());

                String mouvementSql = """
                    INSERT INTO stock_movement (
                        produit_id, type_mouvement, quantite, 
                        date_mouvement, type_document, commentaire
                    ) VALUES (?, 'ENTREE', ?, ?, 'COMMANDE_FOURNISSEUR', ?)
                    """;
                tenantRepo.update(mouvementSql, clientId, authClientId,
                        ligne.getProduitId(), quantiteRecue, LocalDateTime.now(),
                        "Réception commande " + commande.getNumeroCommande());
            }
        }

        return getCommandeById(id, token);
    }

    // ==================== REJET ====================
    @Transactional
    public CommandeFournisseurDTO rejeterCommande(Integer id, String motifRejet, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        if (motifRejet == null || motifRejet.trim().isEmpty()) {
            throw new RuntimeException("Le motif de rejet est obligatoire");
        }

        String updateSql = """
            UPDATE commandes_fournisseurs 
            SET statut = 'REJETEE', motif_rejet = ?, date_rejet = ?
            WHERE id_commande_fournisseur = ?
            """;

        tenantRepo.update(updateSql, clientId, authClientId, motifRejet, LocalDateTime.now(), id);

        return getCommandeById(id, token);
    }

    // ==================== RENVOYER EN ATTENTE ====================
    @Transactional
    public CommandeFournisseurDTO renvoyerAttente(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String updateSql = """
            UPDATE commandes_fournisseurs 
            SET statut = 'BROUILLON', motif_rejet = NULL, date_rejet = NULL
            WHERE id_commande_fournisseur = ?
            """;

        tenantRepo.update(updateSql, clientId, authClientId, id);

        return getCommandeById(id, token);
    }

    // ==================== SUPPRESSION ====================
    @Transactional
    public void supprimerCommande(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        CommandeFournisseurDTO commande = getCommandeById(id, token);
        String statut = commande.getStatut().name();

        if (!"BROUILLON".equals(statut) && !"REJETEE".equals(statut)) {
            throw new RuntimeException("Seules les commandes en brouillon ou rejetées peuvent être supprimées");
        }

        String deleteLignesSql = "DELETE FROM lignes_commande_fournisseurs WHERE commande_fournisseur_id = ?";
        tenantRepo.update(deleteLignesSql, clientId, authClientId, id);

        String deleteCommandeSql = "DELETE FROM commandes_fournisseurs WHERE id_commande_fournisseur = ?";
        tenantRepo.update(deleteCommandeSql, clientId, authClientId, id);
    }

    // ==================== ARCHIVAGE ====================
    public List<CommandeFournisseurDTO> getArchivedCommandes(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        mettreAJourCommandesAnciennes(token);

        String sql = "SELECT * FROM commandes_fournisseurs WHERE actif = false ORDER BY date_commande DESC";

        List<CommandeFournisseur> commandes = tenantRepo.query(sql, (rs, rowNum) -> {
            CommandeFournisseur c = new CommandeFournisseur();
            c.setIdCommandeFournisseur(rs.getInt("id_commande_fournisseur"));
            c.setNumeroCommande(rs.getString("numero_commande"));
            c.setDateCommande(rs.getTimestamp("date_commande") != null ? rs.getTimestamp("date_commande").toLocalDateTime() : null);
            c.setStatut(CommandeFournisseur.StatutCommande.valueOf(rs.getString("statut")));
            return c;
        }, clientId, authClientId);

        return commandes.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Transactional
    public void mettreAJourCommandesAnciennes(String token) {
        LocalDateTime dateLimite = LocalDateTime.now().minusYears(5);
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "UPDATE commandes_fournisseurs SET actif = false WHERE date_commande < ? AND actif = true";
        tenantRepo.update(sql, clientId, authClientId, dateLimite);
    }

    // ==================== UTILITAIRES ====================
    public CommandeFournisseurDTO getCommandeByNumero(String numero, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT id_commande_fournisseur FROM commandes_fournisseurs WHERE numero_commande = ?";
        Integer id = tenantRepo.queryForObject(sql, Integer.class, clientId, authClientId, numero);

        if (id == null) {
            throw new RuntimeException("Commande non trouvée avec le numéro: " + numero);
        }

        return getCommandeById(id, token);
    }

    public List<CommandeFournisseurDTO> getCommandesByPeriode(LocalDateTime debut, LocalDateTime fin, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = """
            SELECT * FROM commandes_fournisseurs 
            WHERE date_commande BETWEEN ? AND ? 
            ORDER BY date_commande DESC
            """;

        List<CommandeFournisseur> commandes = tenantRepo.query(sql, (rs, rowNum) -> {
            CommandeFournisseur c = new CommandeFournisseur();
            c.setIdCommandeFournisseur(rs.getInt("id_commande_fournisseur"));
            c.setNumeroCommande(rs.getString("numero_commande"));
            c.setDateCommande(rs.getTimestamp("date_commande") != null ? rs.getTimestamp("date_commande").toLocalDateTime() : null);
            c.setStatut(CommandeFournisseur.StatutCommande.valueOf(rs.getString("statut")));
            return c;
        }, clientId, authClientId, debut, fin);

        return commandes.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    private String genererNumeroCommande(JdbcTemplate jdbc) {
        LocalDateTime now = LocalDateTime.now();
        String anneeMois = now.format(DateTimeFormatter.ofPattern("yyyyMM"));
        String prefix = "BC-" + anneeMois;

        String countSql = "SELECT COUNT(*) FROM commandes_fournisseurs WHERE numero_commande LIKE ?";
        Long count = jdbc.queryForObject(countSql, Long.class, prefix + "%");
        int nextNum = (count != null ? count.intValue() : 0) + 1;
        return String.format("BC-%s-%04d", anneeMois, nextNum);
    }

    // ==================== CONVERSION ====================
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
        dto.setActif(commande.getActif());
        dto.setMotifRejet(commande.getMotifRejet());
        dto.setDateRejet(commande.getDateRejet());
        return dto;
    }
}