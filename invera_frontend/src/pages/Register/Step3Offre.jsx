// src/pages/Register/Step3Offre.jsx
import React, { useState } from 'react';

const Step3Offre = ({ formData, updateFormData, onNext, onBack }) => {
  const [typeInscription, setTypeInscription] = useState(formData.typeInscription || null);

  const handleNext = () => {
    updateFormData('typeInscription', typeInscription);
    // Pour ESSAI, pas de plan d'abonnement
    if (typeInscription === 'ESSAI') {
      updateFormData('planAbonnement', null);
    }
    onNext();
  };

  const isValid = () => {
    return typeInscription !== null;
  };

  return (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🎯 Choisissez votre offre</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Offre ESSAI - 30 CONNEXIONS UNIQUEMENT */}
        <div
          className={`cursor-pointer rounded-xl border-2 p-5 transition ${
            typeInscription === 'ESSAI'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-green-300'
          }`}
          onClick={() => setTypeInscription('ESSAI')}
        >
          <h3 className="text-xl font-bold mb-2">🎁 Offre Découverte</h3>
          <div className="text-3xl font-bold text-green-600 mb-3">0€</div>
          <ul className="space-y-2 text-sm text-gray-600 mb-3">
            <li>✅ Accès IMMÉDIAT après inscription</li>
            <li>✅ 30 connexions offertes</li>
            <li>✅ Toutes fonctionnalités</li>
            <li>✅ Aucun justificatif requis</li>
            <li>✅ Sans carte bancaire</li>
          </ul>
          <span className="inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
            Accès immédiat - 30 connexions
          </span>
        </div>

        {/* Offre DEFINITIF - Abonnement payant */}
        <div
          className={`cursor-pointer rounded-xl border-2 p-5 transition ${
            typeInscription === 'DEFINITIF'
              ? 'border-[#0b4ea2] bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}
          onClick={() => setTypeInscription('DEFINITIF')}
        >
          <h3 className="text-xl font-bold mb-2">💰 Abonnement illimité</h3>
          <div className="text-3xl font-bold text-[#0b4ea2] mb-3">29€</div>
          <ul className="space-y-2 text-sm text-gray-600 mb-3">
            <li>⏳ Accès APRÈS validation + paiement</li>
            <li>✅ Connexions illimitées</li>
            <li>✅ Support prioritaire</li>
            <li>✅ Base de données dédiée</li>
            <li>📎 Justificatifs requis</li>
          </ul>
          <span className="inline-block bg-blue-100 text-[#0b4ea2] text-xs px-3 py-1 rounded-full">
            Validation requise
          </span>
        </div>
      </div>

      {/* Aucun choix de plan pour ESSAI */}
      {typeInscription === 'DEFINITIF' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-semibold mb-3">Formule mensuelle uniquement</h3>
          <p className="text-sm text-gray-600">Abonnement mensuel sans engagement</p>
          <div className="mt-2 text-lg font-semibold text-[#0b4ea2]">29€ / mois</div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
        >
          Retour
        </button>
        <button
          onClick={handleNext}
          disabled={!isValid()}
          className="flex-1 bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition disabled:bg-gray-400"
        >
          Suivant
        </button>
      </div>
    </div>
  );
};

export default Step3Offre;