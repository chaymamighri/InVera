package org.erp.invera.service.erp;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.itextpdf.html2pdf.HtmlConverter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.erp.Produit;
import org.erp.invera.model.erp.client.CommandeClient;
import org.erp.invera.model.erp.client.FactureClient;
import org.erp.invera.model.erp.client.LigneCommandeClient;
import org.erp.invera.model.platform.Client;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.erp.invera.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class FacturePdfService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Value("${app.base-url:http://192.168.1.119:8081}")  // ← Remplacez par votre IP
    private String baseUrl;

    private final TenantAwareRepository tenantRepo;
    private final JwtTokenProvider jwtTokenProvider;
    private final JdbcTemplate platformJdbcTemplate;

    /**
     * Génère le PDF de la facture
     */
    public byte[] genererFacturePdf(Integer factureId, String token) {
        try {
            log.info("📄 FacturePdfService: Début génération pour facture ID: {}", factureId);

            Long clientId = jwtTokenProvider.getClientIdFromToken(token);
            String authClientId = String.valueOf(clientId);

            // 1. Récupérer la facture
            FactureClient facture = getFactureCompleteById(factureId, clientId, authClientId);
            if (facture == null) {
                throw new RuntimeException("Facture non trouvée avec ID: " + factureId);
            }
            log.info("✅ Facture trouvée: {}", facture.getReferenceFactureClient());

            // 2. Récupérer le client connecté
            Client clientConnecte = null;
            try {
                clientConnecte = getClientById(clientId, authClientId);
            } catch (Exception e) {
                log.warn("⚠️ Client plateforme non trouvé: {}", e.getMessage());
            }

            // 3. Récupérer les lignes
            List<LigneCommandeDTO> lignesFacture = getLignesCommandeByFactureId(factureId, clientId, authClientId);

            // 4. Calculer les totaux
            TotauxDTO totaux = calculerTotaux(lignesFacture);

            // 5. ✅ Générer le QR code avec l'URL du PDF
            String baseApiUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
            String qrCodeBase64 = generateCompleteQRCode(facture, baseApiUrl);

            // 6. Générer le HTML
            String htmlContent = generateInvoiceHtml(facture, clientConnecte, lignesFacture, totaux, qrCodeBase64);

            // 7. Convertir HTML en PDF
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            HtmlConverter.convertToPdf(htmlContent, baos);

            log.info("PDF facture généré: {}, taille: {} bytes", facture.getReferenceFactureClient(), baos.size());
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Erreur génération PDF facture", e);
            throw new RuntimeException("Erreur génération PDF: " + e.getMessage(), e);
        }
    }


    /**
     * Génère le PDF de la facture sans authentification (pour QR code)
     */
    public byte[] genererFacturePdfPublic(Integer factureId) {
        try {
            log.info("📄 FacturePdfService (public): Début génération pour facture ID: {}", factureId);

            // ✅ FORCER l'utilisation de la base tenant du commercial (client_5)
            // C'est cette base qui contient TOUTES les factures
            Long clientId = 5L;  // Base tenant par défaut
            String authClientId = String.valueOf(clientId);

            // 1. Récupérer la facture (dans la base client_5)
            FactureClient facture = getFactureCompleteById(factureId, clientId, authClientId);
            if (facture == null) {
                throw new RuntimeException("Facture non trouvée avec ID: " + factureId);
            }
            log.info("✅ Facture trouvée: {}", facture.getReferenceFactureClient());

            // 2. Récupérer le client connecté (émetteur)
            Client clientConnecte = null;
            try {
                clientConnecte = getClientById(clientId, authClientId);
            } catch (Exception e) {
                log.warn("⚠️ Client plateforme non trouvé: {}", e.getMessage());
            }

            // 3. Récupérer les lignes
            List<LigneCommandeDTO> lignesFacture = getLignesCommandeByFactureId(factureId, clientId, authClientId);

            // 4. Calculer les totaux
            TotauxDTO totaux = calculerTotaux(lignesFacture);

            // 5. Générer le QR code avec l'URL du PDF
            String baseApiUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
            String qrCodeBase64 = generateCompleteQRCode(facture, baseApiUrl);

            // 6. Générer le HTML
            String htmlContent = generateInvoiceHtml(facture, clientConnecte, lignesFacture, totaux, qrCodeBase64);

            // 7. Convertir HTML en PDF
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            HtmlConverter.convertToPdf(htmlContent, baos);

            log.info("PDF facture (public) généré: {}, taille: {} bytes", facture.getReferenceFactureClient(), baos.size());
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Erreur génération PDF facture public", e);
            throw new RuntimeException("Erreur génération PDF: " + e.getMessage(), e);
        }
    }

    /**
     * Génère l'image du QR code pour une facture
     */
    public byte[] genererQRCodeImage(Integer factureId, String token) {
        try {
            Long clientId = jwtTokenProvider.getClientIdFromToken(token);
            String authClientId = String.valueOf(clientId);

            FactureClient facture = getFactureCompleteById(factureId, clientId, authClientId);
            if (facture == null) {
                throw new RuntimeException("Facture non trouvée");
            }

            String baseApiUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
            // URL qui pointe vers l'endpoint public
            String pdfUrl = String.format("%s/api/factures/public/%d/pdf", baseApiUrl, factureId);

            log.info("🔗 QR code URL: {}", pdfUrl);

            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(pdfUrl, BarcodeFormat.QR_CODE, 300, 300);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            BufferedImage qrImage = MatrixToImageWriter.toBufferedImage(bitMatrix);
            ImageIO.write(qrImage, "PNG", baos);

            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Erreur génération image QR code", e);
            return null;
        }
    }


    /**
     * Génère un QR code avec l'URL du PDF (pour scanner et afficher la facture)
     */
    private String generateCompleteQRCode(FactureClient facture, String baseApiUrl) {
        try {
            // ✅ CORRECTION : Utiliser le bon endpoint public
            // Avant : String pdfUrl = String.format("%s/facture/%d/pdf", baseApiUrl, facture.getIdFactureClient());
            // Après :
            String pdfUrl = String.format("%s/api/factures/public/%d/pdf", baseApiUrl, facture.getIdFactureClient());

            log.info("🔗 URL du PDF pour QR code: {}", pdfUrl);

            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(pdfUrl, BarcodeFormat.QR_CODE, 300, 300);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            BufferedImage qrImage = MatrixToImageWriter.toBufferedImage(bitMatrix);
            ImageIO.write(qrImage, "PNG", baos);

            String qrCodeBase64 = Base64.getEncoder().encodeToString(baos.toByteArray());
            log.info("✅ QR code généré avec succès, taille: {} caractères", qrCodeBase64.length());

            return qrCodeBase64;
        } catch (Exception e) {
            log.error("❌ Erreur génération QR code", e);
            return "";
        }
    }

    /**
     * Récupère la facture complète
     */
    private FactureClient getFactureCompleteById(Integer factureId, Long clientId, String authClientId) {
        // 1. Récupérer la facture
        String sqlFacture = """
        SELECT 
            f.id_facture_client,
            f.reference_facture_client,
            f.date_facture,
            f.montant_total,
            f.statut,
            f.client_id,
            f.commande_id
        FROM facture_client f
        WHERE f.id_facture_client = ?
        """;

        FactureClient facture = tenantRepo.queryForObjectAuth(sqlFacture, (rs, rowNum) -> {
            FactureClient fact = new FactureClient();
            fact.setIdFactureClient(rs.getInt("id_facture_client"));
            fact.setReferenceFactureClient(rs.getString("reference_facture_client"));
            fact.setDateFacture(rs.getTimestamp("date_facture") != null ?
                    rs.getTimestamp("date_facture").toLocalDateTime() : null);
            fact.setMontantTotal(rs.getBigDecimal("montant_total"));

            String statut = rs.getString("statut");
            if (statut != null) {
                fact.setStatut(FactureClient.StatutFacture.valueOf(statut));
            }

            // Stocker les IDs
            Integer clientIdVal = rs.getInt("client_id");
            Integer commandeIdVal = rs.getInt("commande_id");

            // Charger le client
            if (clientIdVal != null && clientIdVal > 0) {
                String sqlClient = "SELECT * FROM client WHERE id_client = ?";
                org.erp.invera.model.erp.client.Client client = tenantRepo.queryForObjectAuth(sqlClient,
                        (rs2, rowNum2) -> {
                            org.erp.invera.model.erp.client.Client c = new org.erp.invera.model.erp.client.Client();
                            c.setIdClient(rs2.getInt("id_client"));
                            c.setNom(rs2.getString("nom"));
                            c.setPrenom(rs2.getString("prenom"));
                            c.setEmail(rs2.getString("email"));
                            c.setTelephone(rs2.getString("telephone"));
                            c.setAdresse(rs2.getString("adresse"));
                            return c;
                        }, clientId, authClientId, clientIdVal);
                fact.setClient(client);
            }

            // Charger la commande
            if (commandeIdVal != null && commandeIdVal > 0) {
                String sqlCommande = "SELECT * FROM commande_client WHERE id_commande_client = ?";
                CommandeClient commande = tenantRepo.queryForObjectAuth(sqlCommande,
                        (rs2, rowNum2) -> {
                            CommandeClient c = new CommandeClient();
                            c.setIdCommandeClient(rs2.getInt("id_commande_client"));
                            c.setReferenceCommandeClient(rs2.getString("reference_commande_client"));
                            c.setDateCommande(rs2.getTimestamp("date_commande") != null ?
                                    rs2.getTimestamp("date_commande").toLocalDateTime() : null);
                            c.setTotal(rs2.getBigDecimal("total"));
                            c.setSousTotal(rs2.getBigDecimal("sous_total"));
                            c.setTauxRemise(rs2.getBigDecimal("taux_remise"));
                            return c;
                        }, clientId, authClientId, commandeIdVal);
                fact.setCommande(commande);

                // Charger les lignes de la commande
                if (commande != null) {
                    String sqlLignes = """
                    SELECT l.*, p.libelle as produit_libelle, p.prix_vente
                    FROM ligne_commande_client l
                    JOIN produit p ON l.produit_id = p.id_produit
                    WHERE l.commande_client_id = ?
                    """;
                    List<LigneCommandeClient> lignes = tenantRepo.queryWithAuth(sqlLignes,
                            (rs2, rowNum2) -> {
                                LigneCommandeClient ligne = new LigneCommandeClient();
                                ligne.setIdLigneCommandeClient(rs2.getInt("id_ligne_commande_client"));
                                ligne.setQuantite(rs2.getInt("quantite"));
                                ligne.setPrixUnitaire(rs2.getBigDecimal("prix_unitaire"));
                                ligne.setSousTotal(rs2.getBigDecimal("sous_total"));

                                Produit produit = new Produit();
                                produit.setIdProduit(rs2.getInt("produit_id"));
                                produit.setLibelle(rs2.getString("produit_libelle"));
                                produit.setPrixVente(rs2.getDouble("prix_vente"));
                                ligne.setProduit(produit);
                                return ligne;
                            }, clientId, authClientId, commandeIdVal);
                    commande.setLignesCommande(lignes);
                }
            }

            return fact;
        }, clientId, authClientId, factureId);

        if (facture == null) {
            log.error("❌ Facture non trouvée pour ID: {}", factureId);
        } else {
            log.info("✅ Facture trouvée: ID={}, Réf={}", facture.getIdFactureClient(), facture.getReferenceFactureClient());
        }

        return facture;
    }
    /**
     * RowMapper pour FactureClient
     */
    private class FactureRowMapper implements RowMapper<FactureClient> {
        @Override
        public FactureClient mapRow(ResultSet rs, int rowNum) throws SQLException {
            FactureClient facture = new FactureClient();
            facture.setIdFactureClient(rs.getInt("id_facture_client"));
            facture.setReferenceFactureClient(rs.getString("reference_facture_client"));
            facture.setDateFacture(rs.getTimestamp("date_facture") != null ?
                    rs.getTimestamp("date_facture").toLocalDateTime() : null);
            facture.setMontantTotal(rs.getBigDecimal("montant_total"));

            String statut = rs.getString("statut");
            if (statut != null) {
                facture.setStatut(FactureClient.StatutFacture.valueOf(statut));
            }

            // Client destinataire
            org.erp.invera.model.erp.client.Client clientDestinataire = new org.erp.invera.model.erp.client.Client();
            clientDestinataire.setIdClient(rs.getInt("id_client"));
            clientDestinataire.setNom(rs.getString("nom"));
            clientDestinataire.setPrenom(rs.getString("prenom"));
            clientDestinataire.setEmail(rs.getString("client_email"));
            clientDestinataire.setTelephone(rs.getString("client_telephone"));
            facture.setClient(clientDestinataire);

            // Commande
            org.erp.invera.model.erp.client.CommandeClient commande = new org.erp.invera.model.erp.client.CommandeClient();
            commande.setIdCommandeClient(rs.getInt("id_commande_client"));
            commande.setReferenceCommandeClient(rs.getString("reference_commande_client"));
            facture.setCommande(commande);

            return facture;
        }
    }
    private List<LigneCommandeDTO> getLignesCommandeByFactureId(Integer factureId, Long clientId, String authClientId) {
        String sql = """
    SELECT 
        l.quantite,
        l.prix_unitaire,
        l.sous_total as sous_total_ht,
        COALESCE(p.libelle, 'Article') as produit_libelle,
        COALESCE(c.taux_tva, 0) as taux_tva
    FROM facture_client f
    JOIN commande_client cde ON f.commande_id = cde.id_commande_client
    JOIN ligne_commande_client l ON cde.id_commande_client = l.commande_client_id
    LEFT JOIN produit p ON l.produit_id = p.id_produit
    LEFT JOIN categorie c ON p.categorie_id = c.id_categorie
    WHERE f.id_facture_client = ?
    ORDER BY l.id_ligne_commande_client
    """;

        log.info("🔍 Exécution requête lignes facture avec TVA catégorie");

        return tenantRepo.queryWithAuth(sql, (rs, rowNum) -> {
            LigneCommandeDTO ligne = new LigneCommandeDTO();
            ligne.setQuantite(rs.getInt("quantite"));
            ligne.setPrixUnitaire(rs.getBigDecimal("prix_unitaire"));

            // ✅ Montant HT (sous-total sans TVA)
            BigDecimal montantHT = rs.getBigDecimal("sous_total_ht");
            ligne.setSousTotalHT(montantHT);

            // ✅ Récupérer le taux TVA depuis la catégorie
            BigDecimal tauxTVA = rs.getBigDecimal("taux_tva");
            if (tauxTVA == null) {
                tauxTVA = BigDecimal.ZERO;
            }
            ligne.setTauxTVA(tauxTVA);

            // ✅ Calculer le TTC = HT * (1 + TVA/100)
            BigDecimal montantTTC = montantHT.multiply(
                    BigDecimal.ONE.add(tauxTVA.divide(BigDecimal.valueOf(100)))
            );
            ligne.setSousTotalTTC(montantTTC);

            ligne.setDescription(rs.getString("produit_libelle"));

            log.debug("Produit: {}, HT: {}, TVA: {}%, TTC: {}",
                    ligne.getDescription(), montantHT, tauxTVA, montantTTC);

            return ligne;
        }, clientId, authClientId, factureId);
    }
    /**
     * Récupère un client de la plateforme par son ID
     * Utilise la table clients (platform) pour l'émetteur
     */
    private org.erp.invera.model.platform.Client getClientById(Long clientId, String authClientId) {
        String sql = "SELECT * FROM clients WHERE id = ?";

        try {
            // Utiliser platformJdbcTemplate au lieu de tenantRepo
            org.erp.invera.model.platform.Client client = platformJdbcTemplate.queryForObject(sql, new PlatformClientRowMapper(), clientId);
            if (client != null) {
                log.info("✅ Client plateforme trouvé: {} {}", client.getNom(), client.getPrenom());
                return client;
            }
        } catch (Exception e) {
            log.warn("⚠️ Client plateforme non trouvé pour ID: {}", clientId);
        }

        // Fallback: client par défaut
        log.warn("⚠️ Client plateforme non trouvé pour ID: {}, création d'un client par défaut", clientId);
        return createDefaultClient(clientId);
    }

    /**
     * Récupère un client ERP par son ID (destinataire)
     */
    private org.erp.invera.model.erp.client.Client getErpClientById(Integer clientId, Long authClientId, String authClientIdStr) {
        String sql = "SELECT * FROM client WHERE id_client = ?";

        try {
            org.erp.invera.model.erp.client.Client client = tenantRepo.queryForObjectAuth(sql, new ErpClientRowMapper(), authClientId, authClientIdStr, clientId);
            if (client != null) {
                log.info("✅ Client ERP trouvé: {} {}", client.getNom(), client.getPrenom());
                return client;
            }
        } catch (Exception e) {
            log.warn("⚠️ Client ERP non trouvé pour ID: {}", clientId);
        }

        return null;
    }

    // Ajoutez ce RowMapper
    private class ClientRowMapper implements RowMapper<Client> {
        @Override
        public Client mapRow(ResultSet rs, int rowNum) throws SQLException {
            Client client = new Client();
            client.setId(rs.getLong("id"));
            client.setNom(rs.getString("nom"));
            client.setPrenom(rs.getString("prenom"));
            client.setRaisonSociale(rs.getString("raison_sociale"));
            client.setEmail(rs.getString("email"));
            client.setTelephone(rs.getString("telephone"));
            client.setMatriculeFiscal(rs.getString("matricule_fiscal"));
            client.setLogoUrl(rs.getString("logo_url"));
            String typeCompte = rs.getString("type_compte");
            if (typeCompte != null) {
                client.setTypeCompte(Client.TypeCompte.valueOf(typeCompte));
            }
            return client;
        }
    }

    private Client createDefaultClient(Long clientId) {
        Client client = new Client();
        client.setId(clientId);
        client.setNom("InVera");
        client.setPrenom("ERP");
        client.setRaisonSociale("InVera ERP Solutions");
        client.setEmail("contact@invera.tn");
        client.setTelephone("+216 70 000 000");
        client.setMatriculeFiscal("0000000/A/M/000");
        client.setTypeCompte(Client.TypeCompte.ENTREPRISE);
        client.setTypeInscription(Client.TypeInscription.DEFINITIF);
        client.setStatut(Client.StatutClient.ACTIF);
        client.setIsActive(true);
        client.setDateInscription(LocalDateTime.now());
        return client;
    }
    /**
     * RowMapper pour Client
     */
    /**
     * RowMapper pour Client PLATFORM (table clients)
     */
    private class PlatformClientRowMapper implements RowMapper<org.erp.invera.model.platform.Client> {
        @Override
        public org.erp.invera.model.platform.Client mapRow(ResultSet rs, int rowNum) throws SQLException {
            org.erp.invera.model.platform.Client client = new org.erp.invera.model.platform.Client();
            client.setId(rs.getLong("id"));
            client.setNom(rs.getString("nom"));
            client.setPrenom(rs.getString("prenom"));
            client.setRaisonSociale(rs.getString("raison_sociale"));
            client.setEmail(rs.getString("email"));
            client.setTelephone(rs.getString("telephone"));
            client.setMatriculeFiscal(rs.getString("matricule_fiscal"));
            client.setLogoUrl(rs.getString("logo_url"));
            String typeCompte = rs.getString("type_compte");
            if (typeCompte != null) {
                client.setTypeCompte(org.erp.invera.model.platform.Client.TypeCompte.valueOf(typeCompte));
            }
            return client;
        }
    }

    /**
     * RowMapper pour Client ERP (table client)
     */
    private class ErpClientRowMapper implements RowMapper<org.erp.invera.model.erp.client.Client> {
        @Override
        public org.erp.invera.model.erp.client.Client mapRow(ResultSet rs, int rowNum) throws SQLException {
            org.erp.invera.model.erp.client.Client client = new org.erp.invera.model.erp.client.Client();
            client.setIdClient(rs.getInt("id_client"));
            client.setNom(rs.getString("nom"));
            client.setPrenom(rs.getString("prenom"));
            client.setEmail(rs.getString("email"));
            client.setTelephone(rs.getString("telephone"));
            client.setAdresse(rs.getString("adresse"));
            String typeClient = rs.getString("type_client");
            if (typeClient != null) {
                client.setTypeClient(org.erp.invera.model.erp.client.Client.TypeClient.valueOf(typeClient));
            }
            return client;
        }
    }

    /**
     * Calcule les totaux à partir des lignes (avec TVA par produit)
     */
    private TotauxDTO calculerTotaux(List<LigneCommandeDTO> lignes) {
        TotauxDTO totaux = new TotauxDTO();

        BigDecimal totalHT = BigDecimal.ZERO;
        BigDecimal totalTTC = BigDecimal.ZERO;
        BigDecimal tvaParProduit = BigDecimal.ZERO;

        if (lignes != null && !lignes.isEmpty()) {
            for (LigneCommandeDTO ligne : lignes) {
                if (ligne.getSousTotalHT() != null) {
                    totalHT = totalHT.add(ligne.getSousTotalHT());
                }
                if (ligne.getSousTotalTTC() != null) {
                    totalTTC = totalTTC.add(ligne.getSousTotalTTC());
                }
            }
        }

        // Calcul de la TVA totale (TTC - HT)
        BigDecimal tvaTotale = totalTTC.subtract(totalHT);

        // Taux TVA moyen (pour affichage)
        BigDecimal tvaTauxMoyen = BigDecimal.ZERO;
        if (totalHT.compareTo(BigDecimal.ZERO) > 0) {
            tvaTauxMoyen = tvaTotale.multiply(BigDecimal.valueOf(100))
                    .divide(totalHT, 2, BigDecimal.ROUND_HALF_UP);
        }

        totaux.setSousTotal(totalHT);
        totaux.setTotalTTC(totalTTC);
        totaux.setRemise(BigDecimal.ZERO);
        totaux.setRemiseTaux(BigDecimal.ZERO);
        totaux.setTva(tvaTotale);
        totaux.setTvaTaux(tvaTauxMoyen);

        log.info("📊 Totaux calculés - HT: {}, TVA: {} ({}%), TTC: {}",
                totalHT, tvaTotale, tvaTauxMoyen, totalTTC);

        return totaux;
    }

    /**
     * Obtient le détail de la TVA par taux pour une facture
     * Retourne une Map: taux -> montant TVA
     */
    public Map<BigDecimal, BigDecimal> getDetailTVA(Integer factureId, String token) {
        Long clientId = jwtTokenProvider.getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = """
    SELECT 
        COALESCE(c.taux_tva, 0) as taux_tva,
        SUM(l.sous_total) as montant_ht
    FROM facture_client f
    JOIN commande_client cde ON f.commande_id = cde.id_commande_client
    JOIN ligne_commande_client l ON cde.id_commande_client = l.commande_client_id
    LEFT JOIN produit p ON l.produit_id = p.id_produit
    LEFT JOIN categorie c ON p.categorie_id = c.id_categorie
    WHERE f.id_facture_client = ?
    GROUP BY c.taux_tva
    ORDER BY c.taux_tva
    """;

        List<Map<String, Object>> results = tenantRepo.queryWithAuth(sql, (rs, rowNum) -> {
            Map<String, Object> detail = new HashMap<>();
            detail.put("taux", rs.getBigDecimal("taux_tva"));
            detail.put("montantHT", rs.getBigDecimal("montant_ht"));
            return detail;
        }, clientId, authClientId, factureId);

        Map<BigDecimal, BigDecimal> detailTVA = new HashMap<>();
        for (Map<String, Object> result : results) {
            BigDecimal taux = (BigDecimal) result.get("taux");
            BigDecimal montantHT = (BigDecimal) result.get("montantHT");
            BigDecimal montantTVA = montantHT.multiply(taux).divide(BigDecimal.valueOf(100));
            detailTVA.put(taux, montantTVA);
        }

        return detailTVA;
    }

    /**
     * Formate un montant
     */
    private String formatMontant(BigDecimal montant) {
        if (montant == null) return "0,000 DT";
        return String.format("%,.3f DT", montant).replace(",", " ");
    }

    /**
     * Échappe le HTML
     */
    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;")
               .replace("%", "%%");
    }
    /**
     * Génère le HTML de la facture - Version finale corrigée
     */
    private String generateInvoiceHtml(FactureClient facture, Client clientConnecte,
                                       List<LigneCommandeDTO> lignes, TotauxDTO totaux,
                                       String qrCodeBase64) {

        // ========== DONNÉES DYNAMIQUES ==========
        String dateFacture = "";
        if (facture.getDateFacture() != null) {
            dateFacture = facture.getDateFacture().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        }

        String referenceFacture = facture.getReferenceFactureClient() != null ?
                facture.getReferenceFactureClient() : "N/A";

        String numeroCommande = "";
        if (facture.getCommande() != null && facture.getCommande().getReferenceCommandeClient() != null) {
            numeroCommande = facture.getCommande().getReferenceCommandeClient();
        }

        // ========== INFOS ÉMETTEUR ==========
        String emetteurNom = "";
        String emetteurTel = "";
        String emetteurEmail = "";
        String emetteurMatriculeFiscal = "";
        String emetteurLogo = "";
        boolean hasLogo = false;

        if (clientConnecte != null) {
            if (clientConnecte.getTypeCompte() == Client.TypeCompte.ENTREPRISE) {
                emetteurNom = clientConnecte.getRaisonSociale() != null ? clientConnecte.getRaisonSociale() : "";
            } else {
                String prenom = clientConnecte.getPrenom() != null ? clientConnecte.getPrenom() : "";
                String nom = clientConnecte.getNom() != null ? clientConnecte.getNom() : "";
                emetteurNom = (prenom + " " + nom).trim();
            }
            emetteurEmail = clientConnecte.getEmail() != null ? clientConnecte.getEmail() : "";
            emetteurTel = clientConnecte.getTelephone() != null ? clientConnecte.getTelephone() : "";
            emetteurMatriculeFiscal = clientConnecte.getMatriculeFiscal() != null ? clientConnecte.getMatriculeFiscal() : "";

            if (clientConnecte.getLogoUrl() != null && !clientConnecte.getLogoUrl().isEmpty()) {
                emetteurLogo = clientConnecte.getLogoUrl();
                hasLogo = true;
            }
        }

        // ========== INFOS DESTINATAIRE ==========
        String destinataireNom = "Non renseigné";
        String destinataireAdresse = "";
        String destinataireEmail = "Non renseigné";
        String destinataireTelephone = "Non renseigné";

        if (facture.getClient() != null) {
            org.erp.invera.model.erp.client.Client erpClient = facture.getClient();
            String prenom = erpClient.getPrenom() != null ? erpClient.getPrenom() : "";
            String nom = erpClient.getNom() != null ? erpClient.getNom() : "";
            destinataireNom = (prenom + " " + nom).trim();
            if (destinataireNom.isEmpty()) destinataireNom = "Non renseigné";
            destinataireAdresse = erpClient.getAdresse() != null ? erpClient.getAdresse() : "";
            destinataireEmail = erpClient.getEmail() != null ? erpClient.getEmail() : "Non renseigné";
            destinataireTelephone = erpClient.getTelephone() != null ? erpClient.getTelephone() : "Non renseigné";
        }

        // ========== GÉNÉRATION LIGNES TVA ==========
        StringBuilder itemsHtml = new StringBuilder();
        Map<BigDecimal, BigDecimal> tvaParTaux = new LinkedHashMap<>();
        BigDecimal totalHTLignes = BigDecimal.ZERO;

        if (lignes != null && !lignes.isEmpty()) {
            int index = 1;
            for (LigneCommandeDTO ligne : lignes) {
                BigDecimal prixHT = ligne.getPrixUnitaire();
                BigDecimal quantite = new BigDecimal(ligne.getQuantite());
                BigDecimal montantHT = prixHT.multiply(quantite);
                BigDecimal tauxTVA = ligne.getTauxTVA() != null ? ligne.getTauxTVA() : BigDecimal.ZERO;
                BigDecimal montantTVA = montantHT.multiply(tauxTVA).divide(BigDecimal.valueOf(100), 3, BigDecimal.ROUND_HALF_UP);
                BigDecimal montantTTC = montantHT.add(montantTVA);

                totalHTLignes = totalHTLignes.add(montantHT);
                tvaParTaux.merge(tauxTVA, montantTVA, BigDecimal::add);

                // TABLEAU CORRIGÉ - 7 colonnes bien formées
                itemsHtml.append("   <tr>\n");
                itemsHtml.append("       <td style=\"padding: 10px 8px; border: 1px solid #e2e8f0; text-align: center;\">").append(index++).append("</td>\n");
                itemsHtml.append("       <td style=\"padding: 10px 8px; border: 1px solid #e2e8f0; text-align: left;\"><strong>").append(escapeHtml(ligne.getDescription())).append("</strong></td>\n");
                itemsHtml.append("       <td style=\"padding: 10px 8px; border: 1px solid #e2e8f0; text-align: center;\">").append(ligne.getQuantite()).append("</td>\n");
                itemsHtml.append("       <td style=\"padding: 10px 8px; border: 1px solid #e2e8f0; text-align: right;\">").append(formatMontant(prixHT)).append("</td>\n");
                itemsHtml.append("       <td style=\"padding: 10px 8px; border: 1px solid #e2e8f0; text-align: center;\"><span class=\"tva-badge\">").append(tauxTVA).append("%</span></td>\n");
                itemsHtml.append("       <td style=\"padding: 10px 8px; border: 1px solid #e2e8f0; text-align: right;\">").append(formatMontant(montantTVA)).append("</td>\n");
                itemsHtml.append("       <td style=\"padding: 10px 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #f59e0b;\">").append(formatMontant(montantTTC)).append("</td>\n");
                itemsHtml.append("   </tr>\n");
            }
        } else {
            itemsHtml.append("   <tr><td colspan=\"7\" style=\"padding: 30px; text-align: center;\">Aucun article</td></tr>\n");
        }

        BigDecimal totalHT = totaux.getSousTotal() != null ? totaux.getSousTotal() : totalHTLignes;
        BigDecimal totalTTC = totaux.getTotalTTC() != null ? totaux.getTotalTTC() : BigDecimal.ZERO;
        BigDecimal totalTVA = totalTTC.subtract(totalHT);

        String totalEnLettres = convertMontantToWords(totalTTC);

        // ========== CONSTRUCTION HTML ==========
        StringBuilder html = new StringBuilder();

        html.append("<!DOCTYPE html>\n");
        html.append("<html>\n");
        html.append("<head>\n");
        html.append("    <meta charset=\"UTF-8\">\n");
        html.append("    <title>Facture ").append(referenceFacture).append("</title>\n");
        html.append("    <style>\n");
        html.append("        * { margin: 0; padding: 0; box-sizing: border-box; }\n");
        html.append("        body { font-family: 'Segoe UI', Arial, sans-serif; background: #eef2f5; padding: 20px; }\n");
        html.append("        .invoice { max-width: 1000px; margin: 0 auto; background: white; box-shadow: 0 10px 25px rgba(0,0,0,0.08); }\n");
        html.append("        \n");
        html.append("        /* HEADER */\n");
        html.append("        .header { background: linear-gradient(135deg, #0a2a5e, #1a4d8c, #2c6eb0); padding: 15px 25px; display: flex; justify-content: space-between; align-items: center; }\n");
        html.append("        .header-left { width: 200px; text-align: center; }\n");
        html.append("        .logo { max-height: 55px; max-width: 110px; background: white; padding: 5px; border-radius: 6px; }\n");
        html.append("        .company-name { font-size: 12px; font-weight: bold; color: white; margin-top: 6px; }\n");
        html.append("        .header-center { flex: 1; text-align: center; }\n");
        html.append("        .invoice-title { font-size: 24px; font-weight: bold; letter-spacing: 3px; color: white; margin-bottom: 5px; }\n");
        html.append("        .invoice-ref { font-size: 12px; font-family: monospace; color: rgba(255,255,255,0.85); margin-bottom: 3px; }\n");
        html.append("        .invoice-date { font-size: 11px; color: rgba(255,255,255,0.7); }\n");
        html.append("        .header-right { width: 100px; text-align: center; }\n");
        html.append("        .qr-code { width: 55px; height: 55px; background: white; border-radius: 8px; margin: 0 auto; display: flex; align-items: center; justify-content: center; }\n");
        html.append("        .qr-code img { width: 100%; height: 100%; object-fit: contain; }\n");
        html.append("        .qr-text { font-size: 8px; color: rgba(255,255,255,0.7); margin-top: 4px; }\n");
        html.append("        \n");
        html.append("        /* SECTION INFOS */\n");
        html.append("        .info-section { padding: 20px 25px; display: flex; gap: 30px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }\n");
        html.append("        .info-card { flex: 1; background: white; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; }\n");
        html.append("        .info-card-header { padding: 10px 15px; font-size: 12px; font-weight: bold; background: #f1f5f9; border-bottom: 2px solid; }\n");
        html.append("        .info-card-header.emetteur { color: #1a4d8c; border-bottom-color: #1a4d8c; }\n");
        html.append("        .info-card-header.destinataire { color: #f59e0b; border-bottom-color: #f59e0b; }\n");
        html.append("        .info-card-body { padding: 12px 15px; }\n");
        html.append("        .info-row { margin-bottom: 8px; }\n");
        html.append("        .info-label { font-size: 9px; font-weight: 600; text-transform: uppercase; color: #94a3b8; margin-bottom: 2px; }\n");
        html.append("        .info-value { font-size: 12px; font-weight: 500; color: #1e293b; }\n");
        html.append("        \n");
        html.append("        /* CARTES COMMANDE */\n");
        html.append("        .order-cards { padding: 20px 25px; display: flex; justify-content: center; gap: 30px; background: white; border-bottom: 1px solid #e2e8f0; }\n");
        html.append("        .order-card { width: 250px; background: #f8fafc; border-radius: 10px; padding: 12px; border: 1px solid #e2e8f0; text-align: center; }\n");
        html.append("        .order-card-label { font-size: 9px; font-weight: 600; color: #64748b; text-transform: uppercase; }\n");
        html.append("        .order-card-value { font-size: 13px; font-weight: bold; color: #1a4d8c; margin-top: 4px; }\n");
        html.append("        \n");
        html.append("        /* TABLEAU */\n");
        html.append("        .table-section { padding: 20px 25px; }\n");
        html.append("        .section-title { font-size: 12px; font-weight: bold; color: #1e293b; margin-bottom: 12px; }\n");
        html.append("        table { width: 100%; border-collapse: collapse; font-size: 11px; }\n");
        html.append("        th { background: #1a4d8c; color: white; padding: 10px 8px; border: 1px solid #2a5d9c; text-align: center; }\n");
        html.append("        td { padding: 10px 8px; border: 1px solid #e2e8f0; }\n");
        html.append("        .tva-badge { background: #eef2ff; padding: 2px 8px; border-radius: 12px; font-size: 9px; font-weight: 600; color: #1a4d8c; }\n");
        html.append("        \n");
        html.append("        /* TOTAUX A DROITE */\n");
        html.append("        .totaux-section { padding: 15px 25px; display: flex; justify-content: flex-end; }\n");
        html.append("        .totaux-card { width: 320px; border: 1px solid #1a4d8c; border-radius: 10px; padding: 12px 20px; }\n");
        html.append("        .total-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 12px; }\n");
        html.append("        .total-label { color: #64748b; font-weight: 500; }\n");
        html.append("        .total-value { font-weight: 600; color: #1e293b; font-family: monospace; }\n");
        html.append("        .grand-total { border-top: 1px solid #e2e8f0; margin-top: 8px; padding-top: 10px; }\n");
        html.append("        .grand-total-label, .grand-total-value { font-weight: 700; color: #1a4d8c; font-size: 14px; }\n");
        html.append("        \n");
        html.append("        /* MONTANT EN LETTRES */\n");
        html.append("        .amount-letters { margin: 0 25px 20px 25px; padding: 12px 18px; background: #fefce8; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; }\n");
        html.append("        .amount-title { font-size: 10px; font-weight: 600; color: #1a4d8c; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }\n");
        html.append("        .amount-text { font-size: 12px; font-style: italic; color: #475569; font-weight: 500; line-height: 1.4; }\n");
        html.append("        \n");
        html.append("        /* SIGNATURE */\n");
        html.append("        .signature-section { padding: 15px 25px 25px; display: flex; gap: 30px; }\n");
        html.append("        .signature-item { flex: 1; text-align: center; }\n");
        html.append("        .signature-item span { font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 8px; }\n");
        html.append("        .signature-line { border-top: 1px solid #cbd5e1; width: 70%; margin: 8px auto 0; }\n");
        html.append("        .signature-space { height: 35px; }\n");
        html.append("        \n");
        html.append("        @media print { body { background: white; } .invoice { box-shadow: none; } }\n");
        html.append("        @media (max-width: 700px) { .header { flex-direction: column; gap: 10px; } .info-section, .order-cards, .signature-section { flex-direction: column; } .totaux-card { width: 100%; } }\n");
        html.append("    </style>\n");
        html.append("</head>\n");
        html.append("<body>\n");
        html.append("<div class=\"invoice\">\n");

        // ========== HEADER ==========
        html.append("<div class=\"header\">\n");
        html.append("    <div class=\"header-left\">\n");
        if (hasLogo) {
            html.append("        <img src=\"").append(emetteurLogo).append("\" class=\"logo\" alt=\"Logo\">\n");
        }
        html.append("        <div class=\"company-name\">").append(escapeHtml(emetteurNom)).append("</div>\n");
        html.append("    </div>\n");
        html.append("    <div class=\"header-center\">\n");
        html.append("        <div class=\"invoice-title\">FACTURE</div>\n");
        html.append("        <div class=\"invoice-ref\"># ").append(referenceFacture).append("</div>\n");
        html.append("        <div class=\"invoice-date\">Date : ").append(dateFacture).append("</div>\n");
        html.append("    </div>\n");
        html.append("    <div class=\"header-right\">\n");
        html.append("        <div class=\"qr-code\">\n");
        if (qrCodeBase64 != null && !qrCodeBase64.isEmpty()) {
            html.append("            <img src=\"data:image/png;base64,").append(qrCodeBase64).append("\" alt=\"QR\">\n");
        } else {
            html.append("            <div style=\"width:45px;height:45px;background:#eee;border-radius:6px;\"></div>\n");
        }
        html.append("        </div>\n");
        html.append("        <div class=\"qr-text\">SCANNER</div>\n");
        html.append("    </div>\n");
        html.append("</div>\n");

        // ========== ÉMETTEUR / DESTINATAIRE ==========
        html.append("<div class=\"info-section\">\n");
        html.append("    <div class=\"info-card\">\n");
        html.append("        <div class=\"info-card-header emetteur\">ÉMETTEUR</div>\n");
        html.append("        <div class=\"info-card-body\">\n");
        html.append("            <div class=\"info-row\"><div class=\"info-label\">Nom / Raison sociale</div><div class=\"info-value\">").append(escapeHtml(emetteurNom)).append("</div></div>\n");
        if (!emetteurTel.isEmpty()) {
            html.append("            <div class=\"info-row\"><div class=\"info-label\">Téléphone</div><div class=\"info-value\">").append(escapeHtml(emetteurTel)).append("</div></div>\n");
        }
        if (!emetteurEmail.isEmpty()) {
            html.append("            <div class=\"info-row\"><div class=\"info-label\">Email</div><div class=\"info-value\">").append(escapeHtml(emetteurEmail)).append("</div></div>\n");
        }
        if (!emetteurMatriculeFiscal.isEmpty()) {
            html.append("            <div class=\"info-row\"><div class=\"info-label\">Matricule Fiscal</div><div class=\"info-value\">").append(escapeHtml(emetteurMatriculeFiscal)).append("</div></div>\n");
        }
        html.append("        </div>\n");
        html.append("    </div>\n");
        html.append("    <div class=\"info-card\">\n");
        html.append("        <div class=\"info-card-header destinataire\">DESTINATAIRE</div>\n");
        html.append("        <div class=\"info-card-body\">\n");
        html.append("            <div class=\"info-row\"><div class=\"info-label\">Nom / Prénom</div><div class=\"info-value\">").append(escapeHtml(destinataireNom)).append("</div></div>\n");
        if (!destinataireAdresse.isEmpty()) {
            html.append("            <div class=\"info-row\"><div class=\"info-label\">Adresse</div><div class=\"info-value\">").append(escapeHtml(destinataireAdresse)).append("</div></div>\n");
        }
        if (!destinataireTelephone.isEmpty()) {
            html.append("            <div class=\"info-row\"><div class=\"info-label\">Téléphone</div><div class=\"info-value\">").append(escapeHtml(destinataireTelephone)).append("</div></div>\n");
        }
        if (!destinataireEmail.isEmpty()) {
            html.append("            <div class=\"info-row\"><div class=\"info-label\">Email</div><div class=\"info-value\">").append(escapeHtml(destinataireEmail)).append("</div></div>\n");
        }
        html.append("        </div>\n");
        html.append("    </div>\n");
        html.append("</div>\n");

        // ========== CARTES COMMANDE ==========
        html.append("<div class=\"order-cards\">\n");
        html.append("    <div class=\"order-card\">\n");
        html.append("        <div class=\"order-card-label\">N° BON DE COMMANDE</div>\n");
        html.append("        <div class=\"order-card-value\">").append(numeroCommande.isEmpty() ? "N/A" : numeroCommande).append("</div>\n");
        html.append("    </div>\n");
        html.append("    <div class=\"order-card\">\n");
        html.append("        <div class=\"order-card-label\">DATE COMMANDE</div>\n");
        html.append("        <div class=\"order-card-value\">").append(dateFacture).append("</div>\n");
        html.append("    </div>\n");
        html.append("</div>\n");

        // ========== TABLEAU CORRIGÉ ==========
        html.append("<div class=\"table-section\">\n");
        html.append("    <div class=\"section-title\">DÉTAIL DES ARTICLES</div>\n");
        html.append("    <table>\n");
        html.append("        <thead>\n");
        html.append("            <tr>\n");
        html.append("                <th style=\"width:5%\">#</th>\n");
        html.append("                <th style=\"width:38%\">DÉSIGNATION</th>\n");
        html.append("                <th style=\"width:7%\">QTÉ</th>\n");
        html.append("                <th style=\"width:12%\">PRIX HT</th>\n");
        html.append("                <th style=\"width:8%\">TVA</th>\n");
        html.append("                <th style=\"width:15%\">MONTANT TVA</th>\n");
        html.append("                <th style=\"width:15%\">TOTAL TTC</th>\n");
        html.append("            </tr>\n");
        html.append("        </thead>\n");
        html.append("        <tbody>\n");
        html.append(itemsHtml.toString());
        html.append("        </tbody>\n");
        html.append("    </table>\n");
        html.append("</div>\n");

        // ========== TOTAUX A DROITE ==========
        html.append("<div class=\"totaux-section\">\n");
        html.append("    <div class=\"totaux-card\">\n");
        html.append("        <div class=\"total-row\">\n");
        html.append("            <span class=\"total-label\">Total HT</span>\n");
        html.append("            <span class=\"total-value\">").append(formatMontant(totalHT)).append("</span>\n");
        html.append("        </div>\n");

        if (tvaParTaux.isEmpty()) {
            html.append("        <div class=\"total-row\">\n");
            html.append("            <span class=\"total-label\">TVA (0%)</span>\n");
            html.append("            <span class=\"total-value\">0,000 DT</span>\n");
            html.append("        </div>\n");
        } else if (tvaParTaux.size() == 1) {
            BigDecimal taux = tvaParTaux.keySet().iterator().next();
            html.append("        <div class=\"total-row\">\n");
            html.append("            <span class=\"total-label\">TVA (").append(taux).append("%)</span>\n");
            html.append("            <span class=\"total-value\">").append(formatMontant(tvaParTaux.get(taux))).append("</span>\n");
            html.append("        </div>\n");
        } else {
            for (Map.Entry<BigDecimal, BigDecimal> entry : tvaParTaux.entrySet()) {
                if (entry.getKey().compareTo(BigDecimal.ZERO) > 0) {
                    html.append("        <div class=\"total-row\">\n");
                    html.append("            <span class=\"total-label\">TVA (").append(String.format("%.2f", entry.getKey())).append("%)</span>\n");
                    html.append("            <span class=\"total-value\">").append(formatMontant(entry.getValue())).append("</span>\n");
                    html.append("        </div>\n");
                }
            }
        }

        html.append("        <div class=\"total-row grand-total\">\n");
        html.append("            <span class=\"grand-total-label\">TOTAL TTC</span>\n");
        html.append("            <span class=\"grand-total-value\" style=\"color: #f59e0b;\">").append(formatMontant(totalTTC)).append("</span>\n");
        html.append("        </div>\n");
        html.append("    </div>\n");
        html.append("</div>\n");

        // ========== MONTANT EN LETTRES ==========
        if (!totalEnLettres.isEmpty()) {
            html.append("<div class=\"amount-letters\">\n");
            html.append("    <div class=\"amount-title\">ARRÊTÉE LA PRÉSENTE FACTURE À LA SOMME DE :</div>\n");
            html.append("    <div class=\"amount-text\">").append(totalEnLettres).append("</div>\n");
            html.append("</div>\n");
        }

        // ========== SIGNATURE ==========
        html.append("<div class=\"signature-section\">\n");
        html.append("    <div class=\"signature-item\">\n");
        html.append("        <span>Cachet de l'entreprise</span>\n");
        html.append("        <div class=\"signature-space\"></div>\n");
        html.append("    </div>\n");
        html.append("    <div class=\"signature-item\">\n");
        html.append("        <span>Signature du client</span>\n");
        html.append("        <div class=\"signature-space\"></div>\n");
        html.append("    </div>\n");
        html.append("</div>\n");

        html.append("</body>\n");
        html.append("</html>");

        return html.toString();
    }
    /**
     * Convertit un montant en toutes lettres (français)
     */
    private String convertMontantToWords(BigDecimal montant) {
        if (montant == null || montant.compareTo(BigDecimal.ZERO) == 0) {
            return "zéro dinars";
        }

        long partieEntiere = montant.longValue();
        int partieDecimale = montant.remainder(BigDecimal.ONE).multiply(BigDecimal.valueOf(1000)).intValue();

        String resultat = convertNumberToWords(partieEntiere) + " dinars";

        if (partieDecimale > 0) {
            resultat += " et " + convertNumberToWords(partieDecimale) + " millimes";
        }

        return resultat;
    }

    /**
     * Convertit un nombre en toutes lettres (1 à 999999)
     */
    private String convertNumberToWords(long number) {
        if (number == 0) return "zéro";

        String[] units = {"", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
                "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"};
        String[] tens = {"", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"};

        if (number < 20) {
            return units[(int) number];
        }

        if (number < 100) {
            int unit = (int) (number % 10);
            int ten = (int) (number / 10);
            if (ten == 7 || ten == 9) {
                if (unit == 1) {
                    return tens[ten] + " et onze";
                }
                return tens[ten] + "-" + units[unit + 10];
            }
            if (unit == 1 && ten != 8) {
                return tens[ten] + " et un";
            }
            if (unit == 0) {
                return tens[ten] + (ten == 8 ? "s" : "");
            }
            return tens[ten] + "-" + units[unit];
        }

        if (number < 1000) {
            int hundred = (int) (number / 100);
            int rest = (int) (number % 100);
            String result = hundred == 1 ? "cent" : units[hundred] + " cent";
            if (rest > 0) {
                result += " " + convertNumberToWords(rest);
            }
            if (hundred > 1 && rest == 0) {
                result += "s";
            }
            return result;
        }

        if (number < 1000000) {
            int thousand = (int) (number / 1000);
            int rest = (int) (number % 1000);
            String result = thousand == 1 ? "mille" : convertNumberToWords(thousand) + " mille";
            if (rest > 0) {
                result += " " + convertNumberToWords(rest);
            }
            return result;
        }

        return String.valueOf(number);
    }

    /**
     * Formate une date LocalDateTime
     */
    private String formatLocalDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        return dateTime.format(DATE_FORMATTER);
    }

    private String getPrimaryColorForClient(Client client) {
        if (client == null) return "#2563eb";
        long id = client.getId() != null ? client.getId() : 0;
        String[] colors = { "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#059669", "#0891b2", "#4f46e5", "#e11d48" };
        return colors[(int)(id % colors.length)];
    }

    private String getGradientColorForClient(Client client) {
        if (client == null) return "#1e40af";
        long id = client.getId() != null ? client.getId() : 0;
        String[] colors = { "#1e40af", "#5b21b6", "#be185d", "#c2410c", "#047857", "#0e7490", "#4338ca", "#9f1239" };
        return colors[(int)(id % colors.length)];
    }

    // ==================== DTOs Internes ====================

    private static class LigneCommandeDTO {
        private int quantite;
        private BigDecimal prixUnitaire;
        private BigDecimal sousTotalHT;
        private BigDecimal sousTotalTTC;
        private BigDecimal tauxTVA;
        private String description;

        public int getQuantite() { return quantite; }
        public void setQuantite(int quantite) { this.quantite = quantite; }
        public BigDecimal getPrixUnitaire() { return prixUnitaire; }
        public void setPrixUnitaire(BigDecimal prixUnitaire) { this.prixUnitaire = prixUnitaire; }
        public BigDecimal getSousTotalHT() { return sousTotalHT; }
        public void setSousTotalHT(BigDecimal sousTotalHT) { this.sousTotalHT = sousTotalHT; }
        public BigDecimal getSousTotalTTC() { return sousTotalTTC; }
        public void setSousTotalTTC(BigDecimal sousTotalTTC) { this.sousTotalTTC = sousTotalTTC; }
        public BigDecimal getTauxTVA() { return tauxTVA; }
        public void setTauxTVA(BigDecimal tauxTVA) { this.tauxTVA = tauxTVA; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    private static class TotauxDTO {
        private BigDecimal sousTotal;
        private BigDecimal remise;
        private BigDecimal remiseTaux;
        private BigDecimal tva;
        private BigDecimal tvaTaux;
        private BigDecimal totalTTC;

        public BigDecimal getSousTotal() { return sousTotal; }
        public void setSousTotal(BigDecimal sousTotal) { this.sousTotal = sousTotal; }
        public BigDecimal getRemise() { return remise; }
        public void setRemise(BigDecimal remise) { this.remise = remise; }
        public BigDecimal getRemiseTaux() { return remiseTaux; }
        public void setRemiseTaux(BigDecimal remiseTaux) { this.remiseTaux = remiseTaux; }
        public BigDecimal getTva() { return tva; }
        public void setTva(BigDecimal tva) { this.tva = tva; }
        public BigDecimal getTvaTaux() { return tvaTaux; }
        public void setTvaTaux(BigDecimal tvaTaux) { this.tvaTaux = tvaTaux; }
        public BigDecimal getTotalTTC() { return totalTTC; }
        public void setTotalTTC(BigDecimal totalTTC) { this.totalTTC = totalTTC; }
    }
}