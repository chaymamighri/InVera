package org.erp.invera.dto.telegram;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TelegramLinkResponseDTO {
    private boolean linked;
    private Long clientId;
    private Long telegramChatId;
    private String telegramUrl;
}
