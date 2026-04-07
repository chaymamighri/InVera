package org.erp.invera.service;

import com.itextpdf.kernel.colors.Color;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.Fournisseurs.CommandeFournisseur;
import org.erp.invera.model.Fournisseurs.LigneCommandeFournisseur;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Service de génération de PDF pour les Bons de Commande fournisseurs.
 *
 * Le PDF contient :
 * 1. EN-TÊTE : Coordonnées du fournisseur + Titre "BON DE COMMANDE"
 * 2. INFORMATIONS COMMANDE : N°, date, date livraison, adresse livraison
 * 3. DESTINATAIRE : Coordonnées InVera
 * 4. TABLEAU DES PRODUITS : Désignation, quantité, prix HT, TVA, total TTC
 * 5. TOTAUX : Total HT, TVA, TTC
 * 6. CONDITIONS : Délai, règlement, signature
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BonCommandePdfService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    // Couleurs professionnelles
    private static final Color COLOR_PRIMARY = new DeviceRgb(0, 112, 192);    // Bleu Invera
    private static final Color COLOR_SECONDARY = new DeviceRgb(100, 100, 100); // Gris
    private static final Color COLOR_BORDER = new DeviceRgb(220, 220, 220);     // Gris clair
    private static final Color COLOR_HEADER_BG = new DeviceRgb(240, 248, 255);  // Bleu très clair

    /**
     * Générer un Bon de Commande fournisseur professionnel
     */
    public byte[] genererBonCommandePdf(CommandeFournisseur commande) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);

            // Charger les polices
            PdfFont boldFont = PdfFontFactory.createFont();
            PdfFont regularFont = PdfFontFactory.createFont();

            // ==================== 1. EN-TÊTE ====================
            Table headerTable = new Table(UnitValue.createPercentArray(new float[]{50, 50}));
            headerTable.setWidth(UnitValue.createPercentValue(100));
            headerTable.setMarginBottom(20);

            // Colonne gauche - FOURNISSEUR
            Cell leftHeader = new Cell();
            leftHeader.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
            leftHeader.setPadding(8);

            if (commande.getFournisseur() != null) {
                leftHeader.add(new Paragraph(commande.getFournisseur().getNomFournisseur())
                        .setFont(boldFont)
                        .setFontSize(14)
                        .setBold()
                        .setFontColor(COLOR_PRIMARY));
                if (commande.getFournisseur().getAdresse() != null) {
                    leftHeader.add(new Paragraph(commande.getFournisseur().getAdresse())
                            .setFontSize(8));
                }
                if (commande.getFournisseur().getVille() != null) {
                    leftHeader.add(new Paragraph(commande.getFournisseur().getVille())
                            .setFontSize(8));
                }
                if (commande.getFournisseur().getTelephone() != null) {
                    leftHeader.add(new Paragraph("Tél: " + commande.getFournisseur().getTelephone())
                            .setFontSize(8));
                }
                if (commande.getFournisseur().getEmail() != null) {
                    leftHeader.add(new Paragraph("Email: " + commande.getFournisseur().getEmail())
                            .setFontSize(8));
                }
            } else {
                leftHeader.add(new Paragraph("FOURNISSEUR NON RENSEIGNÉ")
                        .setFont(boldFont)
                        .setFontSize(10)
                        .setFontColor(COLOR_SECONDARY));
            }
            headerTable.addCell(leftHeader);

            // Colonne droite - Titre BON DE COMMANDE + N° + Date
            Cell rightHeader = new Cell()
                    .add(new Paragraph("BON DE COMMANDE")
                            .setFont(boldFont)
                            .setFontSize(18)
                            .setBold()
                            .setFontColor(COLOR_PRIMARY)
                            .setTextAlignment(TextAlignment.RIGHT))
                    .add(new Paragraph("N° " + commande.getNumeroCommande())
                            .setFontSize(12)
                            .setTextAlignment(TextAlignment.RIGHT))
                    .add(new Paragraph("Date: " + commande.getDateCommande().format(DATETIME_FORMATTER))
                            .setFontSize(10)
                            .setTextAlignment(TextAlignment.RIGHT));
            rightHeader.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
            rightHeader.setTextAlignment(TextAlignment.RIGHT);
            rightHeader.setPadding(8);
            headerTable.addCell(rightHeader);

            document.add(headerTable);

            // ==================== 2. INFORMATIONS COMMANDE ====================
            Table infoTable = new Table(UnitValue.createPercentArray(new float[]{50, 50}));
            infoTable.setWidth(UnitValue.createPercentValue(100));
            infoTable.setMarginBottom(15);

            // Colonne gauche - Infos commande
            Cell leftInfo = new Cell();
            leftInfo.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
            leftInfo.setPadding(8);
            leftInfo.add(new Paragraph("INFORMATIONS COMMANDE")
                    .setFont(boldFont)
                    .setFontSize(10)
                    .setFontColor(COLOR_PRIMARY));
            leftInfo.add(new Paragraph("Date livraison prévue: " +
                    (commande.getDateLivraisonPrevue() != null ?
                            commande.getDateLivraisonPrevue().format(DATE_FORMATTER) : "Non spécifiée"))
                    .setFontSize(9));

            if (commande.getAdresseLivraison() != null && !commande.getAdresseLivraison().isEmpty()) {
                leftInfo.add(new Paragraph("Adresse livraison: " + commande.getAdresseLivraison())
                        .setFontSize(9));
            }
            infoTable.addCell(leftInfo);

            // Colonne droite - Statut
            Cell rightInfo = new Cell();
            rightInfo.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
            rightInfo.setPadding(8);
            rightInfo.add(new Paragraph("STATUT")
                    .setFont(boldFont)
                    .setFontSize(10)
                    .setFontColor(COLOR_PRIMARY));
            rightInfo.add(new Paragraph(commande.getStatut().toString())
                    .setFontSize(9)
                    .setFontColor(getStatusColor(commande.getStatut())));
            infoTable.addCell(rightInfo);

            document.add(infoTable);

            // ==================== 3. DESTINATAIRE (InVera) ====================
            Table clientTable = new Table(UnitValue.createPercentArray(new float[]{100}));
            clientTable.setWidth(UnitValue.createPercentValue(100));
            clientTable.setMarginBottom(15);

            Cell clientCell = new Cell();
            clientCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
            clientCell.setPadding(8);
            clientCell.add(new Paragraph("DESTINATAIRE")
                    .setFont(boldFont)
                    .setFontSize(10)
                    .setFontColor(COLOR_PRIMARY));
            clientCell.add(new Paragraph("INVERA")
                    .setFont(boldFont)
                    .setFontSize(10));
            clientCell.add(new Paragraph("123 Avenue de la République")
                    .setFontSize(8));
            clientCell.add(new Paragraph("1000 Tunis, Tunisie")
                    .setFontSize(8));
            clientCell.add(new Paragraph("Tél: +216 71 123 456")
                    .setFontSize(8));
            clientCell.add(new Paragraph("Email: contact@invera.com")
                    .setFontSize(8));
            clientTable.addCell(clientCell);

            document.add(clientTable);

            // ==================== 4. RÉFÉRENCES ====================
            if (commande.getNumeroBonLivraison() != null || commande.getDemande() != null) {
                Table refTable = new Table(UnitValue.createPercentArray(new float[]{30, 70}));
                refTable.setWidth(UnitValue.createPercentValue(100));
                refTable.setMarginBottom(15);

                if (commande.getNumeroBonLivraison() != null) {
                    Cell blLabelCell = new Cell().add(new Paragraph("Bon de livraison:")
                            .setFont(boldFont).setFontSize(9));
                    blLabelCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
                    blLabelCell.setPadding(6);
                    refTable.addCell(blLabelCell);

                    Cell blValueCell = new Cell().add(new Paragraph(commande.getNumeroBonLivraison())
                            .setFontSize(9));
                    blValueCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
                    blValueCell.setPadding(6);
                    refTable.addCell(blValueCell);
                }

                if (commande.getDemande() != null) {
                    Cell demandeLabelCell = new Cell().add(new Paragraph("N° Demande:")
                            .setFont(boldFont).setFontSize(9));
                    demandeLabelCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
                    demandeLabelCell.setPadding(6);
                    refTable.addCell(demandeLabelCell);
                }

                document.add(refTable);
            }

            // ==================== 5. TABLEAU DES PRODUITS ====================
            float[] columnWidths = {40, 15, 18, 12, 15};
            Table productTable = new Table(UnitValue.createPercentArray(columnWidths));
            productTable.setWidth(UnitValue.createPercentValue(100));
            productTable.setMarginBottom(15);

            // En-têtes
            String[] headers = {"Désignation", "Quantité", "Prix HT", "TVA", "Total TTC"};
            for (String header : headers) {
                Cell headerCell = new Cell()
                        .add(new Paragraph(header).setFont(boldFont).setFontSize(9))
                        .setBackgroundColor(COLOR_HEADER_BG)
                        .setBorder(new SolidBorder(COLOR_BORDER, 0.5f))
                        .setPadding(8);
                productTable.addCell(headerCell);
            }

            // Lignes de produits
            BigDecimal totalHT = BigDecimal.ZERO;
            BigDecimal totalTVA = BigDecimal.ZERO;
            BigDecimal totalTTC = BigDecimal.ZERO;

            if (commande.getLignesCommande() != null && !commande.getLignesCommande().isEmpty()) {
                for (LigneCommandeFournisseur ligne : commande.getLignesCommande()) {
                    // Désignation
                    String designation = ligne.getProduit() != null ? ligne.getProduit().getLibelle() : "Produit non défini";
                    productTable.addCell(new Cell().add(new Paragraph(designation).setFontSize(8))
                            .setBorder(new SolidBorder(COLOR_BORDER, 0.5f)).setPadding(6));

                    // Quantité
                    productTable.addCell(new Cell().add(new Paragraph(String.valueOf(ligne.getQuantite())).setFontSize(8))
                            .setTextAlignment(TextAlignment.CENTER)
                            .setBorder(new SolidBorder(COLOR_BORDER, 0.5f)).setPadding(6));

                    // Prix HT
                    BigDecimal prixHT = ligne.getPrixUnitaire();
                    productTable.addCell(new Cell().add(new Paragraph(String.format(Locale.FRANCE, "%.3f DT", prixHT)).setFontSize(8))
                            .setTextAlignment(TextAlignment.RIGHT)
                            .setBorder(new SolidBorder(COLOR_BORDER, 0.5f)).setPadding(6));

                    // TVA
                    double tva = 20.0;
                    if (ligne.getProduit() != null && ligne.getProduit().getCategorie() != null) {
                        tva = ligne.getProduit().getCategorie().getTauxTVA().doubleValue();
                    }
                    productTable.addCell(new Cell().add(new Paragraph(String.format(Locale.FRANCE, "%.0f%%", tva)).setFontSize(8))
                            .setTextAlignment(TextAlignment.CENTER)
                            .setBorder(new SolidBorder(COLOR_BORDER, 0.5f)).setPadding(6));

                    // Total TTC
                    BigDecimal ligneTTC = ligne.getSousTotalTTC() != null ? ligne.getSousTotalTTC() :
                            prixHT.multiply(BigDecimal.valueOf(ligne.getQuantite()))
                                    .multiply(BigDecimal.valueOf(1 + tva / 100));
                    productTable.addCell(new Cell().add(new Paragraph(String.format(Locale.FRANCE, "%.3f DT", ligneTTC)).setFontSize(8))
                            .setTextAlignment(TextAlignment.RIGHT)
                            .setBorder(new SolidBorder(COLOR_BORDER, 0.5f)).setPadding(6));

                    // Cumuls
                    totalHT = totalHT.add(ligne.getSousTotalHT() != null ? ligne.getSousTotalHT() :
                            prixHT.multiply(BigDecimal.valueOf(ligne.getQuantite())));
                    totalTVA = totalTVA.add(ligne.getMontantTVA() != null ? ligne.getMontantTVA() : BigDecimal.ZERO);
                    totalTTC = totalTTC.add(ligneTTC);
                }
            } else {
                Cell emptyCell = new Cell(1, columnWidths.length)
                        .add(new Paragraph("Aucun produit").setFontSize(9))
                        .setTextAlignment(TextAlignment.CENTER);
                emptyCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
                emptyCell.setPadding(20);
                productTable.addCell(emptyCell);
            }

            document.add(productTable);

            // ==================== 6. TOTAUX ====================
            Table totalsTable = new Table(UnitValue.createPercentArray(new float[]{70, 30}));
            totalsTable.setWidth(UnitValue.createPercentValue(100));
            totalsTable.setMarginBottom(20);

            // Cellule vide à gauche
            Cell emptyTotalsCell = new Cell();
            emptyTotalsCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
            emptyTotalsCell.setPadding(8);
            totalsTable.addCell(emptyTotalsCell);

            // Cellule des totaux
            Cell totalsCell = new Cell();
            totalsCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
            totalsCell.setPadding(10);

            totalsCell.add(new Paragraph("Total HT:")
                    .setFont(boldFont).setFontSize(9).setTextAlignment(TextAlignment.RIGHT));
            totalsCell.add(new Paragraph(String.format(Locale.FRANCE, "%.3f DT",
                    commande.getTotalHT() != null ? commande.getTotalHT() : totalHT))
                    .setFontSize(9).setTextAlignment(TextAlignment.RIGHT));

            totalsCell.add(new Paragraph("Total TVA:")
                    .setFont(boldFont).setFontSize(9).setTextAlignment(TextAlignment.RIGHT));
            totalsCell.add(new Paragraph(String.format(Locale.FRANCE, "%.3f DT",
                    commande.getTotalTVA() != null ? commande.getTotalTVA() : totalTVA))
                    .setFontSize(9).setTextAlignment(TextAlignment.RIGHT));

            totalsCell.add(new Paragraph("\nTOTAL TTC:")
                    .setFont(boldFont).setFontSize(12).setBold().setTextAlignment(TextAlignment.RIGHT)
                    .setFontColor(COLOR_PRIMARY));
            totalsCell.add(new Paragraph(String.format(Locale.FRANCE, "%.3f DT",
                    commande.getTotalTTC() != null ? commande.getTotalTTC() : totalTTC))
                    .setFont(boldFont).setFontSize(12).setBold().setTextAlignment(TextAlignment.RIGHT)
                    .setFontColor(COLOR_PRIMARY));

            totalsTable.addCell(totalsCell);
            document.add(totalsTable);

            // ==================== 7. CONDITIONS ====================
            Table conditionsTable = new Table(UnitValue.createPercentArray(new float[]{100}));
            conditionsTable.setWidth(UnitValue.createPercentValue(100));
            conditionsTable.setMarginBottom(15);

            Cell conditionsCell = new Cell();
            conditionsCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
            conditionsCell.setPadding(8);
            conditionsCell.add(new Paragraph("CONDITIONS")
                    .setFont(boldFont).setFontSize(10).setFontColor(COLOR_PRIMARY));
            conditionsCell.add(new Paragraph("• Délai de livraison: " +
                    (commande.getDateLivraisonPrevue() != null ?
                            commande.getDateLivraisonPrevue().format(DATE_FORMATTER) : "À convenir"))
                    .setFontSize(8));
            conditionsCell.add(new Paragraph("• Mode de règlement: À réception de facture")
                    .setFontSize(8));
            conditionsCell.add(new Paragraph("• Cette commande engage la responsabilité de l'acheteur")
                    .setFontSize(8));
            conditionsTable.addCell(conditionsCell);

            document.add(conditionsTable);

            // ==================== 8. SIGNATURE ====================
            Table signatureTable = new Table(UnitValue.createPercentArray(new float[]{50, 50}));
            signatureTable.setWidth(UnitValue.createPercentValue(100));

            Cell signatureLeft = new Cell();
            signatureLeft.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
            signatureLeft.setPadding(8);
            signatureLeft.add(new Paragraph("Cachet et signature du fournisseur")
                    .setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            signatureTable.addCell(signatureLeft);

            Cell signatureRight = new Cell();
            signatureRight.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
            signatureRight.setPadding(8);
            signatureRight.add(new Paragraph("Signature InVera")
                    .setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            signatureTable.addCell(signatureRight);

            document.add(signatureTable);

            document.close();

            log.info("PDF du bon de commande généré avec succès: {}", commande.getNumeroCommande());
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Erreur lors de la génération du PDF du bon de commande", e);
            throw new RuntimeException("Erreur lors de la génération du PDF", e);
        }
    }

    /**
     * Couleur du statut pour le PDF
     */
    private Color getStatusColor(CommandeFournisseur.StatutCommande statut) {
        switch (statut) {
            case BROUILLON:
                return new DeviceRgb(128, 128, 128); // Gris
            case VALIDEE:
                return new DeviceRgb(0, 112, 192);   // Bleu
            case ENVOYEE:
                return new DeviceRgb(255, 193, 7);   // Orange
            case RECUE:
                return new DeviceRgb(40, 167, 69);   // Vert
            case FACTUREE:
                return new DeviceRgb(111, 66, 193);  // Violet
            case ANNULEE:
                return new DeviceRgb(220, 53, 69);   // Rouge
            default:
                return COLOR_SECONDARY;
        }
    }
}