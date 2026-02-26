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
     * Récupérer une facture par son ID
     */
    public FactureClient getFactureById(Integer factureId) {
        return factureRepository.findById(factureId)
                .orElseThrow(() -> new RuntimeException("Facture non trouvée avec l'ID: " + factureId));
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