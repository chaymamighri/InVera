package org.erp.invera.dto.platform.preferencesdto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LanguagePreferenceResponse {
    private String language;
    private List<String> supportedLanguages;
    private String message;
}
