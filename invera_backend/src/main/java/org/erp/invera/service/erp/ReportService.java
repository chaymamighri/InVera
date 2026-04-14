package org.erp.invera.service.erp;

import jakarta.transaction.Transactional;
import org.erp.invera.model.erp.client.Client;
import org.erp.invera.model.erp.client.CommandeClient;
import org.erp.invera.model.erp.client.FactureClient;
import org.erp.invera.repository.erp.CommandeClientRepository;
import org.erp.invera.repository.erp.FactureClientRepository;
import org.erp.invera.repository.erp.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;


/**
 * Service de génération de rapports (ventes, factures, clients).
 *
 * Ce fichier génère des rapports pour l'analyse commerciale :
 *
 * 1. RAPPORT DES VENTES :
 *    - Chiffre d'affaires total
 *    - Nombre de commandes et panier moyen
 *    - Taux de transformation
 *    - Détail des commandes (avec responsable)
 *    - Statistiques par statut (confirmée, livrée, annulée...)
 *
 * 2. RAPPORT DES FACTURES :
 *    - Montant total facturé
 *    - Factures payées vs impayées
 *    - Taux de recouvrement
 *    - Factures en retard (+30 jours)
 *
 * 3. RAPPORT DES CLIENTS :
 *    - Clients actifs vs inactifs
 *    - Top 10 clients (par chiffre d'affaires)
 *    - Répartition par type (particulier, professionnel...)
 *
 * Tous les rapports peuvent être filtrés par période (aujourd'hui,
 * semaine, mois, trimestre, année) ou par dates personnalisées.
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    private final CommandeClientRepository commandeRepository;
    private final FactureClientRepository factureRepository;
    private final ClientRepository clientRepository;

    // ============== RAPPORT DES COMMANDES (VENTES) ==============

    @Transactional
    public Map<String, Object> generateSalesReport(
            String period,
            LocalDate startDate,
            LocalDate endDate,
            String clientType,
            String status) {

        System.out.println("========== generateSalesReport ==========");
        System.out.println("period: " + period);
        System.out.println("startDate: " + startDate);
        System.out.println("endDate: " + endDate);
        System.out.println("clientType: " + clientType);
        System.out.println("status: " + status);

        // Déterminer les dates selon la période
        DateRange dateRange = calculateDateRange(period, startDate, endDate);

        System.out.println("DateRange start: " + dateRange.getStartDateTime());
        System.out.println("DateRange end: " + dateRange.getEndDateTime());

        // ✅ Récupérer TOUTES les commandes SANS LIMITE
        List<CommandeClient> commandes;

        if (startDate != null && endDate != null) {
            commandes = commandeRepository.findByDateCommandeBetween(
                    dateRange.getStartDateTime(),
                    dateRange.getEndDateTime()
            );
        } else {
            commandes = commandeRepository.findAll();
        }

        System.out.println("Total commandes avant filtres: " + commandes.size());

        // Appliquer les filtres supplémentaires
        commandes = applyCommandeFilters(commandes, clientType, status);

        System.out.println("Total commandes après filtres: " + commandes.size());

        // Afficher les 5 premières commandes pour déboguer
        if (!commandes.isEmpty()) {
            System.out.println("Exemples de commandes:");
            commandes.stream().limit(5).forEach(cmd -> {
                System.out.println("  - " + cmd.getReferenceCommandeClient() +
                        " | " + cmd.getDateCommande() +
                        " | " + cmd.getTotal() +
                        " | " + cmd.getStatut() +
                        " | créé par: " + cmd.getCreatedBy());
            });
        }

        // Générer le rapport
        Map<String, Object> report = new HashMap<>();

        // Résumé
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalCA", calculateTotalCA(commandes));
        summary.put("totalCommandes", commandes.size());
        summary.put("panierMoyen", calculateAverageBasket(commandes));
        summary.put("tauxTransformation", calculateTransformationRate(commandes));

        report.put("summary", summary);

        // Détail des commandes (INCLUT MAINTENANT created_by)
        List<Map<String, Object>> ventesList = commandes.stream()
                .map(this::mapCommandeToDTO)
                .collect(Collectors.toList());
        report.put("ventes", ventesList);

        // Statistiques par statut
        Map<String, Object> statsByStatus = new HashMap<>();
        Map<CommandeClient.StatutCommande, List<CommandeClient>> byStatus = commandes.stream()
                .filter(cmd -> cmd.getStatut() != null)
                .collect(Collectors.groupingBy(CommandeClient::getStatut));

        byStatus.forEach((statut, list) -> {
            Map<String, Object> statutStats = new HashMap<>();
            statutStats.put("nombre", list.size());
            statutStats.put("montant", list.stream()
                    .map(CommandeClient::getTotal)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
            statsByStatus.put(statut.name(), statutStats);
        });
        report.put("statsParStatut", statsByStatus);

        // Informations sur la période
        report.put("period", period);
        if (startDate != null && endDate != null) {
            report.put("startDate", startDate.toString());
            report.put("endDate", endDate.toString());
        }

        System.out.println("Rapport final - Commandes: " + ventesList.size());
        System.out.println("=========================================");

        return report;
    }

    // ============== RAPPORT DES FACTURES ==============

    public Map<String, Object> generateInvoicesReport(
            String period,
            LocalDate startDate,
            LocalDate endDate,
            String clientType,
            String status) {

        System.out.println("========== generateInvoicesReport ==========");
        System.out.println("period: " + period);
        System.out.println("startDate: " + startDate);
        System.out.println("endDate: " + endDate);
        System.out.println("clientType: " + clientType);
        System.out.println("status: " + status);

        DateRange dateRange = calculateDateRange(period, startDate, endDate);

        System.out.println("DateRange start: " + dateRange.getStartDateTime());
        System.out.println("DateRange end: " + dateRange.getEndDateTime());

        List<FactureClient> factures;

        if (startDate != null && endDate != null) {
            factures = factureRepository.findByDateFactureBetween(
                    dateRange.getStartDateTime(),
                    dateRange.getEndDateTime()
            );
        } else {
            factures = factureRepository.findAll();
        }

        System.out.println("Total factures avant filtres: " + factures.size());

        if (!factures.isEmpty()) {
            System.out.println("Exemples de factures:");
            factures.stream().limit(5).forEach(f -> {
                System.out.println("  - " + f.getReferenceFactureClient() +
                        " | " + f.getDateFacture() +
                        " | " + f.getMontantTotal() +
                        " | " + f.getStatut());
            });
        }

        factures = applyFactureFilters(factures, clientType, status);

        System.out.println("Total factures après filtres: " + factures.size());

        Map<String, Object> report = new HashMap<>();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalFactures", factures.size());
        summary.put("montantTotal", calculateTotalAmount(factures));

        long payees = factures.stream()
                .filter(f -> FactureClient.StatutFacture.PAYE.equals(f.getStatut()))
                .count();
        long impayees = factures.stream()
                .filter(f -> FactureClient.StatutFacture.NON_PAYE.equals(f.getStatut()))
                .count();

        summary.put("payees", payees);
        summary.put("impayees", impayees);

        BigDecimal montantPaye = factures.stream()
                .filter(f -> FactureClient.StatutFacture.PAYE.equals(f.getStatut()))
                .map(FactureClient::getMontantTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal montantImpaye = factures.stream()
                .filter(f -> FactureClient.StatutFacture.NON_PAYE.equals(f.getStatut()))
                .map(FactureClient::getMontantTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        summary.put("montantPaye", montantPaye);
        summary.put("montantImpaye", montantImpaye);
        summary.put("tauxRecouvrement", calculateRecoveryRate(factures));

        LocalDateTime dateLimite = LocalDateTime.now().minusDays(30);
        long enRetard = factures.stream()
                .filter(f -> FactureClient.StatutFacture.NON_PAYE.equals(f.getStatut()))
                .filter(f -> f.getDateFacture() != null && f.getDateFacture().isBefore(dateLimite))
                .count();
        summary.put("enRetard", enRetard);

        report.put("summary", summary);

        List<Map<String, Object>> facturesList = factures.stream()
                .map(this::mapFactureToDTO)
                .collect(Collectors.toList());
        report.put("factures", facturesList);

        report.put("period", period);
        if (startDate != null && endDate != null) {
            report.put("startDate", startDate.toString());
            report.put("endDate", endDate.toString());
        }

        System.out.println("Rapport final - Factures: " + facturesList.size());
        System.out.println("=========================================");

        return report;
    }

    // ============== MÉTHODES PRIVÉES CORRIGÉES ==============

    private DateRange calculateDateRange(String period, LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null) {
            return new DateRange(startDate, endDate);
        }

        LocalDate now = LocalDate.now();
        LocalDate start;
        LocalDate end = now;

        if (period != null) {
            switch (period) {
                case "today":
                    start = now;
                    break;
                case "week":
                    start = now.minusWeeks(1);
                    break;
                case "month":
                    start = now.minusMonths(1);
                    break;
                case "quarter":
                    start = now.minusMonths(3);
                    break;
                case "year":
                    start = now.minusYears(1);
                    break;
                default:
                    start = now.minusMonths(1);
            }
        } else {
            start = now.minusMonths(1);
        }

        return new DateRange(start, end);
    }

    private List<CommandeClient> applyCommandeFilters(
            List<CommandeClient> commandes,
            String clientType,
            String status) {

        return commandes.stream()
                .filter(cmd -> {
                    if (clientType == null || "all".equals(clientType)) return true;
                    if (cmd.getClient() == null) return false;
                    if (cmd.getClient().getTypeClient() == null) return false;
                    return clientType.equals(cmd.getClient().getTypeClient().name());
                })
                .filter(cmd -> {
                    if (status == null || "all".equals(status)) return true;
                    if (cmd.getStatut() == null) return false;
                    return status.equals(cmd.getStatut().name());
                })
                .collect(Collectors.toList());
    }

    private List<FactureClient> applyFactureFilters(
            List<FactureClient> factures,
            String clientType,
            String status) {

        return factures.stream()
                .filter(f -> {
                    if (clientType == null || "all".equals(clientType)) return true;
                    if (f.getClient() == null) return false;
                    if (f.getClient().getTypeClient() == null) return false;
                    return clientType.equals(f.getClient().getTypeClient().name());
                })
                .filter(f -> {
                    if (status == null || "all".equals(status)) return true;
                    if (f.getStatut() == null) return false;
                    return status.equals(f.getStatut().name());
                })
                .collect(Collectors.toList());
    }

    private BigDecimal calculateTotalCA(List<CommandeClient> commandes) {
        return commandes.stream()
                .map(CommandeClient::getTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateAverageBasket(List<CommandeClient> commandes) {
        if (commandes.isEmpty()) return BigDecimal.ZERO;
        return calculateTotalCA(commandes)
                .divide(BigDecimal.valueOf(commandes.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateTransformationRate(List<CommandeClient> commandes) {
        if (commandes.isEmpty()) return BigDecimal.ZERO;

        long confirmees = commandes.stream()
                .filter(c -> CommandeClient.StatutCommande.CONFIRMEE.equals(c.getStatut()))
                .count();

        return BigDecimal.valueOf(confirmees)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(commandes.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateTotalAmount(List<FactureClient> factures) {
        return factures.stream()
                .map(FactureClient::getMontantTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateRecoveryRate(List<FactureClient> factures) {
        BigDecimal total = calculateTotalAmount(factures);
        if (total.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;

        BigDecimal paye = factures.stream()
                .filter(f -> FactureClient.StatutFacture.PAYE.equals(f.getStatut()))
                .map(FactureClient::getMontantTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return paye.multiply(BigDecimal.valueOf(100))
                .divide(total, 2, RoundingMode.HALF_UP);
    }

    /**
     * Convertit une commande en Map pour l'API.
     * Inclut maintenant le champ "created_by" (responsable).
     */
    private Map<String, Object> mapCommandeToDTO(CommandeClient commande) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", commande.getIdCommandeClient());
        map.put("reference", commande.getReferenceCommandeClient());
        map.put("date", commande.getDateCommande() != null ?
                commande.getDateCommande().format(DateTimeFormatter.ISO_DATE) : "");
        map.put("client", commande.getClient() != null ?
                (commande.getClient().getNom() != null ? commande.getClient().getNom() : "") + " " +
                        (commande.getClient().getPrenom() != null ? commande.getClient().getPrenom() : "").trim() : "Client inconnu");
        map.put("montant", commande.getTotal() != null ? commande.getTotal() : BigDecimal.ZERO);
        map.put("statut", commande.getStatut() != null ? commande.getStatut().name() : "INCONNU");
        map.put("nbProduits", commande.getLignesCommande() != null ? commande.getLignesCommande().size() : 0);

        // ✅ AJOUT DU RESPONSABLE (créateur de la commande)
        // Le champ "created_by" est automatiquement renseigné par Spring Data Auditing
        map.put("created_by", commande.getCreatedBy() != null ? commande.getCreatedBy() : "");

        return map;
    }

    private Map<String, Object> mapFactureToDTO(FactureClient facture) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", facture.getIdFactureClient());
        map.put("numero", facture.getReferenceFactureClient());
        map.put("date", facture.getDateFacture() != null ?
                facture.getDateFacture().format(DateTimeFormatter.ISO_DATE) : "");
        map.put("client", facture.getClient() != null ?
                (facture.getClient().getNom() != null ? facture.getClient().getNom() : "") + " " +
                        (facture.getClient().getPrenom() != null ? facture.getClient().getPrenom() : "").trim() : "Client inconnu");
        map.put("montant", facture.getMontantTotal() != null ? facture.getMontantTotal() : BigDecimal.ZERO);
        map.put("statut", facture.getStatut() == FactureClient.StatutFacture.PAYE ? "Payée" : "Impayée");
        return map;
    }

    // ============== RAPPORT DES CLIENTS ==============
    public Map<String, Object> generateClientsReport(
            String period,
            LocalDate startDate,
            LocalDate endDate,
            String clientType) {

        System.out.println("========== generateClientsReport ==========");
        System.out.println("period: " + period);
        System.out.println("startDate: " + startDate);
        System.out.println("endDate: " + endDate);
        System.out.println("clientType: " + clientType);

        List<Client> allClients = clientRepository.findAll();
        System.out.println("Total clients en base: " + allClients.size());

        List<Client> filteredClients;
        if (clientType != null && !"all".equals(clientType) && !clientType.isEmpty()) {
            filteredClients = allClients.stream()
                    .filter(c -> c.getTypeClient() != null)
                    .filter(c -> clientType.equals(c.getTypeClient().name()))
                    .collect(Collectors.toList());
            System.out.println("Après filtre type: " + filteredClients.size());
        } else {
            filteredClients = allClients;
        }

        List<CommandeClient> allCommandes = commandeRepository.findAll();
        System.out.println("Total commandes en base: " + allCommandes.size());

        Map<String, Object> report = new HashMap<>();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalClients", filteredClients.size());

        Set<Integer> clientsAyantCommande = allCommandes.stream()
                .map(c -> c.getClient().getIdClient())
                .collect(Collectors.toSet());
        long clientsActifs = filteredClients.stream()
                .filter(c -> clientsAyantCommande.contains(c.getIdClient()))
                .count();
        long clientsInactifs = filteredClients.size() - clientsActifs;

        summary.put("clientsActifs", clientsActifs);
        summary.put("clientsInactifs", clientsInactifs);
        report.put("summary", summary);

        // Top clients
        Map<Integer, ClientStats> statsByClient = new HashMap<>();
        for (CommandeClient commande : allCommandes) {
            Client client = commande.getClient();
            if (client != null && filteredClients.contains(client)) {
                String nomClient = (client.getNom() != null ? client.getNom() : "") + " " +
                        (client.getPrenom() != null ? client.getPrenom() : "");
                String type = client.getTypeClient() != null ? client.getTypeClient().name() : "NON_DEFINI";

                ClientStats stats = statsByClient.getOrDefault(client.getIdClient(),
                        new ClientStats(nomClient.trim(), type));
                stats.addCommande(commande.getTotal());
                statsByClient.put(client.getIdClient(), stats);
            }
        }

        List<Map<String, Object>> topClients = statsByClient.values().stream()
                .sorted((s1, s2) -> s2.getCa().compareTo(s1.getCa()))
                .limit(10)
                .map(ClientStats::toMap)
                .collect(Collectors.toList());
        report.put("topClients", topClients);

        // Répartition par type
        Map<String, Object> repartitionParType = new HashMap<>();
        Map<String, List<Client>> byType = new HashMap<>();

        for (Client client : filteredClients) {
            String type = client.getTypeClient() != null ? client.getTypeClient().name() : "NON_DEFINI";
            byType.computeIfAbsent(type, k -> new ArrayList<>()).add(client);
        }

        for (Map.Entry<String, List<Client>> entry : byType.entrySet()) {
            String type = entry.getKey();
            List<Client> clientList = entry.getValue();

            Map<String, Object> typeStats = new HashMap<>();
            typeStats.put("nombre", clientList.size());

            BigDecimal ca = allCommandes.stream()
                    .filter(c -> c.getClient() != null && c.getClient().getTypeClient() != null)
                    .filter(c -> type.equals(c.getClient().getTypeClient().name()))
                    .filter(c -> filteredClients.contains(c.getClient()))
                    .map(CommandeClient::getTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            typeStats.put("ca", ca);

            repartitionParType.put(type, typeStats);
        }
        report.put("repartitionParType", repartitionParType);

        report.put("period", period);
        if (startDate != null && endDate != null) {
            report.put("startDate", startDate.toString());
            report.put("endDate", endDate.toString());
        }

        System.out.println("Rapport final - Clients: " + filteredClients.size());
        System.out.println("=========================================");

        return report;
    }

    // ========== CLASSES INTERNES ==============

    private static class ClientStats {
        private String nom;
        private String type;
        private BigDecimal ca = BigDecimal.ZERO;
        private int commandes = 0;

        public ClientStats(String nom, String type) {
            this.nom = nom;
            this.type = type;
        }

        public void addCommande(BigDecimal montant) {
            this.ca = this.ca.add(montant);
            this.commandes++;
        }

        public BigDecimal getCa() {
            return ca;
        }

        public Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("nom", nom);
            map.put("type", type);
            map.put("ca", ca);
            map.put("commandes", commandes);
            map.put("panierMoyen", commandes > 0 ?
                    ca.divide(BigDecimal.valueOf(commandes), 2, RoundingMode.HALF_UP) :
                    BigDecimal.ZERO);
            return map;
        }
    }

    private static class DateRange {
        private final LocalDate startDate;
        private final LocalDate endDate;

        public DateRange(LocalDate startDate, LocalDate endDate) {
            this.startDate = startDate;
            this.endDate = endDate;
        }

        public LocalDateTime getStartDateTime() {
            return startDate.atStartOfDay();
        }

        public LocalDateTime getEndDateTime() {
            return endDate.atTime(LocalTime.MAX);
        }
    }
}