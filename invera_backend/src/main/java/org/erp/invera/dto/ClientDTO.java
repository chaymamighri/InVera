package org.erp.invera.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.Client;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientDTO {
    private Integer id;
    private String nom;
    private String prenom;
    private String telephone;
    private String adresse;
    private String type;
    private String email;

    public static ClientDTO fromEntity(Client client) {
        return new ClientDTO(
                client.getId(),
                client.getNom(),
                client.getPrenom(),
                client.getTelephone(),
                client.getAdresse(),
                client.getType().name(),
                client.getEmail()
        );
    }
}