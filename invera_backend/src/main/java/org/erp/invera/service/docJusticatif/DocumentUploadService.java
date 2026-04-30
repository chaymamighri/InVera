package org.erp.invera.service.docJusticatif;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Client;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentUploadService {


    private final ClientPlatformRepository clientRepository;

    /**
     * Upload d'un justificatif (SANS chiffrement)
     */
    @Transactional
    public String uploadJustificatif(Long clientId, MultipartFile file, DocumentType type) throws Exception {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));

        // 1. Créer le dossier pour le client
        String uploadDir = "uploads/clients/" + clientId + "/";
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // 2. Générer un nom de fichier unique avec extension
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        } else {
            extension = ".pdf";
        }

        String fileName = type.name().toLowerCase() + "_" + System.currentTimeMillis() + extension;
        Path filePath = uploadPath.resolve(fileName);

        // 3. Sauvegarder directement le fichier (SANS chiffrement)
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // 4. Stocker le chemin relatif dans la base de données
        String relativePath = "/" + uploadDir + fileName;
        updateClientDocumentUrl(client, type, relativePath);

        log.info("✅ Document {} sauvegardé (non chiffré) pour {} : {}", type, client.getEmail(), relativePath);
        return relativePath;
    }

    private void updateClientDocumentUrl(Client client, DocumentType type, String filePath) {
        switch (type) {
            case CIN -> client.setCinUrl(filePath);
            case GERANT_CIN -> client.setGerantCinUrl(filePath);
            case PATENTE -> client.setPatenteUrl(filePath);
            case RNE -> client.setRneUrl(filePath);
        }
        clientRepository.save(client);
    }

    /**
     * Récupérer un document (lecture directe, SANS déchiffrement)
     */
    public byte[] getDocument(String filePath) throws Exception {
        // Essayer plusieurs chemins possibles
        Path path = Paths.get(filePath);
        if (!Files.exists(path)) {
            path = Paths.get(System.getProperty("user.dir"), filePath);
        }
        if (!Files.exists(path)) {
            // Enlever le slash au début si nécessaire
            String cleanPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
            path = Paths.get(System.getProperty("user.dir"), cleanPath);
        }
        if (!Files.exists(path)) {
            throw new RuntimeException("Fichier non trouvé: " + filePath);
        }

        log.info("📄 Lecture du document: {}", path);
        return Files.readAllBytes(path);
    }

    public enum DocumentType {
        CIN, GERANT_CIN, PATENTE, RNE
    }
}