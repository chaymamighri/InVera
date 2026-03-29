package org.erp.invera.service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.FactureFournisseurDTO.FactureDetailDTO;
import org.erp.invera.model.Fournisseurs.LigneCommandeFournisseur;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class PdfGenerationService {

    /**
     * Générer PDF à partir du DTO
     */
    public byte[] genererPdfFacture(FactureDetailDTO facture) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);

            // Titre
            document.add(new Paragraph("FACTURE FOURNISSEUR")
                    .setFontSize(18)
                    .setBold()
                    .setMarginBottom(20));

            // ✅ Correction: utiliser "facture" au lieu de "factureDTO"
            document.add(new Paragraph("Réf: " + facture.getReference()));
            document.add(new Paragraph("Date: " + facture.getDateFacture()
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))));

            // ✅ Vérifier que fournisseur n'est pas null
            if (facture.getFournisseur() != null) {
                document.add(new Paragraph("Fournisseur: " + facture.getFournisseur().getNomFournisseur()));
            }

            // ✅ Vérifier que commande n'est pas null
            if (facture.getCommande() != null) {
                document.add(new Paragraph("Commande: " + facture.getCommande().getNumeroCommande()));
            }

            document.add(new Paragraph("\n"));

            // Tableau des produits
            Table table = new Table(UnitValue.createPercentArray(new float[]{5, 50, 15, 30}));
            table.setWidth(UnitValue.createPercentValue(100));

            table.addCell("#");
            table.addCell("Produit");
            table.addCell("Quantité");
            table.addCell("Prix HT");

            // ✅ Vérifier que les lignes ne sont pas null
            if (facture.getLignes() != null && !facture.getLignes().isEmpty()) {
                int index = 1;
                for (LigneCommandeFournisseur ligne : facture.getLignes()) {
                    table.addCell(String.valueOf(index++));

                    // ✅ Vérifier que produit n'est pas null
                    if (ligne.getProduit() != null) {
                        table.addCell(ligne.getProduit().getLibelle());
                    } else {
                        table.addCell("Produit non défini");
                    }

                    table.addCell(String.valueOf(ligne.getQuantite()));
                    table.addCell(String.format(Locale.FRANCE, "%.3f DT", ligne.getPrixUnitaire()));
                }
            } else {
                // ✅ Message si aucune ligne
                table.addCell("Aucun produit");
                table.addCell("");
                table.addCell("");
                table.addCell("");
            }

            document.add(table);
            document.add(new Paragraph("\n"));

            // Total
            document.add(new Paragraph("Total TTC: " +
                    String.format(Locale.FRANCE, "%.3f DT", facture.getMontantTotal()))
                    .setBold()
                    .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.RIGHT));

            document.close();

            log.info("PDF généré pour facture: {}", facture.getReference());
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Erreur génération PDF", e);
            throw new RuntimeException("Erreur lors de la génération du PDF", e);
        }
    }
}