package org.erp.invera.controller;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.commandeFornisseurDTO.CommandeFournisseurDTO;
import org.erp.invera.model.Fournisseurs.CommandeFournisseur;
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
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CommandeFournisseurController {

    private final CommandeFournisseurService commandeService;

    // ========= GET ALL =========

    @GetMapping("/all")
    public ResponseEntity<List<CommandeFournisseurDTO>> getAllCommandes() {
        return ResponseEntity.ok(commandeService.getAll());
    }

    // ========= GET BY ID =========

    @GetMapping("/{id}")
    public ResponseEntity<CommandeFournisseur> getCommandeById(@PathVariable Integer id) {
        return ResponseEntity.ok(commandeService.getCommandeById(id));
    }

    // ========= CREATE =========

    @PostMapping("/add")
    public ResponseEntity<CommandeFournisseur> createCommande(
            @Valid @RequestBody CommandeFournisseurDTO commandeDTO) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String utilisateur = auth.getName();

        System.out.println("📝 Commande créée par: " + utilisateur);

        CommandeFournisseur commande = commandeService.creerCommande(commandeDTO);

        System.out.println("✅ createdBy dans la commande: " + commande.getCreatedBy());

        return new ResponseEntity<>(commande, HttpStatus.CREATED);
    }

    // ========= UPDATE =========

    @PutMapping("/update/{id}")
    public ResponseEntity<CommandeFournisseur> updateCommande(
            @PathVariable Integer id,
            @Valid @RequestBody CommandeFournisseurDTO commandeDTO) {

        CommandeFournisseur commande = commandeService.modifierCommande(id, commandeDTO);

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
    public ResponseEntity<CommandeFournisseur> validerCommande(@PathVariable Integer id) {

        return ResponseEntity.ok(commandeService.validerCommande(id));
    }

    @PutMapping("/{id}/envoyer")
    public ResponseEntity<CommandeFournisseur> envoyerCommande(@PathVariable Integer id) {

        return ResponseEntity.ok(commandeService.envoyerCommande(id));
    }

    @PutMapping("/{id}/recevoir")
    public ResponseEntity<CommandeFournisseur> recevoirCommande(@PathVariable Integer id) {

        return ResponseEntity.ok(commandeService.recevoirCommande(id));
    }

    @PutMapping("/{id}/annuler")
    public ResponseEntity<CommandeFournisseur> annulerCommande(
            @PathVariable Integer id,
            @RequestParam(required = false) String raison) {

        return ResponseEntity.ok(commandeService.annulerCommande(id, raison));
    }

    // ========= RECHERCHE PAR PERIODE =========

    @GetMapping("/recherche/periode")
    public ResponseEntity<List<CommandeFournisseur>> getCommandesByPeriode(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {

        return ResponseEntity.ok(commandeService.getCommandesByPeriode(debut, fin));
    }

    // ========= RECHERCHE PAR NUMERO =========

    @GetMapping("/recherche/numero")
    public ResponseEntity<CommandeFournisseur> getCommandeByNumero(@RequestParam String numero) {

        return ResponseEntity.ok(commandeService.getCommandeByNumero(numero));
    }
}