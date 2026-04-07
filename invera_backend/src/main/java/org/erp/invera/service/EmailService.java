package org.erp.invera.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.erp.invera.model.User;
import org.erp.invera.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;



/**
 * Service d'envoi d'emails.
 *
 * Ce fichier gère l'envoi des emails transactionnels :
 *
 * 1. RÉINITIALISATION DE MOT DE PASSE :
 *    - Envoie un code à 6 chiffres à l'utilisateur
 *    - Code valable 10 minutes
 *    - Format HTML professionnel
 *
 * 2. CRÉATION DE COMPTE / ACTIVATION :
 *    - Envoyé lorsqu'un administrateur crée un compte
 *    - Contient les infos du compte (nom, prénom, email)
 *    - Code d'activation valable 24 heures
 *    - Permet à l'utilisateur de créer son mot de passe
 *
 * Les emails sont envoyés en HTML avec mise en page responsive,
 * couleurs professionnelles (bleu Invera) et instructions claires.
 */
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private UserRepository userRepository;

    @Value("${spring.mail.username}")
    private String fromEmail;

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

    public void sendCreatePasswordEmail(String email, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject("Code d'activation - Invera ERP");

            User newUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            LocalDateTime expiryTime = LocalDateTime.now().plusHours(24);
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy 'a' HH:mm");
            String expiryTimeFormatted = expiryTime.format(formatter);

            String prenom = newUser.getPrenom() == null ? "" : newUser.getPrenom();
            String nom = newUser.getNom() == null ? "" : newUser.getNom();
            String fullName = (prenom + " " + nom).trim();

            if (fullName.isBlank()) {
                fullName = email;
            }

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto;">
                        <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1>Invera ERP</h1>
                        </div>

                        <div style="padding: 24px; border: 1px solid #e0e0e0; border-top: none;">
                            <h2 style="color: #1976d2;">Bonjour %s,</h2>

                            <p>L'administrateur de la plateforme Invera a cree votre compte.</p>

                            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p style="margin: 5px 0;"><strong>Email :</strong> %s</p>
                                <p style="margin: 5px 0;"><strong>Nom :</strong> %s</p>
                                <p style="margin: 5px 0;"><strong>Prenom :</strong> %s</p>
                            </div>

                            <p>Pour activer votre compte et creer votre mot de passe, utilisez le code ci-dessous :</p>

                            <div style="margin: 24px 0; text-align: center;">
                                <div style="display: inline-block; min-width: 220px; padding: 18px 28px; border-radius: 12px; background: #eef4ff; color: #1976d2; font-size: 32px; font-weight: bold; letter-spacing: 10px;">
                                    %s
                                </div>
                            </div>

                            <p>Depuis la page de connexion Invera, cliquez sur <strong>Activer mon compte</strong>, puis saisissez votre email, ce code, et votre nouveau mot de passe.</p>

                            <p style="color: #666; font-size: 14px;">
                                <strong>Validite :</strong> Ce code expirera le %s.
                            </p>

                            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

                            <p style="color: #999; font-size: 12px; text-align: center;">
                                &copy; 2026 Invera ERP. Tous droits reserves.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                    fullName,
                    email,
                    nom,
                    prenom,
                    code,
                    expiryTimeFormatted
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);

        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'envoi de l'email: " + e.getMessage());
        }
    }

    /**
     * Envoyer un bon de commande par email avec pièce jointe PDF
     * @param toEmail Email du fournisseur
     * @param fournisseurNom Nom du fournisseur
     * @param numeroCommande Numéro de la commande
     * @param pdfContent Contenu du PDF en bytes
     */
    public void envoyerBonCommande(String toEmail, String fournisseurNom,
                                   String numeroCommande, byte[] pdfContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Bon de commande N° " + numeroCommande + " - Invera ERP");

            LocalDateTime dateEnvoi = LocalDateTime.now();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm");
            String dateEnvoiFormatted = dateEnvoi.format(formatter);

            String htmlContent = String.format("""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1>Invera ERP</h1>
                        <p>Bon de commande</p>
                    </div>

                    <div style="padding: 24px; border: 1px solid #e0e0e0; border-top: none;">
                        <h2 style="color: #1976d2;">Bonjour %s,</h2>

                        <p>Veuillez trouver ci-joint le bon de commande <strong>N° %s</strong>.</p>

                        <p>📅 Date d'envoi : %s<br>
                        📎 Pièce jointe : Bon_Commande_%s.pdf</p>

                        <p>Nous vous remercions de bien vouloir préparer cette commande dans les meilleurs délais.</p>

                        <p style="margin-top: 30px;">
                            Cordialement,<br>
                            <strong>L'équipe Achats Invera</strong>
                        </p>

                        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

                        <p style="color: #999; font-size: 12px; text-align: center;">
                            &copy; 2026 Invera ERP. Tous droits réservés.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """,
                    fournisseurNom,
                    numeroCommande,
                    dateEnvoiFormatted,
                    numeroCommande
            );

            helper.setText(htmlContent, true);

            // Ajouter le PDF en pièce jointe
            helper.addAttachment("Bon_Commande_" + numeroCommande + ".pdf",
                    new ByteArrayResource(pdfContent), "application/pdf");

            mailSender.send(message);

            System.out.println("✅ Email envoyé à " + toEmail);
            System.out.println("   - Commande: " + numeroCommande);

        } catch (MessagingException e) {
            System.err.println("❌ Erreur envoi email: " + e.getMessage());
        }
    }
}
