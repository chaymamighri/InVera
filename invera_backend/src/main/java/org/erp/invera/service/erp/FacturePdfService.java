package org.erp.invera.service.erp;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.itextpdf.html2pdf.HtmlConverter;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.AreaBreak;
import com.itextpdf.layout.element.IBlockElement;
import com.itextpdf.layout.element.IElement;
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
import java.util.Base64;
import java.util.List;

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
            l.sous_total,
            COALESCE(p.libelle, 'Article') as produit_libelle
        FROM facture_client f
        JOIN commande_client c ON f.commande_id = c.id_commande_client
        JOIN ligne_commande_client l ON c.id_commande_client = l.commande_client_id
        LEFT JOIN produit p ON l.produit_id = p.id_produit
        WHERE f.id_facture_client = ?
        ORDER BY l.id_ligne_commande_client
        """;

        log.info("🔍 Exécution requête lignes facture: {}", sql);

        return tenantRepo.queryWithAuth(sql, (rs, rowNum) -> {
            LigneCommandeDTO ligne = new LigneCommandeDTO();
            ligne.setQuantite(rs.getInt("quantite"));
            ligne.setPrixUnitaire(rs.getBigDecimal("prix_unitaire"));
            ligne.setSousTotalHT(rs.getBigDecimal("sous_total"));
            ligne.setSousTotalTTC(rs.getBigDecimal("sous_total"));
            ligne.setTauxTVA(BigDecimal.valueOf(19)); // TVA par défaut
            ligne.setDescription(rs.getString("produit_libelle"));
            return ligne;
        }, clientId, authClientId, factureId);
    }

    /**
     * RowMapper pour LigneCommandeDTO
     */
    private class LigneCommandeRowMapper implements RowMapper<LigneCommandeDTO> {
        @Override
        public LigneCommandeDTO mapRow(ResultSet rs, int rowNum) throws SQLException {
            LigneCommandeDTO ligne = new LigneCommandeDTO();
            ligne.setQuantite(rs.getInt("quantite"));
            ligne.setPrixUnitaire(rs.getBigDecimal("prix_unitaire"));
            ligne.setSousTotalHT(rs.getBigDecimal("sous_total_ht"));
            ligne.setSousTotalTTC(rs.getBigDecimal("sous_total_ttc"));
            ligne.setTauxTVA(rs.getBigDecimal("taux_tva"));
            ligne.setDescription(rs.getString("produit_libelle"));
            return ligne;
        }
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
     * Calcule les totaux
     */
    private TotauxDTO calculerTotaux(List<LigneCommandeDTO> lignes) {
        TotauxDTO totaux = new TotauxDTO();

        BigDecimal sousTotal = BigDecimal.ZERO;
        BigDecimal totalTTC = BigDecimal.ZERO;

        if (lignes != null && !lignes.isEmpty()) {
            for (LigneCommandeDTO ligne : lignes) {
                if (ligne.getSousTotalHT() != null) {
                    sousTotal = sousTotal.add(ligne.getSousTotalHT());
                }
                if (ligne.getSousTotalTTC() != null) {
                    totalTTC = totalTTC.add(ligne.getSousTotalTTC());
                }
            }
        }

        totaux.setSousTotal(sousTotal);
        totaux.setTotalTTC(totalTTC);
        totaux.setRemise(BigDecimal.ZERO);
        totaux.setRemiseTaux(BigDecimal.ZERO);

        BigDecimal tva = totalTTC.subtract(sousTotal);
        totaux.setTva(tva);
        totaux.setTvaTaux(BigDecimal.valueOf(19));

        return totaux;
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
     * Génère le HTML de la facture
     */
    private String generateInvoiceHtml(FactureClient facture, Client clientConnecte,
                                       List<LigneCommandeDTO> lignes, TotauxDTO totaux,
                                       String qrCodeBase64) {
        boolean hasRemise = totaux.getRemise() != null && totaux.getRemise().compareTo(BigDecimal.ZERO) > 0;

        String numeroCommande = null;
        if (facture.getCommande() != null) {
            numeroCommande = facture.getCommande().getReferenceCommandeClient();
        }

        // Vérifier si le client a un logo
        boolean hasLogo = clientConnecte != null && clientConnecte.getLogoUrl() != null && !clientConnecte.getLogoUrl().isEmpty();

        // Générer les lignes HTML
        StringBuilder itemsHtml = new StringBuilder();
        if (lignes != null && !lignes.isEmpty()) {
            for (LigneCommandeDTO ligne : lignes) {
                itemsHtml.append("<tr>");
                itemsHtml.append("<td>").append(escapeHtml(ligne.getDescription())).append("</td>");
                itemsHtml.append("<td class=\"text-center\">").append(ligne.getQuantite()).append("</td>");
                itemsHtml.append("<td class=\"text-right\">").append(formatMontant(ligne.getPrixUnitaire())).append("</td>");
                itemsHtml.append("<td class=\"text-right\">").append(formatMontant(ligne.getSousTotalTTC())).append("</td>");
                itemsHtml.append("</tr>\n");
            }
        } else {
            itemsHtml.append("<tr><td colspan=\"4\" class=\"text-center\" style=\"padding: 30px;\">Aucun article</td></tr>");
        }

        // Infos entreprise émettrice (client connecté)
        String entrepriseNom = "";
        String telephone = "";
        String email = "";
        String matriculeFiscal = "";
        boolean isEntreprise = false;

        if (clientConnecte != null) {
            isEntreprise = clientConnecte.getTypeCompte() == Client.TypeCompte.ENTREPRISE;

            if (isEntreprise) {
                entrepriseNom = clientConnecte.getRaisonSociale() != null && !clientConnecte.getRaisonSociale().isEmpty()
                        ? clientConnecte.getRaisonSociale() : "";
                matriculeFiscal = clientConnecte.getMatriculeFiscal() != null ? clientConnecte.getMatriculeFiscal() : "";
            } else {
                String nom = clientConnecte.getNom() != null ? clientConnecte.getNom() : "";
                String prenom = clientConnecte.getPrenom() != null ? clientConnecte.getPrenom() : "";
                entrepriseNom = (nom + " " + prenom).trim();
            }
            telephone = clientConnecte.getTelephone() != null ? clientConnecte.getTelephone() : "";
            email = clientConnecte.getEmail() != null ? clientConnecte.getEmail() : "";
        }

        // Infos client destinataire
        String clientNom = "Non renseigné";
        String clientEmail = "Non renseigné";
        String clientTelephone = "Non renseigné";

        if (facture.getClient() != null) {
            clientNom = (facture.getClient().getNom() != null ? facture.getClient().getNom() : "") +
                    " " + (facture.getClient().getPrenom() != null ? facture.getClient().getPrenom() : "");
            clientNom = clientNom.trim().isEmpty() ? "Non renseigné" : clientNom;
            clientEmail = facture.getClient().getEmail() != null ? facture.getClient().getEmail() : "Non renseigné";
            clientTelephone = facture.getClient().getTelephone() != null ? facture.getClient().getTelephone() : "Non renseigné";
        }

        String primaryColor = "#2563eb";

        // Convertir le montant total en toutes lettres
        String totalEnLettres = convertMontantToWords(totaux.getTotalTTC());

        // Construction du HTML
        StringBuilder html = new StringBuilder();

        html.append("<!DOCTYPE html>\n");
        html.append("<html>\n");
        html.append("<head>\n");
        html.append("    <meta charset=\"UTF-8\">\n");
        html.append("    <title>Facture ").append(facture.getReferenceFactureClient()).append("</title>\n");
        html.append("    <style>\n");
        html.append("        * { margin: 0; padding: 0; box-sizing: border-box; }\n");
        html.append("        body {\n");
        html.append("            font-family: 'Segoe UI', 'Inter', -apple-system, sans-serif;\n");
        html.append("            background: #f0f2f5;\n");
        html.append("            padding: 40px 20px;\n");
        html.append("        }\n");
        html.append("        .invoice-container {\n");
        html.append("            max-width: 1000px;\n");
        html.append("            margin: 0 auto;\n");
        html.append("            background: white;\n");
        html.append("            border-radius: 16px;\n");
        html.append("            box-shadow: 0 20px 35px -10px rgba(0,0,0,0.1);\n");
        html.append("            overflow: hidden;\n");
        html.append("        }\n");
        html.append("        /* ========== HEADER ========== */\n");
        html.append("        .header {\n");
        html.append("            padding: 20px 35px;\n");
        html.append("            display: flex;\n");
        html.append("            justify-content: space-between;\n");
        html.append("            align-items: center;\n");
        html.append("            border-bottom: 1px solid #e9ecef;\n");
        html.append("            background: white;\n");
        html.append("            min-height: 130px;\n");
        html.append("        }\n");
        html.append("        .left-section {\n");
        html.append("            display: flex;\n");
        html.append("            flex-direction: column;\n");
        html.append("            align-items: flex-start;\n");
        html.append("            gap: 6px;\n");
        html.append("            flex: 1;\n");
        html.append("        }\n");
        html.append("        .center-section {\n");
        html.append("            text-align: center;\n");
        html.append("            flex: 1;\n");
        html.append("        }\n");
        html.append("        .right-section {\n");
        html.append("            display: flex;\n");
        html.append("            justify-content: flex-end;\n");
        html.append("            flex: 1;\n");
        html.append("        }\n");
        html.append("        .logo {\n");
        html.append("            max-width: 70px;\n");
        html.append("            max-height: 55px;\n");
        html.append("            object-fit: contain;\n");
        html.append("        }\n");
        html.append("        .company-details {\n");
        html.append("            text-align: left;\n");
        html.append("        }\n");
        html.append("        .company-name {\n");
        html.append("            font-size: 13px;\n");
        html.append("            font-weight: 700;\n");
        html.append("            color: #1a1f36;\n");
        html.append("            margin-bottom: 3px;\n");
        html.append("        }\n");
        html.append("        .company-details p {\n");
        html.append("            margin: 2px 0;\n");
        html.append("            font-size: 9px;\n");
        html.append("            color: #5c6f87;\n");
        html.append("        }\n");
        html.append("        .invoice-title {\n");
        html.append("            font-size: 22px;\n");
        html.append("            font-weight: 800;\n");
        html.append("            color: #1a1f36;\n");
        html.append("            letter-spacing: 3px;\n");
        html.append("            margin-bottom: 4px;\n");
        html.append("        }\n");
        html.append("        .invoice-ref {\n");
        html.append("            color: #5c6f87;\n");
        html.append("            font-size: 11px;\n");
        html.append("            font-family: monospace;\n");
        html.append("        }\n");
        html.append("        .qr-code-section {\n");
        html.append("            display: flex;\n");
        html.append("            flex-direction: column;\n");
        html.append("            align-items: center;\n");
        html.append("        }\n");
        html.append("        .qr-code {\n");
        html.append("            width: 75px;\n");
        html.append("            height: 75px;\n");
        html.append("        }\n");
        html.append("        .qr-text {\n");
        html.append("            font-size: 7px;\n");
        html.append("            color: #8b9bb0;\n");
        html.append("            margin-top: 5px;\n");
        html.append("            text-align: center;\n");
        html.append("            line-height: 1.2;\n");
        html.append("        }\n");
        html.append("        /* ========== INFO GRID ========== */\n");
        html.append("        .info-grid {\n");
        html.append("            padding: 25px 30px;\n");
        html.append("            display: flex;\n");
        html.append("            flex-direction: row;\n");
        html.append("            gap: 30px;\n");
        html.append("            background: #f8fafc;\n");
        html.append("        }\n");
        html.append("        .info-card {\n");
        html.append("            background: white;\n");
        html.append("            border-radius: 10px;\n");
        html.append("            padding: 15px 20px;\n");
        html.append("            border: 1px solid #e9ecef;\n");
        html.append("            flex: 1;\n");
        html.append("        }\n");
        html.append("        .info-card h3 {\n");
        html.append("            font-size: 10px;\n");
        html.append("            font-weight: 700;\n");
        html.append("            color: #5c6f87;\n");
        html.append("            text-transform: uppercase;\n");
        html.append("            letter-spacing: 1px;\n");
        html.append("            margin-bottom: 12px;\n");
        html.append("        }\n");
        html.append("        .info-row {\n");
        html.append("            display: flex;\n");
        html.append("            margin-bottom: 8px;\n");
        html.append("        }\n");
        html.append("        .info-label {\n");
        html.append("            width: 80px;\n");
        html.append("            font-size: 10px;\n");
        html.append("            color: #5c6f87;\n");
        html.append("        }\n");
        html.append("        .info-value {\n");
        html.append("            font-size: 11px;\n");
        html.append("            font-weight: 500;\n");
        html.append("            color: #1a1f36;\n");
        html.append("        }\n");
        html.append("        .montant-highlight .info-value {\n");
        html.append("            font-size: 18px;\n");
        html.append("            font-weight: 800;\n");
        html.append("            color: ").append(primaryColor).append(";\n");
        html.append("        }\n");
        html.append("        /* ========== ARTICLES ========== */\n");
        html.append("        .articles-section {\n");
        html.append("            padding: 20px 30px;\n");
        html.append("        }\n");
        html.append("        .section-title {\n");
        html.append("            font-size: 12px;\n");
        html.append("            font-weight: 700;\n");
        html.append("            color: #1a1f36;\n");
        html.append("            margin-bottom: 15px;\n");
        html.append("            text-transform: uppercase;\n");
        html.append("            letter-spacing: 1px;\n");
        html.append("        }\n");
        html.append("        table {\n");
        html.append("            width: 100%;\n");
        html.append("            border-collapse: collapse;\n");
        html.append("        }\n");
        html.append("        th {\n");
        html.append("            background: #f8fafc;\n");
        html.append("            padding: 10px 8px;\n");
        html.append("            text-align: left;\n");
        html.append("            font-size: 10px;\n");
        html.append("            font-weight: 600;\n");
        html.append("            color: #5c6f87;\n");
        html.append("            text-transform: uppercase;\n");
        html.append("            border-bottom: 1px solid #e9ecef;\n");
        html.append("        }\n");
        html.append("        td {\n");
        html.append("            padding: 10px 8px;\n");
        html.append("            text-align: left;\n");
        html.append("            font-size: 11px;\n");
        html.append("            color: #1a1f36;\n");
        html.append("            border-bottom: 1px solid #e9ecef;\n");
        html.append("        }\n");
        html.append("        .text-center { text-align: center; }\n");
        html.append("        .text-right { text-align: right; }\n");
        // ==================== TOTAUX ====================
        html.append("        /* ========== TOTAUX ========== */\n");
        html.append("        .totaux-section {\n");
        html.append("            padding: 15px 30px 25px 30px;\n");
        html.append("        }\n");
        html.append("        .totaux-container {\n");
        html.append("            max-width: 350px;\n");
        html.append("            margin-left: auto;\n");
        html.append("            background: #f8fafc;\n");
        html.append("            border-radius: 10px;\n");
        html.append("            padding: 15px 25px;\n");
        html.append("        }\n");
        html.append("        .total-row {\n");
        html.append("            display: flex;\n");
        html.append("            justify-content: space-between;\n");
        html.append("            align-items: center;\n");
        html.append("            padding: 8px 0;\n");
        html.append("        }\n");
        html.append("        .total-label {\n");
        html.append("            color: #5c6f87;\n");
        html.append("            font-size: 12px;\n");
        html.append("            font-weight: 500;\n");
        html.append("            width: 120px;\n");
        html.append("            text-align: left;\n");
        html.append("        }\n");
        html.append("        .total-value {\n");
        html.append("            color: #1a1f36;\n");
        html.append("            font-size: 12px;\n");
        html.append("            font-weight: 600;\n");
        html.append("            font-family: monospace;\n");
        html.append("            text-align: right;\n");
        html.append("            width: 110px;\n");
        html.append("        }\n");
        html.append("        .grand-total-row {\n");
        html.append("            border-top: 2px solid #e9ecef;\n");
        html.append("            margin-top: 8px;\n");
        html.append("            padding-top: 12px;\n");
        html.append("        }\n");
        html.append("        .grand-total-label {\n");
        html.append("            color: #1a1f36;\n");
        html.append("            font-size: 14px;\n");
        html.append("            font-weight: 800;\n");
        html.append("            width: 120px;\n");
        html.append("            text-align: left;\n");
        html.append("        }\n");
        html.append("        .grand-total-value {\n");
        html.append("            color: ").append(primaryColor).append(";\n");
        html.append("            font-size: 16px;\n");
        html.append("            font-weight: 800;\n");
        html.append("            font-family: monospace;\n");
        html.append("            text-align: right;\n");
        html.append("            width: 110px;\n");
        html.append("        }\n");
        html.append("        .total-letters-title {\n");
        html.append("            text-align: right;\n");
        html.append("            font-size: 9px;\n");
        html.append("            font-weight: 600;\n");
        html.append("            color: #5c6f87;\n");
        html.append("            margin-top: 12px;\n");
        html.append("            padding-top: 8px;\n");
        html.append("            border-top: 1px dashed #e9ecef;\n");
        html.append("            text-transform: uppercase;\n");
        html.append("            letter-spacing: 0.5px;\n");
        html.append("        }\n");
        html.append("        .total-letters {\n");
        html.append("            text-align: right;\n");
        html.append("            font-size: 9px;\n");
        html.append("            color: #8b9bb0;\n");
        html.append("            margin-top: 4px;\n");
        html.append("            font-style: italic;\n");
        html.append("        }\n");
        html.append("        /* ========== FOOTER ========== */\n");
        html.append("        .footer {\n");
        html.append("            padding: 15px 30px;\n");
        html.append("            text-align: center;\n");
        html.append("            border-top: 1px solid #e9ecef;\n");
        html.append("            background: #fefefe;\n");
        html.append("        }\n");
        html.append("        .footer p {\n");
        html.append("            font-size: 9px;\n");
        html.append("            color: #8b9bb0;\n");
        html.append("            margin: 2px 0;\n");
        html.append("        }\n");
        html.append("        @media print {\n");
        html.append("            body { background: white; padding: 0; }\n");
        html.append("            .invoice-container { box-shadow: none; border-radius: 0; }\n");
        html.append("        }\n");
        html.append("    </style>\n");
        html.append("</head>\n");
        html.append("<body>\n");
        html.append("<div class=\"invoice-container\">\n");

        // ==================== HEADER ====================
        html.append("<div class=\"header\">\n");

        // SECTION GAUCHE - Logo et infos entreprise
        html.append("    <div class=\"left-section\">\n");
        if (hasLogo) {
            html.append("        <img src=\"").append(clientConnecte.getLogoUrl()).append("\" class=\"logo\" alt=\"Logo\" />\n");
        }
        if (!entrepriseNom.isEmpty() || !telephone.isEmpty() || !email.isEmpty() || (isEntreprise && !matriculeFiscal.isEmpty())) {
            html.append("        <div class=\"company-details\">\n");
            if (!entrepriseNom.isEmpty()) {
                html.append("            <div class=\"company-name\">").append(escapeHtml(entrepriseNom)).append("</div>\n");
            }
            if (isEntreprise && !matriculeFiscal.isEmpty()) {
                html.append("            <p>🆔 MF: ").append(escapeHtml(matriculeFiscal)).append("</p>\n");
            }
            if (!telephone.isEmpty()) {
                html.append("            <p>📞 ").append(escapeHtml(telephone)).append("</p>\n");
            }
            if (!email.isEmpty()) {
                html.append("            <p>✉️ ").append(escapeHtml(email)).append("</p>\n");
            }
            html.append("        </div>\n");
        }
        html.append("    </div>\n");

        // SECTION CENTRALE - FACTURE et référence
        html.append("    <div class=\"center-section\">\n");
        html.append("        <div class=\"invoice-title\">FACTURE</div>\n");
        html.append("        <div class=\"invoice-ref\">").append(facture.getReferenceFactureClient()).append("</div>\n");
        html.append("    </div>\n");

        // SECTION DROITE - QR Code
        html.append("    <div class=\"right-section\">\n");
        html.append("        <div class=\"qr-code-section\">\n");
        if (qrCodeBase64 != null && !qrCodeBase64.isEmpty()) {
            html.append("            <img src=\"data:image/png;base64,").append(qrCodeBase64).append("\" class=\"qr-code\" alt=\"QR Code\" />\n");
        }
        html.append("            <span class=\"qr-text\">Scanner pour voir<br>le détail de la facture</span>\n");
        html.append("        </div>\n");
        html.append("    </div>\n");
        html.append("</div>\n");

        // ==================== INFO GRID ====================
        html.append("<div class=\"info-grid\">\n");
        html.append("    <div class=\"info-card\">\n");
        html.append("        <h3>👤 FACTURÉ À</h3>\n");
        html.append("        <div class=\"info-row\"><span class=\"info-label\">Client</span><span class=\"info-value\">").append(escapeHtml(clientNom)).append("</span></div>\n");
        html.append("        <div class=\"info-row\"><span class=\"info-label\">Email</span><span class=\"info-value\">").append(escapeHtml(clientEmail)).append("</span></div>\n");
        html.append("        <div class=\"info-row\"><span class=\"info-label\">Téléphone</span><span class=\"info-value\">").append(escapeHtml(clientTelephone)).append("</span></div>\n");
        html.append("    </div>\n");
        html.append("    <div class=\"info-card\">\n");
        html.append("        <h3>📄 DÉTAILS FACTURE</h3>\n");
        html.append("        <div class=\"info-row\"><span class=\"info-label\">Date</span><span class=\"info-value\">").append(formatLocalDateTime(facture.getDateFacture())).append("</span></div>\n");
        html.append("        <div class=\"info-row\"><span class=\"info-label\">N° Facture</span><span class=\"info-value\">").append(facture.getReferenceFactureClient()).append("</span></div>\n");
        html.append("        <div class=\"info-row\"><span class=\"info-label\">N° Commande</span><span class=\"info-value\">").append(numeroCommande != null ? numeroCommande : "Non renseigné").append("</span></div>\n");
        html.append("    </div>\n");
        html.append("</div>\n");

        // ==================== ARTICLES ====================
        html.append("<div class=\"articles-section\">\n");
        html.append("    <div class=\"section-title\">📦 DÉTAILS DES ARTICLES</div>\n");
        html.append("    <table>\n");
        html.append("        <thead>\n");
        html.append("            <tr>\n");
        html.append("                <th style=\"width: 50%;\">Description</th>\n");
        html.append("                <th style=\"width: 15%;\" class=\"text-center\">Quantité</th>\n");
        html.append("                <th style=\"width: 20%;\" class=\"text-right\">Prix unitaire</th>\n");
        html.append("                <th style=\"width: 15%;\" class=\"text-right\">Total TTC</th>\n");
        html.append("            </tr>\n");
        html.append("        </thead>\n");
        html.append("        <tbody>\n");
        html.append(itemsHtml.toString());
        html.append("        </tbody>\n");
        html.append("    </table>\n");
        html.append("</div>\n");

        // ==================== TOTAUX ====================
        // ==================== TOTAUX ====================
        html.append("<div class=\"totaux-section\">\n");
        html.append("    <div class=\"totaux-container\">\n");

// Total HT
        html.append("        <div class=\"total-row\">\n");
        html.append("            <span class=\"total-label\">Total HT</span>\n");
        html.append("            <span class=\"total-value\">").append(formatMontant(totaux.getSousTotal())).append("</span>\n");
        html.append("        </div>\n");

// TVA - Afficher uniquement le taux, pas le montant
        html.append("        <div class=\"total-row\">\n");
        html.append("            <span class=\"total-label\">TVA</span>\n");
        html.append("            <span class=\"total-value\">").append(totaux.getTvaTaux()).append("%</span>\n");
        html.append("        </div>\n");

// TOTAL TTC
        html.append("        <div class=\"total-row grand-total-row\">\n");
        html.append("            <span class=\"grand-total-label\">TOTAL TTC</span>\n");
        html.append("            <span class=\"grand-total-value\">").append(formatMontant(totaux.getTotalTTC())).append("</span>\n");
        html.append("        </div>\n");

// Montant en toutes lettres
        if (!totalEnLettres.isEmpty()) {
            html.append("        <div class=\"total-letters-title\">Montant en toutes lettres</div>\n");
            html.append("        <div class=\"total-letters\">").append(totalEnLettres).append("</div>\n");
        }

        html.append("    </div>\n");
        html.append("</div>\n");

        // ==================== FOOTER ====================
        html.append("<div class=\"footer\">\n");
        if (!entrepriseNom.isEmpty()) {
            html.append("    <p>🔗 Facture générée par ").append(escapeHtml(entrepriseNom)).append("</p>\n");
        }
        html.append("</div>\n");

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