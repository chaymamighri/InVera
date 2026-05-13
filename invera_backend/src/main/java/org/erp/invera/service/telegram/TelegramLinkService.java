package org.erp.invera.service.telegram;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.telegram.TelegramLinkResponseDTO;
import org.erp.invera.model.platform.Client;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.erp.invera.service.platform.ClientPlatformService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramLinkService {

    private final ClientPlatformRepository clientPlatformRepository;
    private final ClientPlatformService clientPlatformService;

    @Value("${telegram.bot.username:}")
    private String botUsername;

    @Transactional
    public TelegramLinkResponseDTO buildTelegramLink(Long clientId) {
        Client client = clientPlatformService.getClientById(clientId);

        if (botUsername == null || botUsername.isBlank()) {
            throw new RuntimeException("Telegram bot username is not configured");
        }

        if (client.getTelegramChatId() != null) {
            return new TelegramLinkResponseDTO(
                    true,
                    client.getId(),
                    client.getTelegramChatId(),
                    "https://t.me/" + botUsername
            );
        }

        if (client.getTelegramLinkToken() == null || client.getTelegramLinkToken().isBlank()) {
            client = clientPlatformService.refreshTelegramLinkToken(clientId);
        }

        return new TelegramLinkResponseDTO(
                false,
                client.getId(),
                null,
                "https://t.me/" + botUsername + "?start=" + client.getTelegramLinkToken()
        );
    }

    @Transactional
    public Client linkChatToClient(String token, Long chatId) {
        if (token == null || token.isBlank()) {
            throw new RuntimeException("Telegram link token is missing");
        }

        Client client = clientPlatformRepository.findByTelegramLinkToken(token)
                .orElseThrow(() -> new RuntimeException("Telegram link token is invalid or already used"));

        if (client.getTelegramChatId() != null) {
            throw new RuntimeException("This client is already linked to Telegram");
        }

        clientPlatformRepository.findByTelegramChatId(chatId)
                .filter(existing -> !existing.getId().equals(client.getId()))
                .ifPresent(existing -> {
                    throw new RuntimeException("This Telegram chat is already linked to another client");
                });

        client.setTelegramChatId(chatId);
        client.setTelegramLinkToken(null);

        Client savedClient = clientPlatformRepository.save(client);
        log.info("Telegram chat {} linked to client {}", chatId, savedClient.getId());
        return savedClient;
    }
}
