package org.erp.invera.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendResetPasswordEmail(String email, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject("🔐 Code de réinitialisation - Invera ERP");

            LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(10);
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
            String expiryTimeFormatted = expiryTime.format(formatter);

            String htmlContent = String.format("""
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 500px; margin: auto; padding: 20px;">
                        <h2 style="color: #444;">Bonjour,</h2>
                        
                        <p>Pour réinitialiser votre mot de passe, utilisez le code ci-dessous :</p>
                        
                        <div style="font-size: 32px; font-weight: bold; color: #0066cc; 
                                   text-align: center; padding: 20px; background: #f5f5f5; 
                                   border-radius: 5px; margin: 20px 0;">
                            %s
                        </div>
                        
                        <p style="color: #666;">
                            <strong>Validité :</strong> Ce code expirera le %s
                        </p>
                       
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        
                        <p style="color: #999; font-size: 12px;">
                            Invera ERP - Enterprise Resource Planning
                        </p>
                    </div>
                </body>
                </html>
                """, code, expiryTimeFormatted);

            helper.setText(htmlContent, true);
            mailSender.send(message);

        } catch (MessagingException e) {
            throw new RuntimeException("Erreur lors de l'envoi de l'email", e);
        }
    }


    public void sendCreatePasswordEmail(String email, String token) {

        try {
            String link = "http://localhost:5173/create-password?token="
                    + token + "&email=" + email;

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper =
                    new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject("Activate Your Account - Invera ERP");

            String htmlContent = """
                <h2>Welcome to Invera ERP</h2>
                <p>An administrator created an account for you.</p>
                <p>Click the button below to create your password:</p>

                <a href="%s"
                   style="padding:10px 20px;
                          background-color:#1976d2;
                          color:white;
                          text-decoration:none;
                          border-radius:5px;">
                    Create Password
                </a>

                <p>This link expires in 24 hours.</p>
                """.formatted(link);

            helper.setText(htmlContent, true);

            mailSender.send(message);

        } catch (Exception e) {
            throw new RuntimeException("Error sending activation email");
        }
    }

}

