package org.erp.invera.model.client;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "client_type_discount")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientTypeDiscount {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "type_client", nullable = false, length = 50)
    private Client.TypeClient typeClient;

    @Column(name = "remise", nullable = false)
    private Double remise;
}
