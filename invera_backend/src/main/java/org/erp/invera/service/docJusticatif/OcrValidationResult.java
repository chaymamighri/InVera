package org.erp.invera.service.docJusticatif;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OcrValidationResult {
    private boolean valid;
    private String message;
    private String extractedText;
    private String extractedValue;
    private Map<String, Object> details;

    public static OcrValidationResult error(String message) {
        OcrValidationResult result = new OcrValidationResult();
        result.setValid(false);
        result.setMessage(message);
        result.setDetails(new HashMap<>());
        return result;
    }

    public void addDetail(String key, Object value) {
        if (this.details == null) {
            this.details = new HashMap<>();
        }
        this.details.put(key, value);
    }
}