package org.erp.invera.service.erp.chatbot;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.erp.chatbot.ChatbotRequestDTO;
import org.erp.invera.dto.erp.chatbot.ChatbotResponseDTO;
import org.erp.invera.security.JwtTokenProvider;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminClientChatbotService {

    private static final ZoneId APP_ZONE = ZoneId.of("Africa/Tunis");
    private static final List<String> SUGGESTIONS = List.of(
            "9adeh min demande d'approvisionnement lyoum ?",
            "Chkoun akther client y3addi commandes ?",
            "Afficher les produits critiques",
            "Combien de commandes ventes aujourd'hui ?"
    );

    private final JwtTokenProvider jwtTokenProvider;
    private final ChatSchema chatSchema;
    private final ChatPrompts prompts;
    private final OpenRouterClient openRouter;
    private final SqlGuard sqlGuard;
    private final QueryRunner queryRunner;

    public ChatbotResponseDTO answer(ChatbotRequestDTO request, String authorizationHeader) {
        String token = cleanToken(authorizationHeader);
        Long clientId = jwtTokenProvider.getClientIdFromToken(token);
        String role = jwtTokenProvider.getRoleFromToken(token);

        if (clientId == null || !isAdminClient(role)) {
            throw new AccessDeniedException("Chatbot is reserved for ADMIN_CLIENT.");
        }

        String message = request == null ? null : request.getMessage();
        if (message == null || message.isBlank()) {
            return response("SMALL_TALK", "Posez-moi une question sur vos donnees InVera.", 0);
        }

        if (!openRouter.isConfigured()) {
            return response("UNSUPPORTED", "OpenRouter n'est pas configure. Ajoutez OPENROUTER_API_KEY dans le backend .env.", 0);
        }

        ZonedDateTime now = ZonedDateTime.now(APP_ZONE);
        try {
            ChatSchema.Snapshot schema = chatSchema.forTenant(clientId);
            String decisionPrompt = prompts.decide(schema, now);
            OpenRouterClient.Decision decision = openRouter.decide(decisionPrompt, request);

            return switch (decision.mode()) {
                case "small_talk" -> answerSmallTalk(request, now);
                case "database_query" -> answerDatabaseQuestion(clientId, request, schema, decisionPrompt, decision, now);
                default -> response("UNSUPPORTED", unsupportedMessage(decision.language()), 0);
            };
        } catch (Exception ex) {
            log.warn("Admin client chatbot failed: {}", ex.getMessage(), ex);
            return response("UNSUPPORTED", "Je n'ai pas pu traiter cette question correctement. Reformulez-la plus precisement.", 0);
        }
    }

    private ChatbotResponseDTO answerSmallTalk(ChatbotRequestDTO request, ZonedDateTime now) throws Exception {
        String answer = openRouter.answer(
                prompts.smallTalk(now),
                "User message: " + request.getMessage()
        );
        return response("SMALL_TALK", answer, 0);
    }

    private ChatbotResponseDTO answerDatabaseQuestion(
            Long clientId,
            ChatbotRequestDTO request,
            ChatSchema.Snapshot schema,
            String decisionPrompt,
            OpenRouterClient.Decision decision,
            ZonedDateTime now) throws Exception {

        String safeSql = validateOrRepair(request, schema, decisionPrompt, decision);
        List<Map<String, Object>> rows;
        try {
            rows = queryRunner.run(clientId, safeSql);
        } catch (Exception executionError) {
            OpenRouterClient.Decision repaired = openRouter.repair(
                    decisionPrompt,
                    prompts.repair(request.getMessage(), schema, safeSql, "Database execution error: " + executionError.getMessage())
            );
            if (repaired.sql() == null || repaired.sql().isBlank()) {
                throw executionError;
            }
            safeSql = sqlGuard.validateAndNormalize(repaired.sql(), schema);
            rows = queryRunner.run(clientId, safeSql);
        }

        String answer = openRouter.answer(
                prompts.answer(now),
                """
                        Original question: %s
                        Language hint: %s
                        Row count: %s
                        Database rows: %s
                        """.formatted(request.getMessage(), decision.language(), rows.size(), rows)
        );

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("rowCount", rows.size());

        return ChatbotResponseDTO.builder()
                .answer(answer)
                .intent("DATABASE_QUERY")
                .period(null)
                .data(data)
                .suggestions(SUGGESTIONS)
                .build();
    }

    private String validateOrRepair(
            ChatbotRequestDTO request,
            ChatSchema.Snapshot schema,
            String decisionPrompt,
            OpenRouterClient.Decision decision) throws Exception {

        if (decision.sql() == null || decision.sql().isBlank()) {
            throw new IllegalArgumentException("The model did not provide SQL.");
        }

        try {
            return sqlGuard.validateAndNormalize(decision.sql(), schema);
        } catch (IllegalArgumentException firstError) {
            OpenRouterClient.Decision repaired = openRouter.repair(
                    decisionPrompt,
                    prompts.repair(request.getMessage(), schema, decision.sql(), firstError.getMessage())
            );
            if (repaired.sql() == null || repaired.sql().isBlank()) {
                throw firstError;
            }
            return sqlGuard.validateAndNormalize(repaired.sql(), schema);
        }
    }

    private ChatbotResponseDTO response(String intent, String answer, int rowCount) {
        return ChatbotResponseDTO.builder()
                .answer(answer)
                .intent(intent)
                .period(null)
                .data(Map.of("rowCount", rowCount))
                .suggestions(SUGGESTIONS)
                .build();
    }

    private String unsupportedMessage(String language) {
        return switch (language == null ? "" : language.toLowerCase(Locale.ROOT)) {
            case "en" -> "I can only read and explain your InVera ERP data.";
            case "ar" -> "يمكنني فقط قراءة وشرح بيانات InVera ERP الخاصة بك.";
            case "tn_arabizi" -> "Najjem naqra w nfassarlek data ERP mte3ek bark.";
            default -> "Je peux seulement lire et expliquer vos donnees InVera ERP.";
        };
    }

    private String cleanToken(String authorizationHeader) {
        if (authorizationHeader == null) {
            return "";
        }
        return authorizationHeader.replace("Bearer ", "").trim();
    }

    private boolean isAdminClient(String role) {
        if (role == null || role.isBlank()) {
            return false;
        }
        String normalized = role.trim().toUpperCase(Locale.ROOT);
        if (normalized.startsWith("ROLE_")) {
            normalized = normalized.substring(5);
        }
        return "ADMIN_CLIENT".equals(normalized);
    }
}
