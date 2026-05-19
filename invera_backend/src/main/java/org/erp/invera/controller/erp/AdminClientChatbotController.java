package org.erp.invera.controller.erp;

import lombok.RequiredArgsConstructor;
import org.erp.invera.dto.erp.chatbot.ChatbotRequestDTO;
import org.erp.invera.dto.erp.chatbot.ChatbotResponseDTO;
import org.erp.invera.service.erp.chatbot.AdminClientChatbotService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin-client/chatbot")
public class AdminClientChatbotController {

    private final AdminClientChatbotService chatbotService;

    @PostMapping("/message")
    @PreAuthorize("hasRole('ADMIN_CLIENT') or hasAuthority('ADMIN_CLIENT')")
    public ResponseEntity<ChatbotResponseDTO> answer(
            @RequestBody ChatbotRequestDTO request,
            @RequestHeader(name = "Authorization", required = false) String authorizationHeader) {
        return ResponseEntity.ok(chatbotService.answer(request, authorizationHeader));
    }
}
