package org.erp.invera.dto.erp.clientdto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.erp.invera.model.erp.client.Client;

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
    private String raisonSociale;
    private String matriculeFiscale;
    private Double remise;

    public static ClientDTO fromEntity(Client client) {
        if (client == null) return null;

        ClientDTO dto = new ClientDTO();
        dto.setIdClient(client.getIdClient());
        dto.setNom(client.getNom());
        dto.setPrenom(client.getPrenom());
        dto.setTelephone(client.getTelephone());
        dto.setAdresse(client.getAdresse());
        dto.setEmail(client.getEmail());
        dto.setRaisonSociale(client.getRaisonSociale());
        dto.setMatriculeFiscale(client.getMatriculeFiscale());

        if (client.getTypeClient() != null) {
            dto.setTypeClient(client.getTypeClient().name());
        }

        return dto;
    }

    // ✅ AJOUTER CETTE MÉTHODE
    public String getNomComplet() {
        // Pour les entreprises, afficher la raison sociale
        if ("ENTREPRISE".equals(typeClient) && raisonSociale != null && !raisonSociale.isEmpty()) {
            return raisonSociale;
        }
        // Pour les particuliers ou professionnels
        if (prenom != null && !prenom.isEmpty()) {
            return prenom + " " + (nom != null ? nom : "");
        }
        // Fallback
        return nom != null ? nom : "Client";
    }

    // ✅ OPTIONNEL : Ajouter une méthode pour obtenir l'affichage du type client
    public String getTypeClientDisplay() {
        if (typeClient == null) return null;
        switch (typeClient) {
            case "PARTICULIER": return "Particulier";
            case "VIP": return "VIP";
            case "ENTREPRISE": return "Entreprise";
            case "FIDELE": return "Fidèle";
            default: return typeClient;
        }
    }
}