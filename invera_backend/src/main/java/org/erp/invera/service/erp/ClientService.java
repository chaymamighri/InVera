package org.erp.invera.service.erp;

import lombok.extern.slf4j.Slf4j;
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

@Slf4j
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
                try {
                    client.setTypeClient(Client.TypeClient.valueOf(typeClient));
                } catch (IllegalArgumentException e) {
                    log.warn("Type client inconnu: {}, utilisation de PARTICULIER par défaut", typeClient);
                    client.setTypeClient(Client.TypeClient.PARTICULIER);
                }
            }

            // Nouveaux attributs pour ENTREPRISE
            client.setRaisonSociale(rs.getString("raison_sociale"));
            client.setMatriculeFiscale(rs.getString("matricule_fiscale"));

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

        // Vérifier unicité du téléphone
        String checkTelSql = "SELECT COUNT(*) FROM client WHERE telephone = ?";
        Integer telCount = tenantRepo.queryForObjectAuth(checkTelSql, Integer.class, clientId, authClientId,
                clientDTO.getTelephone());

        if (telCount != null && telCount > 0) {
            throw new RuntimeException("Un client avec ce numéro de téléphone existe déjà");
        }

        // Vérifier unicité de l'email
        if (clientDTO.getEmail() != null && !clientDTO.getEmail().isEmpty()) {
            String checkEmailSql = "SELECT COUNT(*) FROM client WHERE email = ?";
            Integer emailCount = tenantRepo.queryForObjectAuth(checkEmailSql, Integer.class, clientId, authClientId,
                    clientDTO.getEmail());

            if (emailCount != null && emailCount > 0) {
                throw new RuntimeException("Un client avec cet email existe déjà");
            }
        }

        Client.TypeClient clientType = normalizeClientType(clientDTO.getType());

        // Validation des champs spécifiques aux entreprises
        if (clientType == Client.TypeClient.ENTREPRISE) {
            validateEnterpriseFields(clientDTO);

            // Vérifier unicité du matricule fiscale pour les entreprises
            if (clientDTO.getMatriculeFiscale() != null && !clientDTO.getMatriculeFiscale().isEmpty()) {
                String checkMatriculeSql = "SELECT COUNT(*) FROM client WHERE matricule_fiscale = ? AND type_client = 'ENTREPRISE'";
                Integer matriculeCount = tenantRepo.queryForObjectAuth(checkMatriculeSql, Integer.class, clientId, authClientId,
                        clientDTO.getMatriculeFiscale());

                if (matriculeCount != null && matriculeCount > 0) {
                    throw new RuntimeException("Un client entreprise avec ce matricule fiscale existe déjà");
                }
            }
        }

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
                break;
        }

        String currentUser = jwtTokenProvider.getEmailFromToken(token);
        if (currentUser == null || currentUser.isBlank()) {
            currentUser = "SYSTEM";
        }

        String insertSql = """
            INSERT INTO client (nom, prenom, telephone, email, adresse, type_client, 
                                raison_sociale, matricule_fiscale,
                                remise_client_fidele, remise_client_vip, remise_client_professionnelle,
                                created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id_client
            """;

        Integer id = tenantRepo.queryForObjectAuth(insertSql, Integer.class, clientId, authClientId,
                clientDTO.getNom(),
                clientDTO.getPrenom(),
                clientDTO.getTelephone(),
                clientDTO.getEmail(),
                clientDTO.getAdresse(),
                clientType.name(),
                clientType == Client.TypeClient.ENTREPRISE ? clientDTO.getRaisonSociale() : null,
                clientType == Client.TypeClient.ENTREPRISE ? clientDTO.getMatriculeFiscale() : null,
                remiseFidele,
                remiseVip,
                remisePro,
                currentUser,
                LocalDateTime.now());

        return findById(id, token);
    }

    public List<Client> getAllClients(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT * FROM client ORDER BY nom ASC, prenom ASC";
        return tenantRepo.queryWithAuth(sql, clientRowMapper(), clientId, authClientId);
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
               OR LOWER(raison_sociale) LIKE ?
               OR matricule_fiscale LIKE ?
            ORDER BY nom ASC, prenom ASC
            """;

        String searchPattern = "%" + keyword.toLowerCase().trim() + "%";

        return tenantRepo.queryWithAuth(sql, clientRowMapper(), clientId, authClientId,
                searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    public List<Client> getEntrepriseClients(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT * FROM client WHERE type_client = 'ENTREPRISE' ORDER BY raison_sociale ASC";
        return tenantRepo.queryWithAuth(sql, clientRowMapper(), clientId, authClientId);
    }

    public Client findById(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT * FROM client WHERE id_client = ?";
        Client client = tenantRepo.queryForObjectAuth(sql, clientRowMapper(), clientId, authClientId, id);

        if (client == null) {
            throw new RuntimeException("Client non trouvé avec l'ID: " + id);
        }
        return client;
    }

    public Client updateClient(Integer id, NouveauClientDTO clientDTO, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        Client existing = findById(id, token);

        // Validation des téléphones
        if (!existing.getTelephone().equals(clientDTO.getTelephone())) {
            String checkTelSql = "SELECT COUNT(*) FROM client WHERE telephone = ? AND id_client != ?";
            Integer telCount = tenantRepo.queryForObjectAuth(checkTelSql, Integer.class, clientId, authClientId,
                    clientDTO.getTelephone(), id);

            if (telCount != null && telCount > 0) {
                throw new RuntimeException("Un autre client avec ce numéro de téléphone existe déjà");
            }
        }

        // Validation des emails
        if (clientDTO.getEmail() != null && !clientDTO.getEmail().isEmpty() &&
                (existing.getEmail() == null || !existing.getEmail().equals(clientDTO.getEmail()))) {
            String checkEmailSql = "SELECT COUNT(*) FROM client WHERE email = ? AND id_client != ?";
            Integer emailCount = tenantRepo.queryForObjectAuth(checkEmailSql, Integer.class, clientId, authClientId,
                    clientDTO.getEmail(), id);

            if (emailCount != null && emailCount > 0) {
                throw new RuntimeException("Un autre client avec cet email existe déjà");
            }
        }

        Client.TypeClient nouveauType = null;
        String nouvelleRaisonSociale = existing.getRaisonSociale();
        String nouveauMatriculeFiscale = existing.getMatriculeFiscale();

        if (clientDTO.getType() != null) {
            nouveauType = normalizeClientType(clientDTO.getType());

            // Validation des champs entreprise si le nouveau type est ENTREPRISE
            if (nouveauType == Client.TypeClient.ENTREPRISE) {
                validateEnterpriseFields(clientDTO);
                nouvelleRaisonSociale = clientDTO.getRaisonSociale();
                nouveauMatriculeFiscale = clientDTO.getMatriculeFiscale();

                // Vérifier unicité du matricule fiscale si changé
                if (existing.getMatriculeFiscale() == null ||
                        !existing.getMatriculeFiscale().equals(clientDTO.getMatriculeFiscale())) {
                    String checkMatriculeSql = "SELECT COUNT(*) FROM client WHERE matricule_fiscale = ? AND type_client = 'ENTREPRISE' AND id_client != ?";
                    Integer matriculeCount = tenantRepo.queryForObjectAuth(checkMatriculeSql, Integer.class, clientId, authClientId,
                            clientDTO.getMatriculeFiscale(), id);

                    if (matriculeCount != null && matriculeCount > 0) {
                        throw new RuntimeException("Un autre client entreprise avec ce matricule fiscale existe déjà");
                    }
                }
            } else {
                // Si on change de ENTREPRISE vers autre chose, on efface les champs spécifiques
                nouvelleRaisonSociale = null;
                nouveauMatriculeFiscale = null;
            }
        } else {
            // Si le type ne change pas mais qu'on modifie les champs entreprise
            if (existing.getTypeClient() == Client.TypeClient.ENTREPRISE) {
                if (clientDTO.getRaisonSociale() != null) {
                    nouvelleRaisonSociale = clientDTO.getRaisonSociale();
                }
                if (clientDTO.getMatriculeFiscale() != null) {
                    // Vérifier unicité si matricule change
                    if (!existing.getMatriculeFiscale().equals(clientDTO.getMatriculeFiscale())) {
                        String checkMatriculeSql = "SELECT COUNT(*) FROM client WHERE matricule_fiscale = ? AND type_client = 'ENTREPRISE' AND id_client != ?";
                        Integer matriculeCount = tenantRepo.queryForObjectAuth(checkMatriculeSql, Integer.class, clientId, authClientId,
                                clientDTO.getMatriculeFiscale(), id);

                        if (matriculeCount != null && matriculeCount > 0) {
                            throw new RuntimeException("Un autre client entreprise avec ce matricule fiscale existe déjà");
                        }
                        nouveauMatriculeFiscale = clientDTO.getMatriculeFiscale();
                    }
                }
            }
        }

        // ✅ SQL sans les champs de remise
        String updateSql = """
        UPDATE client 
        SET nom = ?, prenom = ?, telephone = ?, email = ?, adresse = ?, 
            type_client = ?, raison_sociale = ?, matricule_fiscale = ?
        WHERE id_client = ?
        """;

        String typeStr = (nouveauType != null) ? nouveauType.name() : existing.getTypeClient().name();

        tenantRepo.updateWithAuth(updateSql, clientId, authClientId,
                clientDTO.getNom(),
                clientDTO.getPrenom(),
                clientDTO.getTelephone(),
                clientDTO.getEmail(),
                clientDTO.getAdresse(),
                typeStr,
                nouvelleRaisonSociale,
                nouveauMatriculeFiscale,
                id);

        return findById(id, token);
    }

    @Transactional
    public Client updateClientType(Integer id, String newType, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        Client existing = findById(id, token);
        Client.TypeClient nouveauType = normalizeClientType(newType);

        // Vérifier si le type est différent
        if (existing.getTypeClient() == nouveauType) {
            throw new RuntimeException("Le client est déjà de type " + newType);
        }

        // Si on change de ENTREPRISE vers autre chose, on efface les champs spécifiques
        String nouvelleRaisonSociale = existing.getRaisonSociale();
        String nouveauMatriculeFiscale = existing.getMatriculeFiscale();

        if (existing.getTypeClient() == Client.TypeClient.ENTREPRISE) {
            nouvelleRaisonSociale = null;
            nouveauMatriculeFiscale = null;
        }

        // ✅ Mise à jour uniquement du type et des champs associés (sans les remises)
        String updateSql = """
        UPDATE client 
        SET type_client = ?, 
            raison_sociale = ?, 
            matricule_fiscale = ?
        WHERE id_client = ?
        """;

        tenantRepo.updateWithAuth(updateSql, clientId, authClientId,
                nouveauType.name(),
                nouvelleRaisonSociale,
                nouveauMatriculeFiscale,
                id);

        return findById(id, token);
    }

    /**
     * Récupère la remise standard pour un type de client
     * @param typeClient Le type de client (PARTICULIER, VIP, ENTREPRISE, FIDELE)
     * @return Le pourcentage de remise, ou 0 si non trouvé
     */
    public Double getRemiseByType(String typeClient, Long tenantId) {
        if (typeClient == null) {
            return 0.0;
        }

        try {
            String authClientId = String.valueOf(tenantId);
            String sql = "SELECT remise FROM client_type_discount WHERE type_client = ?";
            Double remise = tenantRepo.queryForObjectAuth(sql, Double.class, tenantId, authClientId, typeClient);

            return remise != null ? remise : 0.0;
        } catch (Exception e) {
            log.warn("Impossible de récupérer la remise pour le type {}: {}", typeClient, e.getMessage());
            return 0.0;
        }
    }

    public void deleteClient(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        findById(id, token);

        String checkCommandesSql = "SELECT COUNT(*) FROM commande_client WHERE client_id = ?";
        Integer commandesCount = tenantRepo.queryForObjectAuth(checkCommandesSql, Integer.class, clientId, authClientId, id);

        if (commandesCount != null && commandesCount > 0) {
            throw new RuntimeException("Impossible de supprimer ce client car il a " + commandesCount + " commande(s)");
        }

        String deleteSql = "DELETE FROM client WHERE id_client = ?";
        int deleted = tenantRepo.updateWithAuth(deleteSql, clientId, authClientId, id);

        if (deleted == 0) {
            throw new RuntimeException("Erreur lors de la suppression du client");
        }
    }

    public boolean checkTelephoneExists(String telephone, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT COUNT(*) FROM client WHERE telephone = ?";
        Integer count = tenantRepo.queryForObjectAuth(sql, Integer.class, clientId, authClientId, telephone);

        return count != null && count > 0;
    }

    public boolean checkMatriculeFiscaleExists(String matriculeFiscale, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        String sql = "SELECT COUNT(*) FROM client WHERE matricule_fiscale = ? AND type_client = 'ENTREPRISE'";
        Integer count = tenantRepo.queryForObjectAuth(sql, Integer.class, clientId, authClientId, matriculeFiscale);

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

        if (typeClient == null) return null;

        try {
            Client.TypeClient type = normalizeClientType(typeClient);

            if (type == Client.TypeClient.PARTICULIER) {
                return 0.0;
            }

            // ✅ Temporairement SANS tenant_id pour correspondre à l'update
            String sql = "SELECT remise FROM client_type_discount WHERE type_client = ?";
            Double configuredRemise = tenantRepo.queryForObjectAuth(sql, Double.class, clientId, authClientId, type.name());

            if (configuredRemise != null) {
                return configuredRemise;
            }

            // ✅ Valeurs par défaut CORRECTES
            switch (type) {
                case VIP:
                    return 5.0;      // VIP = 0%
                case ENTREPRISE:
                    return 2.0;      // ENTREPRISE = 2%
                case FIDELE:
                    return 3.0;      // FIDELE = 0%
                default:
                    return getLegacyClientAverageDiscount(type, token);
            }

        } catch (IllegalArgumentException e) {
            return null;
        }
    }
    private String getTenantIdFromToken(String token) {
        Long clientAdminId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientAdminId);
        String sql = "SELECT tenant_id FROM client_admin WHERE id = ?";
        return tenantRepo.queryForObjectAuth(sql, String.class, clientAdminId, authClientId, clientAdminId);
    }

    public Double updateRemiseForClientType(String typeClient, Double remise, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        // ⚠️ TEMPORAIRE : désactiver tenant_id
        // String tenantId = getTenantIdFromToken(token);

        if (typeClient == null || typeClient.isBlank()) {
            throw new IllegalArgumentException("Le type client est obligatoire");
        }
        if (remise == null || remise < 0 || remise > 100) {
            throw new IllegalArgumentException("La remise doit être comprise entre 0 et 100");
        }

        Client.TypeClient type = normalizeClientType(typeClient);

        if (type == Client.TypeClient.PARTICULIER) {
            if (Double.compare(remise, 0.0) != 0) {
                throw new IllegalArgumentException("Le type PARTICULIER doit conserver une remise de 0%");
            }
            return 0.0;
        }

        // ✅ Temporairement SANS tenant_id
        String checkSql = "SELECT COUNT(*) FROM client_type_discount WHERE type_client = ?";
        Integer count = tenantRepo.queryForObjectAuth(checkSql, Integer.class, clientId, authClientId, type.name());

        if (count != null && count > 0) {
            String updateSql = "UPDATE client_type_discount SET remise = ? WHERE type_client = ?";
            tenantRepo.updateWithAuth(updateSql, clientId, authClientId, remise, type.name());
        } else {
            String insertSql = "INSERT INTO client_type_discount (type_client, remise) VALUES (?, ?)";
            tenantRepo.updateWithAuth(insertSql, clientId, authClientId, type.name(), remise);
        }

        // Mise à jour des clients existants
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
            tenantRepo.updateWithAuth(updateClientsSql, clientId, authClientId, remise, type.name());
        }

        return remise;
    }    // ==================== Méthodes privées ====================

    private Client.TypeClient normalizeClientType(String typeClient) {
        if (typeClient == null || typeClient.isBlank()) {
            throw new IllegalArgumentException("Le type client est obligatoire");
        }
        return Client.TypeClient.valueOf(typeClient.toUpperCase());
    }

    private void validateEnterpriseFields(NouveauClientDTO clientDTO) {
        if (clientDTO.getRaisonSociale() == null || clientDTO.getRaisonSociale().trim().isEmpty()) {
            throw new IllegalArgumentException("La raison sociale est obligatoire pour les clients de type ENTREPRISE");
        }
        if (clientDTO.getMatriculeFiscale() == null || clientDTO.getMatriculeFiscale().trim().isEmpty()) {
            throw new IllegalArgumentException("Le matricule fiscale est obligatoire pour les clients de type ENTREPRISE");
        }
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

        return tenantRepo.queryForObjectAuth(sql, Double.class, clientId, authClientId);
    }
}