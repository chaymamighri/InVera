package org.erp.invera.service.erp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.erp.invera.dto.erp.fournisseurdto.FournisseurDTO;
import org.erp.invera.model.erp.Fournisseurs.Fournisseur;
import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.erp.invera.security.JwtTokenProvider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service de gestion des fournisseurs (multi-tenant).
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FournisseurServices {

    private final TenantAwareRepository tenantRepo;
    private final JwtTokenProvider jwtTokenProvider;

    // ==================== ROW MAPPER ====================

    private RowMapper<Fournisseur> fournisseurRowMapper() {
        return (rs, rowNum) -> {
            Fournisseur fournisseur = new Fournisseur();
            fournisseur.setIdFournisseur(rs.getInt("id_fournisseur"));
            fournisseur.setNomFournisseur(rs.getString("nom_fournisseur"));
            fournisseur.setEmail(rs.getString("email"));
            fournisseur.setAdresse(rs.getString("adresse"));
            fournisseur.setTelephone(rs.getString("telephone"));
            fournisseur.setVille(rs.getString("ville"));
            fournisseur.setPays(rs.getString("pays"));
            fournisseur.setActif(rs.getBoolean("actif"));
            return fournisseur;
        };
    }

    private Long getClientIdFromToken(String token) {
        return jwtTokenProvider.getClientIdFromToken(token);
    }

    // ==================== MÉTHODES ====================

    /**
     * Récupère tous les fournisseurs (y compris inactifs)
     */
    @Transactional(readOnly = true)
    public List<FournisseurDTO> getAllFournisseurs(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        log.info("Récupération de tous les fournisseurs pour client: {}", clientId);

        String sql = "SELECT * FROM fournisseurs ORDER BY nom_fournisseur ASC";
        // ✅ CORRECTION: Utiliser queryWithAuth
        List<Fournisseur> fournisseurs = tenantRepo.queryWithAuth(sql, fournisseurRowMapper(), clientId, authClientId);

        return fournisseurs.stream()
                .map(FournisseurDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Récupère uniquement les fournisseurs actifs
     */
    @Transactional(readOnly = true)
    public List<FournisseurDTO> getActiveFournisseurs(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        log.info("Récupération des fournisseurs actifs pour client: {}", clientId);

        String sql = "SELECT * FROM fournisseurs WHERE actif = true ORDER BY nom_fournisseur ASC";
        // ✅ CORRECTION: Utiliser queryWithAuth
        List<Fournisseur> fournisseurs = tenantRepo.queryWithAuth(sql, fournisseurRowMapper(), clientId, authClientId);

        return fournisseurs.stream()
                .map(FournisseurDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Récupère uniquement les fournisseurs inactifs (soft delete)
     */
    @Transactional(readOnly = true)
    public List<FournisseurDTO> getInactiveFournisseurs(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        log.info("Récupération des fournisseurs inactifs pour client: {}", clientId);

        String sql = "SELECT * FROM fournisseurs WHERE actif = false ORDER BY nom_fournisseur ASC";
        // ✅ CORRECTION: Utiliser queryWithAuth
        List<Fournisseur> fournisseurs = tenantRepo.queryWithAuth(sql, fournisseurRowMapper(), clientId, authClientId);

        return fournisseurs.stream()
                .map(FournisseurDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Récupère un fournisseur par son ID (vérifie s'il est actif)
     */
    @Transactional(readOnly = true)
    public FournisseurDTO getFournisseurById(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        log.info("Récupération du fournisseur avec l'id: {} pour client: {}", id, clientId);

        String sql = "SELECT * FROM fournisseurs WHERE id_fournisseur = ? AND actif = true";
        // ✅ CORRECTION: Utiliser queryForObjectAuth
        Fournisseur fournisseur = tenantRepo.queryForObjectAuth(sql, fournisseurRowMapper(), clientId, authClientId, id);

        if (fournisseur == null) {
            throw new RuntimeException(String.format("Fournisseur actif non trouvé avec l'id: %d", id));
        }
        return new FournisseurDTO(fournisseur);
    }

    /**
     * Récupère un fournisseur par son ID (même si inactif - pour admin)
     */
    @Transactional(readOnly = true)
    public FournisseurDTO getFournisseurByIdAdmin(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        log.info("Récupération admin du fournisseur avec l'id: {} pour client: {}", id, clientId);

        String sql = "SELECT * FROM fournisseurs WHERE id_fournisseur = ?";
        // ✅ CORRECTION: Utiliser queryForObjectAuth
        Fournisseur fournisseur = tenantRepo.queryForObjectAuth(sql, fournisseurRowMapper(), clientId, authClientId, id);

        if (fournisseur == null) {
            throw new RuntimeException(String.format("Fournisseur non trouvé avec l'id: %d", id));
        }
        return new FournisseurDTO(fournisseur);
    }

    /**
     * Crée un nouveau fournisseur avec paramètres individuels
     */
    public FournisseurDTO createFournisseur(
            String nomFournisseur,
            String email,
            String adresse,
            String telephone,
            String ville,
            String pays,
            String token) {

        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        log.info("Création d'un nouveau fournisseur: {} pour client: {}", nomFournisseur, clientId);

        // Vérifier si l'email existe déjà
        if (email != null && !email.isEmpty()) {
            String checkSql = "SELECT COUNT(*) FROM fournisseurs WHERE email = ?";
            // ✅ CORRECTION: Utiliser queryForObjectAuth
            Integer count = tenantRepo.queryForObjectAuth(checkSql, Integer.class, clientId, authClientId, email);

            if (count != null && count > 0) {
                throw new RuntimeException(String.format("Un fournisseur avec l'email '%s' existe déjà", email));
            }
        }

        String insertSql = """
            INSERT INTO fournisseurs (nom_fournisseur, email, adresse, telephone, ville, pays, actif)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            RETURNING id_fournisseur
            """;

        // ✅ CORRECTION: Utiliser queryForObjectAuth pour récupérer l'ID
        Integer id = tenantRepo.queryForObjectAuth(insertSql, Integer.class, clientId, authClientId,
                nomFournisseur, email, adresse, telephone, ville, pays, true);

        if (id == null) {
            throw new RuntimeException("Erreur lors de l'insertion du fournisseur");
        }

        // Récupérer par ID
        String selectSql = "SELECT * FROM fournisseurs WHERE id_fournisseur = ?";
        // ✅ CORRECTION: Utiliser queryForObjectAuth
        Fournisseur saved = tenantRepo.queryForObjectAuth(selectSql, fournisseurRowMapper(), clientId, authClientId, id);

        if (saved == null) {
            throw new RuntimeException("Erreur: Fournisseur non trouvé après création");
        }

        log.info("Fournisseur créé avec succès, id: {}", saved.getIdFournisseur());
        return new FournisseurDTO(saved);
    }

    /**
     * Met à jour un fournisseur existant avec paramètres individuels
     */
    public FournisseurDTO updateFournisseur(
            Integer id,
            String nomFournisseur,
            String email,
            String adresse,
            String telephone,
            String ville,
            String pays,
            Boolean actif,
            String token) {

        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        log.info("Mise à jour du fournisseur avec l'id: {} pour client: {}", id, clientId);

        // Vérifier si le fournisseur existe
        String checkExistSql = "SELECT * FROM fournisseurs WHERE id_fournisseur = ?";
        // ✅ CORRECTION: Utiliser queryForObjectAuth
        Fournisseur existing = tenantRepo.queryForObjectAuth(checkExistSql, fournisseurRowMapper(), clientId, authClientId, id);

        if (existing == null) {
            throw new RuntimeException(String.format("Fournisseur non trouvé avec l'id: %d", id));
        }

        // Vérifier si l'email est modifié et n'existe pas déjà
        if (email != null && !email.isEmpty() && !email.equals(existing.getEmail())) {
            String checkEmailSql = "SELECT COUNT(*) FROM fournisseurs WHERE email = ? AND id_fournisseur != ?";
            // ✅ CORRECTION: Utiliser queryForObjectAuth
            Integer count = tenantRepo.queryForObjectAuth(checkEmailSql, Integer.class, clientId, authClientId, email, id);

            if (count != null && count > 0) {
                throw new RuntimeException(String.format("Un autre fournisseur avec l'email '%s' existe déjà", email));
            }
        }

        // Construction de la requête de mise à jour dynamique
        StringBuilder updateSql = new StringBuilder("UPDATE fournisseurs SET ");
        List<Object> params = new java.util.ArrayList<>();

        if (nomFournisseur != null) {
            updateSql.append("nom_fournisseur = ?, ");
            params.add(nomFournisseur);
        }
        if (email != null) {
            updateSql.append("email = ?, ");
            params.add(email);
        }
        if (adresse != null) {
            updateSql.append("adresse = ?, ");
            params.add(adresse);
        }
        if (telephone != null) {
            updateSql.append("telephone = ?, ");
            params.add(telephone);
        }
        if (ville != null) {
            updateSql.append("ville = ?, ");
            params.add(ville);
        }
        if (pays != null) {
            updateSql.append("pays = ?, ");
            params.add(pays);
        }
        if (actif != null) {
            updateSql.append("actif = ?, ");
            params.add(actif);
        }

        if (params.isEmpty()) {
            throw new RuntimeException("Aucune donnée à mettre à jour");
        }

        // Supprimer la dernière virgule et ajouter la condition WHERE
        updateSql.setLength(updateSql.length() - 2);
        updateSql.append(" WHERE id_fournisseur = ?");
        params.add(id);

        // ✅ CORRECTION: Utiliser updateWithAuth
        tenantRepo.updateWithAuth(updateSql.toString(), clientId, authClientId, params.toArray());

        // Récupérer le fournisseur mis à jour
        String selectSql = "SELECT * FROM fournisseurs WHERE id_fournisseur = ?";
        // ✅ CORRECTION: Utiliser queryForObjectAuth
        Fournisseur updated = tenantRepo.queryForObjectAuth(selectSql, fournisseurRowMapper(), clientId, authClientId, id);

        log.info("Fournisseur mis à jour avec succès");
        return new FournisseurDTO(updated);
    }

    /**
     * Soft delete - Désactive un fournisseur
     */
    public void softDeleteFournisseur(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        log.info("Soft delete (désactivation) du fournisseur avec l'id: {} pour client: {}", id, clientId);

        String sql = "UPDATE fournisseurs SET actif = false WHERE id_fournisseur = ? AND actif = true";
        // ✅ CORRECTION: Utiliser updateWithAuth
        int updated = tenantRepo.updateWithAuth(sql, clientId, authClientId, id);

        if (updated == 0) {
            throw new RuntimeException(String.format("Fournisseur non trouvé ou déjà désactivé avec l'id: %d", id));
        }

        log.info("Fournisseur désactivé avec succès");
    }

    /**
     * Hard delete - Suppression physique (réservé admin)
     */
    public void hardDeleteFournisseur(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        log.warn("⚠️ HARD DELETE du fournisseur avec l'id: {} pour client: {} - Action réservée admin", id, clientId);

        String sql = "DELETE FROM fournisseurs WHERE id_fournisseur = ?";
        // ✅ CORRECTION: Utiliser updateWithAuth
        int deleted = tenantRepo.updateWithAuth(sql, clientId, authClientId, id);

        if (deleted == 0) {
            throw new RuntimeException(String.format("Fournisseur non trouvé avec l'id: %d", id));
        }

        log.warn("Fournisseur supprimé définitivement");
    }

    /**
     * Réactive un fournisseur désactivé
     */
    public FournisseurDTO reactivateFournisseur(Integer id, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        log.info("Réactivation du fournisseur avec l'id: {} pour client: {}", id, clientId);

        String updateSql = "UPDATE fournisseurs SET actif = true WHERE id_fournisseur = ? AND actif = false";
        // ✅ CORRECTION: Utiliser updateWithAuth
        int updated = tenantRepo.updateWithAuth(updateSql, clientId, authClientId, id);

        if (updated == 0) {
            throw new RuntimeException(String.format("Fournisseur non trouvé ou déjà actif avec l'id: %d", id));
        }

        String selectSql = "SELECT * FROM fournisseurs WHERE id_fournisseur = ?";
        // ✅ CORRECTION: Utiliser queryForObjectAuth
        Fournisseur reactivated = tenantRepo.queryForObjectAuth(selectSql, fournisseurRowMapper(), clientId, authClientId, id);

        log.info("Fournisseur réactivé avec succès");
        return new FournisseurDTO(reactivated);
    }

    /**
     * Recherche paginée des fournisseurs actifs
     */
    @Transactional(readOnly = true)
    public Page<FournisseurDTO> searchActiveFournisseurs(String searchTerm, Pageable pageable, String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        log.info("Recherche de fournisseurs actifs avec le terme: '{}' pour client: {}", searchTerm, clientId);

        String countSql = "SELECT COUNT(*) FROM fournisseurs WHERE actif = true AND (nom_fournisseur LIKE ? OR email LIKE ?)";
        String searchPattern = "%" + searchTerm + "%";
        // ✅ CORRECTION: Utiliser queryForObjectAuth
        Integer total = tenantRepo.queryForObjectAuth(countSql, Integer.class, clientId, authClientId, searchPattern, searchPattern);

        String sql = """
            SELECT * FROM fournisseurs 
            WHERE actif = true AND (nom_fournisseur LIKE ? OR email LIKE ?) 
            ORDER BY nom_fournisseur ASC 
            LIMIT ? OFFSET ?
            """;

        // ✅ CORRECTION: Utiliser queryWithAuth
        List<Fournisseur> fournisseurs = tenantRepo.queryWithAuth(sql, fournisseurRowMapper(), clientId, authClientId,
                searchPattern, searchPattern, pageable.getPageSize(), pageable.getOffset());

        List<FournisseurDTO> dtos = fournisseurs.stream().map(FournisseurDTO::new).collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, total != null ? total : 0);
    }

    /**
     * Récupère les statistiques des fournisseurs
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getStats(String token) {
        Long clientId = getClientIdFromToken(token);
        String authClientId = String.valueOf(clientId);

        log.info("Récupération des statistiques des fournisseurs pour client: {}", clientId);

        Map<String, Object> stats = new HashMap<>();

        String totalSql = "SELECT COUNT(*) FROM fournisseurs";
        // ✅ CORRECTION: Utiliser queryForObjectAuth
        Long total = tenantRepo.queryForObjectAuth(totalSql, Long.class, clientId, authClientId);

        String actifsSql = "SELECT COUNT(*) FROM fournisseurs WHERE actif = true";
        // ✅ CORRECTION: Utiliser queryForObjectAuth
        Long actifs = tenantRepo.queryForObjectAuth(actifsSql, Long.class, clientId, authClientId);

        stats.put("total", total != null ? total : 0);
        stats.put("actifs", actifs != null ? actifs : 0);
        stats.put("inactifs", (total != null ? total : 0) - (actifs != null ? actifs : 0));

        String villeStatsSql = "SELECT ville, COUNT(*) FROM fournisseurs WHERE ville IS NOT NULL GROUP BY ville";
        // ✅ CORRECTION: Utiliser queryWithAuth
        List<Map<String, Object>> villeResults = tenantRepo.queryWithAuth(villeStatsSql,
                (rs, rowNum) -> Map.of("ville", rs.getString("ville"), "count", rs.getLong("count")),
                clientId, authClientId);

        Map<String, Long> villeMap = new HashMap<>();
        for (Map<String, Object> row : villeResults) {
            villeMap.put((String) row.get("ville"), (Long) row.get("count"));
        }
        stats.put("parVille", villeMap);

        String paysStatsSql = "SELECT pays, COUNT(*) FROM fournisseurs WHERE pays IS NOT NULL GROUP BY pays";
        // ✅ CORRECTION: Utiliser queryWithAuth
        List<Map<String, Object>> paysResults = tenantRepo.queryWithAuth(paysStatsSql,
                (rs, rowNum) -> Map.of("pays", rs.getString("pays"), "count", rs.getLong("count")),
                clientId, authClientId);

        Map<String, Long> paysMap = new HashMap<>();
        for (Map<String, Object> row : paysResults) {
            paysMap.put((String) row.get("pays"), (Long) row.get("count"));
        }
        stats.put("parPays", paysMap);

        return stats;
    }
}