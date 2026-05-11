package org.erp.invera.dto.telegram;

import lombok.Data;

@Data
public class TelegramUpdateRequest {
    private Message message;

    @Data
    public static class Message {
        private Long messageId;
        private Chat chat;
        private String text;
    }

    @Data
    public static class Chat {
        private Long id;
    }
}
