package org.erp.invera.service.docJusticatif;


import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class DocumentUploadResponse {
    private boolean valid;
    private String message;
    private String filePath;
    private String extractedData;
    private Map<String, Object> details;
}