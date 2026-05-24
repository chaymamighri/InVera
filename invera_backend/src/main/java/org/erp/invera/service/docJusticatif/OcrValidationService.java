package org.erp.invera.service.docJusticatif;

import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;



@Slf4j
@Service
public class OcrValidationService {

    @Value("${ocr.tessdata.path:src/main/resources/tessdata}")
    private String tessDataPath;

    @Value("${ocr.language:fra+eng}")
    private String language;

    private final ITesseract tesseract;

    public OcrValidationService() {
        this.tesseract = new Tesseract();
    }

    @jakarta.annotation.PostConstruct
    public void init() {
        tesseract.setDatapath(tessDataPath);
        tesseract.setLanguage(language);
        tesseract.setPageSegMode(1);
        tesseract.setOcrEngineMode(1);

        // Configuration pour l'arabe (RTL)
        tesseract.setTessVariable("textord_force_make_prop_words", "false");
        tesseract.setTessVariable("classify_enable_learning", "0");
        tesseract.setTessVariable("classify_enable_adaptive_matcher", "0");

        log.info("✅ OCR initialisé avec Tesseract, langues: {}", language);
    }

    /**
     * Extrait le texte d'un document (PDF texte ou image)
     */
    private String extractTextFromDocument(MultipartFile file) throws IOException, TesseractException {
        String fileName = file.getOriginalFilename();
        if (fileName == null) return "";

        String lowerFileName = fileName.toLowerCase();

        // Traitement des PDF
        if (lowerFileName.endsWith(".pdf")) {
            log.info("📄 Traitement PDF: {}", fileName);
            try (PDDocument document = PDDocument.load(file.getInputStream())) {
                // 1. ESSAYER D'ABORD L'EXTRACTION DIRECTE DU TEXTE (pour PDF textes)
                PDFTextStripper stripper = new PDFTextStripper();
                String directText = stripper.getText(document);

                if (directText != null && directText.trim().length() > 50) {
                    log.info("✅ Texte extrait directement du PDF: {} caractères", directText.length());
                    log.debug("📝 Texte extrait: {}", directText);
                    return directText;
                }

                // 2. SI PAS DE TEXTE, CONVERTIR EN IMAGE (pour PDF scannés)
                log.info("📄 PDF sans texte exploitable, conversion en image haute qualité...");
                PDFRenderer pdfRenderer = new PDFRenderer(document);

                // Haute résolution pour meilleure OCR
                BufferedImage image = pdfRenderer.renderImageWithDPI(0, 600);
                image = enhanceImageQuality(image);
                image = preprocessImage(image);

                String ocrText = tesseract.doOCR(image);
                log.info("✅ Texte extrait par OCR: {} caractères", ocrText.length());
                return ocrText;
            }
        }

        // Traitement des images
        if (lowerFileName.endsWith(".jpg") || lowerFileName.endsWith(".jpeg") ||
                lowerFileName.endsWith(".png") || lowerFileName.endsWith(".bmp") ||
                lowerFileName.endsWith(".gif") || lowerFileName.endsWith(".webp")) {
            log.info("🖼️ Traitement image: {}", fileName);
            BufferedImage image = ImageIO.read(file.getInputStream());
            if (image == null) {
                return "";
            }
            image = enhanceImageQuality(image);
            image = preprocessImage(image);
            return tesseract.doOCR(image);
        }

        log.warn("⚠️ Format non supporté: {}", fileName);
        return "";
    }

    /**
     * Améliore la qualité de l'image pour l'OCR
     */
    private BufferedImage enhanceImageQuality(BufferedImage original) {
        if (original == null) return null;

        BufferedImage enhanced = new BufferedImage(
                original.getWidth(),
                original.getHeight(),
                BufferedImage.TYPE_BYTE_GRAY
        );

        for (int y = 0; y < original.getHeight(); y++) {
            for (int x = 0; x < original.getWidth(); x++) {
                int rgb = original.getRGB(x, y);
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;

                // Conversion en niveaux de gris avec luminosité
                int gray = (int)(r * 0.299 + g * 0.587 + b * 0.114);

                // Amélioration du contraste
                if (gray < 128) {
                    gray = Math.max(0, gray - 30);
                } else {
                    gray = Math.min(255, gray + 30);
                }

                int grayPixel = (gray << 16) | (gray << 8) | gray;
                enhanced.setRGB(x, y, grayPixel);
            }
        }
        return enhanced;
    }

