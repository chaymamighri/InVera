package org.erp.invera.service.erp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.erp.commandeFornisseurdto.CommandeFournisseurDTO;
import org.erp.invera.dto.erp.commandeFornisseurdto.LigneCommandeDTO;
import org.erp.invera.dto.erp.commandeFornisseurdto.ReceptionDTO;
import org.erp.invera.dto.erp.fournisseurdto.FournisseurDTO;
import org.erp.invera.model.erp.Fournisseurs.CommandeFournisseur;
import org.erp.invera.model.erp.Fournisseurs.Fournisseur;
import org.erp.invera.model.erp.Fournisseurs.LigneCommandeFournisseur;
import org.erp.invera.model.erp.Produit;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.erp.invera.security.JwtTokenProvider;
import org.erp.invera.model.platform.Client;
import org.erp.invera.service.platform.ClientPlatformService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j  // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ AJOUTER pour utiliser log.info(), log.error()
@Service
@RequiredArgsConstructor
public class CommandeFournisseurService {

    private final TenantAwareRepository tenantRepo;
    private final JwtTokenProvider jwtTokenProvider;
    private final BonCommandePdfService bonCommandePdfService;
    private final EmailService emailService;
    private final ClientPlatformService clientService;

    private static final BigDecimal TVA_PAR_DEFAUT = new BigDecimal("20");
    private static final String ADMIN_CLIENT_ROLE = "ADMIN_CLIENT";
    private static final String PROCUREMENT_ROLE = "RESPONSABLE_ACHAT";
    private static final String COMMANDE_FOURNISSEUR_ENTITY = "COMMANDE_FOURNISSEUR";

    // ==================== MÃƒÆ’Ã¢â‚¬Â°THODES MULTI-TENANT ====================

    private Long getClientIdFromToken(String token) {
        return jwtTokenProvider.getClientIdFromToken(token);
    }

    private JdbcTemplate getTenantJdbcTemplate(String token) {
        Long clientId = getClientIdFromToken(token);
        return tenantRepo.getClientJdbcTemplate(clientId, String.valueOf(clientId));
    }

    // ==================== RÃƒÆ’Ã¢â‚¬Â°CUPÃƒÆ’Ã¢â‚¬Â°RATION COMPLÃƒÆ’Ã‹â€ TE POUR PDF ====================

    private void createNotification(Long clientId, String authClientId, String type, String message,
                                    String targetRole, Integer commandeId, String numeroCommande) {
        String sql = """
            INSERT INTO notifications (
                created_at, message, read, type, target_role,
                entity_type, entity_id, entity_reference
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """;

        tenantRepo.updateWithAuth(sql, clientId, authClientId,
                LocalDateTime.now(),
                message,
                false,
                type,
                targetRole,
                COMMANDE_FOURNISSEUR_ENTITY,
                commandeId != null ? commandeId.longValue() : null,
                numeroCommande
        );
    }

