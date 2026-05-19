package org.erp.invera.dto.erp.chatbot;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class ChatbotResponseDTO {
    private String answer;
    private String intent;
    private String period;
    private Map<String, Object> data;
    private List<String> suggestions;
}
