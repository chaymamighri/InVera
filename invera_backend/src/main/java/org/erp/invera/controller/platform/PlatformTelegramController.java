package org.erp.invera.controller.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.telegram.TelegramLinkResponseDTO;
import org.erp.invera.security.JwtTokenProvider;
import org.erp.invera.service.telegram.TelegramLinkService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/platform")
@RequiredArgsConstructor
public class PlatformTelegramController {

    private final TelegramLinkService telegramLinkService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping("/telegram-link")
    public ResponseEntity<TelegramLinkResponseDTO> getTelegramLink(
            @RequestHeader("Authorization") String token) {
        Long clientId = extractClientId(token);
        return ResponseEntity.ok(telegramLinkService.buildTelegramLink(clientId));
    }

    private Long extractClientId(String token) {
        try {
            return jwtTokenProvider.getClientIdFromToken(token.replace("Bearer ", ""));
        } catch (Exception e) {
            log.error("Unable to extract client id from token: {}", e.getMessage(), e);
            throw new RuntimeException("Invalid authorization token");
        }
    }
}
