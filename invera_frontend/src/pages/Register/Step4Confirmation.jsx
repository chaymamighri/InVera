// src/pages/Register/Step5Confirmation.jsx
import React, { useState } from 'react';
import { register } from '../../services/registerService';

const Step5Confirmation = ({ formData, onReset }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState(null);

  const isEssai = formData.typeInscription === 'ESSAI';

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      const registerData = {
        email: formData.email || formData.contact,
        telephone: formData.telephone,
        nom: formData.nom || '',
        prenom: formData.prenom || '',
        raisonSociale: formData.raisonSociale || '',
        siret: formData.siret || '',
        typeCompte: formData.typeCompte,
        typeInscription: formData.typeInscription,
        code: formData.code,
        motDePasse: formData.motDePasse
      };
      
      const result = await register(registerData);
      
      if (result.success) {
        setSuccess(true);
        setCredentials({
          email: formData.email || formData.contact,
          motDePasse: formData.motDePasse
        });
      } else {
        setError(result.message || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    }
    setLoading(false);
  };

  if (success) {
    if (isEssai) {
      return (
        <div className="text-center animate-fadeIn">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Compte essai créé avec succès !</h2>
          
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-green-800 mb-2">✅ Votre compte est actif !</h3>
            <p className="text-green-700">Vous pouvez dès maintenant vous connecter à votre ERP.</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <h4 className="font-semibold mb-2">📋 Vos identifiants :</h4>
            <p><strong>Email :</strong> {credentials?.email}</p>
            <p><strong>Mot de passe :</strong> {credentials?.motDePasse}</p>
            <small className="text-gray-500">⚠️ Conservez ces identifiants précieusement</small>
          </div>

          <div className="bg-yellow-50 rounded-xl p-4 mb-6 text-left">
            <h4 className="font-semibold text-yellow-800 mb-2">📌 Informations essai :</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
              <li>🔑 30 connexions maximum</li>
              <li>💡 Chaque connexion diminue le compteur</li>
              <li>⚠️ Après 30 connexions, l'accès sera bloqué</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => window.location.href = '/login'}
              className="flex-1 bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition"
            >
              🔐 Se connecter
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-center animate-fadeIn">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Inscription enregistrée !</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">⏳ En attente de validation</h3>
            <p className="text-blue-700">Votre dossier est en cours de vérification par nos équipes.</p>
            <p className="text-blue-700 mt-1">Vous recevrez un email sous 24-48h.</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <h4 className="font-semibold mb-2">📌 Prochaines étapes :</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Validation de vos justificatifs</li>
              <li>Réception d'un email avec lien de paiement</li>
              <li>Paiement de l'abonnement (29€/mois)</li>
              <li>Activation de votre compte</li>
            </ol>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition"
          >
            Retour à l'accueil
          </button>
        </div>
      );
    }
  }

  return (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📝 Vérifiez vos informations</h2>

      <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-600 text-sm mb-1">Type de compte</h3>
          <p>{formData.typeCompte === 'PARTICULIER' ? '👤 Particulier' : '🏢 Entreprise'}</p>
        </div>

        <div className="border-t border-gray-200 pt-3">
          <h3 className="font-semibold text-gray-600 text-sm mb-1">Identité</h3>
          {formData.typeCompte === 'PARTICULIER' ? (
            <p>{formData.prenom} {formData.nom}</p>
          ) : (
            <p>{formData.raisonSociale} {formData.siret ? `(SIRET: ${formData.siret})` : ''}</p>
          )}
          <p>{formData.email || formData.contact}</p>
          <p>{formData.telephone}</p>
        </div>

        <div className="border-t border-gray-200 pt-3">
          <h3 className="font-semibold text-gray-600 text-sm mb-1">Offre choisie</h3>
          {isEssai ? (
            <p>🎁 Essai gratuit (30 connexions)</p>
          ) : (
            <p>💰 Abonnement mensuel (29€/mois)</p>
          )}
        </div>

        {!isEssai && (
          <div className="border-t border-gray-200 pt-3">
            <h3 className="font-semibold text-gray-600 text-sm mb-1">Documents</h3>
            <p>{formData.documents?.length || 0} fichier(s) téléchargé(s)</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={onReset}
          className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
        >
          Modifier
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition disabled:bg-gray-400"
        >
          {loading ? 'Envoi en cours...' : 'Confirmer mon inscription'}
        </button>
      </div>
    </div>
  );
};

export default Step5Confirmation;