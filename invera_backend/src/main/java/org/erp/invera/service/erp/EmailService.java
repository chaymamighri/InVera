package org.erp.invera.service.erp;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.erp.invera.model.erp.Utilisateur;  // ← Changer l'import
import org.erp.invera.repository.erp.utilisateurRepository;  // ← Changer l'import
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

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.activation-url:http://localhost:5173/create-password}")
    private String activationUrl;

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

    public void sendActivationLinkEmail(String email, String token, String nom, String prenom) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject("Lien d'activation - Invera ERP");

            LocalDateTime expiryTime = LocalDateTime.now().plusHours(24);
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm");
            String expiryTimeFormatted = expiryTime.format(formatter);

            String prenomClean = prenom == null ? "" : prenom;
            String nomClean = nom == null ? "" : nom;
            String fullName = (prenomClean + " " + nomClean).trim();

            if (fullName.isBlank()) {
                fullName = email;
            }

            String activationLink = activationUrl + "?token=" + token;

            String htmlContent = String.format("""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1>Invera ERP</h1>
                    </div>
                    <div style="padding: 24px; border: 1px solid #e0e0e0; border-top: none;">
                        <h2 style="color: #1976d2;">Bonjour %s,</h2>
                        <p>L'administrateur de la plateforme Invera a créé votre compte.</p>
                        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Email :</strong> %s</p>
                            <p style="margin: 5px 0;"><strong>Nom :</strong> %s</p>
                            <p style="margin: 5px 0;"><strong>Prénom :</strong> %s</p>
                        </div>
                        <p>Pour activer votre compte et créer votre mot de passe, cliquez sur le lien ci-dessous :</p>
                        <div style="margin: 24px 0; text-align: center;">
                            <a href="%s" style="display: inline-block; padding: 14px 22px; border-radius: 10px; background: #1976d2; color: #ffffff; text-decoration: none; font-weight: bold;">
                                Activer mon compte
                            </a>
                        </div>
                        <p style="color: #666; font-size: 14px;">
                            <strong>Validité :</strong> Ce lien expirera le %s.
                        </p>
                        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            © 2026 Invera ERP. Tous droits réservés.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """, fullName, email, nomClean, prenomClean, activationLink, expiryTimeFormatted);

            helper.setText(htmlContent, true);
            mailSender.send(message);

            System.out.println("✅ Email d'activation envoyé à " + email);

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
                            © 2026 Invera ERP. Tous droits réservés.
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

    // Dans EmailService.java - Ajouter cette méthode

    /**
     * Envoi d'email après validation admin pour inviter au paiement
     * @param email Email du client
     * @param clientName Nom du client (raison sociale ou nom complet)
     * @param clientId ID du client
     */
    public void sendValidationEmail(String email, String clientName, Long clientId) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject("✅ Votre compte InVera a été validé - Passez au paiement");

            String paymentLink = "https://app.invera.com/payment/" + clientId;

            String htmlContent = String.format("""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1>InVera ERP</h1>
                    </div>

                    <div style="padding: 24px; border: 1px solid #e0e0e0; border-top: none;">
                        <h2 style="color: #1976d2;">Bonjour %s,</h2>

                        <p>Nous avons le plaisir de vous informer que <strong>votre dossier a été validé</strong> par notre équipe administrative.</p>

                        <p>Pour finaliser votre inscription et accéder à votre espace, vous devez :</p>
                        <ol>
                            <li>Choisir votre formule d'abonnement</li>
                            <li>Effectuer le paiement sécurisé</li>
                        </ol>

                        <div style="margin: 24px 0; text-align: center;">
                            <a href="%s" style="display: inline-block; padding: 14px 22px; border-radius: 10px; background: #28a745; color: #ffffff; text-decoration: none; font-weight: bold;">
                                💰 Payer votre abonnement
                            </a>
                        </div>
                        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

                        <p style="color: #999; font-size: 12px; text-align: center;">
                            © 2026 InVera ERP. Tous droits réservés.<br>
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """,
                    clientName,
                    paymentLink,
                    30  // nombre de connexions restantes en essai
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);

            System.out.println("✅ Email de validation/paiement envoyé à " + email);

        } catch (MessagingException e) {
            System.err.println("❌ Erreur envoi email validation: " + e.getMessage());
        }
    }

    /**
     * Envoi d'email de refus de dossier
     * @param email Email du client
     * @param clientName Nom du client (raison sociale ou nom complet)
     * @param motif Motif du refus
     */
    public void sendRefusalEmail(String email, String clientName, String motif) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject("❌ Votre dossier InVera a été refusé");

            String htmlContent = String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9;">
                    <div style="background-color: #dc3545; color: white; padding: 30px 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px;">InVera ERP</h1>
                    </div>
                    <div style="padding: 30px 24px; background-color: #ffffff;">
                        <h2 style="color: #dc3545; margin-top: 0;">Bonjour %s,</h2>
                        
                        <p>Nous avons examiné votre dossier d'inscription.</p>
                        
                        <p>Nous sommes au regret de vous informer que <strong>votre demande a été refusée</strong>.</p>
                        
                        <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #dc3545; margin: 20px 0;">
                            <p style="margin: 0 0 10px 0;"><strong>📋 Motif du refus :</strong></p>
                            <p style="margin: 0; color: #555;">%s</p>
                        </div>
                        
                        <p>Si vous avez des questions ou souhaitez contester cette décision, vous pouvez :</p>
                        <ul>
                            <li>Nous contacter par email : <a href="mailto:support@invera.com">support@invera.com</a></li>
                            <li>Modifier vos documents et soumettre une nouvelle demande</li>
                        </ul>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://app.invera.com/contact" 
                               style="display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 6px;">
                                Contacter le support
                            </a>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                        
                        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                            © 2026 InVera ERP. Tous droits réservés.<br>
                            Besoin d'aide ? Contactez-nous : <a href="mailto:support@invera.com">support@invera.com</a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """, clientName, motif);

            helper.setText(htmlContent, true);
            mailSender.send(message);

            System.out.println("✅ Email de refus envoyé à " + email + " - Motif: " + motif);

        } catch (MessagingException e) {
            System.err.println("❌ Erreur envoi email refus: " + e.getMessage());
        }
    }
    /**
     * Envoi d'email de confirmation d'abonnement après paiement
     */
    public void sendSubscriptionConfirmation(String email, String clientName,
                                             String offreNom, LocalDateTime dateFin) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject("✅ Abonnement activé - Invera ERP");

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            String dateFinFormatted = dateFin.format(formatter);

            String htmlContent = String.format("""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1>Invera ERP</h1>
                    </div>
                    <div style="padding: 24px; border: 1px solid #e0e0e0; border-top: none;">
                        <h2 style="color: #1976d2;">Bonjour %s,</h2>
                        <p>Votre abonnement <strong>%s</strong> est maintenant <strong>actif</strong>.</p>
                        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>📅 Date d'expiration :</strong> %s</p>
                        </div>
                        <p>Connectez-vous dès maintenant pour accéder à vos services.</p>
                        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            © 2026 Invera ERP. Tous droits réservés.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """, clientName, offreNom, dateFinFormatted);

            helper.setText(htmlContent, true);
            mailSender.send(message);

            // ✅ Remplacer log.info par System.out.println
            System.out.println("✅ Email confirmation abonnement envoyé à " + email);

        } catch (MessagingException e) {
            // ❌ Remplacer log.error par System.err.println
            System.err.println("❌ Erreur envoi email confirmation: " + e.getMessage());
        }
    }

    /**
     * Envoi d'email de rappel d'expiration (J-7 ou J-1)
     */
    public void sendExpirationReminder(String email, String clientName,
                                       String offreNom, LocalDateTime dateFin, int joursRestants) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject("🔔 Votre abonnement expire dans " + joursRestants + " jours - Invera ERP");

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            String dateFinFormatted = dateFin.format(formatter);

            String htmlContent = String.format("""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #ff9800; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1>Invera ERP</h1>
                    </div>
                    <div style="padding: 24px; border: 1px solid #e0e0e0; border-top: none;">
                        <h2 style="color: #ff9800;">Bonjour %s,</h2>
                        <p>Votre abonnement <strong>%s</strong> expire dans <strong style="color: #ff9800;">%d jours</strong>.</p>
                        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>📅 Date d'expiration :</strong> %s</p>
                        </div>
                        <p>Pour continuer à profiter de nos services, renouvelez votre abonnement dès maintenant.</p>
                        <div style="margin: 24px 0; text-align: center;">
                            <a href="https://app.invera.com/renouvellement" 
                               style="display: inline-block; padding: 12px 24px; border-radius: 6px; background: #ff9800; color: white; text-decoration: none;">
                                🔄 Renouveler mon abonnement
                            </a>
                        </div>
                        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            © 2026 Invera ERP. Tous droits réservés.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """, clientName, offreNom, joursRestants, dateFinFormatted);

            helper.setText(htmlContent, true);
            mailSender.send(message);

            // ✅ Remplacer log.info par System.out.println
            System.out.println("✅ Email rappel expiration envoyé à " + email + " (J-" + joursRestants + ")");

        } catch (MessagingException e) {
            // ❌ Remplacer log.error par System.err.println
            System.err.println("❌ Erreur envoi email rappel: " + e.getMessage());
        }
    }

    /**
     * Envoi d'email d'expiration (accès désactivé)
     */
    public void sendExpirationNotice(String email, String clientName, String offreNom) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject("⚠️ Votre abonnement a expiré - Invera ERP");

            String htmlContent = String.format("""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1>Invera ERP</h1>
                    </div>
                    <div style="padding: 24px; border: 1px solid #e0e0e0; border-top: none;">
                        <h2 style="color: #dc3545;">Bonjour %s,</h2>
                        <p>Votre abonnement <strong>%s</strong> a expiré.</p>
                        <p>Votre accès à la plateforme a été désactivé.</p>
                        <div style="margin: 24px 0; text-align: center;">
                            <a href="https://app.invera.com/offres" 
                               style="display: inline-block; padding: 12px 24px; border-radius: 6px; background: #28a745; color: white; text-decoration: none;">
                                📦 Voir les offres
                            </a>
                        </div>
                        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            © 2026 Invera ERP. Tous droits réservés.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """, clientName, offreNom);

            helper.setText(htmlContent, true);
            mailSender.send(message);

            // ✅ Remplacer log.info par System.out.println
            System.out.println("✅ Email expiration envoyé à " + email);

        } catch (MessagingException e) {
            // ❌ Remplacer log.error par System.err.println
            System.err.println("❌ Erreur envoi email expiration: " + e.getMessage());
        }
    }


}