    /**
     * Valider un document CIN
     */
    public OcrValidationResult validateCin(MultipartFile file) {
        log.info("🔍 Validation CIN (sans OCR): {}", file.getOriginalFilename());

        // Toujours accepter le document CIN
        OcrValidationResult result = new OcrValidationResult();
        result.setValid(true);
        result.setMessage("✅ Document accepté (vérification manuelle requise)");
        result.setExtractedValue(null);
        result.addDetail("need_manual_review", true);
        return result;
    }

    /**
     * Récupère le contexte autour d'une position donnée dans le texte
     * @param text le texte complet
     * @param position la position dans le texte
     * @param radius le nombre de caractères avant/après
     * @return le texte du contexte
     */
    private String getContextAround(String text, int position, int radius) {
        int start = Math.max(0, position - radius);
        int end = Math.min(text.length(), position + radius);
        return text.substring(start, end);
    }

    /**
     * Corrige l'orientation de l'image (version simple sans EXIF)
     * Basé sur la détection des dimensions
     */
    private BufferedImage correctOrientationSimple(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();

        // Une carte d'identité est généralement en portrait (plus haute que large)
        // Si l'image est plus large que haute, elle est en mode paysage, on la tourne
        if (width > height) {
            log.info("🔄 Détection: image en mode paysage ({}x{}), rotation de 90°", width, height);
            return rotateImage(image, 90);
        }

        log.info("✅ Image déjà en mode portrait ({}x{})", width, height);
        return image;
    }

    /**
     * Rotation de l'image
     */
    private BufferedImage rotateImage(BufferedImage image, int angle) {
        int width = image.getWidth();
        int height = image.getHeight();

        // Pour une rotation de 90° ou 270°, les dimensions s'inversent
        int newWidth = (angle == 90 || angle == 270) ? height : width;
        int newHeight = (angle == 90 || angle == 270) ? width : height;

        BufferedImage rotated = new BufferedImage(newWidth, newHeight, image.getType());
        Graphics2D g2d = rotated.createGraphics();

        // Centrer et pivoter
        double radians = Math.toRadians(angle);
        g2d.translate(newWidth / 2.0, newHeight / 2.0);
        g2d.rotate(radians);
        g2d.translate(-width / 2.0, -height / 2.0);
        g2d.drawImage(image, 0, 0, null);
        g2d.dispose();

        return rotated;
    }


    /**
     * Flip horizontal (miroir)
     */
    private BufferedImage flipHorizontally(BufferedImage image) {
        BufferedImage flipped = new BufferedImage(image.getWidth(), image.getHeight(), image.getType());
        Graphics2D g2d = flipped.createGraphics();
        g2d.drawImage(image, image.getWidth(), 0, -image.getWidth(), image.getHeight(), null);
        g2d.dispose();
        return flipped;
    }

    /**
     * Flip vertical
     */
    private BufferedImage flipVertically(BufferedImage image) {
        BufferedImage flipped = new BufferedImage(image.getWidth(), image.getHeight(), image.getType());
        Graphics2D g2d = flipped.createGraphics();
        g2d.drawImage(image, 0, image.getHeight(), image.getWidth(), -image.getHeight(), null);
        g2d.dispose();
        return flipped;
    }

    /**
     * Valider un document PATENTE
     */
    public OcrValidationResult validatePatente(MultipartFile file) throws IOException, TesseractException {
        log.info("🔍 Validation PATENTE par OCR: {}", file.getOriginalFilename());

        String extractedText = extractTextFromDocument(file);
        if (extractedText.isEmpty()) {
            return OcrValidationResult.error("Impossible de lire le document. Utilisez JPG, PNG ou un PDF clair");
        }

        log.debug("📝 Texte extrait pour PATENTE: {}", extractedText);
        return validatePatenteFormat(extractedText);
    }

