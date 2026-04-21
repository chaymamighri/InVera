package org.erp.invera.service.docJusticatif;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Client;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentUploadService {

    private final DocumentEncryptionService encryptionService;
    private final ClientPlatformRepository clientRepository;

    /**
     * Upload et chiffrement d'un justificatif
     */
    @Transactional
    public String uploadJustificatif(Long clientId, MultipartFile file, DocumentType type) throws Exception {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));

        // 1. Sauvegarde temporaire
        String tempDir = System.getProperty("java.io.tmpdir");
        Path tempFile = Files.createTempFile(Path.of(tempDir), "upload_", ".tmp");
        file.transferTo(tempFile.toFile());

        // 2. Chiffrer le document
        String encryptedPath = encryptionService.encryptAndSave(
                tempFile.toFile(),
                clientId,
                type.name().toLowerCase()
        );

        // 3. Nettoyer le fichier temporaire
        Files.deleteIfExists(tempFile);

        // 4. Mettre à jour l'URL dans l'entité Client
        updateClientDocumentUrl(client, type, encryptedPath);

        log.info("✅ Justificatif {} uploadé et chiffré pour {}", type, client.getEmail());
        return encryptedPath;
    }

    private void updateClientDocumentUrl(Client client, DocumentType type, String encryptedPath) {
        switch (type) {
            case CIN -> client.setCinUrl(encryptedPath);
            case GERANT_CIN -> client.setGerantCinUrl(encryptedPath);
            case PATENTE -> client.setPatenteUrl(encryptedPath);
            case RNE -> {
                client.setRneUrl(encryptedPath);
            }
        }
        clientRepository.save(client);
    }

    public enum DocumentType {
        CIN, GERANT_CIN, PATENTE, RNE
    }
}
