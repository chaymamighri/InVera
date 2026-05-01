package org.erp.invera.controller.erp;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.erp.commandeFornisseurdto.CommandeFournisseurDTO;
import org.erp.invera.dto.erp.commandeFornisseurdto.ReceptionDTO;
import org.erp.invera.service.erp.CommandeFournisseurService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Contrôleur des commandes fournisseurs (achats) - MULTI-TENANT.
 *
 * Cycle de vie d'une commande :
 * BROUILLON → VALIDEE → ENVOYEE → RECUE
 *
 * Tous les endpoints extraient le tenant depuis le token JWT.
 */
@RestController
@RequestMapping("/api/commandes-fournisseurs")
@RequiredArgsConstructor
public class CommandeFournisseurController {

    private final CommandeFournisseurService commandeService;

    // ==================== MÉTHODE UTILITAIRE ====================

    /**
     * Extrait le token JWT de la requête HTTP
     */
    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        throw new RuntimeException("Token JWT manquant ou invalide");
    }

    // ==================== GET ALL ====================

    @GetMapping("/All")
    public ResponseEntity<List<CommandeFournisseurDTO>> getAllCommandes(HttpServletRequest request) {
        String token = extractToken(request);
        return ResponseEntity.ok(commandeService.getAll(token));
    }

    // ==================== GET BY ID ====================

    @GetMapping("/{id}")
    public ResponseEntity<CommandeFournisseurDTO> getCommandeById(
            @PathVariable Integer id,
            HttpServletRequest request) {
        String token = extractToken(request);
        return ResponseEntity.ok(commandeService.getCommandeById(id, token));
    }

    // ==================== CREATE ====================

    @PostMapping("/add")
    public ResponseEntity<CommandeFournisseurDTO> createCommande(
            @Valid @RequestBody CommandeFournisseurDTO commandeDTO,
            HttpServletRequest request) {

        String token = extractToken(request);
        CommandeFournisseurDTO commande = commandeService.creerCommande(commandeDTO, token);

        return new ResponseEntity<>(commande, HttpStatus.CREATED);
    }

    // ==================== UPDATE ====================

    @PutMapping("/update/{id}")
    public ResponseEntity<CommandeFournisseurDTO> updateCommande(
            @PathVariable Integer id,
            @Valid @RequestBody CommandeFournisseurDTO commandeDTO,
            HttpServletRequest request) {

        String token = extractToken(request);
        CommandeFournisseurDTO commande = commandeService.modifierCommande(id, commandeDTO, token);
        return ResponseEntity.ok(commande);
    }

    // ==================== DELETE ====================

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteCommande(
            @PathVariable Integer id,
            HttpServletRequest request) {
        String token = extractToken(request);
        commandeService.supprimerCommande(id, token);
        return ResponseEntity.noContent().build();
    }

    // ==================== STATUTS ====================

    @PutMapping("/{id}/valider")
    public ResponseEntity<CommandeFournisseurDTO> validerCommande(
            @PathVariable Integer id,
            HttpServletRequest request) {
        String token = extractToken(request);
        return ResponseEntity.ok(commandeService.validerCommande(id, token));
    }

    @PutMapping("/{id}/envoyer")
    public ResponseEntity<CommandeFournisseurDTO> envoyerCommande(
            @PathVariable Integer id,
            HttpServletRequest request) {
        String token = extractToken(request);
        return ResponseEntity.ok(commandeService.envoyerCommande(id, token));
    }

    @PutMapping("/{id}/recevoir")
    public ResponseEntity<CommandeFournisseurDTO> recevoirCommande(
            @PathVariable Integer id,
            @RequestBody ReceptionDTO receptionData,
            HttpServletRequest request) {
        String token = extractToken(request);
        return ResponseEntity.ok(commandeService.recevoirCommande(id, receptionData, token));
    }

    /**
     * Rejeter une commande
     */
    @PutMapping("/{id}/rejeter")
    public ResponseEntity<?> rejeterCommande(
            @PathVariable Integer id,
            @RequestParam String motifRejet,
            HttpServletRequest request) {
        try {
            String token = extractToken(request);
            CommandeFournisseurDTO commande = commandeService.rejeterCommande(id, motifRejet, token);
            return ResponseEntity.ok(commande);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Erreur interne: " + e.getMessage()));
        }
    }

    /**
     * Renvoyer une commande rejetée en attente
     */
    @PutMapping("/{id}/renvoyer-attente")
    public ResponseEntity<?> renvoyerAttente(
            @PathVariable Integer id,
            HttpServletRequest request) {
        try {
            String token = extractToken(request);
            CommandeFournisseurDTO commande = commandeService.renvoyerAttente(id, token);
            return ResponseEntity.ok(commande);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Erreur interne: " + e.getMessage()));
        }
    }

    // ==================== RECHERCHE PAR PERIODE ====================

    @GetMapping("/recherche/periode")
    public ResponseEntity<List<CommandeFournisseurDTO>> getCommandesByPeriode(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin,
            HttpServletRequest request) {

        String token = extractToken(request);
        List<CommandeFournisseurDTO> commandes = commandeService.getCommandesByPeriode(debut, fin, token);
        return ResponseEntity.ok(commandes);
    }

    // ==================== RECHERCHE PAR NUMERO ====================

    @GetMapping("/recherche/numero")
    public ResponseEntity<CommandeFournisseurDTO> getCommandeByNumero(
            @RequestParam String numero,
            HttpServletRequest request) {
        String token = extractToken(request);
        return ResponseEntity.ok(commandeService.getCommandeByNumero(numero, token));
    }

    // ==================== GESTION DES ARCHIVES ====================

    @GetMapping("/archived")
    public ResponseEntity<List<CommandeFournisseurDTO>> getArchivedCommandes(HttpServletRequest request) {
        String token = extractToken(request);
        return ResponseEntity.ok(commandeService.getArchivedCommandes(token));
    }
}