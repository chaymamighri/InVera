package org.erp.invera.dto.erp;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour les réponses contenant un simple message
 * Utilisé pour les confirmations, erreurs, etc.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private String message;
}