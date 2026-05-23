package org.erp.invera.service.erp;

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
import org.erp.invera.model.erp.Fournisseurs.CommandeFournisseur;
import org.erp.invera.model.erp.Fournisseurs.Fournisseur;
import org.erp.invera.model.erp.Fournisseurs.LigneCommandeFournisseur;
import org.erp.invera.model.erp.Produit;
import org.erp.invera.model.platform.Client;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class BonCommandePdfService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private static final Color COLOR_PRIMARY = new DeviceRgb(0, 112, 192);
    private static final Color COLOR_SECONDARY = new DeviceRgb(100, 100, 100);
    private static final Color COLOR_BORDER = new DeviceRgb(220, 220, 220);
    private static final Color COLOR_HEADER_BG = new DeviceRgb(240, 248, 255);
    private static final Color COLOR_FOOTER_BG = new DeviceRgb(245, 245, 245);

    public byte[] genererBonCommandePdf(CommandeFournisseur commande, Client clientConnecte) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);

            PdfFont boldFont = PdfFontFactory.createFont();
            PdfFont regularFont = PdfFontFactory.createFont();

            Fournisseur fournisseur = getFournisseurFromCommande(commande);
            boolean hasLogo = clientConnecte != null && clientConnecte.getLogoUrl() != null && !clientConnecte.getLogoUrl().isEmpty();

            // Infos émetteur (client connecté)
            String entrepriseNom = "";
            String telephone = "";
            String email = "";
            String matriculeFiscal = "";
            String raisonSociale = "";
            boolean isEntreprise = false;

            if (clientConnecte != null) {
                isEntreprise = clientConnecte.getTypeCompte() == Client.TypeCompte.ENTREPRISE;
                if (isEntreprise) {
                    raisonSociale = clientConnecte.getRaisonSociale() != null ? clientConnecte.getRaisonSociale() : "";
                    entrepriseNom = raisonSociale;
                    matriculeFiscal = clientConnecte.getMatriculeFiscal() != null ? clientConnecte.getMatriculeFiscal() : "";
                } else {
                    String nom = clientConnecte.getNom() != null ? clientConnecte.getNom() : "";
                    String prenom = clientConnecte.getPrenom() != null ? clientConnecte.getPrenom() : "";
                    entrepriseNom = (nom + " " + prenom).trim();
                }
                telephone = clientConnecte.getTelephone() != null ? clientConnecte.getTelephone() : "";
                email = clientConnecte.getEmail() != null ? clientConnecte.getEmail() : "";
            }

            // ==================== EN-TÊTE ====================
            Table headerTable = new Table(UnitValue.createPercentArray(new float[]{50, 50}));
            headerTable.setWidth(UnitValue.createPercentValue(100));
            headerTable.setMarginBottom(20);

            // Gauche : ÉMETTEUR (client connecté)
            Cell leftHeader = new Cell();
            leftHeader.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
            leftHeader.setPadding(10);

            leftHeader.add(new Paragraph("ÉMETTEUR")
                    .setFont(boldFont).setFontSize(10).setFontColor(COLOR_PRIMARY));
            leftHeader.add(new Paragraph(entrepriseNom.isEmpty() ? "Client non renseigné" : entrepriseNom)
                    .setFont(boldFont).setFontSize(12).setBold());
            if (isEntreprise && !matriculeFiscal.isEmpty()) {
                leftHeader.add(new Paragraph("Matricule fiscal: " + matriculeFiscal).setFontSize(8));
            }
            if (!telephone.isEmpty()) {
                leftHeader.add(new Paragraph("Tél: " + telephone).setFontSize(8));
            }
            if (!email.isEmpty()) {
                leftHeader.add(new Paragraph("Email: " + email).setFontSize(8));
            }
            headerTable.addCell(leftHeader);

            // Droite : Titre + N° commande
            Cell rightHeader = new Cell()
                    .add(new Paragraph("BON DE COMMANDE")
                            .setFont(boldFont).setFontSize(18).setBold().setFontColor(COLOR_PRIMARY)
                            .setTextAlignment(TextAlignment.RIGHT))
                    .add(new Paragraph("N° " + commande.getNumeroCommande())
                            .setFontSize(12).setTextAlignment(TextAlignment.RIGHT))
                    .add(new Paragraph("Date: " + commande.getDateCommande().format(DATETIME_FORMATTER))
                            .setFontSize(10).setTextAlignment(TextAlignment.RIGHT));
            rightHeader.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
            rightHeader.setTextAlignment(TextAlignment.RIGHT);
            rightHeader.setPadding(10);
            headerTable.addCell(rightHeader);
            document.add(headerTable);

            // ==================== FOURNISSEUR (destinataire) ====================
            Table destTable = new Table(UnitValue.createPercentArray(new float[]{100}));
            destTable.setWidth(UnitValue.createPercentValue(100));
            destTable.setMarginBottom(15);

            Cell destCell = new Cell();
            destCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
            destCell.setPadding(10);
            destCell.add(new Paragraph("DESTINATAIRE")
                    .setFont(boldFont).setFontSize(10).setFontColor(COLOR_PRIMARY));

            if (fournisseur != null) {
                destCell.add(new Paragraph(fournisseur.getNomFournisseur())
                        .setFont(boldFont).setFontSize(12).setBold());

                if (fournisseur.getMatriculeFiscale() != null && !fournisseur.getMatriculeFiscale().isEmpty()) {
                    destCell.add(new Paragraph("Matricule fiscal: " + fournisseur.getMatriculeFiscale())
                            .setFontSize(8).setFontColor(COLOR_SECONDARY));
                }

                if (fournisseur.getAdresse() != null && !fournisseur.getAdresse().isEmpty()) {
                    destCell.add(new Paragraph(fournisseur.getAdresse()).setFontSize(8));
                }
                if (fournisseur.getVille() != null && !fournisseur.getVille().isEmpty()) {
                    destCell.add(new Paragraph(fournisseur.getVille()).setFontSize(8));
                }
                if (fournisseur.getPays() != null && !fournisseur.getPays().isEmpty()) {
                    destCell.add(new Paragraph(fournisseur.getPays()).setFontSize(8));
                }
                if (fournisseur.getTelephone() != null && !fournisseur.getTelephone().isEmpty()) {
                    destCell.add(new Paragraph("Tél: " + fournisseur.getTelephone()).setFontSize(8));
                }
                if (fournisseur.getEmail() != null && !fournisseur.getEmail().isEmpty()) {
                    destCell.add(new Paragraph("Email: " + fournisseur.getEmail()).setFontSize(8));
                }
            } else {
                destCell.add(new Paragraph("Fournisseur non renseigné")
                        .setFontSize(9).setFontColor(COLOR_SECONDARY));
            }
            destTable.addCell(destCell);
            document.add(destTable);

            // ==================== INFORMATIONS COMMANDE ====================
            Table infoTable = new Table(UnitValue.createPercentArray(new float[]{100}));
            infoTable.setWidth(UnitValue.createPercentValue(100));
            infoTable.setMarginBottom(15);

            Cell infoCell = new Cell();
            infoCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
            infoCell.setPadding(10);
            infoCell.add(new Paragraph("DÉTAILS DE LA COMMANDE")
                    .setFont(boldFont).setFontSize(10).setFontColor(COLOR_PRIMARY));
            infoCell.add(new Paragraph("Date livraison prévue: " +
                    (commande.getDateLivraisonPrevue() != null ?
                            commande.getDateLivraisonPrevue().format(DATE_FORMATTER) : "Non spécifiée"))
                    .setFontSize(9));
            if (commande.getAdresseLivraison() != null && !commande.getAdresseLivraison().isEmpty()) {
                infoCell.add(new Paragraph("Adresse livraison: " + commande.getAdresseLivraison())
                        .setFontSize(9));
            }
            infoTable.addCell(infoCell);
            document.add(infoTable);

            // ==================== RÉFÉRENCES ====================
            if (commande.getNumeroBonLivraison() != null && !commande.getNumeroBonLivraison().isEmpty()) {
                Table refTable = new Table(UnitValue.createPercentArray(new float[]{30, 70}));
                refTable.setWidth(UnitValue.createPercentValue(100));
                refTable.setMarginBottom(15);

                Cell blLabelCell = new Cell().add(new Paragraph("Bon de livraison:")
                        .setFont(boldFont).setFontSize(9));
                blLabelCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
                blLabelCell.setPadding(8);
                refTable.addCell(blLabelCell);

                Cell blValueCell = new Cell().add(new Paragraph(commande.getNumeroBonLivraison())
                        .setFontSize(9));
                blValueCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
                blValueCell.setPadding(8);
                refTable.addCell(blValueCell);
                document.add(refTable);
            }

            // ==================== TABLEAU DES PRODUITS ====================
            float[] columnWidths = {50, 15, 15, 10, 10};
            Table productTable = new Table(UnitValue.createPercentArray(columnWidths));
            productTable.setWidth(UnitValue.createPercentValue(100));
            productTable.setMarginBottom(15);

            String[] headers = {"Désignation", "Qté", "Prix HT", "TVA", "Total TTC"};
            for (String header : headers) {
                Cell headerCell = new Cell()
                        .add(new Paragraph(header).setFont(boldFont).setFontSize(9))
                        .setBackgroundColor(COLOR_HEADER_BG)
                        .setBorder(new SolidBorder(COLOR_BORDER, 0.5f))
                        .setPadding(8)
                        .setTextAlignment(TextAlignment.CENTER);
                productTable.addCell(headerCell);
            }

            BigDecimal totalHT = BigDecimal.ZERO;
            BigDecimal totalTTC = BigDecimal.ZERO;

            if (commande.getLignesCommande() != null && !commande.getLignesCommande().isEmpty()) {
                for (LigneCommandeFournisseur ligne : commande.getLignesCommande()) {
                    String designation = ligne.getProduit() != null ? ligne.getProduit().getLibelle() : "Produit non défini";

                    productTable.addCell(new Cell().add(new Paragraph(designation).setFontSize(8))
                            .setBorder(new SolidBorder(COLOR_BORDER, 0.5f)).setPadding(6));

                    productTable.addCell(new Cell().add(new Paragraph(String.valueOf(ligne.getQuantite())).setFontSize(8))
                            .setTextAlignment(TextAlignment.CENTER)
                            .setBorder(new SolidBorder(COLOR_BORDER, 0.5f)).setPadding(6));

                    BigDecimal prixHT = ligne.getPrixUnitaire();
                    productTable.addCell(new Cell().add(new Paragraph(String.format(Locale.FRANCE, "%.3f", prixHT)).setFontSize(8))
                            .setTextAlignment(TextAlignment.RIGHT)
                            .setBorder(new SolidBorder(COLOR_BORDER, 0.5f)).setPadding(6));

                    BigDecimal tauxTVA = ligne.getTauxTVA() != null ? ligne.getTauxTVA() : BigDecimal.valueOf(19);
                    productTable.addCell(new Cell().add(new Paragraph(String.format(Locale.FRANCE, "%.0f%%", tauxTVA)).setFontSize(8))
                            .setTextAlignment(TextAlignment.CENTER)
                            .setBorder(new SolidBorder(COLOR_BORDER, 0.5f)).setPadding(6));

                    BigDecimal ligneTTC = ligne.getSousTotalTTC() != null ? ligne.getSousTotalTTC() :
                            prixHT.multiply(BigDecimal.valueOf(ligne.getQuantite()))
                                    .multiply(BigDecimal.ONE.add(tauxTVA.divide(BigDecimal.valueOf(100))));
                    productTable.addCell(new Cell().add(new Paragraph(String.format(Locale.FRANCE, "%.3f", ligneTTC)).setFontSize(8))
                            .setTextAlignment(TextAlignment.RIGHT)
                            .setBorder(new SolidBorder(COLOR_BORDER, 0.5f)).setPadding(6));

                    totalHT = totalHT.add(ligne.getSousTotalHT() != null ? ligne.getSousTotalHT() :
                            prixHT.multiply(BigDecimal.valueOf(ligne.getQuantite())));
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

            // ==================== TOTAUX ====================
            Table totalsTable = new Table(UnitValue.createPercentArray(new float[]{70, 30}));
            totalsTable.setWidth(UnitValue.createPercentValue(100));
            totalsTable.setMarginBottom(20);

            Cell emptyTotalsCell = new Cell();
            emptyTotalsCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
            emptyTotalsCell.setPadding(8);
            totalsTable.addCell(emptyTotalsCell);

            Cell totalsCell = new Cell();
            totalsCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
            totalsCell.setPadding(12);

            totalsCell.add(new Paragraph("Total HT:")
                    .setFont(boldFont).setFontSize(9).setTextAlignment(TextAlignment.RIGHT));
            totalsCell.add(new Paragraph(String.format(Locale.FRANCE, "%.3f DT", totalHT))
                    .setFontSize(9).setTextAlignment(TextAlignment.RIGHT));

            BigDecimal totalTVA = totalTTC.subtract(totalHT);
            totalsCell.add(new Paragraph("Total TVA:")
                    .setFont(boldFont).setFontSize(9).setTextAlignment(TextAlignment.RIGHT));
            totalsCell.add(new Paragraph(String.format(Locale.FRANCE, "%.3f DT", totalTVA))
                    .setFontSize(9).setTextAlignment(TextAlignment.RIGHT));

            totalsCell.add(new Paragraph("\nTOTAL TTC:")
                    .setFont(boldFont).setFontSize(12).setBold().setTextAlignment(TextAlignment.RIGHT)
                    .setFontColor(COLOR_PRIMARY));
            totalsCell.add(new Paragraph(String.format(Locale.FRANCE, "%.3f DT", totalTTC))
                    .setFont(boldFont).setFontSize(12).setBold().setTextAlignment(TextAlignment.RIGHT)
                    .setFontColor(COLOR_PRIMARY));

            totalsTable.addCell(totalsCell);
            document.add(totalsTable);

            // ==================== PIED DE PAGE (CACHET) ====================
            Table footerTable = new Table(UnitValue.createPercentArray(new float[]{100}));
            footerTable.setWidth(UnitValue.createPercentValue(100));
            footerTable.setMarginTop(20);

            Cell footerCell = new Cell();
            footerCell.setBorder(new SolidBorder(COLOR_BORDER, 0.5f));
            footerCell.setBackgroundColor(COLOR_FOOTER_BG);
            footerCell.setPadding(10);
            footerCell.setTextAlignment(TextAlignment.CENTER);

            footerCell.add(new Paragraph("Cachet et signature du fournisseur")
                    .setFont(boldFont).setFontSize(9).setFontColor(COLOR_SECONDARY));
            footerCell.add(new Paragraph("_________________________________________")
                    .setFontSize(8).setFontColor(COLOR_SECONDARY));
            footerCell.add(new Paragraph("Date et signature")
                    .setFontSize(8).setFontColor(COLOR_SECONDARY));

            footerTable.addCell(footerCell);
            document.add(footerTable);

            document.close();

            log.info("PDF du bon de commande genere avec succes: {}", commande.getNumeroCommande());
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Erreur lors de la generation du PDF du bon de commande", e);
            throw new RuntimeException("Erreur lors de la generation du PDF", e);
        }
    }

    private Fournisseur getFournisseurFromCommande(CommandeFournisseur commande) {
        if (commande.getLignesCommande() == null || commande.getLignesCommande().isEmpty()) {
            return null;
        }
        Produit premierProduit = commande.getLignesCommande().get(0).getProduit();
        return premierProduit != null ? premierProduit.getFournisseur() : null;
    }
}