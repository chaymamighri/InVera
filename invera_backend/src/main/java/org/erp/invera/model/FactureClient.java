package org.erp.invera.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Date;
@Entity
@Table(name = "facture_client")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FactureClient {

    public enum StatutFacture {
        paye,
        Non_paye
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idFactureClient;

    private LocalDateTime dateFacture;

    private Double montantTotal;

    @Enumerated(EnumType.STRING)
    private StatutFacture statut;
}



