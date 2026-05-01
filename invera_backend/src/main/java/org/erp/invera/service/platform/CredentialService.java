package org.erp.invera.service.platform;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class CredentialService {

    // ✅ FORCER l'utilisation du bon JdbcTemplate avec @Qualifier
   // @Qualifier("platformJdbcTemplate")
    private final JdbcTemplate platformJdbcTemplate;

    private static final String AES_ALGORITHM = "AES";
    private SecretKey secretKey;

    @PostConstruct
    public void init() {
        // 🔍 DEBUG : Vérifier quelle base est utilisée
        try {
            String currentDb = platformJdbcTemplate.queryForObject(
                    "SELECT current_database()", String.class
            );
            log.info("========== CONFIGURATION CREDENTIAL SERVICE ==========");
            log.info("📁 platformJdbcTemplate connecté à: {}", currentDb);
            log.info("======================================================");

            if (!"invera_platform".equals(currentDb)) {
                log.error("❌ ERREUR CRITIQUE: La table sera créée dans la MAUVAISE base !");
            }
        } catch (Exception e) {
            log.error("❌ Impossible de vérifier la base: {}", e.getMessage());
        }

        // Initialisation de la clé
        String keyString = "InVeraSecretKey2024SuperSecure1234567890";
        byte[] keyBytes = keyString.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length != 32) {
            byte[] fixedKey = new byte[32];
            System.arraycopy(keyBytes, 0, fixedKey, 0, Math.min(keyBytes.length, 32));
            keyBytes = fixedKey;
        }
        secretKey = new SecretKeySpec(keyBytes, "AES");
        log.info("✅ Service de chiffrement initialisé");

        createTableIfNotExists();
    }

    private void createTableIfNotExists() {
        String sql = """
            CREATE TABLE IF NOT EXISTS client_credentials (
                client_id BIGINT PRIMARY KEY,
                username_encrypted TEXT NOT NULL,
                password_encrypted TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """;

        try {
            platformJdbcTemplate.execute(sql);
            log.info("✅ Table client_credentials créée/vérifiée");

            // Vérification post-création
            String currentDb = platformJdbcTemplate.queryForObject(
                    "SELECT current_database()", String.class
            );
            log.info("📁 Table créée dans la base: {}", currentDb);

        } catch (Exception e) {
            log.error("❌ Erreur création table: {}", e.getMessage());
            throw new RuntimeException("Impossible de créer la table client_credentials", e);
        }
    }

    @Transactional
    public void storeCredentials(Long clientId, String username, String password) {
        String encryptedUsername = encrypt(username);
        String encryptedPassword = encrypt(password);

        String sql = """
            INSERT INTO client_credentials (client_id, username_encrypted, password_encrypted, created_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (client_id) DO UPDATE
            SET username_encrypted = EXCLUDED.username_encrypted,
                password_encrypted = EXCLUDED.password_encrypted,
                updated_at = NOW()
            """;

        platformJdbcTemplate.update(sql, clientId, encryptedUsername, encryptedPassword, LocalDateTime.now());
        log.info("✅ Credentials stockés pour client {}", clientId);
    }

    public Credentials getCredentials(Long clientId) {
        String sql = "SELECT username_encrypted, password_encrypted FROM client_credentials WHERE client_id = ?";

        try {
            var result = platformJdbcTemplate.queryForMap(sql, clientId);
            String username = decrypt((String) result.get("username_encrypted"));
            String password = decrypt((String) result.get("password_encrypted"));
            return new Credentials(username, password);
        } catch (Exception e) {
            log.warn("⚠️ Credentials non trouvés pour client {}", clientId);
            // Retourner des credentials par défaut au lieu de planter
            return new Credentials("postgres", "chayma");
        }
    }

    public boolean exists(Long clientId) {
        try {
            String sql = "SELECT COUNT(*) FROM client_credentials WHERE client_id = ?";
            Integer count = platformJdbcTemplate.queryForObject(sql, Integer.class, clientId);
            return count != null && count > 0;
        } catch (Exception e) {
            return false;
        }
    }

    private String encrypt(String plainText) {
        try {
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            log.error("Erreur chiffrement: {}", e.getMessage());
            return plainText; // Fallback en clair
        }
    }

    private String decrypt(String encryptedText) {
        try {
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
            byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(encryptedText));
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Erreur déchiffrement: {}", e.getMessage());
            return encryptedText; // Fallback : retourne la valeur encodée
        }
    }

    public record Credentials(String username, String password) {}
}