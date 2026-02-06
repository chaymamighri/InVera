package org.erp.invera.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommandeRequestDTO {
    private Integer clientId;  // ← AJOUTEZ CETTE LIGNE
    private Map<Integer, Integer> produits; // produitId -> quantite
    private String notes;
}