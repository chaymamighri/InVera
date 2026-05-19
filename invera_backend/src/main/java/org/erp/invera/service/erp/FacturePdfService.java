package org.erp.invera.service.erp;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.itextpdf.html2pdf.ConverterProperties;
import com.itextpdf.html2pdf.HtmlConverter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.erp.commandeClientdto.LigneCommandeClientDTO;
import org.erp.invera.model.erp.client.CommandeClient;
import org.erp.invera.model.erp.client.FactureClient;
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

    @Value("${app.base-url:http://192.168.1.119:8081}")
    private String baseUrl;

    private final TenantAwareRepository tenantRepo;
    private final JwtTokenProvider jwtTokenProvider;
    private final JdbcTemplate platformJdbcTemplate;

    /**
     * Génère le PDF de la facture
     */
    public byte[] genererFacturePdf(Integer factureId, String token) {
        try {
            log.info("FacturePdfService: Début génération pour facture ID: {}", factureId);

            Long clientId = jwtTokenProvider.getClientIdFromToken(token);
            String authClientId = String.valueOf(clientId);

            FactureClient facture = getFactureCompleteById(factureId, clientId, authClientId);
            if (facture == null) {
                throw new RuntimeException("Facture non trouvée avec ID: " + factureId);
            }
            log.info("Facture trouvée: {}", facture.getReferenceFactureClient());

            Client clientConnecte = null;
            try {
                clientConnecte = getClientById(clientId, authClientId);
            } catch (Exception e) {
                log.warn("Client plateforme non trouvé: {}", e.getMessage());
            }

            List<LigneCommandeClientDTO> lignesFacture = getLignesCommandeByFactureId(factureId, clientId, authClientId);
            log.info("Nombre de lignes récupérées: {}", lignesFacture.size());

            // Récupérer le taux de remise client depuis client_type_discount
            BigDecimal tauxRemiseClient = getTauxRemiseClient(facture, clientId, authClientId);
            log.info("Taux remise client récupéré: {}%", tauxRemiseClient);

            TotauxDTO totaux = calculerTotaux(lignesFacture, tauxRemiseClient);

            String baseApiUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
            String qrCodeBase64 = generateCompleteQRCode(facture, baseApiUrl);

            String htmlContent = generateInvoiceHtml(facture, clientConnecte, lignesFacture, totaux, qrCodeBase64, tauxRemiseClient);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            convertHtmlToPdf(htmlContent, baos);

            log.info("PDF facture généré: {}, taille: {} bytes", facture.getReferenceFactureClient(), baos.size());
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Erreur génération PDF facture", e);
            throw new RuntimeException("Erreur génération PDF: " + e.getMessage(), e);
        }
    }

    /**
     * Récupère le taux de remise client depuis la table client_type_discount
     */
    private BigDecimal getTauxRemiseClient(FactureClient facture, Long clientId, String authClientId) {
        if (facture.getClient() == null || facture.getClient().getTypeClient() == null) {
            log.warn("Client ou type client non trouvé, remise client = 0%");
            return BigDecimal.ZERO;
        }

        String typeClient = facture.getClient().getTypeClient().name();
        String sql = "SELECT remise FROM client_type_discount WHERE type_client = ?";

        try {
            Double remise = tenantRepo.queryForObjectAuth(sql, Double.class, clientId, authClientId, typeClient);
            if (remise != null) {
                log.info("Remise client récupérée: {}% pour type {}", remise, typeClient);
                return BigDecimal.valueOf(remise);
            }
        } catch (Exception e) {
            log.warn("Aucune remise trouvée pour le type client: {}", typeClient);
        }
        return BigDecimal.ZERO;
    }

    /**
     * Génère le PDF de la facture sans authentification (pour QR code)
     */
    public byte[] genererFacturePdfPublic(Integer factureId) {
        try {
            log.info("FacturePdfService (public): Début génération pour facture ID: {}", factureId);

            Long clientId = 5L;
            String authClientId = String.valueOf(clientId);

            FactureClient facture = getFactureCompleteById(factureId, clientId, authClientId);
            if (facture == null) {
                throw new RuntimeException("Facture non trouvée avec ID: " + factureId);
            }
            log.info("Facture trouvée: {}", facture.getReferenceFactureClient());

            Client clientConnecte = null;
            try {
                clientConnecte = getClientById(clientId, authClientId);
            } catch (Exception e) {
                log.warn("Client plateforme non trouvé: {}", e.getMessage());
            }

            List<LigneCommandeClientDTO> lignesFacture = getLignesCommandeByFactureId(factureId, clientId, authClientId);
            log.info("Nombre de lignes récupérées: {}", lignesFacture.size());

            BigDecimal tauxRemiseClient = getTauxRemiseClient(facture, clientId, authClientId);
            log.info("Taux remise client récupéré: {}%", tauxRemiseClient);

            TotauxDTO totaux = calculerTotaux(lignesFacture, tauxRemiseClient);

            String baseApiUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
            String qrCodeBase64 = generateCompleteQRCode(facture, baseApiUrl);

            String htmlContent = generateInvoiceHtml(facture, clientConnecte, lignesFacture, totaux, qrCodeBase64, tauxRemiseClient);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            convertHtmlToPdf(htmlContent, baos);

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
            String pdfUrl = String.format("%s/api/factures/public/%d/pdf", baseApiUrl, factureId);

            log.info("QR code URL: {}", pdfUrl);

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

    private String generateCompleteQRCode(FactureClient facture, String baseApiUrl) {
        try {
            String pdfUrl = String.format("%s/api/factures/public/%d/pdf", baseApiUrl, facture.getIdFactureClient());
            log.info("URL du PDF pour QR code: {}", pdfUrl);

            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(pdfUrl, BarcodeFormat.QR_CODE, 300, 300);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            BufferedImage qrImage = MatrixToImageWriter.toBufferedImage(bitMatrix);
            ImageIO.write(qrImage, "PNG", baos);

            String qrCodeBase64 = Base64.getEncoder().encodeToString(baos.toByteArray());
            log.info("QR code généré avec succès, taille: {} caractères", qrCodeBase64.length());

            return qrCodeBase64;
        } catch (Exception e) {
            log.error("Erreur génération QR code", e);
            return "";
        }
    }

    private FactureClient getFactureCompleteById(Integer factureId, Long clientId, String authClientId) {
        log.info("=== DÉBUT getFactureCompleteById ===");
        log.info("factureId: {}, clientId: {}", factureId, clientId);

        JdbcTemplate jdbc = tenantRepo.getClientJdbcTemplate(clientId, authClientId);

        // ✅ CORRECTION : Retirer c.taux_remise qui n'existe pas
        String sql = """
        SELECT 
            f.id_facture_client,
            f.reference_facture_client,
            f.date_facture,
            f.montant_total,
            f.statut,
            f.client_id,
            f.commande_id,
            c.id_commande_client as cmd_id,
            c.reference_commande_client as cmd_reference,
            c.date_commande as cmd_date,
            c.sous_total as cmd_sous_total,
            c.total as cmd_total,
            cl.id_client as cl_id,
            cl.nom as cl_nom,
            cl.prenom as cl_prenom,
            cl.email as cl_email,
            cl.telephone as cl_telephone,
            cl.adresse as cl_adresse,
            cl.type_client as cl_type,
            cl.raison_sociale as cl_raison_sociale,
            cl.matricule_fiscale as cl_matricule
        FROM facture_client f
        LEFT JOIN commande_client c ON f.commande_id = c.id_commande_client
        LEFT JOIN client cl ON f.client_id = cl.id_client
        WHERE f.id_facture_client = ?
    """;

        try {
            FactureClient facture = jdbc.queryForObject(sql, (rs, rowNum) -> {
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

                // ✅ Charger la commande SANS taux_remise
                int commandeIdDb = rs.getInt("cmd_id");
                if (!rs.wasNull() && commandeIdDb > 0) {
                    CommandeClient commande = new CommandeClient();
                    commande.setIdCommandeClient(commandeIdDb);
                    commande.setReferenceCommandeClient(rs.getString("cmd_reference"));
                    commande.setDateCommande(rs.getTimestamp("cmd_date") != null ?
                            rs.getTimestamp("cmd_date").toLocalDateTime() : null);
                    commande.setSousTotal(rs.getBigDecimal("cmd_sous_total"));
                    commande.setTauxRemise(BigDecimal.ZERO); // Valeur par défaut
                    commande.setTotal(rs.getBigDecimal("cmd_total"));
                    fact.setCommande(commande);
                    log.info("✅ Commande chargée: {}", commande.getReferenceCommandeClient());
                } else {
                    log.warn("⚠️ Aucune commande associée à la facture ID: {}", factureId);
                    fact.setCommande(null);
                }

                // ✅ Charger le client
                int clientIdDb = rs.getInt("cl_id");
                if (!rs.wasNull() && clientIdDb > 0) {
                    org.erp.invera.model.erp.client.Client client = new org.erp.invera.model.erp.client.Client();
                    client.setIdClient(clientIdDb);
                    client.setNom(rs.getString("cl_nom"));
                    client.setPrenom(rs.getString("cl_prenom"));
                    client.setEmail(rs.getString("cl_email"));
                    client.setTelephone(rs.getString("cl_telephone"));
                    client.setAdresse(rs.getString("cl_adresse"));

                    String typeClient = rs.getString("cl_type");
                    if (typeClient != null) {
                        client.setTypeClient(org.erp.invera.model.erp.client.Client.TypeClient.valueOf(typeClient));
                    }
                    client.setRaisonSociale(rs.getString("cl_raison_sociale"));
                    client.setMatriculeFiscale(rs.getString("cl_matricule"));
                    fact.setClient(client);
                }

                return fact;
            }, factureId);

            log.info("=== FIN getFactureCompleteById: Commande présente = {}", facture.getCommande() != null);
            if (facture.getCommande() != null) {
                log.info("Numéro commande: {}", facture.getCommande().getReferenceCommandeClient());
            }

            return facture;

        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage(), e);
            return null;
        }
    }

    private List<LigneCommandeClientDTO> getLignesCommandeByFactureId(Integer factureId, Long clientId, String authClientId) {
        String sql = """
            SELECT
                l.id_ligne_commande_client,
                l.quantite,
                l.prix_unitaire,
                l.sous_total as sous_total,
                p.id_produit,
                COALESCE(p.libelle, 'Article') as produit_libelle,
                p.prix_vente,
                p.image_url,
                c.nom_categorie as categorie_nom,
                COALESCE(c.remise_standard, 0) as remise_standard,
                COALESCE(c.taux_tva, 0) as taux_tva
            FROM facture_client f
            JOIN ligne_commande_client l ON f.commande_id = l.commande_client_id
            LEFT JOIN produit p ON l.produit_id = p.id_produit
            LEFT JOIN categorie c ON p.categorie_id = c.id_categorie
            WHERE f.id_facture_client = ?
            ORDER BY l.id_ligne_commande_client
        """;

        return tenantRepo.queryWithAuth(sql, (rs, rowNum) -> {
            LigneCommandeClientDTO ligne = new LigneCommandeClientDTO();
            ligne.setIdLigneCommandeClient(rs.getInt("id_ligne_commande_client"));
            ligne.setQuantite(rs.getInt("quantite"));
            ligne.setPrixUnitaire(rs.getBigDecimal("prix_unitaire"));
            ligne.setSousTotal(rs.getBigDecimal("sous_total"));
            ligne.setProduitId(rs.getInt("id_produit"));
            ligne.setProduitLibelle(rs.getString("produit_libelle"));
            ligne.setPrixVente(rs.getBigDecimal("prix_vente"));
            ligne.setImageUrl(rs.getString("image_url"));
            ligne.setCategorieNom(rs.getString("categorie_nom"));
            ligne.setRemiseStandard(rs.getDouble("remise_standard"));
            ligne.setTauxTVA(rs.getBigDecimal("taux_tva"));
            return ligne;
        }, clientId, authClientId, factureId);
    }

    private Client getClientById(Long clientId, String authClientId) {
        String sql = "SELECT * FROM clients WHERE id = ?";

        try {
            Client client = platformJdbcTemplate.queryForObject(sql, new PlatformClientRowMapper(), clientId);
            if (client != null) {
                log.info("Client plateforme trouvé: {} {}", client.getNom(), client.getPrenom());
                return client;
            }
        } catch (Exception e) {
            log.warn("Client plateforme non trouvé pour ID: {}", clientId);
        }

        return createDefaultClient(clientId);
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

    private class PlatformClientRowMapper implements RowMapper<Client> {
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

    private TotauxDTO calculerTotaux(List<LigneCommandeClientDTO> lignes, BigDecimal tauxRemiseClient) {
        TotauxDTO totaux = new TotauxDTO();

        BigDecimal sousTotalBrut = BigDecimal.ZERO;
        BigDecimal totalRemisesProduits = BigDecimal.ZERO;
        BigDecimal totalHTApresRemisesProduits = BigDecimal.ZERO;
        BigDecimal totalTVA = BigDecimal.ZERO;

        if (lignes != null && !lignes.isEmpty()) {
            for (LigneCommandeClientDTO ligne : lignes) {
                BigDecimal prixUnitaire = BigDecimal.valueOf(ligne.getPrixUnitaire() != null ? ligne.getPrixUnitaire() : 0);
                BigDecimal quantite = new BigDecimal(ligne.getQuantite());
                BigDecimal brutLigne = prixUnitaire.multiply(quantite);
                sousTotalBrut = sousTotalBrut.add(brutLigne);

                BigDecimal tauxRemise = BigDecimal.valueOf(ligne.getRemiseStandard() != null ? ligne.getRemiseStandard() : 0);
                BigDecimal montantRemiseLigne = brutLigne.multiply(tauxRemise).divide(BigDecimal.valueOf(100), 3, BigDecimal.ROUND_HALF_UP);
                totalRemisesProduits = totalRemisesProduits.add(montantRemiseLigne);

                BigDecimal htLigne = brutLigne.subtract(montantRemiseLigne);
                totalHTApresRemisesProduits = totalHTApresRemisesProduits.add(htLigne);

                BigDecimal tauxTVA = ligne.getTauxTVA() != null ? ligne.getTauxTVA() : BigDecimal.ZERO;
                BigDecimal montantTVA = htLigne.multiply(tauxTVA).divide(BigDecimal.valueOf(100), 3, BigDecimal.ROUND_HALF_UP);
                totalTVA = totalTVA.add(montantTVA);
            }
        }

        BigDecimal montantRemiseClient = totalHTApresRemisesProduits.multiply(tauxRemiseClient).divide(BigDecimal.valueOf(100));
        BigDecimal totalHTFinal = totalHTApresRemisesProduits.subtract(montantRemiseClient);
        BigDecimal totalTTCFinal = totalHTFinal.add(totalTVA);
        BigDecimal economieTotale = totalRemisesProduits.add(montantRemiseClient);

        totaux.setSousTotalBrut(sousTotalBrut);
        totaux.setTotalRemisesProduits(totalRemisesProduits);
        totaux.setTotalHTApresRemisesProduits(totalHTApresRemisesProduits);
        totaux.setMontantRemiseClient(montantRemiseClient);
        totaux.setTotalHTFinal(totalHTFinal);
        totaux.setTotalTVA(totalTVA);
        totaux.setTotalTTCFinal(totalTTCFinal);
        totaux.setEconomieTotale(economieTotale);
        totaux.setTauxRemiseClient(tauxRemiseClient);

        return totaux;
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private void convertHtmlToPdf(String htmlContent, ByteArrayOutputStream baos) {
        ConverterProperties properties = new ConverterProperties();
        properties.setCharset("UTF-8");
        HtmlConverter.convertToPdf(htmlContent, baos, properties);
    }


    // =========================================================
//  MÉTHODES MANQUANTES À AJOUTER
// =========================================================

    /**
     * Génère un QR code SVG de fallback
     */
    private String buildFallbackQrSvg() {
        return "<svg viewBox='0 0 44 44' width='44' height='44' xmlns='http://www.w3.org/2000/svg'>"
                + "<rect x='2' y='2' width='16' height='16' rx='2' fill='#1a4d8c'/>"
                + "<rect x='5' y='5' width='10' height='10' rx='1' fill='white'/>"
                + "<rect x='7' y='7' width='6' height='6' rx='.5' fill='#1a4d8c'/>"
                + "<rect x='26' y='2' width='16' height='16' rx='2' fill='#1a4d8c'/>"
                + "<rect x='29' y='5' width='10' height='10' rx='1' fill='white'/>"
                + "<rect x='31' y='7' width='6' height='6' rx='.5' fill='#1a4d8c'/>"
                + "<rect x='2' y='26' width='16' height='16' rx='2' fill='#1a4d8c'/>"
                + "<rect x='5' y='29' width='10' height='10' rx='1' fill='white'/>"
                + "<rect x='7' y='31' width='6' height='6' rx='.5' fill='#1a4d8c'/>"
                + "<rect x='20' y='2' width='3' height='3' fill='#1a4d8c'/>"
                + "<rect x='20' y='7' width='3' height='3' fill='#1a4d8c'/>"
                + "<rect x='24' y='20' width='3' height='3' fill='#1a4d8c'/>"
                + "<rect x='20' y='20' width='3' height='3' fill='#1a4d8c'/>"
                + "<rect x='28' y='20' width='3' height='3' fill='#1a4d8c'/>"
                + "<rect x='32' y='20' width='3' height='3' fill='#1a4d8c'/>"
                + "<rect x='36' y='20' width='3' height='3' fill='#1a4d8c'/>"
                + "<rect x='24' y='24' width='3' height='3' fill='#1a4d8c'/>"
                + "<rect x='28' y='28' width='3' height='3' fill='#1a4d8c'/>"
                + "<rect x='32' y='24' width='3' height='3' fill='#1a4d8c'/>"
                + "<rect x='36' y='28' width='3' height='3' fill='#1a4d8c'/>"
                + "<rect x='24' y='32' width='3' height='3' fill='#1a4d8c'/>"
                + "<rect x='20' y='36' width='3' height='3' fill='#1a4d8c'/>"
                + "<rect x='32' y='36' width='3' height='3' fill='#1a4d8c'/>"
                + "<rect x='36' y='32' width='3' height='3' fill='#1a4d8c'/>"
                + "</svg>";
    }

    /**
     * Génère une ligne d'information pour les parties (émetteur/destinataire)
     */
    private static String partyRow(String label, String value) {
        return "<div class='party-row'>"
                + "<span class='plabel'>" + label + "</span>"
                + "<span class='pval'>" + esc(value) + "</span>"
                + "</div>\n";
    }

    /**
     * Génère un élément de référence
     */
    private static String refItem(String label, String value) {
        return "<div class='ref-card'>"
                + "<div class='ref-lbl'>" + label + "</div>"
                + "<div class='ref-val'>" + esc(value) + "</div>"
                + "</div>";
    }


    public String generateInvoiceHtml(FactureClient facture,
                                      Client clientConnecte,
                                      List<LigneCommandeClientDTO> lignes,
                                      TotauxDTO totaux,
                                      String qrCodeBase64,
                                      BigDecimal tauxRemiseClient) {

        /* ── Dates & références ── */
        String dateFacture = facture.getDateFacture() != null
                ? facture.getDateFacture().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : "";

        String referenceFacture = facture.getReferenceFactureClient() != null
                ? facture.getReferenceFactureClient() : "N/A";

        String numeroCommande = "N/A";
        if (facture.getCommande() != null
                && facture.getCommande().getReferenceCommandeClient() != null) {
            numeroCommande = facture.getCommande().getReferenceCommandeClient();
        }

        /* ── Émetteur ── */
        String emetteurNom            = "";
        String emetteurTel            = "";
        String emetteurEmail          = "";
        String emetteurMatriculeFiscal = "";
        String emetteurLogo           = "";
        boolean hasLogo               = false;

        if (clientConnecte != null) {
            emetteurNom = clientConnecte.getTypeCompte() == Client.TypeCompte.ENTREPRISE
                    ? nvl(clientConnecte.getRaisonSociale())
                    : (nvl(clientConnecte.getPrenom()) + " " + nvl(clientConnecte.getNom())).trim();

            emetteurEmail          = nvl(clientConnecte.getEmail());
            emetteurTel            = nvl(clientConnecte.getTelephone());
            emetteurMatriculeFiscal = nvl(clientConnecte.getMatriculeFiscal());

            if (clientConnecte.getLogoUrl() != null && !clientConnecte.getLogoUrl().isEmpty()) {
                emetteurLogo = clientConnecte.getLogoUrl();
                hasLogo      = true;
            }
        }

        /* ── Destinataire ── */
        String destinataireNom              = "Non renseigné";
        String destinataireAdresse          = "";
        String destinataireEmail            = "Non renseigné";
        String destinataireTelephone        = "Non renseigné";
        String destinataireMatriculeFiscale = "";
        String destinataireTypeClient       = "";
        boolean isEntreprise               = false;

        if (facture.getClient() != null) {
            org.erp.invera.model.erp.client.Client ec = facture.getClient();

            if (ec.getTypeClient() != null) {
                destinataireTypeClient = ec.getTypeClient().name();
                isEntreprise           = "ENTREPRISE".equals(destinataireTypeClient);
            }

            if (isEntreprise && notBlank(ec.getRaisonSociale())) {
                destinataireNom = ec.getRaisonSociale();
            } else {
                String n = (nvl(ec.getPrenom()) + " " + nvl(ec.getNom())).trim();
                destinataireNom = n.isEmpty() ? "Non renseigné" : n;
            }

            if (isEntreprise) destinataireMatriculeFiscale = nvl(ec.getMatriculeFiscale());

            destinataireAdresse   = nvl(ec.getAdresse());
            destinataireEmail     = notBlank(ec.getEmail())     ? ec.getEmail()     : "Non renseigné";
            destinataireTelephone = notBlank(ec.getTelephone()) ? ec.getTelephone() : "Non renseigné";
        }

        /* ── Lignes du tableau ── */
        StringBuilder tableRows = new StringBuilder();
        if (lignes != null && !lignes.isEmpty()) {
            int idx = 1;
            for (LigneCommandeClientDTO l : lignes) {
                BigDecimal prixHT    = bd(l.getPrixUnitaire());
                BigDecimal qte       = new BigDecimal(l.getQuantite());
                BigDecimal brut      = prixHT.multiply(qte);
                BigDecimal tRemise   = bd(l.getRemiseStandard());
                BigDecimal mRemise   = brut.multiply(tRemise).divide(BigDecimal.valueOf(100), 3, BigDecimal.ROUND_HALF_UP);
                BigDecimal htLigne   = brut.subtract(mRemise);
                BigDecimal tTVA      = l.getTauxTVA() != null ? l.getTauxTVA() : BigDecimal.ZERO;
                BigDecimal mTVA      = htLigne.multiply(tTVA).divide(BigDecimal.valueOf(100), 3, BigDecimal.ROUND_HALF_UP);
                BigDecimal ttcLigne  = htLigne.add(mTVA);

                String remiseDisplay = mRemise.compareTo(BigDecimal.ZERO) > 0
                        ? "−" + formatMontant(mRemise) + " (" + tRemise.stripTrailingZeros().toPlainString() + "%)"
                        : "−";
                String remiseColor = mRemise.compareTo(BigDecimal.ZERO) > 0 ? "#dc2626" : "#94a3b8";

                tableRows.append("<tr>")
                        .append("<td>").append(idx++).append("</td>")
                        .append("<td>").append(esc(l.getProduitLibelle())).append("</td>")
                        .append("<td class='col-qty'>").append(l.getQuantite()).append("</td>")
                        .append("<td class='col-num'>").append(formatMontant(prixHT)).append("</td>")
                        .append("<td class='col-remise' style='color:").append(remiseColor).append("'>")
                        .append(esc(remiseDisplay)).append("</td>")
                        .append("<td class='col-num'>").append(formatMontant(htLigne)).append("</td>")
                        .append("<td><span class='tva-badge'>").append(tTVA.stripTrailingZeros().toPlainString()).append("%</span></td>")
                        .append("<td class='col-num'>").append(formatMontant(mTVA)).append("</td>")
                        .append("<td class='col-ttc'>").append(formatMontant(ttcLigne)).append("</td>")
                        .append("</tr>\n");
            }
        } else {
            tableRows.append("<tr><td colspan='9' style='text-align:center;padding:20px;color:#94a3b8'>Aucun article</td></tr>\n");
        }

        /* ── QR code ── */
        String qrHtml;
        if (notBlank(qrCodeBase64)) {
            qrHtml = "<img src='data:image/png;base64," + qrCodeBase64 + "' style='width:44px;height:44px;object-fit:contain' alt='QR'>";
        } else {
            qrHtml = buildFallbackQrSvg();
        }

        /* ── Montant en lettres ── */
        String totalEnLettres = convertMontantToWords(totaux.getTotalTTCFinal());

        /* ── Cachet SVG simplifié ── */
        String stampSvg = buildSimplifiedStampSvg(clientConnecte, emetteurNom, emetteurTel, emetteurEmail);

        /* ── Initiales logo ── */
        String logoHtml;
        if (hasLogo) {
            logoHtml = "<img src='" + emetteurLogo + "' style='max-height:40px;max-width:90px' alt='Logo'/>";
        } else {
            String initiales = emetteurNom.length() >= 2
                    ? emetteurNom.substring(0, 2).toUpperCase()
                    : (emetteurNom.isEmpty() ? "IN" : emetteurNom.toUpperCase());
            logoHtml = "<div class='brand-logo'>" + esc(initiales) + "</div>";
        }

        /* ── Totaux ── */
        StringBuilder totauxHtml = new StringBuilder();

        // Sous-total HT
        totauxHtml.append(totRow("Sous-total HT", formatMontant(totaux.getSousTotalBrut()), false));

        // Remises produits
        if (totaux.getTotalRemisesProduits().compareTo(BigDecimal.ZERO) > 0) {
            totauxHtml.append(totRow("Remises produits", "− " + formatMontant(totaux.getTotalRemisesProduits()), true));
        }

        // Total HT après remises produits
        if (totaux.getTotalRemisesProduits().compareTo(BigDecimal.ZERO) > 0) {
            totauxHtml.append(totRow("Total HT après remises", formatMontant(totaux.getTotalHTApresRemisesProduits()), false));
        }

        // Remise client
        if (totaux.getMontantRemiseClient().compareTo(BigDecimal.ZERO) > 0) {
            totauxHtml.append(totRow(
                    "Remise client" + (notBlank(destinataireTypeClient)
                            ? " (" + destinataireTypeClient + " " + totaux.getTauxRemiseClient().stripTrailingZeros().toPlainString() + "%)"
                            : ""),
                    "− " + formatMontant(totaux.getMontantRemiseClient()), true));
        }

        // Séparateur
        totauxHtml.append("<div class='tot-sep'></div>");

        // Total HT
        totauxHtml.append(totRow("Total HT", formatMontant(totaux.getTotalHTFinal()), false));

        // TVA
        totauxHtml.append(totRow("TVA", formatMontant(totaux.getTotalTVA()), false));

        // Séparateur
        totauxHtml.append("<div class='tot-sep'></div>");

        /* ── Destinataire MF ── */
        String destMfRow = (isEntreprise && notBlank(destinataireMatriculeFiscale))
                ? partyRow("MF", destinataireMatriculeFiscale) : "";

        /* ── Construction HTML finale ── */
        return "<!DOCTYPE html>\n"
                + "<html lang='fr'>\n"
                + "<head>\n"
                + "  <meta charset='UTF-8'>\n"
                + "  <title>Facture " + referenceFacture + "</title>\n"
                + "  <style>\n"
                + CSS
                + "\n"
                /* Style pour ajouter un grand espace entre les deux cartes */
                + "  .bottom-two-columns {\n"
                + "    display: flex;\n"
                + "    justify-content: space-between;\n"  /* ← Pousse les cartes aux extrémités */
                + "    gap: 100px;\n"                       /* ← Espace supplémentaire entre elles */
                + "    margin-top: 50px;\n"
                + "  }\n"
                + "  \n"
                + "  .left-column {\n"
                + "    flex: 1;\n"
                + "  }\n"
                + "  \n"
                + "  .right-column {\n"
                + "    flex: 1;\n"
                + "  }\n"
                + "  </style>\n"
                + "</head>\n"
                + "<body>\n"
                + "<div class='page'>\n"

                /* ── HEADER ── */
                + "  <div class='hdr'>\n"
                + "    <div class='hdr-brand'>\n"
                + "      " + logoHtml + "\n"
                + "      <div class='brand-name'>" + esc(emetteurNom) + "</div>\n"
                + (notBlank(emetteurMatriculeFiscal)
                ? "<div class='brand-mf'>MF : " + esc(emetteurMatriculeFiscal) + "</div>\n" : "")
                + (notBlank(emetteurEmail)
                ? "<div class='brand-mf'>" + esc(emetteurEmail) + "</div>\n" : "")
                + (notBlank(emetteurTel)
                ? "<div class='brand-mf'>" + esc(emetteurTel) + "</div>\n" : "")
                + "    </div>\n"
                + "    <div class='hdr-center'>\n"
                + "      <div class='inv-word'>FACTURE</div>\n"
                + "      <div class='inv-ref'># " + referenceFacture + "</div>\n"
                + "      <div class='inv-date'>Émise le " + dateFacture + "</div>\n"
                + "    </div>\n"
                + "    <div class='hdr-qr'>\n"
                + "      <div class='qr-box'>" + qrHtml + "</div>\n"
                + "      <div class='qr-lbl'>SCANNER</div>\n"
                + "    </div>\n"
                + "  </div>\n"

                /* ── PARTIES ── */
                + "  <div class='parties'>\n"
                + "    <div class='party-card party-card--em'><div class='party-card-inner'>\n"
                + "      <div class='party-tag em'>Émetteur</div>\n"
                + "      <div class='party-name'>" + esc(emetteurNom) + "</div>\n"
                + (notBlank(emetteurTel)       ? partyRow("Tél.",  emetteurTel)            : "")
                + (notBlank(emetteurEmail)      ? partyRow("Email", emetteurEmail)          : "")
                + (notBlank(emetteurMatriculeFiscal) ? partyRow("MF", emetteurMatriculeFiscal) : "")
                + "    </div></div>\n"
                + "    <div class='party-card party-card--dest'><div class='party-card-inner'>\n"
                + "      <div class='party-tag dest'>Destinataire</div>\n"
                + "      <div class='party-name'>" + esc(destinataireNom) + "</div>\n"
                + (notBlank(destinataireAdresse)    ? partyRow("Adresse", destinataireAdresse)     : "")
                + (!"Non renseigné".equals(destinataireTelephone) ? partyRow("Tél.",  destinataireTelephone) : "")
                + (!"Non renseigné".equals(destinataireEmail)     ? partyRow("Email", destinataireEmail)     : "")
                + destMfRow
                + "    </div></div>\n"
                + "  </div>\n"

                /* ── REFS ── */
                + "  <div class='refs refs--two'>\n"
                + "    " + refItem("N° Commande", numeroCommande) + "\n"
                + "    " + refItem("Date facture", dateFacture) + "\n"
                + "  </div>\n"

                /* ── TABLEAU ARTICLES ── */
                + "  <div class='arts'>\n"
                + "    <div class='sec-title'>Détail des articles</div>\n"
                + "    <table class='items-table'>\n"
                + "      <thead><tr>\n"
                + "        <th class='col-idx'>#</th>\n"
                + "        <th class='col-desc'>Désignation</th>\n"
                + "        <th>Qté</th><th>Prix HT</th><th>Remise</th>\n"
                + "        <th>Total HT</th><th>TVA</th><th>Mt. TVA</th><th>Total TTC</th>\n"
                + "      <tr>\n"
                + "      </thead>\n"
                + "      <tbody>\n"
                + tableRows
                + "      </tbody>\n"
                + "    </table>\n"
                + "  </div>\n"

                /* ── BAS : MONTANT EN LETTRES (gauche) + RÉCAPITULATIF (droite) ── */
                + "  <div class='bottom-two-columns'>\n"
                + "    <div class='left-column'>\n"
                + (notBlank(totalEnLettres)
                ? "      <div class='lettre-box-cadre'>\n"
                + "        <div class='lettre-title-cadre'>FACTURE À LA SOMME DE :</div>\n"
                + "        <div class='lettre-text-cadre'>" + esc(totalEnLettres) + "</div>\n"
                + "      </div>\n"
                : "")
                + "    </div>\n"
                + "    <div class='right-column'>\n"
                + "      <div class='recapitulatif-box'>\n"
                + "        <div class='recapitulatif-header'>RÉCAPITULATIF</div>\n"
                + "        <div class='recapitulatif-body'>\n"
                + totauxHtml.toString()
                + "          <div class='tot-final'>\n"
                + "            <span><b>TOTAL TTC</b></span>\n"
                + "            <span class='tot-ttc-val'>" + formatMontant(totaux.getTotalTTCFinal()) + " TND</span>\n"
                + "          </div>\n"
                + (totaux.getEconomieTotale().compareTo(BigDecimal.ZERO) > 0
                ? "          <div class='economie-row'>\n"
                + "            <span class='economie-label'>Économie totale</span>\n"
                + "            <span class='economie-value'>" + formatMontant(totaux.getEconomieTotale()) + "</span>\n"
                + "          </div>\n"
                : "")
                + "        </div>\n"
                + "      </div>\n"
                + "    </div>\n"
                + "  </div>\n"

                /* ── BAS : cachet + signature ── */
                + "  <div class='footer-bottom'>\n"
                + "    <div class='stamp-block'>\n"
                + "      <span class='stamp-lbl'>Cachet de l'entreprise</span>\n"
                + "      " + stampSvg + "\n"
                + "    </div>\n"
                + "    <div class='sig-block'>\n"
                + "      <span class='sig-lbl'>Signature du client</span>\n"
                + "      <div class='sig-line'></div>\n"
                + "      <div class='sig-note'>Bon pour accord</div>\n"
                + "    </div>\n"
                + "  </div>\n"

                + "</div>\n"
                + "</body>\n"
                + "</html>\n";
    }
    /**
     * Cachet SVG - version avec texte ajusté pour rester dans le cercle
     */
    private String buildSimplifiedStampSvg(Client clientConnecte,
                                           String emetteurNom,
                                           String emetteurTel,
                                           String emetteurEmail) {

        String raisonSociale = "ENTREPRISE";
        String telephone = "";
        String email = "";
        String matriculeFiscal = "";

        if (clientConnecte != null) {
            if (notBlank(clientConnecte.getRaisonSociale()))
                raisonSociale = clientConnecte.getRaisonSociale();
            else if (notBlank(emetteurNom))
                raisonSociale = emetteurNom;

            if (notBlank(clientConnecte.getTelephone()))
                telephone = clientConnecte.getTelephone();
            else if (notBlank(emetteurTel))
                telephone = emetteurTel;

            if (notBlank(clientConnecte.getEmail()))
                email = clientConnecte.getEmail();
            else if (notBlank(emetteurEmail))
                email = emetteurEmail;

            if (notBlank(clientConnecte.getMatriculeFiscal()))
                matriculeFiscal = clientConnecte.getMatriculeFiscal();
        }

        // Troncature plus agressive des textes
        String displayName = raisonSociale.length() > 28
                ? raisonSociale.substring(0, 26) + "…"
                : raisonSociale;
        String emailShort = email.length() > 28 ? email.substring(0, 26) + "…" : email;
        String telShort = telephone.length() > 22 ? telephone.substring(0, 20) + "…" : telephone;

        // Pour le matricule fiscal, on garde la valeur complète car c'est une information importante
        String matriculeDisplay = notBlank(matriculeFiscal) ? matriculeFiscal : "";

        // Positions Y ajustées pour viewBox 120x120 (tout à l'intérieur du cercle r=58)
        float yTopText = 22f;      // "CACHET OFFICIEL"
        float yName = 45f;          // Nom entreprise
        float yLine = 55f;          // Ligne séparatrice
        float yMf = 66f;            // Matricule fiscal
        float yTel = 78f;           // Téléphone
        float yEmail = 90f;         // Email

        StringBuilder svg = new StringBuilder();
        svg.append("<svg viewBox='0 0 120 120' width='120' height='120' xmlns='http://www.w3.org/2000/svg'>\n")
                // Cercle extérieur
                .append("<circle cx='60' cy='60' r='58' fill='none' stroke='#1a4d8c' stroke-width='2'/>\n")
                // Cercle intérieur décoratif
                .append("<circle cx='60' cy='60' r='53' fill='none' stroke='#1a4d8c' stroke-width='0.6' stroke-dasharray='3 2'/>\n")
                // Ornement haut
                .append("<path d='M60,10 L64,16 L56,16 Z' fill='#1a4d8c'/>\n")
                // Ornement bas
                .append("<path d='M60,110 L64,104 L56,104 Z' fill='#1a4d8c'/>\n")
                // Titre
                .append("<text x='60' y='").append(fmt(yTopText)).append("' text-anchor='middle' font-size='6.5' font-weight='bold'")
                .append(" font-family='Arial' fill='#1a4d8c' letter-spacing='1'>CACHET OFFICIEL</text>\n")
                // Nom entreprise
                .append("<text x='60' y='").append(fmt(yName)).append("' text-anchor='middle' font-size='9'")
                .append(" font-weight='bold' font-family='Arial' fill='#0a2a5e'>").append(esc(displayName.toUpperCase())).append("</text>\n")
                // Séparateur
                .append("<line x1='20' y1='").append(fmt(yLine)).append("' x2='100' y2='").append(fmt(yLine))
                .append("' stroke='#1a4d8c' stroke-width='0.8'/>\n");

        // Matricule fiscal - version alternative avec plus d'espace
        if (notBlank(matriculeDisplay)) {
            svg.append("<text x='60' y='").append(fmt(yMf)).append("' text-anchor='middle' font-size='5.5'")
                    .append(" font-family='Courier New, monospace' fill='#1a4d8c' letter-spacing='0.5'>")
                    .append("MF: ").append(esc(matriculeDisplay))
                    .append("</text>\n");
        }

        // Téléphone
        if (notBlank(telephone)) {
            float yPos = notBlank(matriculeDisplay) ? yTel : (yMf + 10);
            svg.append("<text x='60' y='").append(fmt(yPos)).append("' text-anchor='middle' font-size='5.5'")
                    .append(" font-family='Arial' fill='#475569'>📞 ").append(esc(telShort)).append("</text>\n");
        }

        // Email
        if (notBlank(email)) {
            float yPos;
            if (notBlank(telephone)) {
                yPos = yEmail;
            } else if (notBlank(matriculeDisplay)) {
                yPos = yTel;
            } else {
                yPos = yMf + 10;
            }
            svg.append("<text x='60' y='").append(fmt(yPos)).append("' text-anchor='middle' font-size='5'")
                    .append(" font-family='Arial' fill='#475569'>✉ ").append(esc(emailShort)).append("</text>\n");
        }

        svg.append("</svg>");
        return svg.toString();
    }
    /**
     * Ligne de totaux avec alignement à droite
     */
    private static String totRow(String label, String value, boolean isDiscount) {
        String colorClass = isDiscount ? "disc" : "";
        return "<div class='tot-row " + colorClass + "'>"
                + "<span class='tot-label'>" + label + "</span>"
                + "<span class='tot-value'>" + value + "</span>"
                + "</div>";
    }

    // =========================================================
//  CSS EMBARQUÉ (CORRIGÉ - AVEC HEADER RÉCAPITULATIF)
// =========================================================

    private static final String CSS =
            "@page{size:A4;margin:10mm}\n"
                    + "*{margin:0;padding:0;box-sizing:border-box}\n"
                    + "body{background-color:#eef2f5;padding:12px;font-family:Arial,Helvetica,sans-serif;font-size:9.5px;color:#1a1f2e}\n"
                    + ".page{width:100%;max-width:190mm;margin:0 auto;background-color:#ffffff;border:1px solid #e2e8f0}\n"

                    /* Header */
                    + ".hdr{display:table;width:100%;background-color:#0a2a5e;border-bottom:3px solid #1a4d8c}\n"
                    + ".hdr-brand,.hdr-center,.hdr-qr{display:table-cell;vertical-align:middle;padding:14px 16px}\n"
                    + ".hdr-brand{width:32%}\n"
                    + ".hdr-center{width:36%;text-align:center}\n"
                    + ".hdr-qr{width:32%;text-align:right}\n"
                    + ".brand-logo{width:44px;height:44px;background-color:#ffffff;text-align:center;line-height:44px;"
                    + "font-size:15px;font-weight:bold;color:#0a2a5e;margin-bottom:6px;border-radius:4px}\n"
                    + ".brand-name{font-size:10px;font-weight:bold;color:#ffffff}\n"
                    + ".brand-mf{font-size:7.5px;color:#cbd5e1;margin-top:2px}\n"
                    + ".inv-word{font-size:22px;font-weight:normal;letter-spacing:8px;color:#ffffff;text-transform:uppercase}\n"
                    + ".inv-ref{font-size:9.5px;color:#e2e8f0;margin-top:4px}\n"
                    + ".inv-date{font-size:8px;color:#94a3b8;margin-top:3px}\n"
                    + ".qr-box{width:52px;height:52px;background-color:#ffffff;text-align:center;margin:0 auto 4px;padding:4px;border-radius:4px}\n"
                    + ".qr-lbl{font-size:6.5px;color:#94a3b8;letter-spacing:1px;text-align:center}\n"

                    /* Parties */
                    + ".parties{display:table;width:100%;table-layout:fixed;padding:14px 16px;background-color:#ffffff}\n"
                    + ".party-card{display:table-cell;width:50%;vertical-align:top;padding:0 6px}\n"
                    + ".party-card--em .party-card-inner{border-left:4px solid #0a2a5e}\n"
                    + ".party-card--dest .party-card-inner{border-left:4px solid #f59e0b}\n"
                    + ".party-card-inner{background-color:#f8fafc;border:1px solid #e2e8f0;padding:12px 14px}\n"
                    + ".party-tag{font-size:7px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;"
                    + "margin-bottom:8px;padding:4px 8px;display:inline-block;border-radius:3px}\n"
                    + ".party-tag.em{color:#ffffff;background-color:#0a2a5e}\n"
                    + ".party-tag.dest{color:#ffffff;background-color:#f59e0b}\n"
                    + ".party-name{font-size:11px;font-weight:bold;color:#0a2a5e;margin-bottom:8px;line-height:1.3}\n"
                    + ".party-row{margin-bottom:5px}\n"
                    + ".plabel{font-size:7px;color:#64748b;font-weight:bold;display:inline-block;min-width:48px}\n"
                    + ".pval{font-size:8.5px;color:#1e293b}\n"

                    /* Refs */
                    + ".refs{display:table;width:100%;table-layout:fixed;padding:10px 16px 14px;background-color:#ffffff;"
                    + "border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0}\n"
                    + ".refs--two .ref-card{width:50%}\n"
                    + ".ref-card{display:table-cell;vertical-align:middle;background-color:#f8fafc;"
                    + "border:1px solid #e2e8f0;padding:12px 16px;text-align:center;border-radius:4px}\n"
                    + ".refs--two .ref-card:first-child{padding-right:10px}\n"
                    + ".refs--two .ref-card:last-child{padding-left:10px}\n"
                    + ".ref-lbl{font-size:7px;font-weight:bold;letter-spacing:1px;color:#64748b;text-transform:uppercase;margin-bottom:5px}\n"
                    + ".ref-val{font-size:11px;font-weight:bold;color:#0a2a5e}\n"

                    /* Articles */
                    + ".arts{padding:12px 16px 4px;background-color:#ffffff}\n"
                    + ".sec-title{font-size:7px;font-weight:bold;letter-spacing:2px;color:#64748b;text-transform:uppercase;margin-bottom:8px}\n"
                    + ".items-table,table.items-table,table{width:100%;border-collapse:collapse;border:1px solid #e2e8f0}\n"
                    + "thead th{background-color:#0a2a5e;color:#ffffff;padding:6px 4px;font-size:7.5px;font-weight:bold;text-align:center}\n"
                    + "thead th.col-desc,thead th:nth-child(2){text-align:left}\n"
                    + "tbody td{padding:5px 4px;font-size:8px;text-align:center;color:#374151;border-bottom:1px solid #e2e8f0}\n"
                    + "tbody td:nth-child(2){text-align:left;font-weight:bold;color:#0a2a5e}\n"
                    + "td.col-num,td.col-remise,td.col-ttc{text-align:right}\n"
                    + "td.col-remise{color:#dc2626}\n"
                    + "td.col-ttc{font-weight:bold;color:#f59e0b;background-color:#fffbeb}\n"
                    + ".tva-badge{background-color:#e0e7ff;color:#0a2a5e;padding:2px 5px;font-size:7px;font-weight:bold;border-radius:3px}\n"

                    /* Disposition à deux colonnes - lettre plus petit que récapitulatif */
                    + ".bottom-two-columns{display:flex;gap:20px;padding:12px 16px 16px;background-color:#ffffff;align-items:flex-start}\n"
                    + ".left-column{flex:0.9;min-width:0}\n"
                    + ".right-column{flex:1.1;min-width:260px}\n"

                    /* Cadre pour le montant en lettres - Titre en haut, montant centré en dessous */
                    + ".lettre-box-cadre{border:2px solid #0a2a5e;border-radius:8px;padding:0;height:100%;min-height:180px;"
                    + "background-color:#f8fafc;display:flex;flex-direction:column;overflow:hidden}\n"
                    + ".lettre-title-cadre{background-color:#0a2a5e;color:#ffffff;padding:8px 12px;text-align:center;"
                    + "font-size:7px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;margin:0}\n"
                    + ".lettre-text-cadre{flex:1;display:flex;justify-content:center;align-items:center;text-align:center;"
                    + "font-size:9px;color:#0a2a5e;font-weight:600;line-height:1.5;padding:15px 12px;"
                    + "font-family:'Times New Roman',serif;text-transform:uppercase;word-break:break-word}\n"

                    /* Récapitulatif */
                    + ".recapitulatif-box{width:100%;border:2px solid #0a2a5e;border-radius:6px;overflow:hidden;background-color:#ffffff}\n"
                    + ".recapitulatif-header{background-color:#0a2a5e;color:#ffffff;padding:6px 12px;text-align:center;"
                    + "font-size:7px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase}\n"
                    + ".recapitulatif-body{padding:8px 12px}\n"
                    + ".tot-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;padding:2px 0}\n"
                    + ".tot-label{font-size:8px;color:#374151;text-align:left}\n"
                    + ".tot-value{font-size:8px;color:#374151;text-align:right;font-family:'Courier New',monospace}\n"
                    + ".tot-row.disc .tot-value{color:#dc2626}\n"
                    + ".tot-row.disc .tot-label{color:#dc2626}\n"
                    + ".tot-sep{border-top:1px solid #e2e8f0;margin:6px 0}\n"
                    + ".tot-ttc-lbl{font-size:6px;color:#94a3b8;text-align:right;margin:6px 0 2px}\n"
                    + ".tot-final{display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding-top:6px;border-top:2px solid #0a2a5e}\n"
                    + ".tot-final span:first-child{font-size:9px;font-weight:bold;color:#0a2a5e}\n"
                    + ".tot-final .tot-ttc-val{font-size:12px;font-weight:bold;color:#f59e0b;font-family:'Courier New',monospace}\n"
                    + ".economie-row{display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding-top:4px;"
                    + "border-top:1px dashed #16a34a;color:#16a34a;font-weight:bold}\n"
                    + ".economie-row .economie-label{font-size:8px}\n"
                    + ".economie-row .economie-value{font-size:8px;font-family:'Courier New',monospace}\n"

                    /* Footer */
                    + ".footer-bottom{display:table;width:100%;padding:10px 16px 14px;background-color:#ffffff;border-top:1px solid #e2e8f0}\n"
                    + ".stamp-block,.sig-block{display:table-cell;vertical-align:bottom}\n"
                    + ".stamp-block{width:45%;text-align:left}\n"
                    + ".sig-block{width:55%;text-align:right}\n"
                    + ".stamp-lbl{font-size:6px;font-weight:bold;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;display:block}\n"
                    + ".stamp-block svg{display:block;margin:0}\n"
                    + ".sig-lbl{font-size:6px;font-weight:bold;color:#94a3b8;text-transform:uppercase;display:block;margin-bottom:6px}\n"
                    + ".sig-line{width:120px;border-top:1px dashed #cbd5e1;margin:24px 0 4px auto;display:block}\n"
                    + ".sig-note{font-size:6.5px;color:#94a3b8;font-style:italic}\n"

                    /* Responsive */
                    + "@media (max-width: 600px){.bottom-two-columns{flex-direction:column}.left-column,.right-column{flex:auto;width:100%}}\n"

                    /* Print */
                    + "@media print{body{background-color:#ffffff;padding:0}.page{border:none}}\n";

    // =========================================================
    //  HELPERS JAVA
    // =========================================================

    private static String nvl(String s) { return s != null ? s : ""; }
    private static boolean notBlank(String s) { return s != null && !s.trim().isEmpty(); }
    private static BigDecimal bd(Double d) { return BigDecimal.valueOf(d != null ? d : 0); }
    private static String fmt(double d) { return String.format("%.3f", d); }

    /** Échappe les caractères HTML spéciaux. */
    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    /**
     * Formate un montant en TND avec 3 décimales et espace des milliers.
     * Ex : 1200.000 → "1 200,000"
     */
    protected String formatMontant(BigDecimal val) {
        if (val == null) return "0,000";
        // arrondi 3 décimales
        BigDecimal rounded = val.setScale(3, BigDecimal.ROUND_HALF_UP);
        String[] parts = rounded.toPlainString().split("\\.");
        String intPart = parts[0];
        String decPart = parts.length > 1 ? parts[1] : "000";

        // padding décimal
        while (decPart.length() < 3) decPart += "0";
        decPart = decPart.substring(0, 3);

        // séparateur milliers
        StringBuilder sb = new StringBuilder();
        int count = 0;
        for (int i = intPart.length() - 1; i >= 0; i--) {
            if (count > 0 && count % 3 == 0 && intPart.charAt(i) != '-')
                sb.insert(0, '\u00A0'); // espace insécable
            sb.insert(0, intPart.charAt(i));
            count++;
        }
        return sb + "," + decPart;
    }


    protected String convertMontantToWords(BigDecimal montant) {
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

    // ==================== DTOs Internes ====================

    private static class TotauxDTO {
        private BigDecimal sousTotalBrut;
        private BigDecimal totalRemisesProduits;
        private BigDecimal totalHTApresRemisesProduits;
        private BigDecimal montantRemiseClient;
        private BigDecimal totalHTFinal;
        private BigDecimal totalTVA;
        private BigDecimal totalTTCFinal;
        private BigDecimal economieTotale;
        private BigDecimal tauxRemiseClient;

        // Getters et Setters
        public BigDecimal getSousTotalBrut() { return sousTotalBrut; }
        public void setSousTotalBrut(BigDecimal sousTotalBrut) { this.sousTotalBrut = sousTotalBrut; }
        public BigDecimal getTotalRemisesProduits() { return totalRemisesProduits; }
        public void setTotalRemisesProduits(BigDecimal totalRemisesProduits) { this.totalRemisesProduits = totalRemisesProduits; }
        public BigDecimal getTotalHTApresRemisesProduits() { return totalHTApresRemisesProduits; }
        public void setTotalHTApresRemisesProduits(BigDecimal totalHTApresRemisesProduits) { this.totalHTApresRemisesProduits = totalHTApresRemisesProduits; }
        public BigDecimal getMontantRemiseClient() { return montantRemiseClient; }
        public void setMontantRemiseClient(BigDecimal montantRemiseClient) { this.montantRemiseClient = montantRemiseClient; }
        public BigDecimal getTotalHTFinal() { return totalHTFinal; }
        public void setTotalHTFinal(BigDecimal totalHTFinal) { this.totalHTFinal = totalHTFinal; }
        public BigDecimal getTotalTVA() { return totalTVA; }
        public void setTotalTVA(BigDecimal totalTVA) { this.totalTVA = totalTVA; }
        public BigDecimal getTotalTTCFinal() { return totalTTCFinal; }
        public void setTotalTTCFinal(BigDecimal totalTTCFinal) { this.totalTTCFinal = totalTTCFinal; }
        public BigDecimal getEconomieTotale() { return economieTotale; }
        public void setEconomieTotale(BigDecimal economieTotale) { this.economieTotale = economieTotale; }
        public BigDecimal getTauxRemiseClient() { return tauxRemiseClient; }
        public void setTauxRemiseClient(BigDecimal tauxRemiseClient) { this.tauxRemiseClient = tauxRemiseClient; }
    }
}