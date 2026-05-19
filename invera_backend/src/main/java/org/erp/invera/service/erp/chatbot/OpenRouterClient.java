package org.erp.invera.service.erp.chatbot;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.erp.chatbot.ChatbotRequestDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OpenRouterClient {

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${openrouter.api.url:https://openrouter.ai/api/v1/chat/completions}")
    private String apiUrl;

    @Value("${openrouter.api.key:}")
    private String apiKey;

    @Value("${openrouter.model:openai/gpt-4o-mini}")
    private String model;

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public Decision decide(String systemPrompt, ChatbotRequestDTO request) throws Exception {
        Map<String, Object> json = callJson(systemPrompt, request.getMessage(), decisionSchema(), 0.1, 900);
        return new Decision(
                text(json.get("mode"), "unsupported"),
                text(json.get("language"), request.getLanguage() == null ? "mixed" : request.getLanguage()),
                Boolean.TRUE.equals(json.get("needs_database")),
                nullableText(json.get("sql")),
                text(json.get("explanation"), "")
        );
    }

    public Decision repair(String systemPrompt, String repairPrompt) throws Exception {
        Map<String, Object> json = callJson(systemPrompt, repairPrompt, decisionSchema(), 0.0, 900);
        return new Decision(
                text(json.get("mode"), "unsupported"),
                text(json.get("language"), "mixed"),
                Boolean.TRUE.equals(json.get("needs_database")),
                nullableText(json.get("sql")),
                text(json.get("explanation"), "")
        );
    }

    public String answer(String systemPrompt, String userPrompt) throws Exception {
        Map<String, Object> json = callJson(systemPrompt, userPrompt, answerSchema(), 0.25, 1200);
        return text(json.get("answer"), "Je n'ai pas pu formuler une reponse claire.");
    }

    private Map<String, Object> callJson(String systemPrompt, String userPrompt, Map<String, Object> responseSchema, double temperature, int maxTokens) throws Exception {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", model);
        payload.put("temperature", temperature);
        payload.put("max_tokens", maxTokens);
        payload.put("response_format", responseSchema);
        payload.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt == null ? "" : userPrompt)
        ));

        ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, new HttpEntity<>(payload, headers()), Map.class);
        String content = extractContent(response.getBody());
        return objectMapper.readValue(cleanJson(content), new TypeReference<>() {
        });
    }

    private HttpHeaders headers() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey.trim());
        headers.set("HTTP-Referer", "http://localhost:5173");
        headers.set("X-Title", "InVera ERP");
        return headers;
    }

    private String extractContent(Map<?, ?> body) {
        if (body == null) {
            throw new RestClientException("OpenRouter returned empty body");
        }
        Object choices = body.get("choices");
        if (!(choices instanceof List<?> list) || list.isEmpty() || !(list.get(0) instanceof Map<?, ?> choice)) {
            throw new RestClientException("OpenRouter returned no choices");
        }
        Object message = choice.get("message");
        if (!(message instanceof Map<?, ?> messageMap) || !(messageMap.get("content") instanceof String content) || content.isBlank()) {
            throw new RestClientException("OpenRouter returned empty content");
        }
        return content;
    }

    private String cleanJson(String content) {
        String cleaned = content.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("^```(?:json)?\\s*", "");
            cleaned = cleaned.replaceFirst("\\s*```$", "");
        }
        return cleaned.trim();
    }

    private Map<String, Object> decisionSchema() {
        return Map.of(
                "type", "json_schema",
                "json_schema", Map.of(
                        "name", "invera_chat_decision",
                        "strict", true,
                        "schema", Map.of(
                                "type", "object",
                                "additionalProperties", false,
                                "properties", Map.of(
                                        "mode", Map.of("type", "string", "enum", List.of("small_talk", "database_query", "unsupported")),
                                        "language", Map.of("type", "string", "enum", List.of("fr", "en", "ar", "tn_arabizi", "mixed")),
                                        "needs_database", Map.of("type", "boolean"),
                                        "sql", Map.of("type", List.of("string", "null")),
                                        "explanation", Map.of("type", "string")
                                ),
                                "required", List.of("mode", "language", "needs_database", "sql", "explanation")
                        )
                )
        );
    }

    private Map<String, Object> answerSchema() {
        return Map.of(
                "type", "json_schema",
                "json_schema", Map.of(
                        "name", "invera_chat_answer",
                        "strict", true,
                        "schema", Map.of(
                                "type", "object",
                                "additionalProperties", false,
                                "properties", Map.of("answer", Map.of("type", "string")),
                                "required", List.of("answer")
                        )
                )
        );
    }

    private String text(Object value, String fallback) {
        return value instanceof String text && !text.isBlank() ? text : fallback;
    }

    private String nullableText(Object value) {
        return value instanceof String text && !text.isBlank() ? text : null;
    }

    public record Decision(String mode, String language, boolean needsDatabase, String sql, String explanation) {
    }
}
