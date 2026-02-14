package org.erp.invera.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "fournisseur")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Fournisseur {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idFournisseur;
    
    private String nom;
    private String contact;
    private String email;
}
