package org.erp.invera.service.telegram;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
public class TelegramMessageSenderService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${telegram.bot.token:}")
    private String botToken;

    public void sendMessage(Long chatId, String text) {
        if (botToken == null || botToken.isBlank()) {
            log.warn("Telegram bot token is not configured. Message not sent to chat {}", chatId);
            return;
        }

        String url = "https://api.telegram.org/bot" + botToken + "/sendMessage";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "chat_id", chatId,
                "text", text
        );

        restTemplate.postForEntity(url, new HttpEntity<>(body, headers), String.class);
    }
}
