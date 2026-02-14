package org.erp.invera.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendResetPasswordEmail(String email, String code) {

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Password Reset Code - Invera ERP");

        message.setText(
                "Hello,\n\n" +
                        "Your password reset code is:\n\n" +
                        "   " + code + "\n\n" +
                        "This code expires in 10 minutes.\n\n" +
                        "If this was not you, ignore this email.\n\n" +
                        "Invera ERP"
        );

        mailSender.send(message);
    }
}
