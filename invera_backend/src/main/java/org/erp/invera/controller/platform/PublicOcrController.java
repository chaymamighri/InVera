package org.erp.invera.controller.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.service.docJusticatif.OcrValidationResult;
import org.erp.invera.service.docJusticatif.OcrValidationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/api/public/ocr")
@RequiredArgsConstructor
public class PublicOcrController {

    private final OcrValidationService ocrValidationService;

    /**
     * Valider un CIN par OCR (public - pas besoin de token)
     */
    @PostMapping("/validate-cin")
    public ResponseEntity<OcrValidationResult> validateCin(@RequestParam("file") MultipartFile file) {
        try {
            log.info("🌐 [PUBLIC] Validation CIN par OCR: {}", file.getOriginalFilename());
            OcrValidationResult result = ocrValidationService.validateCin(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur validation CIN: {}", e.getMessage());
            return ResponseEntity.badRequest().body(OcrValidationResult.error(e.getMessage()));
        }
    }

    /**
     * Valider une PATENTE par OCR (public - pas besoin de token)
     */
    @PostMapping("/validate-patente")
    public ResponseEntity<OcrValidationResult> validatePatente(@RequestParam("file") MultipartFile file) {
        try {
            log.info("🌐 [PUBLIC] Validation PATENTE par OCR: {}", file.getOriginalFilename());
            OcrValidationResult result = ocrValidationService.validatePatente(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur validation PATENTE: {}", e.getMessage());
            return ResponseEntity.badRequest().body(OcrValidationResult.error(e.getMessage()));
        }
    }

    /**
     * Valider un RNE par OCR (public - pas besoin de token)
     */
    @PostMapping("/validate-rne")
    public ResponseEntity<OcrValidationResult> validateRne(@RequestParam("file") MultipartFile file) {
        try {
            log.info("🌐 [PUBLIC] Validation RNE par OCR: {}", file.getOriginalFilename());
            OcrValidationResult result = ocrValidationService.validateRne(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur validation RNE: {}", e.getMessage());
            return ResponseEntity.badRequest().body(OcrValidationResult.error(e.getMessage()));
        }
    }
}