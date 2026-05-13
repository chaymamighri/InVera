package org.erp.invera.service.telegram;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.telegram.TelegramUpdateRequest;
import org.erp.invera.model.platform.Client;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class BotService {

    private final ClientPlatformRepository clientPlatformRepository;
    private final TelegramLinkService telegramLinkService;
    private final TelegramErpAssistantService telegramErpAssistantService;
    private final TelegramMessageSenderService telegramMessageSenderService;

    public void processUpdate(TelegramUpdateRequest update) {
        if (update == null || update.getMessage() == null || update.getMessage().getChat() == null) {
            log.debug("Telegram update ignored because message or chat is missing");
            return;
        }

        Long chatId = update.getMessage().getChat().getId();
        String text = update.getMessage().getText() != null ? update.getMessage().getText().trim() : "";

        try {
            if (text.startsWith("/start")) {
                handleStartCommand(chatId, text);
                return;
            }

            Client client = clientPlatformRepository.findByTelegramChatId(chatId).orElse(null);
            if (client == null) {
                telegramMessageSenderService.sendMessage(
                        chatId,
                        "This Telegram chat is not linked yet. Please open the Telegram bot from your platform first."
                );
                return;
            }

            String answer = telegramErpAssistantService.answer(client, text);
            telegramMessageSenderService.sendMessage(chatId, answer);
        } catch (Exception e) {
            log.error("Telegram processing error for chat {}: {}", chatId, e.getMessage(), e);
            telegramMessageSenderService.sendMessage(chatId, "An error occurred while processing your request.");
        }
    }

    private void handleStartCommand(Long chatId, String text) {
        String[] parts = text.split("\\s+", 2);

        if (parts.length < 2 || parts[1].isBlank()) {
            telegramMessageSenderService.sendMessage(
                    chatId,
                    "Open the Telegram bot from your platform to connect your account automatically."
            );
            return;
        }

        Client client = telegramLinkService.linkChatToClient(parts[1].trim(), chatId);
        telegramMessageSenderService.sendMessage(
                chatId,
                "✅ Your account is now connected. You can start asking anything."
        );
        log.info("Telegram account linked for client {}", client.getId());
    }
}
