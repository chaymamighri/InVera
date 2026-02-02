package org.erp.invera.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "commande_client")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommandeClient {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idCommande;
    
    @Temporal(TemporalType.DATE)
    private Date dateCommande;
    
    private Double total;
    private String statut;
}
