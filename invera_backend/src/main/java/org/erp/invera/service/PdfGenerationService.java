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
import org.erp.invera.dto.FactureFournisseurDTO.FactureDetailDTO;
import org.erp.invera.model.Fournisseurs.LigneCommandeFournisseur;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class PdfGenerationService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    // Couleurs professionnelles
    private static final Color COLOR_PRIMARY = new DeviceRgb(0, 112, 192);    // Bleu Invera
    private static final Color COLOR_SECONDARY = new DeviceRgb(100, 100, 100); // Gris
    private static final Color COLOR_BORDER = new DeviceRgb(220, 220, 220);     // Gris clair
    private static final Color COLOR_HEADER_BG = new DeviceRgb(240, 248, 255);  // Bleu très clair

    /**
     * Générer une facture fournisseur professionnelle et structurée
     */
    public byte[] genererPdfFacture(FactureDetailDTO facture) {
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

            // Colonne gauche - FOURNISSEUR (Émetteur principal)
            Cell leftHeader = new Cell();
            leftHeader.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
            leftHeader.setPadding(8);

            if (facture.getFournisseur() != null) {
                leftHeader.add(new Paragraph(facture.getFournisseur().getNomFournisseur())
                        .setFont(boldFont)
                        .setFontSize(14)
                        .setBold()
                        .setFontColor(COLOR_PRIMARY));
                if (facture.getFournisseur().getAdresse() != null) {
                    leftHeader.add(new Paragraph(facture.getFournisseur().getAdresse())
                            .setFontSize(8));
                }
                if (facture.getFournisseur().getVille() != null) {
                    leftHeader.add(new Paragraph(facture.getFournisseur().getVille())
                            .setFontSize(8));
                }
                if (facture.getFournisseur().getTelephone() != null) {
                    leftHeader.add(new Paragraph("Tél: " + facture.getFournisseur().getTelephone())
                            .setFontSize(8));
                }
                if (facture.getFournisseur().getEmail() != null) {
                    leftHeader.add(new Paragraph("Email: " + facture.getFournisseur().getEmail())
                            .setFontSize(8));
                }
            } else {
                leftHeader.add(new Paragraph("FOURNISSEUR NON RENSEIGNÉ")
                        .setFont(boldFont)
                        .setFontSize(10)
                        .setFontColor(COLOR_SECONDARY));
            }
            headerTable.addCell(leftHeader);

            // Colonne droite - Titre facture + N° + Date
            Cell rightHeader = new Cell()
                    .add(new Paragraph("FACTURE")
                            .setFont(boldFont)
                            .setFontSize(18)
                            .setBold()
                            .setFontColor(COLOR_PRIMARY)
                            .setTextAlignment(TextAlignment.RIGHT))
                    .add(new Paragraph("N° " + facture.getReference())
                            .setFontSize(12)
                            .setTextAlignment(TextAlignment.RIGHT))
                    .add(new Paragraph("Date: " + facture.getDateFacture().format(DATETIME_FORMATTER))
                            .setFontSize(10)
                            .setTextAlignment(TextAlignment.RIGHT));
            rightHeader.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
            rightHeader.setTextAlignment(TextAlignment.RIGHT);
            rightHeader.setPadding(8);
            headerTable.addCell(rightHeader);

            document.add(headerTable);

            // ==================== 2. INFORMATIONS DESTINATAIRE (InVera) ====================
            Table clientTable = new Table(UnitValue.createPercentArray(new float[]{50, 50}));
            clientTable.setWidth(UnitValue.createPercentValue(100));
            clientTable.setMarginBottom(20);

            // Cellule vide à gauche
            Cell emptyCell = new Cell();
            emptyCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
            emptyCell.setPadding(8);
            clientTable.addCell(emptyCell);

            // Colonne droite - DESTINATAIRE (InVera)
            Cell clientCell = new Cell()
                    .add(new Paragraph("DESTINATAIRE")
                            .setFont(boldFont)
                            .setFontSize(11)
                            .setBold()
                            .setFontColor(COLOR_PRIMARY))
                    .add(new Paragraph("INVERA")
                            .setFont(boldFont)
                            .setFontSize(10))
                    .add(new Paragraph("123 Avenue de la République")
                            .setFontSize(8))
                    .add(new Paragraph("1000 Tunis, Tunisie")
                            .setFontSize(8))
                    .add(new Paragraph("Tél: +216 71 123 456")
                            .setFontSize(8))
                    .add(new Paragraph("Email: contact@invera.com")
                            .setFontSize(8))
                    .add(new Paragraph("Matricule Fiscal: 1234567X")
                            .setFontSize(8));
            clientCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
            clientCell.setPadding(8);
            clientTable.addCell(clientCell);

            document.add(clientTable);

            // ==================== 3. RÉFÉRENCES COMMANDE ====================
            Table refTable = new Table(UnitValue.createPercentArray(new float[]{30, 70}));
            refTable.setWidth(UnitValue.createPercentValue(100));
            refTable.setMarginBottom(15);

            if (facture.getCommande() != null) {
                Cell refLabelCell = new Cell().add(new Paragraph("N° Commande:")
                        .setFont(boldFont)
                        .setFontSize(9));
                refLabelCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
                refLabelCell.setPadding(6);
                refTable.addCell(refLabelCell);

                Cell refValueCell = new Cell().add(new Paragraph(facture.getCommande().getNumeroCommande())
                        .setFontSize(9));
                refValueCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
                refValueCell.setPadding(6);
                refTable.addCell(refValueCell);

                if (facture.getCommande().getDateCommande() != null) {
                    Cell dateLabelCell = new Cell().add(new Paragraph("Date commande:")
                            .setFont(boldFont)
                            .setFontSize(9));
                    dateLabelCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
                    dateLabelCell.setPadding(6);
                    refTable.addCell(dateLabelCell);

                    Cell dateValueCell = new Cell().add(new Paragraph(facture.getCommande().getDateCommande().format(DATE_FORMATTER))
                            .setFontSize(9));
                    dateValueCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
                    dateValueCell.setPadding(6);
                    refTable.addCell(dateValueCell);
                }

                if (facture.getCommande().getNumeroBonLivraison() != null) {
                    Cell blLabelCell = new Cell().add(new Paragraph("Bon de livraison:")
                            .setFont(boldFont)
                            .setFontSize(9));
                    blLabelCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
                    blLabelCell.setPadding(6);
                    refTable.addCell(blLabelCell);

                    Cell blValueCell = new Cell().add(new Paragraph(facture.getCommande().getNumeroBonLivraison())
                            .setFontSize(9));
                    blValueCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
                    blValueCell.setPadding(6);
                    refTable.addCell(blValueCell);
                }
            }

            document.add(refTable);

            // ==================== 4. TABLEAU DES PRODUITS ====================
            float[] columnWidths = {5, 50, 10, 15, 10, 15};
            Table productTable = new Table(UnitValue.createPercentArray(columnWidths));
            productTable.setWidth(UnitValue.createPercentValue(100));
            productTable.setMarginBottom(15);

            // En-têtes avec bordure
            String[] headers = {"#", "Désignation", "Qté", "Prix HT", "TVA", "Total TTC"};
            for (String header : headers) {
                Cell headerCell = new Cell()
                        .add(new Paragraph(header).setFont(boldFont).setFontSize(9))
                        .setBackgroundColor(COLOR_HEADER_BG)
                        .setBorder(new SolidBorder(COLOR_BORDER, 0.5f))
                        .setPadding(8);
                productTable.addCell(headerCell);
            }

            // Lignes de produits
            if (facture.getLignes() != null && !facture.getLignes().isEmpty()) {
                int index = 1;
                for (LigneCommandeFournisseur ligne : facture.getLignes()) {
                    // Numéro
                    Cell numCell = new Cell().add(new Paragraph(String.valueOf(index++)).setFontSize(8));
                    numCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
                    numCell.setPadding(6);
                    productTable.addCell(numCell);

                    // Désignation
                    String designation = ligne.getProduit() != null ? ligne.getProduit().getLibelle() : "Produit non défini";
                    Cell descCell = new Cell().add(new Paragraph(designation).setFontSize(8));
                    descCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
                    descCell.setPadding(6);
                    productTable.addCell(descCell);

                    // Quantité
                    Cell qtyCell = new Cell().add(new Paragraph(String.valueOf(ligne.getQuantite())).setFontSize(8))
                            .setTextAlignment(TextAlignment.CENTER);
                    qtyCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
                    qtyCell.setPadding(6);
                    productTable.addCell(qtyCell);

                    // Prix HT
                    Cell priceCell = new Cell().add(new Paragraph(String.format(Locale.FRANCE, "%.3f DT", ligne.getPrixUnitaire())).setFontSize(8))
                            .setTextAlignment(TextAlignment.RIGHT);
                    priceCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
                    priceCell.setPadding(6);
                    productTable.addCell(priceCell);

                    // TVA - Récupérer le taux TVA depuis le produit
                    double tva = 20.0;
                    if (ligne.getProduit() != null && ligne.getProduit().getCategorie() != null) {
                        tva = ligne.getProduit().getCategorie().getTauxTVA().doubleValue();
                    }
                    Cell tvaCell = new Cell().add(new Paragraph(String.format(Locale.FRANCE, "%.0f%%", tva)).setFontSize(8))
                            .setTextAlignment(TextAlignment.CENTER);
                    tvaCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
                    tvaCell.setPadding(6);
                    productTable.addCell(tvaCell);

                    // Total TTC - Utiliser sousTotalTTC s'il existe
                    BigDecimal totalTTC = ligne.getSousTotalTTC() != null ? ligne.getSousTotalTTC() :
                            ligne.getPrixUnitaire().multiply(BigDecimal.valueOf(ligne.getQuantite()))
                                    .multiply(BigDecimal.valueOf(1 + tva / 100));
                    Cell totalCell = new Cell().add(new Paragraph(String.format(Locale.FRANCE, "%.3f DT", totalTTC)).setFontSize(8))
                            .setTextAlignment(TextAlignment.RIGHT);
                    totalCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
                    totalCell.setPadding(6);
                    productTable.addCell(totalCell);
                }
            } else {
                Cell emptyCellProduct = new Cell(1, columnWidths.length)
                        .add(new Paragraph("Aucun produit").setFontSize(9))
                        .setTextAlignment(TextAlignment.CENTER);
                emptyCellProduct.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
                emptyCellProduct.setPadding(20);
                productTable.addCell(emptyCellProduct);
            }

            document.add(productTable);

            // ==================== 5. TOTAUX ====================
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

            // Calcul des totaux
            BigDecimal totalHT = facture.getLignes().stream()
                    .map(l -> l.getSousTotalHT() != null ? l.getSousTotalHT() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalTVA = facture.getLignes().stream()
                    .map(l -> l.getMontantTVA() != null ? l.getMontantTVA() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            totalsCell.add(new Paragraph("Total HT:")
                    .setFont(boldFont)
                    .setFontSize(9)
                    .setTextAlignment(TextAlignment.RIGHT));
            totalsCell.add(new Paragraph(String.format(Locale.FRANCE, "%.3f DT", totalHT))
                    .setFontSize(9)
                    .setTextAlignment(TextAlignment.RIGHT));

            totalsCell.add(new Paragraph("Total TVA:")
                    .setFont(boldFont)
                    .setFontSize(9)
                    .setTextAlignment(TextAlignment.RIGHT));
            totalsCell.add(new Paragraph(String.format(Locale.FRANCE, "%.3f DT", totalTVA))
                    .setFontSize(9)
                    .setTextAlignment(TextAlignment.RIGHT));

            totalsCell.add(new Paragraph("\nTOTAL TTC:")
                    .setFont(boldFont)
                    .setFontSize(12)
                    .setBold()
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setFontColor(COLOR_PRIMARY));
            totalsCell.add(new Paragraph(String.format(Locale.FRANCE, "%.3f DT", facture.getMontantTotal()))
                    .setFont(boldFont)
                    .setFontSize(12)
                    .setBold()
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setFontColor(COLOR_PRIMARY));

            totalsTable.addCell(totalsCell);
            document.add(totalsTable);

            document.close();

            log.info("PDF généré avec succès pour la facture: {}", facture.getReference());
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Erreur lors de la génération du PDF", e);
            throw new RuntimeException("Erreur lors de la génération du PDF", e);
        }
    }
}