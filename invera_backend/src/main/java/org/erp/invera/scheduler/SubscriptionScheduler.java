package org.erp.invera.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.service.payment.SubscriptionService;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class SubscriptionScheduler {

    private final SubscriptionService subscriptionService;

    /**
     * Vérification quotidienne des abonnements expirés
     * Exécuté tous les jours à 01:00
     */
    @Scheduled(cron = "0 0 1 * * *")
    public void checkExpiredSubscriptions() {
        log.info("🔍 Vérification des abonnements expirés...");
        subscriptionService.checkAndRenewSubscriptions();
    }
}