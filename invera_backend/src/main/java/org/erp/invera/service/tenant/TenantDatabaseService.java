package org.erp.invera.service.tenant;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Client;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.erp.invera.service.platform.CredentialService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantDatabaseService {

    private final ClientPlatformRepository clientRepository;
    private final CredentialService credentialService;  // ← Injecter CredentialService

    // Cache des connexions par client
    private final ConcurrentHashMap<Long, JdbcTemplate> clientJdbcTemplateCache = new ConcurrentHashMap<>();

    /**
     * Récupère la connexion à la base du client
     */
    public JdbcTemplate getClientJdbcTemplate(Long clientId, String authenticatedClientId) {
        // ✅ Vérification : l'utilisateur ne peut accéder qu'à SA propre base
        if (!clientId.equals(Long.parseLong(authenticatedClientId))) {
            throw new SecurityException("Accès non autorisé à la base d'un autre client");
        }

        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));

        return clientJdbcTemplateCache.computeIfAbsent(clientId, id -> {
            // ✅ Récupérer les credentials stockés pour ce client
            CredentialService.Credentials creds = credentialService.getCredentials(clientId);

            String url = String.format("jdbc:postgresql://localhost:5432/%s", client.getNomBaseDonnees());
            SingleConnectionDataSource dataSource = new SingleConnectionDataSource(
                    url,
                    creds.username(),   // ← user_c123
                    creds.password(),   // ← mot de passe stocké
                    false
            );
            return new JdbcTemplate(dataSource);
        });
    }

    /**
     * Invalide le cache pour un client
     */
    public void invalidateCache(Long clientId) {
        clientJdbcTemplateCache.remove(clientId);
        log.info("Cache invalidé pour client {}", clientId);
    }
}