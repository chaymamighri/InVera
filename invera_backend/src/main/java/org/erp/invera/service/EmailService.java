package org.erp.invera.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Service responsible ONLY for sending emails
 */
@Service
public class EmailService {

    /**
     * Spring automatically creates this bean
     * ONLY if spring-boot-starter-mail is added
     */
    @Autowired
    private JavaMailSender mailSender;

    /**
     * Sends password reset email to user
     */
    public void sendResetPasswordEmail(String email, String token) {

        // Frontend reset password URL
        String resetLink =
                "http://localhost:5173/reset-password?token=" + token;

        // Simple text email
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Password Reset - Invera ERP");

        message.setText(
                "Hello,\n\n" +
                        "You requested to reset your password.\n\n" +
                        "Click the link below:\n" +
                        resetLink +
                        "\n\nThis link expires in 30 minutes.\n\n" +
                        "If this was not you, ignore this email.\n\n" +
                        "Invera ERP"
        );

        // Send email
        mailSender.send(message);
    }
}
