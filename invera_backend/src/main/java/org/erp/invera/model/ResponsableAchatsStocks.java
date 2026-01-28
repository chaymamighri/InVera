package org.erp.invera.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "responsable_achats_stocks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResponsableAchatsStocks {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idResponsable;

    private String status;
}