    private String getNumeroCommande(Long clientId, String authClientId, Integer id) {
        String numeroSql = "SELECT numero_commande FROM commandes_fournisseurs WHERE id_commande_fournisseur = ?";
        return tenantRepo.queryForObjectAuth(numeroSql, String.class, clientId, authClientId, id);
    }
    /**
     * RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â¨re une commande avec toutes ses lignes et produits (multi-tenant)
     */
    private CommandeFournisseur getCommandeEntity(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // 1. RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer la commande
        String sql = """
            SELECT * FROM commandes_fournisseurs 
            WHERE id_commande_fournisseur = ? AND actif = true
            """;

        CommandeFournisseur commande = tenantRepo.queryForObjectAuth(sql, (rs, rowNum) -> {
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
            c.setNumeroBonLivraison(rs.getString("numero_bon_livraison"));
            return c;
        }, clientId, authClientId, id);

        if (commande == null) {
            throw new RuntimeException("Commande non trouvÃƒÆ’Ã‚Â©e");
        }

        // 2. RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer les lignes avec produits et fournisseurs
        String lignesSql = """
            SELECT l.*, p.libelle as produit_libelle, p.prix_achat,
                   f.id_fournisseur, f.nom_fournisseur, f.email as fournisseur_email,
                   f.adresse, f.ville, f.telephone
            FROM lignes_commande_fournisseurs l
            JOIN produit p ON l.produit_id = p.id_produit
            LEFT JOIN fournisseurs f ON p.fournisseur_id = f.id_fournisseur
            WHERE l.commande_fournisseur_id = ? AND l.actif = true
            """;

        List<LigneCommandeFournisseur> lignes = tenantRepo.queryWithAuth(lignesSql, (rs, rowNum) -> {
            LigneCommandeFournisseur ligne = new LigneCommandeFournisseur();
            ligne.setIdLigneCommandeFournisseur(rs.getInt("id_ligne_commande_fournisseur"));
            ligne.setQuantite(rs.getInt("quantite"));
            ligne.setPrixUnitaire(rs.getBigDecimal("prix_unitaire"));
            ligne.setSousTotalHT(rs.getBigDecimal("sous_total_ht"));
            ligne.setMontantTVA(rs.getBigDecimal("montant_tva"));
            ligne.setSousTotalTTC(rs.getBigDecimal("sous_total_ttc"));
            ligne.setTauxTVA(rs.getBigDecimal("tauxtva"));
            ligne.setNotes(rs.getString("notes"));

            // Produit
            Produit produit = new Produit();
            produit.setIdProduit(rs.getInt("produit_id"));
            produit.setLibelle(rs.getString("produit_libelle"));
            produit.setPrixAchat(rs.getBigDecimal("prix_achat"));

            // Fournisseur
            if (rs.getObject("id_fournisseur") != null) {
                Fournisseur fournisseur = new Fournisseur();
                fournisseur.setIdFournisseur(rs.getInt("id_fournisseur"));
                fournisseur.setNomFournisseur(rs.getString("nom_fournisseur"));
                fournisseur.setEmail(rs.getString("fournisseur_email"));
                fournisseur.setAdresse(rs.getString("adresse"));
                fournisseur.setVille(rs.getString("ville"));
                fournisseur.setTelephone(rs.getString("telephone"));
                produit.setFournisseur(fournisseur);
            }

            ligne.setProduit(produit);
            return ligne;
        }, clientId, authClientId, id);

        commande.setLignesCommande(lignes);
        return commande;
    }

    // ==================== LISTES ====================
    public List<CommandeFournisseurDTO> getAll(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = """
            SELECT cf.*, f.id_fournisseur, f.nom_fournisseur, f.email, f.telephone, f.adresse, f.ville, f.pays
            FROM commandes_fournisseurs cf
            LEFT JOIN LATERAL (
                SELECT f.id_fournisseur, f.nom_fournisseur, f.email, f.telephone, f.adresse, f.ville, f.pays
                FROM lignes_commande_fournisseurs l
                JOIN produit p ON l.produit_id = p.id_produit
                LEFT JOIN fournisseurs f ON p.fournisseur_id = f.id_fournisseur
                WHERE l.commande_fournisseur_id = cf.id_commande_fournisseur AND l.actif = true
                ORDER BY l.id_ligne_commande_fournisseur
                LIMIT 1
            ) f ON true
            WHERE cf.actif = true
            ORDER BY cf.date_commande DESC
            """;

        List<CommandeFournisseur> commandes = tenantRepo.queryWithAuth(sql, (rs, rowNum) -> {
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
            if (rs.getObject("id_fournisseur") != null) {
                Fournisseur fournisseur = new Fournisseur();
                fournisseur.setIdFournisseur(rs.getInt("id_fournisseur"));
                fournisseur.setNomFournisseur(rs.getString("nom_fournisseur"));
                fournisseur.setEmail(rs.getString("email"));
                fournisseur.setTelephone(rs.getString("telephone"));
                fournisseur.setAdresse(rs.getString("adresse"));
                fournisseur.setVille(rs.getString("ville"));
                fournisseur.setPays(rs.getString("pays"));
                c.setFournisseur(fournisseur);
            }
            return c;
        }, clientId, authClientId);

        return commandes.stream().map(commande -> {
            CommandeFournisseurDTO dto = convertToDTO(commande);
            dto.setLignesCommande(getLignesCommandeDTO(clientId, authClientId, commande.getIdCommandeFournisseur()));
            return dto;
        }).collect(Collectors.toList());
    }

