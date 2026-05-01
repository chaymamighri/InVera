package org.erp.invera.repository.tenant;

import org.erp.invera.model.erp.Produit;
import org.erp.invera.model.erp.Utilisateur;
import org.erp.invera.model.erp.client.Client;
import org.erp.invera.model.erp.client.CommandeClient;
import org.erp.invera.model.erp.client.LigneCommandeClient;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Component
public class TenantRowMapper {

    // ==================== ROW MAPPER POUR UTILISATEURS ====================

    /**
     * RowMapper pour la liste des utilisateurs (sans mot de passe)
     * Utilisé pour getAllUsers()
     */
    public RowMapper<Map<String, Object>> userListRowMapper() {
        return (rs, rowNum) -> {
            Map<String, Object> user = new HashMap<>();
            user.put("id", rs.getLong("id"));
            user.put("email", rs.getString("email"));
            user.put("nom", rs.getString("nom") != null ? rs.getString("nom") : "");
            user.put("prenom", rs.getString("prenom") != null ? rs.getString("prenom") : "");
            user.put("role", rs.getString("role"));
            user.put("active", rs.getBoolean("active"));
            user.put("clientId", rs.getLong("client_id"));
            user.put("createdAt", rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null);
            user.put("lastLogin", rs.getTimestamp("last_login") != null ? rs.getTimestamp("last_login").toLocalDateTime() : null);
            return user;
        };
    }

    /**
     * RowMapper pour l'authentification (avec mot de passe)
     * Utilisé pour authenticate()
     */
    public RowMapper<Map<String, Object>> userAuthRowMapper() {
        return (rs, rowNum) -> {
            Map<String, Object> user = new HashMap<>();
            user.put("id", rs.getLong("id"));
            user.put("email", rs.getString("email"));
            user.put("mot_de_passe", rs.getString("mot_de_passe"));
            user.put("nom", rs.getString("nom") != null ? rs.getString("nom") : "");
            user.put("prenom", rs.getString("prenom") != null ? rs.getString("prenom") : "");
            user.put("role", rs.getString("role"));
            user.put("active", rs.getBoolean("active"));
            user.put("client_id", rs.getLong("client_id"));
            return user;
        };
    }

    /**
     * RowMapper pour l'entité Utilisateur complète
     * Utilisé pour findById(), findByEmail(), getEmployeesByClient()
     */
    public RowMapper<Utilisateur> utilisateurRowMapper() {
        return (rs, rowNum) -> {
            Utilisateur user = new Utilisateur();
            user.setId(rs.getLong("id"));
            user.setEmail(rs.getString("email"));
            user.setNom(rs.getString("nom"));
            user.setPrenom(rs.getString("prenom"));
            user.setActive(rs.getBoolean("active"));
            user.setClientId(rs.getLong("client_id"));

            String role = rs.getString("role");
            if (role != null) {
                user.setRole(Utilisateur.RoleUtilisateur.valueOf(role));
            }

            // ✅ Vérifie que ces lignes sont présentes
            if (rs.getTimestamp("created_at") != null) {
                user.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
            }
            if (rs.getTimestamp("last_login") != null) {
                user.setLastLogin(rs.getTimestamp("last_login").toLocalDateTime());
            }
            if (rs.getTimestamp("updated_at") != null) {
                user.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
            }

            user.setMotDePasse(rs.getString("mot_de_passe"));

            String preferredLanguage = rs.getString("preferred_language");
            if (preferredLanguage != null) {
                user.setPreferredLanguage(org.erp.invera.model.platform.PreferredLanguage.valueOf(preferredLanguage));
            }

            return user;
        };
    }
    // ==================== ROW MAPPER POUR COMMANDES ====================

    // ✅ RowMapper pour CommandeClient (complet)
    public RowMapper<CommandeClient> commandeRowMapper() {
        return (rs, rowNum) -> {
            CommandeClient commande = new CommandeClient();
            commande.setIdCommandeClient(rs.getInt("id_commande_client"));
            commande.setReferenceCommandeClient(rs.getString("reference_commande_client"));

            String statut = rs.getString("statut");
            if (statut != null) {
                commande.setStatut(CommandeClient.StatutCommande.valueOf(statut));
            }

            if (rs.getTimestamp("date_commande") != null) {
                commande.setDateCommande(rs.getTimestamp("date_commande").toLocalDateTime());
            }

            commande.setSousTotal(rs.getBigDecimal("sous_total") != null ?
                    rs.getBigDecimal("sous_total") : BigDecimal.ZERO);
            commande.setTauxRemise(rs.getBigDecimal("taux_remise") != null ?
                    rs.getBigDecimal("taux_remise") : BigDecimal.ZERO);
            commande.setTotal(rs.getBigDecimal("total") != null ?
                    rs.getBigDecimal("total") : BigDecimal.ZERO);

            return commande;
        };
    }

    // ✅ RowMapper pour LigneCommandeClient
    public RowMapper<LigneCommandeClient> ligneCommandeRowMapper() {
        return (rs, rowNum) -> {
            LigneCommandeClient ligne = new LigneCommandeClient();
            ligne.setIdLigneCommandeClient(rs.getInt("id_ligne_commande_client"));
            ligne.setQuantite(rs.getInt("quantite"));
            ligne.setPrixUnitaire(rs.getBigDecimal("prix_unitaire") != null ?
                    rs.getBigDecimal("prix_unitaire") : BigDecimal.ZERO);
            ligne.setSousTotal(rs.getBigDecimal("sous_total") != null ?
                    rs.getBigDecimal("sous_total") : BigDecimal.ZERO);
            return ligne;
        };
    }

    // ✅ RowMapper pour Produit (complet - avec tous les champs)
    public RowMapper<Produit> produitRowMapper() {
        return (rs, rowNum) -> {
            Produit produit = new Produit();
            produit.setIdProduit(rs.getInt("id_produit"));
            produit.setLibelle(rs.getString("libelle"));
            produit.setPrixVente(rs.getDouble("prix_vente"));
            produit.setPrixAchat(rs.getBigDecimal("prix_achat") != null ?
                    rs.getBigDecimal("prix_achat") : BigDecimal.ZERO);
            produit.setQuantiteStock(rs.getInt("quantite_stock"));

            // Statut (enum)
            String status = rs.getString("status");
            if (status != null) {
                produit.setStatus(Produit.StockStatus.valueOf(status));
            }

            // Unité de mesure (enum)
            String uniteMesure = rs.getString("unite_mesure");
            if (uniteMesure != null) {
                produit.setUniteMesure(Produit.UniteMesure.valueOf(uniteMesure));
            }

            produit.setActive(rs.getBoolean("is_active"));
            produit.setSeuilMinimum(rs.getInt("seuil_minimum"));
            produit.setImageUrl(rs.getString("image_url"));

            // remise_temporaire peut être null
            double remise = rs.getDouble("remise_temporaire");
            if (!rs.wasNull()) {
                produit.setRemiseTemporaire(remise);
            }

            produit.setCreatedBy(rs.getString("created_by"));

            if (rs.getTimestamp("created_at") != null) {
                produit.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
            }

            return produit;
        };
    }

    // ✅ RowMapper pour Client (complet)
    public RowMapper<Client> clientRowMapper() {
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
}