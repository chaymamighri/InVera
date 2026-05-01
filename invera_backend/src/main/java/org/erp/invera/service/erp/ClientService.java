package org.erp.invera.service.erp;

import org.erp.invera.dto.erp.clientdto.NouveauClientDTO;
import org.erp.invera.model.erp.client.Client;
import org.erp.invera.model.erp.client.ClientTypeDiscount;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.erp.invera.security.JwtTokenProvider;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service de gestion des clients (MULTI-TENANT)
 *
 * Toutes les opérations sont filtrées par tenant via clientId
 */
@Service
@Transactional
public class ClientService {

    private final TenantAwareRepository tenantRepo;
    private final JwtTokenProvider jwtTokenProvider;

    public ClientService(TenantAwareRepository tenantRepo,
                         JwtTokenProvider jwtTokenProvider) {
        this.tenantRepo = tenantRepo;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    // ==================== ROW MAPPER ====================

    private RowMapper<Client> clientRowMapper() {
        return (rs, rowNum) -> {
            Client client = new Client();
            client.setIdClient(rs.getInt("id_client"));
            client.setNom(rs.getString("nom"));
            client.setPrenom(rs.getString("prenom"));
            client.setEmail(rs.getString("email"));
            client.setTelephone(rs.getString("telephone"));
            client.setAdresse(rs.getString("adresse"));

            // Type client (enum)
            String typeClient = rs.getString("type_client");
            if (typeClient != null) {
                client.setTypeClient(Client.TypeClient.valueOf(typeClient));
            }

            // Remises (peuvent être null)
            double remiseFidele = rs.getDouble("remise_client_fidele");
            if (!rs.wasNull()) {
                client.setRemiseClientFidele(remiseFidele);
            }

            double remiseVip = rs.getDouble("remise_client_vip");
            if (!rs.wasNull()) {
                client.setRemiseClientVIP(remiseVip);
            }

            double remisePro = rs.getDouble("remise_client_professionnelle");
            if (!rs.wasNull()) {
                client.setRemiseClientProfessionnelle(remisePro);
            }

            client.setCreatedBy(rs.getString("created_by"));

            if (rs.getTimestamp("created_at") != null) {
                client.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
            }

            return client;
        };
    }

    private Long getClientIdFromToken(String token) {
        return jwtTokenProvider.getClientIdFromToken(token);
    }

    // ==================== CRUD Operations ====================

    public Client creerClient(NouveauClientDTO clientDTO, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // Vérifier unicité du téléphone dans le tenant
        String checkTelSql = "SELECT COUNT(*) FROM client WHERE telephone = ?";
        Integer telCount = tenantRepo.queryForObject(checkTelSql, Integer.class, clientId, authClientId,
                clientDTO.getTelephone());

        if (telCount != null && telCount > 0) {
            throw new RuntimeException("Un client avec ce numéro de téléphone existe déjà");
        }

        // Vérifier unicité de l'email dans le tenant (si fourni)
        if (clientDTO.getEmail() != null && !clientDTO.getEmail().isEmpty()) {
            String checkEmailSql = "SELECT COUNT(*) FROM client WHERE email = ?";
            Integer emailCount = tenantRepo.queryForObject(checkEmailSql, Integer.class, clientId, authClientId,
                    clientDTO.getEmail());

            if (emailCount != null && emailCount > 0) {
                throw new RuntimeException("Un client avec cet email existe déjà");
            }
        }

        // Normaliser le type
        Client.TypeClient clientType = normalizeClientType(clientDTO.getType());

        // Calculer la remise selon le type
        Double remiseFidele = null;
        Double remiseVip = null;
        Double remisePro = null;

        switch (clientType) {
            case FIDELE:
                remiseFidele = getRemiseForClientType("FIDELE", token);
                break;
            case VIP:
                remiseVip = getRemiseForClientType("VIP", token);
                break;
            case ENTREPRISE:
                remisePro = getRemiseForClientType("ENTREPRISE", token);
                break;
            default:
                // PARTICULIER = pas de remise
                break;
        }

        // Récupérer l'utilisateur connecté
        String currentUser = jwtTokenProvider.getEmailFromToken(token);
        if (currentUser == null || currentUser.isBlank()) {
            currentUser = "SYSTEM";
        }
        // Insertion
        String insertSql = """
            INSERT INTO client (nom, prenom, telephone, email, adresse, type_client, 
                                remise_client_fidele, remise_client_vip, remise_client_professionnelle,
                                created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id_client
            """;

        Integer id = tenantRepo.queryForObject(insertSql, Integer.class, clientId, authClientId,
                clientDTO.getNom(),
                clientDTO.getPrenom(),
                clientDTO.getTelephone(),
                clientDTO.getEmail(),
                clientDTO.getAdresse(),
                clientType.name(),
                remiseFidele,
                remiseVip,
                remisePro,
                currentUser,
                LocalDateTime.now());

        // Retourner le client créé
        return findById(id, token);
    }

    public List<Client> getAllClients(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT * FROM client ORDER BY nom ASC, prenom ASC";
        return tenantRepo.query(sql, clientRowMapper(), clientId, authClientId);
    }

    public List<Client> searchClients(String keyword, String token) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllClients(token);
        }

        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = """
            SELECT * FROM client 
            WHERE LOWER(nom) LIKE ? 
               OR LOWER(prenom) LIKE ? 
               OR telephone LIKE ? 
               OR LOWER(email) LIKE ?
            ORDER BY nom ASC, prenom ASC
            """;

