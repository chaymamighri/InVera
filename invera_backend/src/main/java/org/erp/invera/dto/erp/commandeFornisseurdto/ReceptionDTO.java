package org.erp.invera.dto.erp.commandeFornisseurdto;

import lombok.Data;

import java.util.Map;

// DTO pour la réception
@Data
public class ReceptionDTO {
    private Map<Integer, Integer> quantitesRecues;
    private Map<Integer, Boolean> produitsAReactiver;
    private String numeroBL;
    private String notes;

}