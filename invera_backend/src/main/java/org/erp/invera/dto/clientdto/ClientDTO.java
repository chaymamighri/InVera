package org.erp.invera.dto.clientdto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.client.Client;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientDTO {
    private Integer idClient;
    private String nom;
    private String prenom;
    private String telephone;
    private String adresse;
    private String typeClient;
    private String email;
    private Double remiseStandard;
    private Double remiseClientFidele;
    private Double remiseClientVIP;
    private Double remiseClientProfessionnelle;

    public static ClientDTO fromEntity(Client client) {
        if (client == null) {
            return null;
        }

        ClientDTO dto = new ClientDTO();

        dto.setIdClient(client.getIdClient());
        dto.setNom(client.getNom());
        dto.setPrenom(client.getPrenom());
        dto.setTelephone(client.getTelephone());
        dto.setAdresse(client.getAdresse());
        dto.setEmail(client.getEmail());

        // Gestion du type de client
        if (client.getTypeClient() != null) {
            dto.setTypeClient(normalizeTypeClient(client.getTypeClient().name()));
        }

        // Attributs de remise
        dto.setRemiseClientFidele(client.getRemiseClientFidele());
        dto.setRemiseClientVIP(client.getRemiseClientVIP());
        dto.setRemiseClientProfessionnelle(client.getRemiseClientProfessionnelle());

        return dto;
    }

    // Méthode utilitaire pour obtenir le nom complet du client
    public String getNomComplet() {
        if (prenom != null && !prenom.isEmpty()) {
            return prenom + " " + nom;
        }
        return nom;
    }

    // Méthode pour obtenir le type de client en français
    public String getTypeClientDisplay() {
        if (typeClient == null) return null;

        switch (normalizeTypeClient(typeClient)) {
            case "PARTICULIER": return "Particulier";
            case "VIP": return "VIP";
            case "ENTREPRISE": return "Entreprise";
            case "FIDELE": return "Fidèle";
            default: return typeClient;
        }
    }

    private static String normalizeTypeClient(String typeClient) {
        if ("PROFESSIONNEL".equals(typeClient)) {
            return "ENTREPRISE";
        }
        return typeClient;
    }
}
