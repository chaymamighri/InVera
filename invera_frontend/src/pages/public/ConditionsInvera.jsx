// src/pages/public/ConditionsInvera.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const ConditionsInvera = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simplifié pour la page légale */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <Link to="/" className="text-2xl font-bold text-[#0b4ea2]">
            InVera
          </Link>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-gray-500 text-sm mb-8 pb-4 border-b border-gray-100">
            Dernière mise à jour : 29 avril 2026
          </p>

          {/* TABLE DES MATIÈRES */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Table des matières</h2>
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              <ul className="space-y-2 text-[#0b4ea2]">
                <li><a href="#services" className="hover:underline">1. Nos Services</a></li>
                <li><a href="#engagements" className="hover:underline">2. Nos Engagements</a></li>
                <li><a href="#propriete" className="hover:underline">3. Propriété Intellectuelle</a></li>
                <li><a href="#utilisateur" className="hover:underline">4. Déclarations de l'Utilisateur</a></li>
                <li><a href="#inscription" className="hover:underline">5. Inscription</a></li>
                <li><a href="#paiement" className="hover:underline">6. Paiement et Abonnements</a></li>
                <li><a href="#remboursement" className="hover:underline">7. Politique de Remboursement</a></li>
              </ul>
              <ul className="space-y-2 text-[#0b4ea2]">
                <li><a href="#interdits" className="hover:underline">8. Activités Interdites</a></li>
                <li><a href="#confidentialite" className="hover:underline">9. Politique de Confidentialité</a></li>
                <li><a href="#duree" className="hover:underline">10. Durée et Résiliation</a></li>
                <li><a href="#droit" className="hover:underline">11. Droit Applicable</a></li>
                <li><a href="#responsabilite" className="hover:underline">12. Limitations de Responsabilité</a></li>
                <li><a href="#contact" className="hover:underline">13. Nous Contacter</a></li>
              </ul>
            </div>
          </div>

          {/* SECTION 1 - NOS SERVICES */}
          <section id="services" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Nos Services</h2>
            <p className="text-gray-700 mb-4">
              InVera est une plateforme de gestion commerciale et de facturation électronique, 
              spécialement conçue pour les entreprises tunisiennes. Nos Services incluent :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><span className="font-medium">Facturation Électronique :</span> Création et gestion de factures conformes à la réglementation tunisienne</li>
              <li><span className="font-medium">Gestion Commerciale :</span> Suivi des clients, devis, bons de commande et bons de livraison</li>
              <li><span className="font-medium">Tableau de Bord :</span> Visualisation en temps réel des performances de votre entreprise</li>
              <li><span className="font-medium">Gestion de Stock :</span> Suivi des inventaires et alertes de réapprovisionnement</li>
              <li><span className="font-medium">Conformité Fiscale :</span> Gestion de la TVA, retenue à la source et conformité légale</li>
              <li><span className="font-medium">Reporting :</span> Génération de rapports financiers et statistiques détaillés</li>
            </ul>
          </section>

          {/* SECTION 2 - NOS ENGAGEMENTS */}
          <section id="engagements" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Nos Engagements</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-[#0b4ea2] mb-2">✓ Disponibilité</h3>
                <p className="text-sm text-gray-600">Nous assurons une disponibilité optimale de nos Services avec un taux de disponibilité cible de 99.5%.</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-[#0b4ea2] mb-2">✓ Sécurité des Données</h3>
                <p className="text-sm text-gray-600">Vos données sont protégées par des mesures de sécurité conformes aux normes internationales.</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-[#0b4ea2] mb-2">✓ Conformité Légale</h3>
                <p className="text-sm text-gray-600">Nos Services respectent la législation tunisienne, notamment la loi sur la facturation électronique.</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-[#0b4ea2] mb-2">✓ Support Client</h3>
                <p className="text-sm text-gray-600">Une équipe dédiée pour vous accompagner dans l'utilisation de notre plateforme.</p>
              </div>
            </div>
          </section>

          {/* SECTION 3 - PROPRIÉTÉ INTELLECTUELLE */}
          <section id="propriete" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Propriété Intellectuelle</h2>
            <p className="text-gray-700 mb-3">
              InVera et l'ensemble de son contenu (textes, logos, interfaces, illustrations, 
              code source, bases de données) sont protégés par les lois sur la propriété intellectuelle.
            </p>
            <p className="text-gray-700 mb-3">
              Vous bénéficiez d'une licence non exclusive, non transférable et personnelle pour 
              utiliser nos Services dans le cadre de votre activité professionnelle.
            </p>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">Important :</span> Toute reproduction, modification 
                ou distribution non autorisée de nos Services est strictement interdite.
              </p>
            </div>
          </section>

          {/* SECTION 4 - DÉCLARATIONS UTILISATEUR */}
          <section id="utilisateur" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Déclarations de l'Utilisateur</h2>
            <p className="text-gray-700 mb-3">En utilisant InVera, vous déclarez et garantissez que :</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-3">
              <li>Vous avez au moins 18 ans et la capacité légale de contracter</li>
              <li>Les informations fournies sont exactes, complètes et à jour</li>
              <li>Vous utilisez les Services conformément aux lois tunisiennes</li>
              <li>Vous êtes légalement autorisé à représenter votre entreprise</li>
            </ul>
          </section>

          {/* SECTION 5 - INSCRIPTION */}
          <section id="inscription" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Inscription</h2>
            <p className="text-gray-700 mb-3">
              Pour accéder à nos Services, vous devez créer un compte et fournir des informations 
              exactes vous concernant ou concernant votre entreprise.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 mb-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">À savoir :</span> InVera se réserve le droit de 
                refuser l'ouverture d'un compte à tout moment pour des raisons légitimes.
              </p>
            </div>
          </section>

          {/* SECTION 6 - PAIEMENT ET ABONNEMENTS */}
          <section id="paiement" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Paiement et Abonnements</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Période d'Essai</h3>
                <p className="text-gray-700">Nous proposons une période d'essai gratuite de 30 connexions pour découvrir toutes les fonctionnalités d'InVera.</p>
              </div>
             <div>
<h3 className="font-semibold text-gray-800 mb-2">Formules d'Abonnement</h3>
<p className="text-gray-700">
  InVera propose des formules d'abonnement mensuelles et annuelles adaptées à la taille 
  de votre entreprise. 
  <Link to="/subscriptions" className="text-[#0b4ea2] hover:underline ml-1">
    Consultez notre page d'offres →
  </Link>
</p>
</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Moyens de Paiement</h3>
                <p className="text-gray-700">Nous acceptons les cartes bancaires, virements bancaires et autres moyens spécifiés lors du paiement.</p>
              </div>
            </div>
          </section>

          {/* SECTION 7 - REMBOURSEMENT */}
          <section id="remboursement" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Politique de Remboursement</h2>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl mb-3">
              <p className="text-sm text-red-700">
                <span className="font-semibold">Aucun remboursement après la période d'essai :</span> 
                En raison de la période d'essai gratuite de 30 connexions, aucune demande de remboursement 
                ne sera acceptée pour des raisons de non-utilisation ou de changement d'avis après souscription.
              </p>
            </div>
            <p className="text-gray-700 text-sm">
              Des exceptions peuvent être étudiées en cas d'erreurs techniques majeures de notre part, 
              après analyse par notre équipe support.
            </p>
          </section>

          {/* SECTION 8 - ACTIVITÉS INTERDITES */}
          <section id="interdits" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Activités Interdites</h2>
            <p className="text-gray-700 mb-3">Il est strictement interdit d'utiliser InVera pour :</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Toute activité frauduleuse ou illégale</li>
              <li>La création de faux documents commerciaux ou fiscaux</li>
              <li>Le contournement des mécanismes de sécurité</li>
              <li>La violation des droits de propriété intellectuelle</li>
              <li>L'envoi de contenus malveillants (virus, malwares)</li>
            </ul>
          </section>

          {/* SECTION 9 - POLITIQUE DE CONFIDENTIALITÉ */}
          <section id="confidentialite" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Politique de Confidentialité</h2>
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-semibold text-gray-800 mb-3">9.1. Collecte des Données</h3>
              <p className="text-gray-600 text-sm mb-4">
                Nous collectons les informations nécessaires à la fourniture de nos Services : 
                informations d'identification, données professionnelles, données de facturation.
              </p>

              <h3 className="font-semibold text-gray-800 mb-3">9.2. Utilisation des Données</h3>
              <p className="text-gray-600 text-sm mb-4">
                Vos données sont utilisées exclusivement pour la gestion de votre compte, 
                la facturation, l'amélioration de nos Services et le respect de nos obligations légales.
              </p>

              <h3 className="font-semibold text-gray-800 mb-3">9.3. Protection des Données</h3>
              <p className="text-gray-600 text-sm mb-4">
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles 
                appropriées pour protéger vos données. Conformément à la loi tunisienne n° 2015-48 
                relative à la protection des données personnelles.
              </p>

              <h3 className="font-semibold text-gray-800 mb-3">9.4. Partage des Données</h3>
              <p className="text-gray-600 text-sm mb-4">
                Vos données ne sont pas vendues à des tiers. Elles peuvent être partagées uniquement :
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-600 text-sm mb-4">
                <li>Avec votre consentement explicite</li>
                <li>Pour respecter nos obligations légales</li>
                <li>Avec nos sous-traitants techniques (hébergement, paiement)</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-3">9.5. Conservation des Données</h3>
              <p className="text-gray-600 text-sm mb-4">
                Vos données sont conservées pendant la durée de votre abonnement, et conformément 
                aux obligations légales de conservation des documents comptables (10 ans en Tunisie).
              </p>

              <h3 className="font-semibold text-gray-800 mb-3">9.6. Vos Droits</h3>
              <p className="text-gray-600 text-sm">
                Conformément à la législation en vigueur, vous disposez d'un droit d'accès, 
                de rectification, d'opposition et de suppression de vos données personnelles. 
                Pour exercer ces droits, contactez-nous à <span className="text-[#0b4ea2]">contact@invera.tn</span>
              </p>
            </div>
          </section>

          {/* SECTION 10 - DURÉE ET RÉSILIATION */}
          <section id="duree" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Durée et Résiliation</h2>
            <p className="text-gray-700 mb-3">
              Les présentes conditions s'appliquent pendant toute la durée de votre abonnement.
            </p>
            <p className="text-gray-700 mb-3">
              Vous pouvez résilier votre abonnement à tout moment depuis votre espace client. 
              La résiliation prendra effet à la fin de la période en cours.
            </p>
            <p className="text-gray-700">
              InVera se réserve le droit de suspendre ou résilier votre accès en cas de 
              non-respect des présentes conditions.
            </p>
          </section>

          {/* SECTION 11 - DROIT APPLICABLE */}
          <section id="droit" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Droit Applicable</h2>
            <p className="text-gray-700">
              Les présentes conditions sont régies par le droit tunisien. En cas de litige, 
              les tribunaux de Tunis auront compétence exclusive.
            </p>
          </section>

          {/* SECTION 12 - LIMITATIONS DE RESPONSABILITÉ */}
          <section id="responsabilite" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Limitations de Responsabilité</h2>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
              <p className="text-sm text-red-700 mb-2">
                <span className="font-semibold">Avertissement important :</span>
              </p>
              <p className="text-sm text-red-700">
                InVera ne saurait être tenu responsable des pertes indirectes, pertes de chiffre d'affaires, 
                pertes de données ou préjudices commerciaux résultant de l'utilisation de nos Services. 
                Notre responsabilité est limitée au montant des frais payés par vous au cours des 6 mois 
                précédant le sinistre.
              </p>
            </div>
          </section>

          {/* SECTION 13 - NOUS CONTACTER */}
          <section id="contact" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Nous Contacter</h2>
            <div className="bg-gray-50 rounded-xl p-5">
              <p className="text-gray-700 mb-2">Pour toute question concernant ces conditions :</p>
              <p className="text-gray-700">📧 Email : <a href="mailto:contact@invera.tn" className="text-[#0b4ea2] hover:underline">contact@invera.tn</a></p>
              <p className="text-gray-700">📍 Adresse : Tunis, Tunisie</p>
            </div>
          </section>

          {/* VERSION ACCEPTABLE */}
          <div className="mt-10 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
            <p>© 2026 InVera - Tous droits réservés</p>
            <p className="mt-1">Version 1.0 - Mise à jour du 29 avril 2026</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ConditionsInvera;