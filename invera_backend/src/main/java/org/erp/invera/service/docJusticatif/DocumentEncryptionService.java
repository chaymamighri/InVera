package org.erp.invera.service.docJusticatif;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Key;
import java.util.Base64;

@Slf4j
@Service
public class DocumentEncryptionService {

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";

    @Value("${encryption.key:}") // Clé depuis application.properties ou variable d'environnement
    private String encryptionKey;

    /**
     * Chiffre un fichier uploadé et sauvegarde la version chiffrée
     * @param uploadedFile Fichier temporaire uploadé
     * @param clientId ID du client
     * @param documentType Type (cin, patente, rne)
     * @return URL relative du fichier chiffré
     */
    public String encryptAndSave(File uploadedFile, Long clientId, String documentType) throws Exception {
        // 1. Générer un dossier sécurisé par client
        String encryptedDir = "/secure-data/clients/" + clientId + "/encrypted/";
        Files.createDirectories(Paths.get(encryptedDir));

        // 2. Nom du fichier chiffré
        String encryptedFileName = documentType + "_" + System.currentTimeMillis() + ".enc";
        String encryptedFilePath = encryptedDir + encryptedFileName;

        // 3. Chiffrer le fichier
        SecretKey key = getSecretKey();
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.ENCRYPT_MODE, key);

        try (FileInputStream fis = new FileInputStream(uploadedFile);
             FileOutputStream fos = new FileOutputStream(encryptedFilePath)) {

            byte[] fileBytes = fis.readAllBytes();
            byte[] encryptedBytes = cipher.doFinal(fileBytes);
            fos.write(encryptedBytes);
        }

        log.info("🔐 Document chiffré : {} pour client {}", documentType, clientId);
        return encryptedFilePath;
    }

    /**
     * Déchiffre un fichier (pour visualisation/admin)
     */
    public byte[] decryptDocument(String encryptedFilePath) throws Exception {
        SecretKey key = getSecretKey();
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.DECRYPT_MODE, key);

        byte[] encryptedBytes = Files.readAllBytes(Paths.get(encryptedFilePath));
        return cipher.doFinal(encryptedBytes);
    }

    private SecretKey getSecretKey() {
        if (encryptionKey == null || encryptionKey.isEmpty()) {
            // En développement : générer une clé temporaire
            // En production : utiliser une clé stockée dans un vault (AWS KMS, HashiCorp)
            log.warn("⚠️ Aucune clé de chiffrement configurée ! Utilisation d'une clé par défaut (non sécurisé)");
            return new SecretKeySpec("0123456789abcdef".getBytes(), ALGORITHM);
        }
        byte[] decodedKey = Base64.getDecoder().decode(encryptionKey);
        return new SecretKeySpec(decodedKey, ALGORITHM);
    }
}