package org.erp.invera.controller;

import org.erp.invera.dto.commandeFornisseurDTO.CommandeFournisseurDTO;
import org.erp.invera.model.Fournisseurs.CommandeFournisseur;

import org.erp.invera.service.CommandeFournisseurService;
import org.springframework.beans.factory.annotation.Autowired;
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
public class CommandeFournisseurController {

    @Autowired
    private CommandeFournisseurService commandeService;

    // ========== CRUD ESSENTIEL ==========

    @GetMapping("/all")
    public ResponseEntity<List<CommandeFournisseur>> getAllCommandes() {
        return ResponseEntity.ok(commandeService.getAllCommandes());
    }


    @GetMapping("/{id}")
    public ResponseEntity<CommandeFournisseur> getCommandeById(@PathVariable Integer id) {
        return ResponseEntity.ok(commandeService.getCommandeById(id));
    }


    @PostMapping("/add")
    public ResponseEntity<CommandeFournisseur> createCommande(
            @Valid @RequestBody CommandeFournisseurDTO commandeDTO) {

        // ✅ Récupérer l'utilisateur connecté (optionnel, juste pour log)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String utilisateur = auth.getName();
        System.out.println("📝 Commande créée par: " + utilisateur);

        // Créer la commande
        CommandeFournisseur commande = commandeService.creerCommande(commandeDTO);

        // ✅ Vérifier que createdBy est bien rempli
        System.out.println("✅ createdBy dans la commande: " + commande.getCreatedBy());

        return new ResponseEntity<>(commande, HttpStatus.CREATED);
    }


    @PutMapping("/update/{id}")
    public ResponseEntity<CommandeFournisseur> updateCommande(
            @PathVariable Integer id,
            @Valid @RequestBody CommandeFournisseurDTO commandeDTO) {
        CommandeFournisseur commande = commandeService.modifierCommande(id, commandeDTO);
        return ResponseEntity.ok(commande);
    }

    @DeleteMapping("delete/{id}")
    public ResponseEntity<Void> deleteCommande(@PathVariable Integer id) {
        commandeService.supprimerCommande(id);
        return ResponseEntity.noContent().build();
    }

    // ========== GESTION DES STATUTS ==========

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

    // ========== RECHERCHES ==========

    @GetMapping("/recherche/periode")
    public ResponseEntity<List<CommandeFournisseur>> getCommandesByPeriode(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {
        return ResponseEntity.ok(commandeService.getCommandesByPeriode(debut, fin));
    }

    @GetMapping("/recherche/numero")
    public ResponseEntity<CommandeFournisseur> getCommandeByNumero(@RequestParam String numero) {
        return ResponseEntity.ok(commandeService.getCommandeByNumero(numero));
    }
}