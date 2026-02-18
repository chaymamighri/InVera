package org.erp.invera.service;

import com.itextpdf.kernel.pdf.*;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import org.erp.invera.model.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class PdfGenerationService {

    public byte[] genererPDFFacture(FactureClient facture) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try {
            // Initialisation du document PDF
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);

            // Titre
            document.add(new Paragraph("FACTURE")
                    .setFontSize(24)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph("\n"));

            // Référence et date
            document.add(new Paragraph("N° Facture: " + facture.getReferenceFactureClient())
                    .setFontSize(12));
            document.add(new Paragraph("Date: " + facture.getDateFacture()
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                    .setFontSize(12));

            document.add(new Paragraph("\n"));

            // Informations client
            document.add(new Paragraph("CLIENT")
                    .setFontSize(14)
                    .setBold());

            Client client = facture.getClient();
            document.add(new Paragraph(client.getPrenom() + " " + client.getNom()));
            if (client.getEmail() != null) {
                document.add(new Paragraph("Email: " + client.getEmail()));
            }
            if (client.getTelephone() != null) {
                document.add(new Paragraph("Tél: " + client.getTelephone()));
            }
            if (client.getAdresse() != null) {
                document.add(new Paragraph("Adresse: " + client.getAdresse()));
            }

            document.add(new Paragraph("\n"));

            // Détails de la commande
            CommandeClient commande = facture.getCommande();
            document.add(new Paragraph("DÉTAILS DE LA COMMANDE")
                    .setFontSize(14)
                    .setBold());

            document.add(new Paragraph("Référence commande: " + commande.getReferenceCommandeClient()));
            document.add(new Paragraph("Date commande: " + commande.getDateCommande()
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))));

            document.add(new Paragraph("\n"));

            // Tableau des produits
            float[] columnWidths = {4, 1, 2, 2};
            Table table = new Table(UnitValue.createPercentArray(columnWidths));
            table.setWidth(UnitValue.createPercentValue(100));

            // En-têtes
            table.addHeaderCell("Produit");
            table.addHeaderCell("Qté");
            table.addHeaderCell("Prix unit.");
            table.addHeaderCell("Total");

            // Lignes de produits
            for (LigneCommandeClient ligne : commande.getLignesCommande()) {
                table.addCell(ligne.getProduit().getLibelle());
                table.addCell(String.valueOf(ligne.getQuantite()));
                table.addCell(String.format("%.3f dt", ligne.getPrixUnitaire()));
                table.addCell(String.format("%.3f dt", ligne.getSousTotal()));
            }

            document.add(table);
            document.add(new Paragraph("\n"));

            // Totaux
            document.add(new Paragraph("Sous-total: " + String.format("%.3f dt", commande.getSousTotal()))
                    .setTextAlignment(TextAlignment.RIGHT));

            if (commande.getTauxRemise() != null && commande.getTauxRemise().compareTo(java.math.BigDecimal.ZERO) > 0) {
                document.add(new Paragraph("Remise (" + commande.getTauxRemise() + "%): -"
                        + String.format("%.3f dt", commande.getSousTotal()
                        .subtract(commande.getTotal())))
                        .setTextAlignment(TextAlignment.RIGHT));
            }

            document.add(new Paragraph("TOTAL: " + String.format("%.3f dt", facture.getMontantTotal()))
                    .setFontSize(16)
                    .setBold()
                    .setTextAlignment(TextAlignment.RIGHT));

            document.add(new Paragraph("\n"));

            // Statut
            document.add(new Paragraph("Statut: " + facture.getStatut())
                    .setFontSize(12)
                    .setBold());

            // Fermeture du document
            document.close();

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la génération du PDF: " + e.getMessage());
        }

        return baos.toByteArray();
    }
}