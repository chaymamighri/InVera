package org.erp.invera.dto.platform;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ValidationResult {
    private boolean success;
    private String message;

    public static ValidationResult success() {
        return new ValidationResult(true, "Compte validé avec succès");
    }

    public static ValidationResult fail(String message) {
        return new ValidationResult(false, message);
    }
}