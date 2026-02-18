package org.erp.invera.service;

import org.erp.invera.model.*;
import org.erp.invera.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

@Service
public class FactureService {

    @Autowired
    private FactureClientRepository factureRepository;

    @Autowired
    private CommandeClientRepository commandeRepository;

    @Autowired
    private ClientRepository clientRepository;

    // ===== GÉNÉRATION =====

    /**
     * Génère une facture à partir d'une commande validée
     */
    @Transactional
    public FactureClient genererFactureDepuisCommande(Integer commandeId) {
        // 1. Récupérer la commande
        CommandeClient commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'ID: " + commandeId));

        // 2. Vérifier que la commande est validée
        if (commande.getStatut() != CommandeClient.StatutCommande.CONFIRMEE) {
            throw new RuntimeException("Seules les commandes validées peuvent être facturées");
        }

        // 3. Vérifier qu'une facture n'existe pas déjà
        if (factureRepository.existsByCommandeIdCommandeClient(commandeId)) {
            throw new RuntimeException("Une facture existe déjà pour cette commande");
        }

        // 4. Créer la facture
        FactureClient facture = new FactureClient();
        facture.setCommande(commande);
        facture.setClient(commande.getClient());
        facture.setDateFacture(LocalDateTime.now());
        facture.setReferenceFactureClient(genererReferenceFacture());
        facture.setMontantTotal(commande.getTotal());
        facture.setStatut(FactureClient.StatutFacture.NON_PAYE); // Par défaut non payée

        // 5. Sauvegarder
        return factureRepository.save(facture);
    }

    // ===== RECHERCHE PAR ID =====

    /**
     * Récupérer une facture par son ID
     */
    public FactureClient getFactureById(Integer factureId) {
        return factureRepository.findById(factureId)
                .orElseThrow(() -> new RuntimeException("Facture non trouvée avec l'ID: " + factureId));
    }

    // ===== RECHERCHE PAR RÉFÉRENCE =====

    /**
     * Récupérer une facture par sa référence
     */
    public FactureClient getFactureByReference(String reference) {
        return factureRepository.findByReferenceFactureClient(reference)
                .orElseThrow(() -> new RuntimeException("Facture non trouvée: " + reference));
    }

    // ===== RECHERCHE PAR COMMANDE =====

    /**
     * ✅ NOUVEAU - Récupérer une facture par ID de commande
     */
    public FactureClient getFactureByCommandeId(Integer commandeId) {
        return factureRepository.findByCommandeIdCommandeClient(commandeId)
                .orElse(null); // Retourne null si pas trouvée (pas d'exception)
    }

    // ===== LISTES =====

    /**
     * Récupérer toutes les factures
     */
    public List<FactureClient> getAllFactures() {
        return factureRepository.findAll();
    }

    /**
     * Récupérer les factures d'un client
     */
    public List<FactureClient> getFacturesByClient(Integer clientId) {
        return factureRepository.findByClientIdClient(clientId);
    }

    /**
     * Récupérer les factures par statut
     */
    public List<FactureClient> getFacturesByStatut(FactureClient.StatutFacture statut) {
        return factureRepository.findByStatut(statut);
    }

    // ===== MISE À JOUR =====

    /**
     * Marquer une facture comme payée
     */
    @Transactional
    public FactureClient marquerFacturePayee(Integer factureId) {
        FactureClient facture = getFactureById(factureId);
        facture.setStatut(FactureClient.StatutFacture.PAYE);
        return factureRepository.save(facture);
    }

    // ===== UTILITAIRES =====

    /**
     * Vérifier si une facture existe pour une commande
     */
    public boolean factureExistePourCommande(Integer commandeId) {
        return factureRepository.existsByCommandeIdCommandeClient(commandeId);
    }

    /**
     * Génère une référence unique pour la facture
     * Format: FAC-YYYYMMDD-XXXX
     */
    private String genererReferenceFacture() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
        String datePart = LocalDateTime.now().format(formatter);

        // Générer un nombre aléatoire entre 1000 et 9999
        int randomPart = 1000 + new Random().nextInt(9000);

        String reference = "FAC-" + datePart + "-" + randomPart;

        // Vérifier l'unicité
        while (factureRepository.existsByReferenceFactureClient(reference)) {
            randomPart = 1000 + new Random().nextInt(9000);
            reference = "FAC-" + datePart + "-" + randomPart;
        }

        return reference;
    }
}