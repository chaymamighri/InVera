package org.erp.invera.controller.telegram;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.telegram.TelegramUpdateRequest;
import org.erp.invera.service.telegram.BotService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/telegram")
@RequiredArgsConstructor
public class TelegramWebhookController {

    private final BotService botService;

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> receiveUpdate(
            @RequestBody TelegramUpdateRequest update) {

        System.out.println("========== TELEGRAM UPDATE RECEIVED ==========");
        System.out.println(update);
        System.out.println("==============================================");

        log.info("Telegram update received: {}", update);

        botService.processUpdate(update);

        return ResponseEntity.ok(Map.of("ok", true));
    }
}