    // ==================== CRÃƒÆ’Ã¢â‚¬Â°ATION ====================
    @Transactional
    public CommandeFournisseurDTO creerCommande(CommandeFournisseurDTO dto, String token) {
        if (dto.getLignesCommande() == null || dto.getLignesCommande().isEmpty()) {
            throw new RuntimeException("La commande doit contenir au moins un produit");
        }

        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);
        JdbcTemplate jdbc = getTenantJdbcTemplate(token);

        String numeroCommande = genererNumeroCommande(jdbc);

        String insertCommandeSql = """
            INSERT INTO commandes_fournisseurs (
                numero_commande, date_commande, date_livraison_prevue,
                adresse_livraison, statut, actif
            ) VALUES (?, ?, ?, ?, ?, ?)
            RETURNING id_commande_fournisseur
            """;

        Integer commandeId = tenantRepo.queryForObjectAuth(insertCommandeSql, Integer.class, clientId, authClientId,
                numeroCommande, LocalDateTime.now(), dto.getDateLivraisonPrevue(),
                dto.getAdresseLivraison(), "BROUILLON", true);

        List<LigneCommandeDTO> lignesDTO = new ArrayList<>();
        Fournisseur fournisseurUnique = null;

        for (LigneCommandeDTO ligneDTO : dto.getLignesCommande()) {
            String produitSql = """
                SELECT p.*, f.id_fournisseur as fournisseur_id, f.nom_fournisseur, f.email as fournisseur_email
                FROM produit p
                LEFT JOIN fournisseurs f ON p.fournisseur_id = f.id_fournisseur
                WHERE p.id_produit = ?
                """;

            Produit produit = tenantRepo.queryForObjectAuth(produitSql, (rs, rowNum) -> {
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
                throw new RuntimeException("Produit non trouvÃƒÆ’Ã‚Â©: " + ligneDTO.getProduitId());
            }

            if (produit.getFournisseur() == null) {
                throw new RuntimeException("Le produit '" + produit.getLibelle() + "' n'a pas de fournisseur associÃƒÆ’Ã‚Â©");
            }

            if (fournisseurUnique == null) {
                fournisseurUnique = produit.getFournisseur();
            } else if (!fournisseurUnique.getIdFournisseur().equals(produit.getFournisseur().getIdFournisseur())) {
                throw new RuntimeException("Tous les produits doivent appartenir au mÃƒÆ’Ã‚Âªme fournisseur.");
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

            Integer ligneId = tenantRepo.queryForObjectAuth(insertLigneSql, Integer.class, clientId, authClientId,
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
        tenantRepo.updateWithAuth(updateTotauxSql, clientId, authClientId, totalHT, totalTVA, totalTTC, commandeId);

        dto.setIdCommandeFournisseur(commandeId);
        dto.setNumeroCommande(numeroCommande);
        dto.setLignesCommande(lignesDTO);

        createNotification(
                clientId,
                authClientId,
                "PROCUREMENT_REQUEST_CREATED",
                "Nouvelle demande d'approvisionnement " + numeroCommande + " en attente de validation.",
                ADMIN_CLIENT_ROLE,
                commandeId,
                numeroCommande
        );

        return dto;
    }

    // ==================== LECTURE ====================
    private List<LigneCommandeDTO> getLignesCommandeDTO(Long clientId, String authClientId, Integer commandeId) {
        String lignesSql = """
            SELECT l.*, p.libelle as produit_libelle, p.is_active,
                   cat.nom_categorie as categorie_nom
            FROM lignes_commande_fournisseurs l
            JOIN produit p ON l.produit_id = p.id_produit
            LEFT JOIN categorie cat ON p.categorie_id = cat.id_categorie
            WHERE l.commande_fournisseur_id = ? AND l.actif = true
            ORDER BY l.id_ligne_commande_fournisseur
            """;

        return tenantRepo.queryWithAuth(lignesSql, (rs, rowNum) -> {
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
        }, clientId, authClientId, commandeId);
    }

    public CommandeFournisseurDTO getCommandeById(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT * FROM commandes_fournisseurs WHERE id_commande_fournisseur = ?";

        CommandeFournisseur commande = tenantRepo.queryForObjectAuth(sql, (rs, rowNum) -> {
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
            throw new RuntimeException("Commande non trouvÃƒÆ’Ã‚Â©e");
        }

        List<LigneCommandeDTO> lignes = getLignesCommandeDTO(clientId, authClientId, id);

        CommandeFournisseurDTO dto = convertToDTO(commande);
        dto.setLignesCommande(lignes);
        return dto;
    }

    // ==================== VALIDATION ====================
    @Transactional
    public CommandeFournisseurDTO validerCommande(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String checkSql = "SELECT statut FROM commandes_fournisseurs WHERE id_commande_fournisseur = ?";
        String statut = tenantRepo.queryForObjectAuth(checkSql, String.class, clientId, authClientId, id);

        if (!"BROUILLON".equals(statut)) {
            throw new RuntimeException("Seules les commandes en brouillon peuvent ÃƒÆ’Ã‚Âªtre validÃƒÆ’Ã‚Â©es");
        }

        String updateSql = "UPDATE commandes_fournisseurs SET statut = 'VALIDEE' WHERE id_commande_fournisseur = ?";
        tenantRepo.updateWithAuth(updateSql, clientId, authClientId, id);

        String numeroCommande = getNumeroCommande(clientId, authClientId, id);
        createNotification(
                clientId,
                authClientId,
                "PROCUREMENT_REQUEST_APPROVED",
                "Demande d'approvisionnement " + numeroCommande + " validee par l'administrateur.",
                PROCUREMENT_ROLE,
                id,
                numeroCommande
        );

        return getCommandeById(id, token);
    }

    // ==================== ENVOI bon commande ====================
    @Transactional
    public CommandeFournisseurDTO envoyerCommande(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // 1. VÃƒÆ’Ã‚Â©rifier le statut
        String checkSql = "SELECT statut FROM commandes_fournisseurs WHERE id_commande_fournisseur = ?";
        String statut = tenantRepo.queryForObjectAuth(checkSql, String.class, clientId, authClientId, id);

        if ("BROUILLON".equals(statut)) {
            String approvedSql = """
                SELECT COUNT(*)
                FROM notifications
                WHERE target_role = ?
                  AND type = ?
                  AND entity_type = ?
                  AND entity_id = ?
                """;
            Long approvedCount = tenantRepo.queryForObjectAuth(
                    approvedSql,
                    Long.class,
                    clientId,
                    authClientId,
                    PROCUREMENT_ROLE,
                    "PROCUREMENT_REQUEST_APPROVED",
                    COMMANDE_FOURNISSEUR_ENTITY,
                    id.longValue()
            );

            if (approvedCount != null && approvedCount > 0) {
                tenantRepo.updateWithAuth(
                        "UPDATE commandes_fournisseurs SET statut = 'VALIDEE' WHERE id_commande_fournisseur = ?",
                        clientId,
                        authClientId,
                        id
                );
                statut = "VALIDEE";
            }
        }

        if (!"VALIDEE".equals(statut)) {
            throw new RuntimeException("Seules les commandes validÃƒÆ’Ã‚Â©es peuvent ÃƒÆ’Ã‚Âªtre envoyÃƒÆ’Ã‚Â©es");
        }

        // 2. RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer le numÃƒÆ’Ã‚Â©ro de commande
        String numeroSql = "SELECT numero_commande FROM commandes_fournisseurs WHERE id_commande_fournisseur = ?";
        String numeroCommande = tenantRepo.queryForObjectAuth(numeroSql, String.class, clientId, authClientId, id);

        // 3. RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer la commande complÃƒÆ’Ã‚Â¨te pour le PDF
        CommandeFournisseur commande = getCommandeEntity(id, token);

        // 4. Extraire le fournisseur de la commande
        Fournisseur fournisseur = getFournisseurFromCommande(commande);

        if (fournisseur == null) {
            throw new RuntimeException("Impossible de dÃƒÆ’Ã‚Â©terminer le fournisseur pour cette commande");
        }

        if (fournisseur.getEmail() == null || fournisseur.getEmail().isEmpty()) {
            throw new RuntimeException("Le fournisseur '" + fournisseur.getNomFournisseur() + "' n'a pas d'email configurÃƒÆ’Ã‚Â©");
        }

        // 5. GÃƒÆ’Ã‚Â©nÃƒÆ’Ã‚Â©rer le PDF
        Client clientConnecte = clientService.getClientById(clientId);
        byte[] pdfContent = bonCommandePdfService.genererBonCommandePdf(commande, clientConnecte);

        // 6. Envoyer l'email
        try {
            emailService.envoyerBonCommande(
                    fournisseur.getEmail(),
                    fournisseur.getNomFournisseur(),
                    numeroCommande,
                    pdfContent
            );
            log.info("ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Bon de commande {} envoyÃƒÆ’Ã‚Â© ÃƒÆ’Ã‚Â  {}", numeroCommande, fournisseur.getEmail());
        } catch (Exception e) {
            log.error("ÃƒÂ¢Ã‚ÂÃ…â€™ Erreur envoi email pour commande {}: {}", numeroCommande, e.getMessage());
            throw new RuntimeException("Erreur lors de l'envoi de l'email: " + e.getMessage());
        }

        // 7. Mettre ÃƒÆ’Ã‚Â  jour le statut
        String updateSql = "UPDATE commandes_fournisseurs SET statut = 'ENVOYEE' WHERE id_commande_fournisseur = ?";
        tenantRepo.updateWithAuth(updateSql, clientId, authClientId, id);

        log.info("ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Commande {} marquÃƒÆ’Ã‚Â©e comme ENVOYEE", numeroCommande);

        return getCommandeById(id, token);
    }

    /**
     * RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â¨re le fournisseur ÃƒÆ’Ã‚Â  partir des produits de la commande
     */
    private Fournisseur getFournisseurFromCommande(CommandeFournisseur commande) {
        if (commande.getLignesCommande() == null || commande.getLignesCommande().isEmpty()) {
            throw new RuntimeException("La commande n'a aucun produit");
        }

        // Prendre le fournisseur du premier produit
        Produit premierProduit = commande.getLignesCommande().get(0).getProduit();
        if (premierProduit == null || premierProduit.getFournisseur() == null) {
            throw new RuntimeException("Le premier produit n'a pas de fournisseur associÃƒÆ’Ã‚Â©");
        }

        return premierProduit.getFournisseur();
    }

    // ==================== RÃƒÆ’Ã¢â‚¬Â°CEPTION ====================
    @Transactional
    public CommandeFournisseurDTO recevoirCommande(Integer id, ReceptionDTO receptionData, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        CommandeFournisseurDTO commande = getCommandeById(id, token);
        if (!"ENVOYEE".equals(commande.getStatut().name())) {
            throw new RuntimeException("Seules les commandes envoyÃƒÆ’Ã‚Â©es peuvent ÃƒÆ’Ã‚Âªtre reÃƒÆ’Ã‚Â§ues");
        }

        String updateSql = """
            UPDATE commandes_fournisseurs 
            SET statut = 'RECUE', date_livraison_reelle = ?, 
                numero_bon_livraison = ?, notes_reception = ?
            WHERE id_commande_fournisseur = ?
            """;

        tenantRepo.updateWithAuth(updateSql, clientId, authClientId,
                LocalDateTime.now(), receptionData.getNumeroBL(), receptionData.getNotes(), id);

        Map<Integer, Integer> quantitesRecues = receptionData.getQuantitesRecues() != null ? receptionData.getQuantitesRecues() : new HashMap<>();

        for (LigneCommandeDTO ligne : commande.getLignesCommande()) {
            Integer quantiteRecue = quantitesRecues.get(ligne.getIdLigneCommandeFournisseur());
            if (quantiteRecue != null && quantiteRecue > 0) {
                String stockSql = "SELECT COALESCE(quantite_stock, 0) FROM produit WHERE id_produit = ?";
                Integer stockAvant = tenantRepo.queryForObjectAuth(stockSql, Integer.class, clientId, authClientId, ligne.getProduitId());
                if (stockAvant == null) {
                    throw new RuntimeException("Produit introuvable pour la ligne de reception: " + ligne.getProduitId());
                }

                int stockApres = stockAvant + quantiteRecue;
                String updateStockSql = "UPDATE produit SET quantite_stock = ? WHERE id_produit = ?";
                tenantRepo.updateWithAuth(updateStockSql, clientId, authClientId, stockApres, ligne.getProduitId());

                String mouvementSql = """
                    INSERT INTO stock_movement (
                        produit_id, type_mouvement, quantite, stock_avant, stock_apres,
                        date_mouvement, type_document, commentaire
                    ) VALUES (?, 'ENTREE', ?, ?, ?, ?, 'COMMANDE_FOURNISSEUR', ?)
                    """;
                tenantRepo.updateWithAuth(mouvementSql, clientId, authClientId,
                        ligne.getProduitId(), quantiteRecue, stockAvant, stockApres, LocalDateTime.now(),
                        "RÃƒÆ’Ã‚Â©ception commande " + commande.getNumeroCommande());
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

        tenantRepo.updateWithAuth(updateSql, clientId, authClientId, motifRejet, LocalDateTime.now(), id);

        String numeroCommande = getNumeroCommande(clientId, authClientId, id);
        createNotification(
                clientId,
                authClientId,
                "PROCUREMENT_REQUEST_REJECTED",
                "Demande d'approvisionnement " + numeroCommande + " rejetee par l'administrateur.",
                PROCUREMENT_ROLE,
                id,
                numeroCommande
        );

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

        tenantRepo.updateWithAuth(updateSql, clientId, authClientId, id);

        String numeroCommande = getNumeroCommande(clientId, authClientId, id);
        createNotification(
                clientId,
                authClientId,
                "PROCUREMENT_REQUEST_RESUBMITTED",
                "Demande d'approvisionnement " + numeroCommande + " renvoyee apres correction.",
                ADMIN_CLIENT_ROLE,
                id,
                numeroCommande
        );

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
            throw new RuntimeException("Seules les commandes en brouillon ou rejetÃƒÆ’Ã‚Â©es peuvent ÃƒÆ’Ã‚Âªtre supprimÃƒÆ’Ã‚Â©es");
        }

        String deleteLignesSql = "DELETE FROM lignes_commande_fournisseurs WHERE commande_fournisseur_id = ?";
        tenantRepo.updateWithAuth(deleteLignesSql, clientId, authClientId, id);

        String deleteCommandeSql = "DELETE FROM commandes_fournisseurs WHERE id_commande_fournisseur = ?";
        tenantRepo.updateWithAuth(deleteCommandeSql, clientId, authClientId, id);
    }

    // ==================== ARCHIVAGE ====================
    public List<CommandeFournisseurDTO> getArchivedCommandes(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        mettreAJourCommandesAnciennes(token);

        String sql = "SELECT * FROM commandes_fournisseurs WHERE actif = false ORDER BY date_commande DESC";

        List<CommandeFournisseur> commandes = tenantRepo.queryWithAuth(sql, (rs, rowNum) -> {
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
        tenantRepo.updateWithAuth(sql, clientId, authClientId, dateLimite);
    }

    // ==================== UTILITAIRES ====================
    public CommandeFournisseurDTO getCommandeByNumero(String numero, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT id_commande_fournisseur FROM commandes_fournisseurs WHERE numero_commande = ?";
        Integer id = tenantRepo.queryForObjectAuth(sql, Integer.class, clientId, authClientId, numero);

        if (id == null) {
            throw new RuntimeException("Commande non trouvÃƒÆ’Ã‚Â©e avec le numÃƒÆ’Ã‚Â©ro: " + numero);
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

        List<CommandeFournisseur> commandes = tenantRepo.queryWithAuth(sql, (rs, rowNum) -> {
            CommandeFournisseur c = new CommandeFournisseur();
            c.setIdCommandeFournisseur(rs.getInt("id_commande_fournisseur"));
            c.setNumeroCommande(rs.getString("numero_commande"));
            c.setDateCommande(rs.getTimestamp("date_commande") != null ? rs.getTimestamp("date_commande").toLocalDateTime() : null);
            c.setStatut(CommandeFournisseur.StatutCommande.valueOf(rs.getString("statut")));
            return c;
        }, clientId, authClientId, debut, fin);

        return commandes.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    // ==================== MODIFICATION ====================
    @Transactional
    public CommandeFournisseurDTO modifierCommande(Integer id, CommandeFournisseurDTO dto, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        CommandeFournisseurDTO existing = getCommandeById(id, token);
        String statut = existing.getStatut().name();
        if (!"REJETEE".equals(statut) && !"BROUILLON".equals(statut)) {
            throw new RuntimeException("Seules les commandes rejetÃƒÆ’Ã‚Â©es peuvent ÃƒÆ’Ã‚Âªtre modifiÃƒÆ’Ã‚Â©es");
        }

        String updateSql = """
            UPDATE commandes_fournisseurs 
            SET date_livraison_prevue = ?, adresse_livraison = ?
            WHERE id_commande_fournisseur = ?
            """;
        tenantRepo.updateWithAuth(updateSql, clientId, authClientId,
                dto.getDateLivraisonPrevue(), dto.getAdresseLivraison(), id);

        String deleteLignesSql = "DELETE FROM lignes_commande_fournisseurs WHERE commande_fournisseur_id = ?";
        tenantRepo.updateWithAuth(deleteLignesSql, clientId, authClientId, id);

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

            tenantRepo.updateWithAuth(insertLigneSql, clientId, authClientId,
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
        tenantRepo.updateWithAuth(updateTotauxSql, clientId, authClientId, totalHT, totalTVA, totalTTC, id);

        return getCommandeById(id, token);
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
        if (commande.getFournisseur() != null) {
            FournisseurDTO fournisseurDTO = new FournisseurDTO();
            fournisseurDTO.setIdFournisseur(commande.getFournisseur().getIdFournisseur());
            fournisseurDTO.setNomFournisseur(commande.getFournisseur().getNomFournisseur());
            fournisseurDTO.setEmail(commande.getFournisseur().getEmail());
            fournisseurDTO.setTelephone(commande.getFournisseur().getTelephone());
            fournisseurDTO.setAdresse(commande.getFournisseur().getAdresse());
            fournisseurDTO.setVille(commande.getFournisseur().getVille());
            fournisseurDTO.setPays(commande.getFournisseur().getPays());
            dto.setFournisseur(fournisseurDTO);
        }
        return dto;
    }
}