        String searchPattern = "%" + keyword.toLowerCase().trim() + "%";

        return tenantRepo.query(sql, clientRowMapper(), clientId, authClientId,
                searchPattern, searchPattern, searchPattern, searchPattern);
    }

    public Client findById(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT * FROM client WHERE id_client = ?";
        Client client = tenantRepo.queryForObject(sql, clientRowMapper(), clientId, authClientId, id);

        if (client == null) {
            throw new RuntimeException("Client non trouvé avec l'ID: " + id);
        }
        return client;
    }

    public Client updateClient(Integer id, NouveauClientDTO clientDTO, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // Vérifier existance
        Client existing = findById(id, token);

        // Vérifier unicité téléphone (si changé)
        if (!existing.getTelephone().equals(clientDTO.getTelephone())) {
            String checkTelSql = "SELECT COUNT(*) FROM client WHERE telephone = ? AND id_client != ?";
            Integer telCount = tenantRepo.queryForObject(checkTelSql, Integer.class, clientId, authClientId,
                    clientDTO.getTelephone(), id);

            if (telCount != null && telCount > 0) {
                throw new RuntimeException("Un autre client avec ce numéro de téléphone existe déjà");
            }
        }

        // Vérifier unicité email (si changé et non null)
        if (clientDTO.getEmail() != null && !clientDTO.getEmail().isEmpty() &&
                (existing.getEmail() == null || !existing.getEmail().equals(clientDTO.getEmail()))) {
            String checkEmailSql = "SELECT COUNT(*) FROM client WHERE email = ? AND id_client != ?";
            Integer emailCount = tenantRepo.queryForObject(checkEmailSql, Integer.class, clientId, authClientId,
                    clientDTO.getEmail(), id);

            if (emailCount != null && emailCount > 0) {
                throw new RuntimeException("Un autre client avec cet email existe déjà");
            }
        }

        // Calculer les nouvelles remises si le type change
        Client.TypeClient nouveauType = null;
        Double remiseFidele = existing.getRemiseClientFidele();
        Double remiseVip = existing.getRemiseClientVIP();
        Double remisePro = existing.getRemiseClientProfessionnelle();

        if (clientDTO.getType() != null) {
            nouveauType = normalizeClientType(clientDTO.getType());

            // Réinitialiser les remises selon le nouveau type
            remiseFidele = null;
            remiseVip = null;
            remisePro = null;

            switch (nouveauType) {
                case FIDELE:
                    remiseFidele = getRemiseForClientType("FIDELE", token);
                    break;
                case VIP:
                    remiseVip = getRemiseForClientType("VIP", token);
                    break;
                case ENTREPRISE:
                    remisePro = getRemiseForClientType("ENTREPRISE", token);
                    break;
                default:
                    break;
            }
        }

        // Mise à jour
        String updateSql = """
            UPDATE client 
            SET nom = ?, prenom = ?, telephone = ?, email = ?, adresse = ?, 
                type_client = ?, remise_client_fidele = ?, remise_client_vip = ?, remise_client_professionnelle = ?
            WHERE id_client = ?
            """;

        String typeStr = (nouveauType != null) ? nouveauType.name() : existing.getTypeClient().name();

        tenantRepo.update(updateSql, clientId, authClientId,
                clientDTO.getNom(),
                clientDTO.getPrenom(),
                clientDTO.getTelephone(),
                clientDTO.getEmail(),
                clientDTO.getAdresse(),
                typeStr,
                remiseFidele,
                remiseVip,
                remisePro,
                id);

        return findById(id, token);
    }

    public void deleteClient(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // Vérifier que le client existe
        findById(id, token); // Lève exception si non trouvé

        // Vérifier si le client a des commandes (optionnel)
        String checkCommandesSql = "SELECT COUNT(*) FROM commande_client WHERE client_id = ?";
        Integer commandesCount = tenantRepo.queryForObject(checkCommandesSql, Integer.class, clientId, authClientId, id);

        if (commandesCount != null && commandesCount > 0) {
            throw new RuntimeException("Impossible de supprimer ce client car il a " + commandesCount + " commande(s)");
        }

        String deleteSql = "DELETE FROM client WHERE id_client = ?";
        int deleted = tenantRepo.update(deleteSql, clientId, authClientId, id);

        if (deleted == 0) {
            throw new RuntimeException("Erreur lors de la suppression du client");
        }
    }

    public boolean checkTelephoneExists(String telephone, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT COUNT(*) FROM client WHERE telephone = ?";
        Integer count = tenantRepo.queryForObject(sql, Integer.class, clientId, authClientId, telephone);

        return count != null && count > 0;
    }

    public List<String> getClientTypes() {
        return List.of(
                Client.TypeClient.PARTICULIER.name(),
                Client.TypeClient.VIP.name(),
                Client.TypeClient.ENTREPRISE.name(),
                Client.TypeClient.FIDELE.name()
        );
    }

    // ==================== Gestion des remises par type ====================
    public Double getRemiseForClientType(String typeClient, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // Récupérer tenant_id
        String tenantId = getTenantIdFromToken(token);

        if (typeClient == null) return null;

        try {
            Client.TypeClient type = normalizeClientType(typeClient);

            if (type == Client.TypeClient.PARTICULIER) {
                return 0.0;
            }

            // ✅ AJOUTER tenant_id dans la requête
            String sql = "SELECT remise FROM client_type_discount WHERE tenant_id = ? AND type_client = ?";
            Double configuredRemise = tenantRepo.queryForObject(sql, Double.class, clientId, authClientId, tenantId, type.name());

            if (configuredRemise != null) {
                return configuredRemise;
            }

            return getLegacyClientAverageDiscount(type, token);

        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private String getTenantIdFromToken(String token) {
        Long clientAdminId = getClientIdFromToken(token);
        String sql = "SELECT tenant_id FROM client_admin WHERE id = ?";
        return tenantRepo.queryForObject(sql, String.class, clientAdminId, String.valueOf(clientAdminId), clientAdminId);
    }

    public Double updateRemiseForClientType(String typeClient, Double remise, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        if (typeClient == null || typeClient.isBlank()) {
            throw new IllegalArgumentException("Le type client est obligatoire");
        }
        if (remise == null || remise < 0 || remise > 100) {
            throw new IllegalArgumentException("La remise doit être comprise entre 0 et 100");
        }

        Client.TypeClient type = normalizeClientType(typeClient);

        // PARTICULIER : interdiction de modifier
        if (type == Client.TypeClient.PARTICULIER) {
            if (Double.compare(remise, 0.0) != 0) {
                throw new IllegalArgumentException("Le type PARTICULIER doit conserver une remise de 0%");
            }
            return 0.0;
        }

        // UPSERT : remplacer si existe, insérer sinon
        String checkSql = "SELECT COUNT(*) FROM client_type_discount WHERE type_client = ?";
        Integer count = tenantRepo.queryForObject(checkSql, Integer.class, clientId, authClientId, type.name());

        if (count != null && count > 0) {
            String updateSql = "UPDATE client_type_discount SET remise = ? WHERE type_client = ?";
            tenantRepo.update(updateSql, clientId, authClientId, remise, type.name());
        } else {
            String insertSql = "INSERT INTO client_type_discount (type_client, remise) VALUES (?, ?)";
            tenantRepo.update(insertSql, clientId, authClientId, type.name(), remise);
        }

        // Mettre à jour tous les clients de ce type avec la nouvelle remise
        String updateClientsSql = "";
        switch (type) {
            case FIDELE:
                updateClientsSql = "UPDATE client SET remise_client_fidele = ? WHERE type_client = ?";
                break;
            case VIP:
                updateClientsSql = "UPDATE client SET remise_client_vip = ? WHERE type_client = ?";
                break;
            case ENTREPRISE:
                updateClientsSql = "UPDATE client SET remise_client_professionnelle = ? WHERE type_client = ?";
                break;
            default:
                break;
        }

        if (!updateClientsSql.isEmpty()) {
            tenantRepo.update(updateClientsSql, clientId, authClientId, remise, type.name());
        }

        return remise;
    }

    // ==================== Méthodes privées ====================

    private Client.TypeClient normalizeClientType(String typeClient) {
        if (typeClient == null || typeClient.isBlank()) {
            throw new IllegalArgumentException("Le type client est obligatoire");
        }
        return Client.TypeClient.valueOf(typeClient.toUpperCase());
    }

    private Double getLegacyClientAverageDiscount(Client.TypeClient type, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "";
        switch (type) {
            case VIP:
                sql = "SELECT AVG(remise_client_vip) FROM client WHERE type_client = 'VIP' AND remise_client_vip IS NOT NULL";
                break;
            case FIDELE:
                sql = "SELECT AVG(remise_client_fidele) FROM client WHERE type_client = 'FIDELE' AND remise_client_fidele IS NOT NULL";
                break;
            case ENTREPRISE:
                sql = "SELECT AVG(remise_client_professionnelle) FROM client WHERE type_client = 'ENTREPRISE' AND remise_client_professionnelle IS NOT NULL";
                break;
            default:
                return null;
        }

        return tenantRepo.queryForObject(sql, Double.class, clientId, authClientId);
    }
}