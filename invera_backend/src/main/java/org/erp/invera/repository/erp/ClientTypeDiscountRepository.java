package org.erp.invera.repository.erp;

import org.erp.invera.model.erp.client.Client;
import org.erp.invera.model.erp.client.ClientTypeDiscount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClientTypeDiscountRepository extends JpaRepository<ClientTypeDiscount, Client.TypeClient> {
}
