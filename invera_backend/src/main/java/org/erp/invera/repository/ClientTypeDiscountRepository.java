package org.erp.invera.repository;

import org.erp.invera.model.client.Client;
import org.erp.invera.model.client.ClientTypeDiscount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClientTypeDiscountRepository extends JpaRepository<ClientTypeDiscount, Client.TypeClient> {
}
