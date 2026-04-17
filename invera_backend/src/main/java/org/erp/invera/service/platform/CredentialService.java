package org.erp.invera.service.platform;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.time.LocalDateTime;
import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class CredentialService {

    @Qualifier("platformJdbcTemplate")
    private final JdbcTemplate platformJdbcTemplate;

    private static final String AES_ALGORITHM = "AES";
    private SecretKey secretKey;

    // ============================================================
    // INITIALISATION DE LA CLÉ FIXE
    // ============================================================

    /**
     * Initialise la clé de chiffrement (FIXE !)
     * En production, utiliser une variable d'environnement
     */
    @PostConstruct
    public void init() {
        // ✅ Solution 1 : Clé fixe depuis variable d'environnement (RECOMMANDÉ)
        String keyBase64 = System.getenv("INVERA_ENCRYPTION_KEY");

        if (keyBase64 != null && !keyBase64.isEmpty()) {
            // Utiliser la clé existante
            byte[] decodedKey = Base64.getDecoder().decode(keyBase64);
            secretKey = new SecretKeySpec(decodedKey, 0, decodedKey.length, AES_ALGORITHM);
            log.info("✅ Clé de chiffrement chargée depuis variable d'environnement");
        } else {
            // ✅ Solution 2 : Clé fixe pour développement (À CHANGER en production !)
            String fixedKey = "inveraSecretKey2024!1234567890"; // 32 caractères pour AES-256
            byte[] keyBytes = fixedKey.getBytes();
            // S'assurer que la clé fait 32 bytes (AES-256)
            if (keyBytes.length < 32) {
                byte[] padded = new byte[32];
                System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
                keyBytes = padded;
            }
            secretKey = new SecretKeySpec(keyBytes, 0, 32, AES_ALGORITHM);
            log.warn("⚠️ Clé de chiffrement par défaut utilisée (à changer en production)");
        }

        // Créer la table si elle n'existe pas
        createTableIfNotExists();
    }

    /**
     * Crée la table des credentials si elle n'existe pas
     */
    private void createTableIfNotExists() {
        String createTableSql = """
            CREATE TABLE IF NOT EXISTS client_credentials (
                client_id BIGINT PRIMARY KEY,
                username VARCHAR(100) NOT NULL,
                password_encrypted TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW()
            )
            """;

        try {
            platformJdbcTemplate.execute(createTableSql);
            log.info("✅ Table client_credentials vérifiée/créée");
        } catch (Exception e) {
            log.error("❌ Erreur création table client_credentials: {}", e.getMessage());
        }
    }

    // ============================================================
    // CRUD CREDENTIALS
    // ============================================================

    /**
     * Stocke les credentials d'un client (chiffrés)
     */
    @Transactional
    public void storeCredentials(Long clientId, String username, String password) {
        String encryptedPassword = encrypt(password);

        String sql = """
            INSERT INTO client_credentials (client_id, username, password_encrypted, created_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (client_id) DO UPDATE
            SET username = EXCLUDED.username,
                password_encrypted = EXCLUDED.password_encrypted,
                updated_at = NOW()
            """;

        platformJdbcTemplate.update(sql, clientId, username, encryptedPassword, LocalDateTime.now());
        log.info("✅ Credentials stockés pour client {}", clientId);
    }

    /**
     * Récupère les credentials d'un client (déchiffrés)
     */
    public Credentials getCredentials(Long clientId) {
        String sql = "SELECT username, password_encrypted FROM client_credentials WHERE client_id = ?";

        try {
            var result = platformJdbcTemplate.queryForMap(sql, clientId);
            String username = (String) result.get("username");
            String encryptedPassword = (String) result.get("password_encrypted");
            String password = decrypt(encryptedPassword);

            return new Credentials(username, password);
        } catch (Exception e) {
            throw new RuntimeException("Credentials non trouvés pour client " + clientId, e);
        }
    }

    /**
     * Supprime les credentials d'un client
     */
    @Transactional
    public void deleteCredentials(Long clientId) {
        String sql = "DELETE FROM client_credentials WHERE client_id = ?";
        platformJdbcTemplate.update(sql, clientId);
        log.info("✅ Credentials supprimés pour client {}", clientId);
    }

    /**
     * Vérifie si des credentials existent pour un client
     */
    public boolean credentialsExist(Long clientId) {
        String sql = "SELECT COUNT(*) FROM client_credentials WHERE client_id = ?";
        Integer count = platformJdbcTemplate.queryForObject(sql, Integer.class, clientId);
        return count != null && count > 0;
    }

    // ============================================================
    // MÉTHODES DE CHIFFREMENT
    // ============================================================

    /**
     * Chiffre un texte avec AES-256
     */
    private String encrypt(String plainText) {
        try {
            Cipher cipher = Cipher.getInstance(AES_ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            byte[] encryptedBytes = cipher.doFinal(plainText.getBytes());
            return Base64.getEncoder().encodeToString(encryptedBytes);
        } catch (Exception e) {
            log.error("Erreur chiffrement: {}", e.getMessage());
            throw new RuntimeException("Erreur de chiffrement", e);
        }
    }

    /**
     * Déchiffre un texte avec AES-256
     */
    private String decrypt(String encryptedText) {
        try {
            Cipher cipher = Cipher.getInstance(AES_ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
            byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedText));
            return new String(decryptedBytes);
        } catch (Exception e) {
            log.error("Erreur déchiffrement: {}", e.getMessage());
            throw new RuntimeException("Erreur de déchiffrement", e);
        }
    }

    // ============================================================
    // CLASSE INTERNE
    // ============================================================

    public record Credentials(String username, String password) {}
}