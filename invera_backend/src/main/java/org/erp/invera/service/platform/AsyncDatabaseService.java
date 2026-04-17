package org.erp.invera.service.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AsyncDatabaseService {

    private final DatabaseCreationService databaseCreationService;

    @Async
    public void createClientDatabaseAsync(Long clientId) {
        try {
            databaseCreationService.createClientDatabase(clientId);
            log.info("✅ Base créée asynchrone pour client {}", clientId);
        } catch (Exception e) {
            log.error("❌ Erreur création base asynchrone: {}", e.getMessage());
        }
    }
}