package org.erp.invera.repository.tenant;

import org.erp.invera.model.erp.Produit;
import org.erp.invera.model.erp.client.Client;
import org.erp.invera.model.erp.client.CommandeClient;
import org.erp.invera.model.erp.client.LigneCommandeClient;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;

@Component
public class TenantRowMapper {

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