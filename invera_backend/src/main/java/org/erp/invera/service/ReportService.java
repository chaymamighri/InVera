package org.erp.invera.service;

import org.erp.invera.model.*;
import org.erp.invera.repository.CommandeClientRepository;
import org.erp.invera.repository.FactureClientRepository;
import org.erp.invera.repository.ClientRepository;
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

@Service
@RequiredArgsConstructor
public class ReportService {

    private final CommandeClientRepository commandeRepository;
    private final FactureClientRepository factureRepository;
    private final ClientRepository clientRepository;

    // ============== RAPPORT DES COMMANDES (VENTES) ==============

    public Map<String, Object> generateSalesReport(
            String period,
            LocalDate startDate,
            LocalDate endDate,
            String clientType,
            String status) {

        // Déterminer les dates selon la période
        DateRange dateRange = calculateDateRange(period, startDate, endDate);

        // Récupérer les commandes
        List<CommandeClient> commandes = commandeRepository.findByDateCommandeBetweenWithDetails(
                dateRange.getStartDateTime(),
                dateRange.getEndDateTime()
        );

        // Appliquer les filtres supplémentaires
        commandes = applyCommandeFilters(commandes, clientType, status);

        // Générer le rapport
        Map<String, Object> report = new HashMap<>();

        // Résumé
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalCA", calculateTotalCA(commandes));
        summary.put("totalCommandes", commandes.size());
        summary.put("panierMoyen", calculateAverageBasket(commandes));
        summary.put("evolution", calculateEvolution(commandes));
        summary.put("tauxTransformation", calculateTransformationRate(dateRange));

        report.put("summary", summary);

        // Détail des commandes
        List<Map<String, Object>> ventesList = commandes.stream()
                .map(this::mapCommandeToDTO)
                .collect(Collectors.toList());
        report.put("ventes", ventesList);

        // Statistiques par statut
        Map<String, Object> statsByStatus = new HashMap<>();
        Map<CommandeClient.StatutCommande, List<CommandeClient>> byStatus = commandes.stream()
                .collect(Collectors.groupingBy(CommandeClient::getStatut));

        byStatus.forEach((statut, list) -> {
            Map<String, Object> statutStats = new HashMap<>();
            statutStats.put("nombre", list.size());
            statutStats.put("montant", list.stream()
                    .map(CommandeClient::getTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
            statsByStatus.put(statut.getDisplayName(), statutStats);
        });
        report.put("statsParStatut", statsByStatus);

        // Informations sur la période
        report.put("period", period);
        report.put("startDate", dateRange.getStartDate().toString());
        report.put("endDate", dateRange.getEndDate().toString());

        return report;
    }

    // ============== RAPPORT DES FACTURES ==============

    public Map<String, Object> generateInvoicesReport(
            String period,
            LocalDate startDate,
            LocalDate endDate,
            String clientType,
            String status) {

        DateRange dateRange = calculateDateRange(period, startDate, endDate);

        List<FactureClient> factures = factureRepository.findByDateFactureBetween(
                dateRange.getStartDateTime(),
                dateRange.getEndDateTime()
        );

        factures = applyFactureFilters(factures, clientType, status);

        Map<String, Object> report = new HashMap<>();

        // Résumé
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
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal montantImpaye = factures.stream()
                .filter(f -> FactureClient.StatutFacture.NON_PAYE.equals(f.getStatut()))
                .map(FactureClient::getMontantTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        summary.put("montantPaye", montantPaye);
        summary.put("montantImpaye", montantImpaye);
        summary.put("tauxRecouvrement", calculateRecoveryRate(factures));

        // Factures en retard (plus de 30 jours)
        LocalDateTime dateLimite = LocalDateTime.now().minusDays(30);
        long enRetard = factures.stream()
                .filter(f -> FactureClient.StatutFacture.NON_PAYE.equals(f.getStatut()))
                .filter(f -> f.getDateFacture().isBefore(dateLimite))
                .count();
        summary.put("enRetard", enRetard);

        report.put("summary", summary);

        // Détail des factures
        List<Map<String, Object>> facturesList = factures.stream()
                .map(this::mapFactureToDTO)
                .collect(Collectors.toList());
        report.put("factures", facturesList);

        report.put("period", period);

        return report;
    }

    // ============== RAPPORT DES CLIENTS ==============
// ============== RAPPORT DES CLIENTS (VERSION CORRIGÉE) ==============

    public Map<String, Object> generateClientsReport(
            String period,
            LocalDate startDate,
            LocalDate endDate,
            String clientType) {

        DateRange dateRange = calculateDateRange(period, startDate, endDate);

        List<Client> clients = clientRepository.findAll();

        // Filtrer par type de client si nécessaire (clientType est un String)
        if (!"all".equals(clientType) && clientType != null && !clientType.isEmpty()) {
            clients = clients.stream()
                    .filter(c -> {
                        // Comparer le String clientType avec la valeur de l'enum convertie en String
                        if (c.getTypeClient() == null) return false;
                        return clientType.equals(c.getTypeClient().name()); // .name() convertit l'enum en String
                    })
                    .collect(Collectors.toList());
        }

        Map<String, Object> report = new HashMap<>();

        // ===== RÉSUMÉ =====
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalClients", clients.size());

        // Nouveaux clients dans la période
        long nouveauxClients = clients.stream()
                .filter(c -> c.getCreatedAt() != null)
                .filter(c -> !c.getCreatedAt().toLocalDate().isBefore(dateRange.getStartDate()))
                .count();
        summary.put("nouveauxClients", nouveauxClients);

        // Clients actifs (ont passé commande dans la période)
        List<CommandeClient> commandesPeriode = commandeRepository.findByDateCommandeBetween(
                dateRange.getStartDateTime(),
                dateRange.getEndDateTime()
        );

        Set<Integer> clientsActifsIds = commandesPeriode.stream()
                .map(c -> c.getClient().getIdClient())
                .collect(Collectors.toSet());
        summary.put("clientsActifs", clientsActifsIds.size());

        // CA total
        BigDecimal caTotal = commandesPeriode.stream()
                .map(CommandeClient::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        summary.put("caTotal", caTotal);

        report.put("summary", summary);

        // ===== TOP CLIENTS =====
        Map<Integer, ClientStats> statsByClient = new HashMap<>();

        commandesPeriode.forEach(commande -> {
            Client client = commande.getClient();
            if (client != null) {
                String nomClient = (client.getNom() != null ? client.getNom() : "") + " " +
                        (client.getPrenom() != null ? client.getPrenom() : "");
                String typeClient = client.getTypeClient() != null ?
                        client.getTypeClient().name() : "NON_DEFINI"; // .name() pour String

                ClientStats stats = statsByClient.getOrDefault(client.getIdClient(),
                        new ClientStats(nomClient.trim(), typeClient));

                stats.addCommande(commande.getTotal());
                statsByClient.put(client.getIdClient(), stats);
            }
        });

        List<Map<String, Object>> topClients = statsByClient.values().stream()
                .sorted((s1, s2) -> s2.getCa().compareTo(s1.getCa()))
                .limit(10)
                .map(ClientStats::toMap)
                .collect(Collectors.toList());
        report.put("topClients", topClients);

        // ===== RÉPARTITION PAR TYPE DE CLIENT (CORRIGÉ) =====
        Map<String, Object> repartition = new HashMap<>();
        Map<String, List<Client>> byType = new HashMap<>();

        // Grouper les clients par type (en convertissant l'enum en String)
        for (Client client : clients) {
            String type = "NON_DEFINI";
            if (client.getTypeClient() != null) {
                type = client.getTypeClient().name(); // Conversion enum → String
            }

            byType.computeIfAbsent(type, k -> new ArrayList<>()).add(client);
        }

        // Calculer les stats pour chaque type
        for (Map.Entry<String, List<Client>> entry : byType.entrySet()) {
            String type = entry.getKey();
            List<Client> clientList = entry.getValue();

            Map<String, Object> typeStats = new HashMap<>();
            typeStats.put("nombre", clientList.size());

            // CA pour ce type
            BigDecimal ca = commandesPeriode.stream()
                    .filter(c -> c.getClient() != null)
                    .filter(c -> {
                        if (c.getClient().getTypeClient() == null) return false;
                        return type.equals(c.getClient().getTypeClient().name());
                    })
                    .map(CommandeClient::getTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            typeStats.put("ca", ca);

            // Panier moyen pour ce type
            long commandesType = commandesPeriode.stream()
                    .filter(c -> c.getClient() != null)
                    .filter(c -> {
                        if (c.getClient().getTypeClient() == null) return false;
                        return type.equals(c.getClient().getTypeClient().name());
                    })
                    .count();

            BigDecimal panierMoyen = commandesType > 0 ?
                    ca.divide(BigDecimal.valueOf(commandesType), 2, RoundingMode.HALF_UP) :
                    BigDecimal.ZERO;
            typeStats.put("panierMoyen", panierMoyen);

            repartition.put(type, typeStats);
        }

        report.put("repartitionParType", repartition);

        report.put("period", period);
        report.put("startDate", dateRange.getStartDate().toString());
        report.put("endDate", dateRange.getEndDate().toString());

        return report;
    }

    // ============== CLASSES INTERNES ==============

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

        public LocalDate getStartDate() {
            return startDate;
        }

        public LocalDate getEndDate() {
            return endDate;
        }

        public LocalDateTime getStartDateTime() {
            return startDate.atStartOfDay();
        }

        public LocalDateTime getEndDateTime() {
            return endDate.atTime(LocalTime.MAX);
        }
    }

    // ============== MÉTHODES UTILITAIRES ==============

    private DateRange calculateDateRange(String period, LocalDate startDate, LocalDate endDate) {
        LocalDate now = LocalDate.now();
        LocalDate start;
        LocalDate end = now;

        if ("custom".equals(period) && startDate != null && endDate != null) {
            start = startDate;
            end = endDate;
        } else {
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
        }

        return new DateRange(start, end);
    }

    private List<CommandeClient> applyCommandeFilters(
            List<CommandeClient> commandes,
            String clientType,
            String status) {

        return commandes.stream()
                .filter(cmd -> "all".equals(clientType) ||
                        (cmd.getClient() != null && clientType.equals(cmd.getClient().getTypeClient())))
                .filter(cmd -> "all".equals(status) ||
                        status.equals(cmd.getStatut().name()))
                .collect(Collectors.toList());
    }

    private List<FactureClient> applyFactureFilters(
            List<FactureClient> factures,
            String clientType,
            String status) {

        return factures.stream()
                .filter(f -> "all".equals(clientType) ||
                        (f.getClient() != null && clientType.equals(f.getClient().getTypeClient())))
                .filter(f -> "all".equals(status) ||
                        status.equals(f.getStatut().name()))
                .collect(Collectors.toList());
    }

    private BigDecimal calculateTotalCA(List<CommandeClient> commandes) {
        return commandes.stream()
                .map(CommandeClient::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateAverageBasket(List<CommandeClient> commandes) {
        if (commandes.isEmpty()) return BigDecimal.ZERO;
        return calculateTotalCA(commandes)
                .divide(BigDecimal.valueOf(commandes.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateEvolution(List<CommandeClient> commandes) {
        if (commandes.size() < 2) return BigDecimal.ZERO;

        int moitie = commandes.size() / 2;
        List<CommandeClient> premiereMoitie = commandes.subList(0, moitie);
        List<CommandeClient> deuxiemeMoitie = commandes.subList(moitie, commandes.size());

        BigDecimal ca1 = calculateTotalCA(premiereMoitie);
        BigDecimal ca2 = calculateTotalCA(deuxiemeMoitie);

        if (ca1.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.valueOf(100);

        return ca2.subtract(ca1)
                .multiply(BigDecimal.valueOf(100))
                .divide(ca1, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateTransformationRate(DateRange dateRange) {
        // Taux de transformation (commandes confirmées / total)
        List<CommandeClient> toutesCommandes = commandeRepository.findByDateCommandeBetween(
                dateRange.getStartDateTime(),
                dateRange.getEndDateTime()
        );

        if (toutesCommandes.isEmpty()) return BigDecimal.ZERO;

        long confirmees = toutesCommandes.stream()
                .filter(c -> CommandeClient.StatutCommande.CONFIRMEE.equals(c.getStatut()))
                .count();

        return BigDecimal.valueOf(confirmees)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(toutesCommandes.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateTotalAmount(List<FactureClient> factures) {
        return factures.stream()
                .map(FactureClient::getMontantTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateRecoveryRate(List<FactureClient> factures) {
        BigDecimal total = calculateTotalAmount(factures);
        if (total.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;

        BigDecimal paye = factures.stream()
                .filter(f -> FactureClient.StatutFacture.PAYE.equals(f.getStatut()))
                .map(FactureClient::getMontantTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return paye.multiply(BigDecimal.valueOf(100))
                .divide(total, 2, RoundingMode.HALF_UP);
    }

    private Map<String, Object> mapCommandeToDTO(CommandeClient commande) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", commande.getIdCommandeClient());
        map.put("reference", commande.getReferenceCommandeClient());
        map.put("date", commande.getDateCommande().format(DateTimeFormatter.ISO_DATE));
        map.put("client", commande.getClient() != null ?
                commande.getClient().getNom() + " " + commande.getClient().getPrenom() : "Client inconnu");
        map.put("montant", commande.getTotal());
        map.put("statut", commande.getStatut().getDisplayName());
        map.put("sousTotal", commande.getSousTotal());
        map.put("tauxRemise", commande.getTauxRemise());
        map.put("nbProduits", commande.getLignesCommande() != null ?
                commande.getLignesCommande().size() : 0);
        return map;
    }

    private Map<String, Object> mapFactureToDTO(FactureClient facture) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", facture.getIdFactureClient());
        map.put("numero", facture.getReferenceFactureClient());
        map.put("date", facture.getDateFacture().format(DateTimeFormatter.ISO_DATE));
        map.put("client", facture.getClient() != null ?
                facture.getClient().getNom() + " " + facture.getClient().getPrenom() : "Client inconnu");
        map.put("montant", facture.getMontantTotal());
        map.put("statut", facture.getStatut() == FactureClient.StatutFacture.PAYE ? "Payée" : "Impayée");
        map.put("commandeRef", facture.getCommande() != null ?
                facture.getCommande().getReferenceCommandeClient() : null);
        return map;
    }
}