    private OcrValidationResult validatePatenteFormat(String text) {
        OcrValidationResult result = new OcrValidationResult();
        result.setExtractedText(text);
        result.setDetails(new HashMap<>());
        result.setValid(false);

        String upperText = text.toUpperCase();

        // 1. Recherche du numéro de patente
        boolean hasPatenteNumber = Pattern.compile("\\b[0-9]{4,}\\b").matcher(upperText).find();

        // 2. Recherche de la raison sociale
        boolean hasRaisonSociale = upperText.contains("RAISON SOCIALE") ||
                upperText.contains("NOM COMMERCIAL") ||
                upperText.contains("DÉNOMINATION") ||
                upperText.matches(".*\\bRAISON\\s+SOCIALE\\b.*");

        // 3. Recherche des informations fiscales (ICE ou IF)
        boolean hasFiscalInfo = upperText.contains("IF") ||
                upperText.contains("ICE") ||
                upperText.contains("IDENTIFIANT FISCAL") ||
                upperText.contains("MATRICULE FISCAL");

        // ✅ CRITÈRE STRICT : TOUS les champs DOIVENT être présents
        boolean isValid = hasPatenteNumber && hasRaisonSociale && hasFiscalInfo;

        String validationMessage;

        if (isValid) {
            validationMessage = "✅ PATENTE valide (tous les champs requis sont présents)";
        } else {
            validationMessage = "❌ PATENTE invalide - Champs manquants :";
            if (!hasPatenteNumber) validationMessage += " numéro de patente";
            if (!hasRaisonSociale) validationMessage += " raison sociale";
            if (!hasFiscalInfo) validationMessage += " ICE/IF";
        }

        result.setValid(isValid);
        result.setMessage(validationMessage);
        result.addDetail("contient_patente", hasPatenteNumber);
        result.addDetail("contient_raison_sociale", hasRaisonSociale);
        result.addDetail("contient_infos_fiscales", hasFiscalInfo);

        return result;
    }

