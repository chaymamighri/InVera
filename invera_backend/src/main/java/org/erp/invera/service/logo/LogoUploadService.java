package org.erp.invera.service.logo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.model.platform.Client;
import org.erp.invera.repository.platform.ClientPlatformRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Slf4j
@Service
@RequiredArgsConstructor
public class LogoUploadService {

    private final ClientPlatformRepository clientRepository;

    @Value("${logo.upload.directory:uploads/logos}")
    private String uploadDirectory;

    /**
     * Uploader le logo d'un client
     */
    @Transactional
    public String uploadLogo(Long clientId, MultipartFile file) throws IOException {
        // 1. Vérifier le client
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client non trouvé: " + clientId));

        // 2. Vérifier le type de fichier
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") &&
                !contentType.equals("image/jpg") && !contentType.equals("image/png"))) {
            throw new RuntimeException("Format non supporté. Utilisez JPEG ou PNG");
        }

        // 3. Créer le dossier pour le client
        String clientDir = uploadDirectory + "/client_" + clientId;
        Path uploadPath = Paths.get(clientDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // 4. Supprimer l'ancien logo s'il existe
        if (client.getLogoUrl() != null) {
            deleteOldLogo(client.getLogoUrl());
        }

        // 5. Générer le nom du fichier
        String extension = getFileExtension(file.getOriginalFilename());
        String fileName = "logo_" + System.currentTimeMillis() + extension;
        Path filePath = uploadPath.resolve(fileName);

        // 6. Sauvegarder le nouveau logo
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // 7. Stocker le chemin dans la base
        String relativePath = clientDir + "/" + fileName;
        client.setLogoUrl(relativePath);
        clientRepository.save(client);

        log.info("✅ Logo uploadé pour le client {}: {}", client.getEmail(), relativePath);

        return relativePath;
    }

    /**
     * Récupérer le logo d'un client
     */
    public byte[] getLogo(Long clientId) throws IOException {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client non trouvé: " + clientId));

        if (client.getLogoUrl() == null) {
            throw new RuntimeException("Aucun logo trouvé pour ce client");
        }

        Path logoPath = Paths.get(client.getLogoUrl());

        // Si le chemin relatif ne fonctionne pas, essayer depuis le répertoire courant
        if (!Files.exists(logoPath)) {
            logoPath = Paths.get(System.getProperty("user.dir"), client.getLogoUrl());
        }

        if (!Files.exists(logoPath)) {
            throw new RuntimeException("Fichier logo non trouvé: " + client.getLogoUrl());
        }

        log.info("📄 Lecture du logo: {}", logoPath);
        return Files.readAllBytes(logoPath);
    }

    /**
     * Supprimer le logo d'un client
     */
    @Transactional
    public void deleteLogo(Long clientId) throws IOException {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client non trouvé: " + clientId));

        if (client.getLogoUrl() != null) {
            deleteOldLogo(client.getLogoUrl());
            client.setLogoUrl(null);
            clientRepository.save(client);
            log.info("🗑️ Logo supprimé pour le client: {}", client.getEmail());
        }
    }

    /**
     * Mettre à jour le logo (supprime l'ancien et upload le nouveau)
     */
    @Transactional
    public String updateLogo(Long clientId, MultipartFile file) throws IOException {
        // Supprimer l'ancien
        deleteLogo(clientId);
        // Uploader le nouveau
        return uploadLogo(clientId, file);
    }

    /**
     * Vérifier si un client a un logo
     */
    public boolean hasLogo(Long clientId) {
        Client client = clientRepository.findById(clientId).orElse(null);
        return client != null && client.getLogoUrl() != null;
    }

    // ========== MÉTHODES PRIVÉES ==========

    private void deleteOldLogo(String logoUrl) throws IOException {
        if (logoUrl != null) {
            Path oldPath = Paths.get(logoUrl);
            if (!Files.exists(oldPath)) {
                oldPath = Paths.get(System.getProperty("user.dir"), logoUrl);
            }
            if (Files.exists(oldPath)) {
                Files.delete(oldPath);
                log.info("Ancien logo supprimé: {}", logoUrl);
            }
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null) return ".jpg";
        int lastDot = filename.lastIndexOf('.');
        if (lastDot > 0) {
            return filename.substring(lastDot);
        }
        return ".jpg";
    }
}