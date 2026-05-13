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
import org.erp.invera.model.platform.Client;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.erp.invera.security.JwtTokenProvider;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class CommandeFournisseurService {

    private final TenantAwareRepository tenantRepo;
    private final JwtTokenProvider jwtTokenProvider;
    private final BonCommandePdfService bonCommandePdfService;
    private final EmailService emailService;
    private final ClientPlatformService clientService;

    private static final BigDecimal TVA_PAR_DEFAUT = new BigDecimal("20");

    private Long getClientIdFromToken(String token) {
        return jwtTokenProvider.getClientIdFromToken(token);
    }

    // ==================== RÉCUPÉRATION COMPLÈTE POUR PDF ====================

    private CommandeFournisseur getCommandeEntity(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = """
            SELECT * FROM commandes_fournisseurs 
            WHERE id_commande_fournisseur = ? AND actif = true
            """;

        // ✅ Utiliser queryForObjectAuth (avec authenticatedClientId)
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
            throw new RuntimeException("Commande non trouvée");
        }

        String lignesSql = """
            SELECT l.*, p.libelle as produit_libelle, p.prix_achat,
                   f.id_fournisseur, f.nom_fournisseur, f.email as fournisseur_email,
                   f.adresse, f.ville, f.telephone
            FROM lignes_commande_fournisseurs l
            JOIN produit p ON l.produit_id = p.id_produit
            LEFT JOIN fournisseurs f ON p.fournisseur_id = f.id_fournisseur
            WHERE l.commande_fournisseur_id = ? AND l.actif = true
            """;

        // ✅ Utiliser queryWithAuth pour les listes
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

            Produit produit = new Produit();
            produit.setIdProduit(rs.getInt("produit_id"));
            produit.setLibelle(rs.getString("produit_libelle"));
            produit.setPrixAchat(rs.getBigDecimal("prix_achat"));

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
        SELECT c.*, 
               f.id_fournisseur, 
               f.nom_fournisseur, 
               f.email as fournisseur_email,
               f.telephone as fournisseur_telephone  
        FROM commandes_fournisseurs c
        LEFT JOIN (
            SELECT DISTINCT ON (l.commande_fournisseur_id) 
                   l.commande_fournisseur_id, p.fournisseur_id
            FROM lignes_commande_fournisseurs l
            JOIN produit p ON l.produit_id = p.id_produit
            WHERE l.actif = true
        ) fp ON fp.commande_fournisseur_id = c.id_commande_fournisseur
        LEFT JOIN fournisseurs f ON fp.fournisseur_id = f.id_fournisseur
        WHERE c.actif = true 
        ORDER BY c.date_commande DESC
        """;

        List<CommandeFournisseurDTO> commandes = tenantRepo.queryWithAuth(sql, (rs, rowNum) -> {
            CommandeFournisseurDTO dto = new CommandeFournisseurDTO();
            dto.setIdCommandeFournisseur(rs.getInt("id_commande_fournisseur"));
            dto.setNumeroCommande(rs.getString("numero_commande"));
            dto.setDateCommande(rs.getTimestamp("date_commande") != null ? rs.getTimestamp("date_commande").toLocalDateTime() : null);
            dto.setDateLivraisonPrevue(rs.getTimestamp("date_livraison_prevue") != null ? rs.getTimestamp("date_livraison_prevue").toLocalDateTime() : null);
            dto.setDateLivraisonReelle(rs.getTimestamp("date_livraison_reelle") != null ? rs.getTimestamp("date_livraison_reelle").toLocalDateTime() : null);
            dto.setAdresseLivraison(rs.getString("adresse_livraison"));

            String statutStr = rs.getString("statut");
            if (statutStr != null) {
                dto.setStatut(CommandeFournisseur.StatutCommande.valueOf(statutStr));
            }

            dto.setTotalHT(rs.getBigDecimal("totalht"));
            dto.setTotalTVA(rs.getBigDecimal("totaltva"));
            dto.setTotalTTC(rs.getBigDecimal("totalttc"));
            dto.setActif(rs.getBoolean("actif"));
            dto.setMotifRejet(rs.getString("motif_rejet"));
            dto.setDateRejet(rs.getTimestamp("date_rejet") != null ? rs.getTimestamp("date_rejet").toLocalDateTime() : null);

            // ✅ Remplir les informations du fournisseur
            if (rs.getObject("id_fournisseur") != null) {
                FournisseurDTO fournisseurDTO = new FournisseurDTO();
                fournisseurDTO.setIdFournisseur(rs.getInt("id_fournisseur"));
                fournisseurDTO.setNomFournisseur(rs.getString("nom_fournisseur"));
                fournisseurDTO.setEmail(rs.getString("fournisseur_email"));
                fournisseurDTO.setTelephone(rs.getString("fournisseur_telephone"));
                dto.setFournisseur(fournisseurDTO);
            }

            return dto;
        }, clientId, authClientId);

        // Pour chaque commande, charger ses lignes
        for (CommandeFournisseurDTO commande : commandes) {
            String lignesSql = """
        SELECT l.*, 
               p.libelle as produit_libelle,
               COALESCE(l.quantite_recue, 0) as quantite_recue
        FROM lignes_commande_fournisseurs l
        JOIN produit p ON l.produit_id = p.id_produit
        WHERE l.commande_fournisseur_id = ? AND l.actif = true
        """;

            List<LigneCommandeDTO> lignes = tenantRepo.queryWithAuth(lignesSql, (rs, rowNum) -> {
                LigneCommandeDTO ligne = new LigneCommandeDTO();
                ligne.setIdLigneCommandeFournisseur(rs.getInt("id_ligne_commande_fournisseur"));
                ligne.setProduitId(rs.getInt("produit_id"));
                ligne.setProduitLibelle(rs.getString("produit_libelle"));
                ligne.setQuantite(rs.getInt("quantite"));
                ligne.setQuantiteRecue(rs.getInt("quantite_recue"));
                ligne.setPrixUnitaire(rs.getBigDecimal("prix_unitaire"));
                ligne.setSousTotalHT(rs.getBigDecimal("sous_total_ht"));
                ligne.setMontantTVA(rs.getBigDecimal("montant_tva"));
                ligne.setSousTotalTTC(rs.getBigDecimal("sous_total_ttc"));
                ligne.setTauxTVA(rs.getBigDecimal("tauxtva"));
                return ligne;
            }, clientId, authClientId, commande.getIdCommandeFournisseur());

            commande.setLignesCommande(lignes);
        }
        for (CommandeFournisseurDTO cmd : commandes) {
            System.out.println("🔍 Commande " + cmd.getNumeroCommande() +
                    " - HT: " + cmd.getTotalHT() +
                    ", TVA: " + cmd.getTotalTVA() +
                    ", TTC: " + cmd.getTotalTTC());
            if (cmd.getLignesCommande() != null) {
                for (LigneCommandeDTO ligne : cmd.getLignesCommande()) {
                    System.out.println("   📦 " + ligne.getProduitLibelle() +
                            " - Qté cmd: " + ligne.getQuantite() +
                            ", Qté reçue: " + ligne.getQuantiteRecue() +
                            ", Total HT: " + ligne.getSousTotalHT());
                }
            }
        }

        return commandes;
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

        String insertCommandeSql = """
            INSERT INTO commandes_fournisseurs (
                numero_commande, date_commande, date_livraison_prevue,
                adresse_livraison, statut, actif
            ) VALUES (?, ?, ?, ?, ?, ?)
            RETURNING id_commande_fournisseur
            """;

        // ✅ Utiliser queryForObjectAuth
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

            // ✅ Utiliser queryForObjectAuth
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

            // ✅ Utiliser queryForObjectAuth
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

        return dto;
    }

    // ==================== LECTURE ====================
    public CommandeFournisseurDTO getCommandeById(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // 1. Récupérer la commande avec les infos fournisseur
        String sql = """
        SELECT c.*, 
               f.id_fournisseur, f.nom_fournisseur, f.email as fournisseur_email,
               f.telephone, f.adresse as fournisseur_adresse, f.ville, f.pays
        FROM commandes_fournisseurs c
        LEFT JOIN (
            SELECT DISTINCT l.commande_fournisseur_id, p.fournisseur_id
            FROM lignes_commande_fournisseurs l
            JOIN produit p ON l.produit_id = p.id_produit
            WHERE l.actif = true
        ) fp ON fp.commande_fournisseur_id = c.id_commande_fournisseur
        LEFT JOIN fournisseurs f ON fp.fournisseur_id = f.id_fournisseur
        WHERE c.id_commande_fournisseur = ?
        """;

        CommandeFournisseurDTO commande = tenantRepo.queryForObjectAuth(sql, (rs, rowNum) -> {
            CommandeFournisseurDTO dto = new CommandeFournisseurDTO();
            dto.setIdCommandeFournisseur(rs.getInt("id_commande_fournisseur"));
            dto.setNumeroCommande(rs.getString("numero_commande"));
            dto.setDateCommande(rs.getTimestamp("date_commande") != null ? rs.getTimestamp("date_commande").toLocalDateTime() : null);
            dto.setDateLivraisonPrevue(rs.getTimestamp("date_livraison_prevue") != null ? rs.getTimestamp("date_livraison_prevue").toLocalDateTime() : null);
            dto.setDateLivraisonReelle(rs.getTimestamp("date_livraison_reelle") != null ? rs.getTimestamp("date_livraison_reelle").toLocalDateTime() : null);
            dto.setAdresseLivraison(rs.getString("adresse_livraison"));
            dto.setMotifRejet(rs.getString("motif_rejet"));
            dto.setDateRejet(rs.getTimestamp("date_rejet") != null ? rs.getTimestamp("date_rejet").toLocalDateTime() : null);

            String statutStr = rs.getString("statut");
            if (statutStr != null) {
                dto.setStatut(CommandeFournisseur.StatutCommande.valueOf(statutStr));
            }

            dto.setTotalHT(rs.getBigDecimal("totalht"));
            dto.setTotalTVA(rs.getBigDecimal("totaltva"));
            dto.setTotalTTC(rs.getBigDecimal("totalttc"));
            dto.setActif(rs.getBoolean("actif"));

            // ✅ Remplir les informations du fournisseur
            if (rs.getObject("id_fournisseur") != null) {
                FournisseurDTO fournisseurDTO = new FournisseurDTO();
                fournisseurDTO.setIdFournisseur(rs.getInt("id_fournisseur"));
                fournisseurDTO.setNomFournisseur(rs.getString("nom_fournisseur"));
                fournisseurDTO.setEmail(rs.getString("fournisseur_email"));
                fournisseurDTO.setTelephone(rs.getString("telephone"));
                fournisseurDTO.setAdresse(rs.getString("fournisseur_adresse"));
                fournisseurDTO.setVille(rs.getString("ville"));
                fournisseurDTO.setPays(rs.getString("pays"));
                dto.setFournisseur(fournisseurDTO);

                System.out.println("📞 Téléphone récupéré: '" + rs.getString("telephone") + "'");
                System.out.println("📞 Téléphone dans DTO: '" + fournisseurDTO.getTelephone() + "'");
            }

            return dto;
        }, clientId, authClientId, id);

        if (commande == null) {
            throw new RuntimeException("Commande non trouvée");
        }

        // 2. Récupérer les lignes de commande
        String lignesSql = """
        SELECT l.*, 
               p.libelle as produit_libelle, 
               p.is_active,
               cat.nom_categorie as categorie_nom,
               COALESCE(l.quantite_recue, 0) as quantite_recue
        FROM lignes_commande_fournisseurs l
        JOIN produit p ON l.produit_id = p.id_produit
        LEFT JOIN categorie cat ON p.categorie_id = cat.id_categorie
        WHERE l.commande_fournisseur_id = ? AND l.actif = true
        """;

        List<LigneCommandeDTO> lignes = tenantRepo.queryWithAuth(lignesSql, (rs, rowNum) -> {
            LigneCommandeDTO ligne = new LigneCommandeDTO();
            ligne.setIdLigneCommandeFournisseur(rs.getInt("id_ligne_commande_fournisseur"));
            ligne.setProduitId(rs.getInt("produit_id"));
            ligne.setProduitLibelle(rs.getString("produit_libelle"));
            ligne.setQuantite(rs.getInt("quantite"));
            ligne.setQuantiteRecue(rs.getInt("quantite_recue"));
            ligne.setPrixUnitaire(rs.getBigDecimal("prix_unitaire"));
            ligne.setSousTotalHT(rs.getBigDecimal("sous_total_ht"));
            ligne.setMontantTVA(rs.getBigDecimal("montant_tva"));
            ligne.setSousTotalTTC(rs.getBigDecimal("sous_total_ttc"));
            ligne.setTauxTVA(rs.getBigDecimal("tauxtva"));
            ligne.setNotes(rs.getString("notes"));
            ligne.setCategorie(rs.getString("categorie_nom"));
            ligne.setEstInactif(!rs.getBoolean("is_active"));

            // Log pour déboguer
            System.out.println("✅ Ligne chargée: Produit=" + ligne.getProduitLibelle() +
                    ", Quantité=" + ligne.getQuantite() +
                    ", Prix=" + ligne.getPrixUnitaire());

            return ligne;
        }, clientId, authClientId, id);

        commande.setLignesCommande(lignes);

        // Log pour vérifier
        System.out.println("📦 Commande chargée: ID=" + commande.getIdCommandeFournisseur() +
                ", Fournisseur=" + (commande.getFournisseur() != null ? commande.getFournisseur().getNomFournisseur() : "null") +
                ", Lignes=" + (lignes != null ? lignes.size() : 0));

        return commande;
    }

    // ==================== VALIDATION ====================

    @Transactional
    public CommandeFournisseurDTO validerCommande(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String checkSql = "SELECT statut FROM commandes_fournisseurs WHERE id_commande_fournisseur = ?";
        // ✅ Utiliser queryForObjectAuth
        String statut = tenantRepo.queryForObjectAuth(checkSql, String.class, clientId, authClientId, id);

        if (!"BROUILLON".equals(statut)) {
            throw new RuntimeException("Seules les commandes en brouillon peuvent être validées");
        }

        String updateSql = "UPDATE commandes_fournisseurs SET statut = 'VALIDEE' WHERE id_commande_fournisseur = ?";
        tenantRepo.updateWithAuth(updateSql, clientId, authClientId, id);

        return getCommandeById(id, token);
    }

    // ==================== ENVOI bon commande ====================

// ==================== ENVOI bon commande ====================

    @Transactional
    public CommandeFournisseurDTO envoyerCommande(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // 1. Vérifier le statut
        String checkSql = "SELECT statut FROM commandes_fournisseurs WHERE id_commande_fournisseur = ?";
        String statut = tenantRepo.queryForObjectAuth(checkSql, String.class, clientId, authClientId, id);

        if (!"VALIDEE".equals(statut)) {
            throw new RuntimeException("Seules les commandes validées peuvent être envoyées");
        }

        // 2. Récupérer le numéro de commande
        String numeroSql = "SELECT numero_commande FROM commandes_fournisseurs WHERE id_commande_fournisseur = ?";
        String numeroCommande = tenantRepo.queryForObjectAuth(numeroSql, String.class, clientId, authClientId, id);

        // 3. Récupérer la commande complète
        CommandeFournisseur commande = getCommandeEntity(id, token);
        Fournisseur fournisseur = getFournisseurFromCommande(commande);

        if (fournisseur == null) {
            throw new RuntimeException("Impossible de déterminer le fournisseur pour cette commande");
        }

        if (fournisseur.getEmail() == null || fournisseur.getEmail().isEmpty()) {
            throw new RuntimeException("Le fournisseur '" + fournisseur.getNomFournisseur() + "' n'a pas d'email configuré");
        }

        // 4. ✅ Récupérer le client connecté (émetteur)
        Long clientIdToken = jwtTokenProvider.getClientIdFromToken(token);
        String authClientIdToken = String.valueOf(clientIdToken);
        Client clientConnecte = clientService.getClientById(clientIdToken);

        // 5. Générer le PDF du bon de commande
        byte[] pdfContent = bonCommandePdfService.genererBonCommandePdf(commande, clientConnecte);

        // 6. Envoyer l'email
        try {
            emailService.envoyerBonCommande(
                    fournisseur.getEmail(),
                    fournisseur.getNomFournisseur(),
                    numeroCommande,
                    pdfContent
            );
            log.info("✅ Bon de commande {} envoyé à {}", numeroCommande, fournisseur.getEmail());
        } catch (Exception e) {
            log.error("❌ Erreur envoi email pour commande {}: {}", numeroCommande, e.getMessage());
            throw new RuntimeException("Erreur lors de l'envoi de l'email: " + e.getMessage());
        }

        // 7. Mettre à jour le statut
        String updateSql = "UPDATE commandes_fournisseurs SET statut = 'ENVOYEE' WHERE id_commande_fournisseur = ?";
        tenantRepo.updateWithAuth(updateSql, clientId, authClientId, id);

        log.info("✅ Commande {} marquée comme ENVOYEE", numeroCommande);

        return getCommandeById(id, token);
    }

    private Fournisseur getFournisseurFromCommande(CommandeFournisseur commande) {
        if (commande.getLignesCommande() == null || commande.getLignesCommande().isEmpty()) {
            throw new RuntimeException("La commande n'a aucun produit");
        }

        Produit premierProduit = commande.getLignesCommande().get(0).getProduit();
        if (premierProduit == null || premierProduit.getFournisseur() == null) {
            throw new RuntimeException("Le premier produit n'a pas de fournisseur associé");
        }

        return premierProduit.getFournisseur();
    }

    // ==================== RÉCEPTION ====================
    @Transactional
    public CommandeFournisseurDTO recevoirCommande(Integer id, ReceptionDTO receptionData, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        System.out.println("========================================");
        System.out.println("🔔 RECEPTION COMMANDE CALLED!");
        System.out.println("🔔 ID: " + id);
        System.out.println("========================================");

        CommandeFournisseurDTO commande = getCommandeById(id, token);
        if (!"ENVOYEE".equals(commande.getStatut().name())) {
            throw new RuntimeException("Seules les commandes envoyées peuvent être reçues");
        }

        // 1. Mettre à jour le statut de la commande
        String updateSql = """
        UPDATE commandes_fournisseurs 
        SET statut = 'RECUE', date_livraison_reelle = ?, 
            numero_bon_livraison = ?, notes_reception = ?
        WHERE id_commande_fournisseur = ?
    """;

        tenantRepo.updateWithAuth(updateSql, clientId, authClientId,
                LocalDateTime.now(), receptionData.getNumeroBL(), receptionData.getNotes(), id);

        Map<Integer, Integer> quantitesRecues = receptionData.getQuantitesRecues() != null
                ? receptionData.getQuantitesRecues() : new HashMap<>();

        for (LigneCommandeDTO ligne : commande.getLignesCommande()) {
            Integer quantiteRecue = quantitesRecues.getOrDefault(ligne.getIdLigneCommandeFournisseur(), ligne.getQuantite());

            if (quantiteRecue != null && quantiteRecue > 0) {
                // 2. Récupérer le stock actuel
                String sqlStockActuel = "SELECT quantite_stock FROM produit WHERE id_produit = ?";
                Integer stockAvant = tenantRepo.queryForObjectAuth(sqlStockActuel, Integer.class,
                        clientId, authClientId, ligne.getProduitId());
                if (stockAvant == null) stockAvant = 0;

                Integer nouveauStock = stockAvant + quantiteRecue;

                // 3. Mettre à jour le stock du produit
                String updateStockSql = "UPDATE produit SET quantite_stock = ? WHERE id_produit = ?";
                tenantRepo.updateWithAuth(updateStockSql, clientId, authClientId, nouveauStock, ligne.getProduitId());

                // 4. ✅ INSÉRER LE MOUVEMENT DE STOCK (version simplifiée)
                String insertMovementSql = """
                INSERT INTO stock_movement 
                (produit_id, type_mouvement, quantite, stock_avant, stock_apres, 
                 prix_unitaire, valeur_totale, type_document, date_mouvement)
                VALUES (?, 'ENTREE', ?, ?, ?, ?, ?, 'RECEPTION', NOW())
            """;

                BigDecimal prixUnitaire = ligne.getPrixUnitaire() != null ? ligne.getPrixUnitaire() : BigDecimal.ZERO;
                BigDecimal valeurTotale = prixUnitaire.multiply(BigDecimal.valueOf(quantiteRecue));

                tenantRepo.updateWithAuth(insertMovementSql, clientId, authClientId,
                        ligne.getProduitId(),
                        quantiteRecue,
                        stockAvant,
                        nouveauStock,
                        prixUnitaire,
                        valeurTotale
                );

                System.out.println("✅ Mouvement stock: Produit=" + ligne.getProduitLibelle() +
                        ", ENTREE=" + quantiteRecue + ", Stock: " + stockAvant + " → " + nouveauStock);

                // 5. Mettre à jour quantite_recue
                String updateLigneSql = "UPDATE lignes_commande_fournisseurs SET quantite_recue = ? WHERE id_ligne_commande_fournisseur = ?";
                tenantRepo.updateWithAuth(updateLigneSql, clientId, authClientId, quantiteRecue, ligne.getIdLigneCommandeFournisseur());
            }
        }

        System.out.println("✅ FIN RECEPTION COMMANDE");
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

        // ✅ Utiliser queryWithAuth pour les listes
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

    private JdbcTemplate getTenantJdbcTemplate(String token) {
        Long clientId = getClientIdFromToken(token);
        return tenantRepo.getClientJdbcTemplate(clientId, String.valueOf(clientId));
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

    public CommandeFournisseurDTO getCommandeByNumero(String numero, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT id_commande_fournisseur FROM commandes_fournisseurs WHERE numero_commande = ?";
        // ✅ Utiliser queryForObjectAuth
        Integer id = tenantRepo.queryForObjectAuth(sql, Integer.class, clientId, authClientId, numero);

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

        // ✅ Utiliser queryWithAuth pour les listes
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
        if (!"REJETEE".equals(existing.getStatut().name())) {
            throw new RuntimeException("Seules les commandes rejetées peuvent être modifiées");
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