// src/pages/Register/Step1Contact.jsx
import React, { useState } from 'react';
import { sendOtp, verifyOtp } from '../../services/registerService';

const Step1Contact = ({ formData, updateFormData, onNext }) => {
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    if (!formData.contact) {
      setError('Veuillez saisir votre email ou téléphone');
      return;
    }
    
    const isEmail = formData.contact.includes('@');
    if (!isEmail) {
      setError('Veuillez saisir un email valide');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const result = await sendOtp(formData.contact);
    
    if (result.success) {
      setCodeSent(true);
      updateFormData('email', formData.contact);
      console.log('📧 Code OTP envoyé à:', formData.contact);
      console.log('🔑 Code (debug):', result.otp);
    } else {
      setError(result.message || 'Erreur lors de l\'envoi du code');
    }
    setLoading(false);
  };

  const handleVerifyCode = async () => {
    if (!formData.code) {
      setError('Veuillez saisir le code reçu');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // ✅ Appeler l'API de vérification OTP
    const isValid = await verifyOtp(formData.contact, formData.code);
    
    if (isValid) {
      // ✅ Code valide, passer à l'étape suivante
      onNext();
    } else {
      setError('Code invalide. Veuillez réessayer.');
    }
    
    setLoading(false);
  };

  return (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">📱 Créer mon compte</h2>
      <p className="text-gray-500 mb-6">Saisissez votre email</p>

      <div className="mb-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2] focus:border-transparent"
          value={formData.contact}
          onChange={(e) => updateFormData('contact', e.target.value)}
          disabled={codeSent}
        />
      </div>

      {!codeSent ? (
        <button
          onClick={handleSendCode}
          disabled={loading || !formData.contact}
          className="w-full bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Envoi en cours...' : 'Recevoir le code'}
        </button>
      ) : (
        <>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Code à 6 chiffres"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]"
              value={formData.code}
              onChange={(e) => updateFormData('code', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-2">
              Un code a été envoyé à {formData.contact}
            </p>
          </div>
          <button
            onClick={handleVerifyCode}
            disabled={loading || !formData.code}
            className="w-full bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition disabled:bg-gray-400"
          >
            {loading ? 'Vérification...' : 'Vérifier le code'}
          </button>
          <button
            onClick={() => {
              setCodeSent(false);
              setError('');
            }}
            className="w-full text-[#0b4ea2] py-2 mt-2 text-sm hover:underline"
          >
            Modifier mon email
          </button>
        </>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default Step1Contact;