// src/pages/Register/Step2Infos.jsx
import React, { useState } from 'react';

const Step2Infos = ({ formData, updateFormData, onNext, onBack }) => {
  const [typeCompte, setTypeCompte] = useState(formData.typeCompte || 'PARTICULIER');
  const [uploadedFiles, setUploadedFiles] = useState({
    cin: null,
    cinGerant: null,
    patente: null,
    rne: null
  });

  const handleTypeChange = (type) => {
    setTypeCompte(type);
    updateFormData('typeCompte', type);
    // Réinitialiser les fichiers quand on change de type
    setUploadedFiles({
      cin: null,
      cinGerant: null,
      patente: null,
      rne: null
    });
  };

  const handleFileUpload = (field, file) => {
    
 const typeMapping = {
    cin: 'CIN',
    cinGerant: 'CIN_DIRIGEANT',
    patente: 'PATENTE',
    rne: 'RNE'
  };


    setUploadedFiles(prev => ({ ...prev, [field]: file }));
    // Stocker les fichiers dans formData
    const currentDocs = formData.documents || [];
    const newDocs = [...currentDocs];
    
    // Remplacer ou ajouter le document
    const existingIndex = newDocs.findIndex(d => d.field === field);
    if (existingIndex !== -1) {
      newDocs[existingIndex] = { field, file };
    } else {
      newDocs.push({ field, file });
    }
    updateFormData('documents', newDocs);
  };

  const isValid = () => {
    const hasBasicInfo = typeCompte === 'PARTICULIER' 
      ? formData.nom && formData.prenom && formData.email && formData.telephone && formData.motDePasse
      : formData.raisonSociale && formData.email && formData.telephone && formData.motDePasse;
    
    if (!hasBasicInfo) return false;
    
    // Vérifier les documents requis selon le type
    if (typeCompte === 'PARTICULIER') {
      return uploadedFiles.cin !== null;
    } else {
      return uploadedFiles.cinGerant !== null && 
             uploadedFiles.patente !== null && 
             uploadedFiles.rne !== null;
    }
  };

  return (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 Vos informations</h2>

      {/* Type de compte */}
      <div className="flex gap-4 mb-6">
        <button
          className={`flex-1 py-3 rounded-xl font-semibold transition ${
            typeCompte === 'PARTICULIER'
              ? 'bg-[#0b4ea2] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => handleTypeChange('PARTICULIER')}
        >
          👤 Particulier
        </button>
        <button
          className={`flex-1 py-3 rounded-xl font-semibold transition ${
            typeCompte === 'ENTREPRISE'
              ? 'bg-[#0b4ea2] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => handleTypeChange('ENTREPRISE')}
        >
          🏢 Entreprise
        </button>
      </div>

      {/* Champs selon le type */}
      {typeCompte === 'PARTICULIER' ? (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            placeholder="Nom *"
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]"
            value={formData.nom || ''}
            onChange={(e) => updateFormData('nom', e.target.value)}
          />
          <input
            placeholder="Prénom *"
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]"
            value={formData.prenom || ''}
            onChange={(e) => updateFormData('prenom', e.target.value)}
          />
        </div>
      ) : (
        <>
          <div className="mb-4">
            <input
              placeholder="Raison sociale *"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]"
              value={formData.raisonSociale || ''}
              onChange={(e) => updateFormData('raisonSociale', e.target.value)}
            />
          </div>
          <div className="mb-4">
            <input
              placeholder="SIRET (14 chiffres)"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]"
              value={formData.siret || ''}
              onChange={(e) => updateFormData('siret', e.target.value)}
            />
          </div>
        </>
      )}

      {/* Champs communs */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="email"
          placeholder="Email *"
          className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]"
          value={formData.email || ''}
          onChange={(e) => updateFormData('email', e.target.value)}
        />
        <input
          type="tel"
          placeholder="Téléphone *"
          className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]"
          value={formData.telephone || ''}
          onChange={(e) => updateFormData('telephone', e.target.value)}
        />
      </div>

      <div className="mb-6">
        <input
          type="password"
          placeholder="Mot de passe *"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]"
          value={formData.motDePasse || ''}
          onChange={(e) => updateFormData('motDePasse', e.target.value)}
        />
      </div>

      {/* 📎 SECTION DOCUMENTS OBLIGATOIRES */}
      <div className="border-t border-gray-200 pt-6 mt-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📎 Documents obligatoires</h3>
        
        {typeCompte === 'PARTICULIER' ? (
          // Documents pour PARTICULIER
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-[#0b4ea2] transition">
            <input
              type="file"
              accept=".pdf,.jpg,.png"
              onChange={(e) => handleFileUpload('cin', e.target.files[0])}
              className="hidden"
              id="cin"
            />
            <label htmlFor="cin" className="cursor-pointer block">
              <div className="text-4xl mb-2">🪪</div>
              <p className="text-gray-600 font-medium">Carte d'identité nationale</p>
              <p className="text-sm text-gray-400">PDF, JPG ou PNG (max 5Mo)</p>
              {uploadedFiles.cin && (
                <div className="mt-2 text-green-600 text-sm">✅ {uploadedFiles.cin.name}</div>
              )}
            </label>
          </div>
        ) : (
          // Documents pour ENTREPRISE
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-[#0b4ea2] transition">
              <input
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={(e) => handleFileUpload('cinGerant', e.target.files[0])}
                className="hidden"
                id="cinGerant"
              />
              <label htmlFor="cinGerant" className="cursor-pointer block">
                <div className="text-4xl mb-2">👤</div>
                <p className="text-gray-600 font-medium">Carte d'identité du Gérant *</p>
                <p className="text-sm text-gray-400">PDF, JPG ou PNG (max 5Mo)</p>
                {uploadedFiles.cinGerant && (
                  <div className="mt-2 text-green-600 text-sm">✅ {uploadedFiles.cinGerant.name}</div>
                )}
              </label>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-[#0b4ea2] transition">
              <input
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={(e) => handleFileUpload('patente', e.target.files[0])}
                className="hidden"
                id="patente"
              />
              <label htmlFor="patente" className="cursor-pointer block">
                <div className="text-4xl mb-2">📜</div>
                <p className="text-gray-600 font-medium">Patente *</p>
                <p className="text-sm text-gray-400">PDF, JPG ou PNG (max 5Mo)</p>
                {uploadedFiles.patente && (
                  <div className="mt-2 text-green-600 text-sm">✅ {uploadedFiles.patente.name}</div>
                )}
              </label>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-[#0b4ea2] transition">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileUpload('rne', e.target.files[0])}
                className="hidden"
                id="rne"
              />
              <label htmlFor="rne" className="cursor-pointer block">
                <div className="text-4xl mb-2">🏢</div>
                <p className="text-gray-600 font-medium">Extrait RNE (moins de 3 mois) *</p>
                <p className="text-sm text-gray-400">PDF uniquement (max 5Mo)</p>
                {uploadedFiles.rne && (
                  <div className="mt-2 text-green-600 text-sm">✅ {uploadedFiles.rne.name}</div>
                )}
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
        >
          Retour
        </button>
        <button
          onClick={onNext}
          disabled={!isValid()}
          className="flex-1 bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition disabled:bg-gray-400"
        >
          Suivant
        </button>
      </div>
    </div>
  );
};

export default Step2Infos;