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
    public void createClientDatabaseWithAdmin(Long clientId, String plainPassword) {
        try {
            databaseCreationService.createClientDatabaseWithAdmin(clientId, plainPassword);
            log.info("✅ Base créée asynchrone avec admin pour client {}", clientId);
        } catch (Exception e) {
            log.error("❌ Erreur création base asynchrone: {}", e.getMessage());
        }
    }
}