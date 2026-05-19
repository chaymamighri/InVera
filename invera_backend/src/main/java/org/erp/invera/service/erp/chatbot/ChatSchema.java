package org.erp.invera.service.erp.chatbot;

import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class ChatSchema {

    private static final Set<String> SENSITIVE_COLUMNS = Set.of(
            "mot_de_passe", "password", "token", "secret", "jwt", "api_key", "refresh_token"
    );

    private static final Map<String, Set<String>> ALLOWED = Map.ofEntries(
            table("client", "id_client", "nom", "prenom", "email", "telephone", "adresse", "type_client", "created_at", "created_by"),
            table("users", "id", "email", "nom", "prenom", "role", "active", "client_id", "created_at", "last_login", "preferred_language"),
            table("fournisseurs", "id_fournisseur", "nom_fournisseur", "email", "telephone", "adresse", "ville", "pays", "actif", "created_at", "updated_at"),
            table("categorie", "id_categorie", "nom_categorie", "description", "taux_tva"),
            table("produit", "id_produit", "libelle", "prix_vente", "prix_achat", "quantite_stock", "seuil_minimum", "remise_temporaire", "status", "unite_mesure", "image_url", "is_active", "categorie_id", "fournisseur_id", "created_at", "created_by"),
            table("commande_client", "id_commande_client", "reference_commande_client", "date_commande", "sous_total", "taux_remise", "total", "statut", "client_id", "created_at", "created_by"),
            table("ligne_commande_client", "id_ligne_commande_client", "quantite", "prix_unitaire", "sous_total", "commande_client_id", "produit_id", "created_at", "created_by"),
            table("commandes_fournisseurs", "id_commande_fournisseur", "numero_commande", "date_commande", "date_livraison_prevue", "date_livraison_reelle", "statut", "totalht", "totalttc", "totaltva", "taux_tva", "adresse_livraison", "numero_bon_livraison", "actif", "created_at", "updated_at", "created_by"),
            table("lignes_commande_fournisseurs", "id_ligne_commande_fournisseur", "quantite", "quantite_recue", "prix_unitaire", "sous_total", "sous_total_ht", "sous_total_ttc", "montant_tva", "tauxtva", "actif", "commande_fournisseur_id", "produit_id", "created_at", "updated_at"),
            table("facture_client", "id_facture_client", "reference_facture_client", "date_facture", "montant_total", "statut", "client_id", "commande_id", "created_at", "created_by"),
            table("stock_movement", "id", "quantite", "stock_avant", "stock_apres", "prix_unitaire", "valeur_totale", "type_mouvement", "type_document", "commentaire", "date_mouvement", "produit_id", "created_at", "created_by")
    );

    private final TenantAwareRepository tenantRepo;

    public ChatSchema(TenantAwareRepository tenantRepo) {
        this.tenantRepo = tenantRepo;
    }

    public Snapshot forTenant(Long clientId) {
        List<Map<String, String>> rows = tenantRepo.query("""
                SELECT table_name, column_name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                ORDER BY table_name, ordinal_position
                """, (rs, rowNum) -> Map.of(
                "table", rs.getString("table_name").toLowerCase(Locale.ROOT),
                "column", rs.getString("column_name").toLowerCase(Locale.ROOT)
        ), clientId);

        Map<String, Set<String>> safe = new LinkedHashMap<>();
        for (Map<String, String> row : rows) {
            String table = row.get("table");
            String column = row.get("column");
            Set<String> allowedColumns = ALLOWED.get(table);
            if (allowedColumns != null && allowedColumns.contains(column) && !isSensitive(column)) {
                safe.computeIfAbsent(table, ignored -> new LinkedHashSet<>()).add(column);
            }
        }
        return new Snapshot(safe);
    }

    private boolean isSensitive(String column) {
        String lower = column.toLowerCase(Locale.ROOT);
        return SENSITIVE_COLUMNS.stream().anyMatch(lower::contains);
    }

    private static Map.Entry<String, Set<String>> table(String name, String... columns) {
        return Map.entry(name, new LinkedHashSet<>(List.of(columns)));
    }

    public record Snapshot(Map<String, Set<String>> tables) {
        public boolean hasTable(String table) {
            return tables.containsKey(table.toLowerCase(Locale.ROOT));
        }

        public boolean hasColumn(String table, String column) {
            String normalizedTable = table.toLowerCase(Locale.ROOT);
            String normalizedColumn = column.toLowerCase(Locale.ROOT);
            return tables.containsKey(normalizedTable) && tables.get(normalizedTable).contains(normalizedColumn);
        }

        public String promptText() {
            StringBuilder builder = new StringBuilder();
            tables.forEach((table, columns) -> builder
                    .append("- ")
                    .append(table)
                    .append("(")
                    .append(String.join(", ", columns))
                    .append(")\n"));
            return builder.toString();
        }
    }
}
