package org.erp.invera.controller;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.commandeFornisseurdto.CommandeFournisseurDTO;
import org.erp.invera.service.CommandeFournisseurService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/commandes-fournisseurs")
@RequiredArgsConstructor
public class CommandeFournisseurController {

    private final CommandeFournisseurService commandeService;

    // ========= GET ALL =========
    // ========= GET ALL =========
    @GetMapping("/all")
    public ResponseEntity<List<CommandeFournisseurDTO>> getAllCommandes(
            @RequestParam(required = false, defaultValue = "true") Boolean actif) {

        List<CommandeFournisseurDTO> commandes;

        if (actif) {
            commandes = commandeService.getActiveCommandes();
        } else {
            commandes = commandeService.getArchivedCommandes();
        }

        return ResponseEntity.ok(commandes);
    }

    // ========= GET BY ID =========
    @GetMapping("/{id}")
    public ResponseEntity<CommandeFournisseurDTO> getCommandeById(@PathVariable Integer id) {
        return ResponseEntity.ok(commandeService.getCommandeById(id));
    }

    // ========= CREATE =========
    @PostMapping("/add")
    public ResponseEntity<CommandeFournisseurDTO> createCommande(
            @Valid @RequestBody CommandeFournisseurDTO commandeDTO) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String utilisateur = auth.getName();
        System.out.println("Commande créée par: " + utilisateur);

        CommandeFournisseurDTO commande = commandeService.creerCommande(commandeDTO);

        // ✅ Ne pas essayer d'appeler getCreatedBy() sur le DTO
        System.out.println("Commande créée avec succès");

        return new ResponseEntity<>(commande, HttpStatus.CREATED);
    }

    // ========= UPDATE =========
    @PutMapping("/update/{id}")
    public ResponseEntity<CommandeFournisseurDTO> updateCommande(
            @PathVariable Integer id,
            @Valid @RequestBody CommandeFournisseurDTO commandeDTO) {

        CommandeFournisseurDTO commande = commandeService.modifierCommande(id, commandeDTO);
        return ResponseEntity.ok(commande);
    }

    // ========= DELETE =========
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteCommande(@PathVariable Integer id) {
        commandeService.supprimerCommande(id);
        return ResponseEntity.noContent().build();
    }

    // ========= STATUTS =========
    @PutMapping("/{id}/valider")
    public ResponseEntity<CommandeFournisseurDTO> validerCommande(@PathVariable Integer id) {
        return ResponseEntity.ok(commandeService.validerCommande(id));
    }

    @PutMapping("/{id}/envoyer")
    public ResponseEntity<CommandeFournisseurDTO> envoyerCommande(@PathVariable Integer id) {
        return ResponseEntity.ok(commandeService.envoyerCommande(id));
    }

    @PutMapping("/{id}/recevoir")
    public ResponseEntity<CommandeFournisseurDTO> recevoirCommande(@PathVariable Integer id) {
        return ResponseEntity.ok(commandeService.recevoirCommande(id));
    }

    @PutMapping("/{id}/annuler")
    public ResponseEntity<CommandeFournisseurDTO> annulerCommande(
            @PathVariable Integer id,
            @RequestParam(required = false) String raison) {
        return ResponseEntity.ok(commandeService.annulerCommande(id, raison));
    }

    // ========= RECHERCHE PAR PERIODE =========
    @GetMapping("/recherche/periode")
    public ResponseEntity<List<CommandeFournisseurDTO>> getCommandesByPeriode(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {

        List<CommandeFournisseurDTO> commandes = commandeService.getCommandesByPeriode(debut, fin)
                .stream()
                .map(cmd -> commandeService.getCommandeById(cmd.getIdCommandeFournisseur()))
                .toList();
        return ResponseEntity.ok(commandes);
    }

    // ========= RECHERCHE PAR NUMERO =========
    @GetMapping("/recherche/numero")
    public ResponseEntity<CommandeFournisseurDTO> getCommandeByNumero(@RequestParam String numero) {
        return ResponseEntity.ok(commandeService.getCommandeByNumero(numero));
    }
    // ========= GESTION DES ARCHIVES =========

    @GetMapping("/archived")
    public ResponseEntity<List<CommandeFournisseurDTO>> getArchivedCommandes() {
        return ResponseEntity.ok(commandeService.getArchivedCommandes());
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<CommandeFournisseurDTO> restoreCommande(@PathVariable Integer id) {
        return ResponseEntity.ok(commandeService.restoreCommande(id));
    }

    // Optionnel - Hard delete (suppression définitive)
    @DeleteMapping("/{id}/hard-delete")
    public ResponseEntity<Void> hardDeleteCommande(@PathVariable Integer id) {
        commandeService.hardDeleteCommande(id);
        return ResponseEntity.noContent().build();
    }

}