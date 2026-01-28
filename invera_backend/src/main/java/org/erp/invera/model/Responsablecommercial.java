package org.erp.invera.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "responsable_commercial")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Responsablecommercial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idResponsable;

    private String status;
}