    /**
     * Extrait le numéro de patente du texte
     */
    private String extractPatenteNumber(String text) {
        // Pattern pour numéro de patente tunisien (ex: 1234567, 1234567/A/M/000)
        Pattern patentePattern = Pattern.compile("\\b([0-9]{4,})(?:/[A-Z]/[A-Z]/[0-9]{3})?\\b");
        Matcher matcher = patentePattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    /**
     * Valider un document RNE
     */
    public OcrValidationResult validateRne(MultipartFile file) throws IOException, TesseractException {
        log.info("🔍 Validation RNE par OCR: {}", file.getOriginalFilename());

        String extractedText = extractTextFromDocument(file);
        if (extractedText.isEmpty()) {
            return OcrValidationResult.error("Impossible de lire le document. Utilisez JPG, PNG ou un PDF clair");
        }

        log.debug("📝 Texte extrait pour RNE: {}", extractedText);
        return validateRneFormat(extractedText);
    }

    private OcrValidationResult validateRneFormat(String text) {
        OcrValidationResult result = new OcrValidationResult();
        result.setExtractedText(text);
        result.setDetails(new HashMap<>());
        result.setValid(false);

        String upperText = text.toUpperCase();

        // 1. Numéro RNE (5-10 chiffres)
        boolean hasRneNumber = Pattern.compile("\\b[0-9]{5,10}\\b").matcher(upperText).find();

        // 2. Forme juridique
        boolean hasLegalForm = upperText.contains("SARL") ||
                upperText.contains("SA") ||
                upperText.contains("SAS") ||
                upperText.contains("EI") ||
                upperText.contains("EURL");

        // 3. Date et validation (< 3 mois)
        DateValidationResult dateValidation = extractAndValidateDate(text);

        // ✅ CRITÈRE STRICT : TOUS les champs DOIVENT être présents ET date valide
        boolean isValid = hasRneNumber && hasLegalForm && dateValidation.hasDate && dateValidation.isLessThan3Months;

        String validationMessage;

        if (isValid) {
            validationMessage = String.format("✅ RNE valide - Date: %s (%d mois)",
                    dateValidation.date, dateValidation.monthsElapsed);
        } else {
            validationMessage = "❌ RNE invalide - ";
            if (!hasRneNumber) validationMessage += "numéro RNE manquant, ";
            if (!hasLegalForm) validationMessage += "forme juridique manquante, ";
            if (!dateValidation.hasDate) validationMessage += "date non trouvée, ";
            if (dateValidation.hasDate && !dateValidation.isLessThan3Months)
                validationMessage += String.format("date expirée (%d mois > 3 mois)", dateValidation.monthsElapsed);
        }

        result.setValid(isValid);
        result.setMessage(validationMessage);
        result.addDetail("numero_rne_present", hasRneNumber);
        result.addDetail("forme_juridique_detectee", hasLegalForm);
        result.addDetail("date_valide", dateValidation.isLessThan3Months);

        return result;
    }

    private DateValidationResult extractAndValidateDate(String text) {
        DateValidationResult result = new DateValidationResult();

        String[] datePatterns = {
                "\\b(\\d{2})/(\\d{2})/(\\d{4})\\b",
                "\\b(\\d{2})-(\\d{2})-(\\d{4})\\b",
                "\\b(\\d{2})\\.(\\d{2})\\.(\\d{4})\\b",
                "\\b(\\d{4})/(\\d{2})/(\\d{2})\\b",
                "\\b(\\d{4})-(\\d{2})-(\\d{2})\\b"
        };

        for (String pattern : datePatterns) {
            Pattern p = Pattern.compile(pattern);
            Matcher m = p.matcher(text);

            if (m.find()) {
                result.hasDate = true;
                result.date = m.group();

                try {
                    LocalDate extractedDate = null;

                    if (pattern.contains("\\d{4}/\\d{2}/\\d{2}")) {
                        extractedDate = LocalDate.parse(result.date, DateTimeFormatter.ofPattern("yyyy/MM/dd"));
                    } else if (pattern.contains("\\d{4}-\\d{2}-\\d{2}")) {
                        extractedDate = LocalDate.parse(result.date, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                    } else {
                        String[] parts = result.date.split("[/\\-\\.]");
                        if (parts.length == 3) {
                            int day = Integer.parseInt(parts[0]);
                            int month = Integer.parseInt(parts[1]);
                            int year = Integer.parseInt(parts[2]);
                            if (year < 100) year += 2000;
                            extractedDate = LocalDate.of(year, month, day);
                        }
                    }

                    if (extractedDate != null) {
                        LocalDate now = LocalDate.now();
                        result.monthsElapsed = ChronoUnit.MONTHS.between(extractedDate, now);
                        result.isLessThan3Months = result.monthsElapsed <= 3;
                        log.info("📅 Date extraite: {}, {} mois, valide: {}",
                                result.date, result.monthsElapsed, result.isLessThan3Months);
                    }

                } catch (Exception e) {
                    log.warn("⚠️ Impossible de parser la date: {}", result.date);
                }
                break;
            }
        }
        return result;
    }

    private String extractRneNumber(String text) {
        Pattern rnePattern = Pattern.compile("\\b[0-9]{5,10}\\b");
        Matcher matcher = rnePattern.matcher(text);
        if (matcher.find()) {
            return matcher.group();
        }
        return null;
    }

    private static class DateValidationResult {
        boolean hasDate = false;
        String date = null;
        boolean isLessThan3Months = false;
        long monthsElapsed = 0;
    }

    public BufferedImage preprocessImage(BufferedImage original) {
        if (original == null) return null;

        // 1. Convertir en niveaux de gris
        BufferedImage grayImage = new BufferedImage(
                original.getWidth(),
                original.getHeight(),
                BufferedImage.TYPE_BYTE_GRAY
        );

        Graphics2D g = grayImage.createGraphics();
        g.drawImage(original, 0, 0, null);
        g.dispose();

        // 2. Amélioration du contraste (égalisation d'histogramme)
        BufferedImage enhanced = enhanceContrast(grayImage);

        // 3. Binarisation adaptative (convertir en noir et blanc pur)
        BufferedImage binaryImage = binarizeImage(enhanced);

        return binaryImage;
    }

    /**
     * Améliore le contraste de l'image
     */
    private BufferedImage enhanceContrast(BufferedImage image) {
        BufferedImage result = new BufferedImage(
                image.getWidth(),
                image.getHeight(),
                BufferedImage.TYPE_BYTE_GRAY
        );

        // Trouver les valeurs min et max
        int min = 255;
        int max = 0;
        for (int y = 0; y < image.getHeight(); y++) {
            for (int x = 0; x < image.getWidth(); x++) {
                int rgb = image.getRGB(x, y);
                int gray = rgb & 0xFF;
                if (gray < min) min = gray;
                if (gray > max) max = gray;
            }
        }

        // Étirer le contraste
        for (int y = 0; y < image.getHeight(); y++) {
            for (int x = 0; x < image.getWidth(); x++) {
                int rgb = image.getRGB(x, y);
                int gray = rgb & 0xFF;
                int newGray = (gray - min) * 255 / (max - min);
                newGray = Math.min(255, Math.max(0, newGray));
                int newRgb = (newGray << 16) | (newGray << 8) | newGray;
                result.setRGB(x, y, newRgb);
            }
        }

        return result;
    }

    /**
     * Convertit l'image en noir et blanc avec seuillage adaptatif
     */
    private BufferedImage binarizeImage(BufferedImage image) {
        BufferedImage result = new BufferedImage(
                image.getWidth(),
                image.getHeight(),
                BufferedImage.TYPE_BYTE_BINARY
        );

        Graphics2D g = result.createGraphics();
        g.drawImage(image, 0, 0, null);
        g.dispose();

        return result;
    }
}