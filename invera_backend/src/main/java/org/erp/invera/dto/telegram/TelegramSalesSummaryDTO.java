package org.erp.invera.dto.telegram;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TelegramSalesSummaryDTO {
    private Long clientId;
    private String clientName;
    private String databaseName;
    private Long totalOrders;
    private BigDecimal totalSales;
    private BigDecimal unpaidInvoices;
}
