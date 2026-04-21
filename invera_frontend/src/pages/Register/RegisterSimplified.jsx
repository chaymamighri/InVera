// src/pages/Register/RegisterSimplified.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendOtp, verifyOtp, register } from '../../services/registerService';
import logo from '../../assets/images/logo.png';

const RegisterSimplified = () => {
  // Étape 0: Vérification OTP
  const [step, setStep] = useState('otp');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Formulaire principal (étapes 1 à 4)
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
    typeCompte: 'PARTICULIER',
    typeInscription: 'ESSAI',
    nom: '',
    prenom: '',
    raisonSociale: '',
    siret: '',
    telephone: '',
    motDePasse: '',
    email: '',
    documents: []
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // === ÉTAPE OTP ===
  const handleSendOtp = async () => {
    if (!email) {
      setOtpError('Veuillez saisir votre email');
      return;
    }
    
    setOtpLoading(true);
    setOtpError('');
    
    const result = await sendOtp(email);
    if (result.success) {
      setOtpSent(true);
      console.log('📧 Code OTP:', result.otp);
    } else {
      setOtpError(result.message || 'Erreur lors de l\'envoi du code');
    }
    setOtpLoading(false);
  };

  const handleVerifyOtp = async () => {
    const cleanedCode = otpCode ? otpCode.toString().trim() : '';
    
    if (!cleanedCode) {
      setOtpError('Veuillez saisir le code reçu');
      return;
    }
    
    setOtpLoading(true);
    setOtpError('');
    
    const isValid = await verifyOtp(email, cleanedCode);
    
    if (isValid) {
      setStep('form');
      setFormData(prev => ({ ...prev, email }));
    } else {
      setOtpError('Code invalide. Veuillez réessayer.');
    }
    
    setOtpLoading(false);
  };

  // === FORMULAIRE PRINCIPAL ===
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setFormStep(formStep + 1);
  const prevStep = () => setFormStep(formStep - 1);

  const handleFileUpload = (field, file) => {
    if (!file) return;
    const currentDocs = formData.documents || [];
    const newDocs = [...currentDocs];
    const existingIndex = newDocs.findIndex(d => d.field === field);
    
    if (existingIndex !== -1) {
      newDocs[existingIndex] = { field, file };
    } else {
      newDocs.push({ field, file });
    }
    updateFormData('documents', newDocs);
  };

  const isEssai = formData.typeInscription === 'ESSAI';
  const isParticulier = formData.typeCompte === 'PARTICULIER';

  const isValid = () => {
    const hasBasicInfo = formData.email && formData.telephone && formData.motDePasse;
    
    if (isParticulier) {
      if (!formData.nom || !formData.prenom) return false;
    } else {
      if (!formData.raisonSociale) return false;
    }
    
    if (!hasBasicInfo) return false;
    
    if (!isEssai) {
      if (isParticulier) {
        if (!formData.documents?.find(d => d.field === 'CIN')) return false;
      } else {
        const hasCinGerant = formData.documents?.find(d => d.field === 'CIN_DIRIGEANT');
        const hasPatente = formData.documents?.find(d => d.field === 'PATENTE');
        const hasRne = formData.documents?.find(d => d.field === 'RNE');
        if (!hasCinGerant || !hasPatente || !hasRne) return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    const registerData = {
      email: formData.email,
      telephone: formData.telephone,
      nom: formData.nom || '',
      prenom: formData.prenom || '',
      raisonSociale: formData.raisonSociale || '',
      siret: formData.siret || '',
      typeCompte: formData.typeCompte,
      typeInscription: formData.typeInscription,
      code: otpCode,
      motDePasse: formData.motDePasse,
      documents: formData.documents
    };
    
    const result = await register(registerData);
    
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  // ==================== ÉCRAN OTP ====================
  if (step === 'otp') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f0f4fa] via-[#f8fafc] to-[#eef2f8]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 h-[500px] w-[500px] rounded-full bg-[#0b4ea2] opacity-[0.03] blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-[#1d75d6] opacity-[0.02] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-md px-4 py-8 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center">
          <div className="w-full rounded-2xl border border-white/60 bg-white/90 p-8 shadow-xl backdrop-blur-md">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#0b2f6b]">
                  <img src={logo} alt="logo" className="max-h-9 max-w-full object-contain" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">InVera ERP</h1>
              <p className="text-gray-500 mt-1">Vérification de votre email</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="exemple@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2] transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={otpSent}
                />
              </div>
              
              {!otpSent ? (
                <button
                  onClick={handleSendOtp}
                  disabled={otpLoading || !email}
                  className="w-full bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition disabled:bg-gray-400"
                >
                  {otpLoading ? 'Envoi en cours...' : 'Recevoir le code'}
                </button>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Code de vérification</label>
                    <input
                      type="text"
                      placeholder="Code à 6 chiffres"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2] transition"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Un code a été envoyé à <span className="font-medium text-slate-700">{email}</span>
                    </p>
                  </div>
                  
                  <button
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || !otpCode}
                    className="w-full bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition disabled:bg-gray-400"
                  >
                    {otpLoading ? 'Vérification...' : 'Vérifier le code'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setOtpSent(false);
                      setOtpError('');
                      setOtpCode('');
                    }}
                    className="w-full text-[#0b4ea2] py-2 text-sm hover:underline transition"
                  >
                    ← Modifier mon email
                  </button>
                </>
              )}

              {otpError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                  {otpError}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== ÉCRAN DE SUCCÈS ====================
  if (success) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f0f4fa] via-[#f8fafc] to-[#eef2f8]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 h-[500px] w-[500px] rounded-full bg-[#0b4ea2] opacity-[0.03] blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-[#1d75d6] opacity-[0.02] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-md px-4 py-8 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center">
          <div className="w-full rounded-2xl border border-white/60 bg-white/90 p-8 shadow-xl backdrop-blur-md text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {isEssai ? 'Compte essai créé !' : 'Inscription enregistrée !'}
            </h2>
            {isEssai ? (
              <>
                <p className="text-gray-600 mb-4">Vous pouvez dès maintenant vous connecter.</p>
                <button
                  onClick={() => window.location.href = '/login'}
                  className="w-full bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition"
                >
                  Se connecter
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">Votre dossier est en cours de validation.</p>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition"
                >
                  Retour à l'accueil
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==================== ÉCRAN PRINCIPAL (ÉTAPES 1-4) ====================
  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f9fc] text-slate-900">
      <div className="absolute inset-x-0 top-0 -z-10 h-[460px] bg-[linear-gradient(180deg,#eef6ff_0%,#f6f9fc_100%)]" />

      <div className="mx-auto max-w-7xl px-6 pb-24 pt-6 lg:px-8">
        {/* Header */}
        <header className="rounded-[28px] border border-sky-100 bg-white px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link to="/" className="flex items-center gap-4 group cursor-pointer">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b2f6b] p-2 transition group-hover:bg-[#0b4ea2]">
                <img src={logo} alt="InVera logo" className="max-h-full max-w-full object-contain" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#0b4ea2]">
                  InVera ERP
                </p>
                <h1 className="text-xl font-semibold text-slate-950">Gestion intelligente des operations</h1>
              </div>
            </Link>

            <Link
              to="/"
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </header>

        {/* Formulaire d'inscription */}
        <main className="pt-14">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Créer mon compte</h1>
              <p className="text-slate-500 mt-2">30 connexions offertes pour découvrir la plateforme</p>
            </div>

            {/* Progress bar */}
            <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm mb-8">
              <div className="flex justify-between">
                <div className="flex-1 text-center relative">
                  <div className="w-10 h-10 mx-auto rounded-full bg-[#0b4ea2] text-white flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div className="text-xs mt-2 text-[#0b4ea2] font-medium">Email</div>
                </div>

                <div className="flex-1 text-center relative">
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold ${formStep >= 2 ? 'bg-[#0b4ea2] text-white' : 'bg-slate-100 text-slate-400'}`}>
                    2
                  </div>
                  <div className={`text-xs mt-2 ${formStep >= 2 ? 'text-[#0b4ea2] font-medium' : 'text-slate-400'}`}>Identité</div>
                  <div className="absolute top-5 left-1/2 w-full h-0.5 -z-10 bg-[#0b4ea2]" />
                </div>

                <div className="flex-1 text-center relative">
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold ${formStep >= 3 ? 'bg-[#0b4ea2] text-white' : 'bg-slate-100 text-slate-400'}`}>
                    3
                  </div>
                  <div className={`text-xs mt-2 ${formStep >= 3 ? 'text-[#0b4ea2] font-medium' : 'text-slate-400'}`}>Offre</div>
                  {formStep > 2 && <div className="absolute top-5 left-1/2 w-full h-0.5 -z-10 bg-[#0b4ea2]" />}
                </div>

                <div className="flex-1 text-center relative">
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold ${formStep >= 4 ? 'bg-[#0b4ea2] text-white' : 'bg-slate-100 text-slate-400'}`}>
                    4
                  </div>
                  <div className={`text-xs mt-2 ${formStep >= 4 ? 'text-[#0b4ea2] font-medium' : 'text-slate-400'}`}>Confirmation</div>
                  {formStep > 3 && <div className="absolute top-5 left-1/2 w-full h-0.5 -z-10 bg-[#0b4ea2]" />}
                </div>
              </div>
            </div>

            {/* Contenu des étapes */}
            <div className="bg-white rounded-2xl border border-sky-100 p-8 shadow-sm">
              {/* ÉTAPE 1 : Identité + Documents */}
              {formStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800">Vos informations</h2>
                    <p className="text-slate-500 text-sm mt-1">Complétez votre profil</p>
                  </div>

                  {/* Type de compte */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Type de compte</label>
                    <div className="flex gap-4">
                      <button
                        className={`flex-1 py-3 rounded-xl font-semibold transition ${
                          formData.typeCompte === 'PARTICULIER' ? 'bg-[#0b4ea2] text-white' : 'bg-white border-2 border-gray-200 hover:border-[#0b4ea2]'
                        }`}
                        onClick={() => updateFormData('typeCompte', 'PARTICULIER')}
                      >
                        👤 Particulier
                      </button>
                      <button
                        className={`flex-1 py-3 rounded-xl font-semibold transition ${
                          formData.typeCompte === 'ENTREPRISE' ? 'bg-[#0b4ea2] text-white' : 'bg-white border-2 border-gray-200 hover:border-[#0b4ea2]'
                        }`}
                        onClick={() => updateFormData('typeCompte', 'ENTREPRISE')}
                      >
                        🏢 Entreprise
                      </button>
                    </div>
                  </div>

                  {/* Type d'inscription */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Type d'inscription</label>
                    <div className="flex gap-4">
                      <button
                        className={`flex-1 py-3 rounded-xl font-semibold transition ${
                          formData.typeInscription === 'ESSAI' ? 'bg-green-500 text-white' : 'bg-white border-2 border-gray-200 hover:border-green-400'
                        }`}
                        onClick={() => updateFormData('typeInscription', 'ESSAI')}
                      >
                        🎁 Essai gratuit
                        <span className="block text-xs">30 connexions</span>
                      </button>
                      <button
                        className={`flex-1 py-3 rounded-xl font-semibold transition ${
                          formData.typeInscription === 'DEFINITIF' ? 'bg-[#0b4ea2] text-white' : 'bg-white border-2 border-gray-200 hover:border-[#0b4ea2]'
                        }`}
                        onClick={() => updateFormData('typeInscription', 'DEFINITIF')}
                      >
                        💰 Abonnement
                        <span className="block text-xs">29€/mois</span>
                      </button>
                    </div>
                  </div>

                  {/* Champs selon le type */}
                  {isParticulier ? (
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="Nom *" className="px-4 py-3 border rounded-xl" value={formData.nom} onChange={(e) => updateFormData('nom', e.target.value)} />
                      <input type="text" placeholder="Prénom *" className="px-4 py-3 border rounded-xl" value={formData.prenom} onChange={(e) => updateFormData('prenom', e.target.value)} />
                    </div>
                  ) : (
                    <>
                      <input type="text" placeholder="Raison sociale *" className="w-full px-4 py-3 border rounded-xl mb-4" value={formData.raisonSociale} onChange={(e) => updateFormData('raisonSociale', e.target.value)} />
                      <input type="text" placeholder="SIRET (optionnel)" className="w-full px-4 py-3 border rounded-xl mb-4" value={formData.siret} onChange={(e) => updateFormData('siret', e.target.value)} />
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <input type="email" placeholder="Email *" className="px-4 py-3 border rounded-xl" value={formData.email} onChange={(e) => updateFormData('email', e.target.value)} />
                    <input type="tel" placeholder="Téléphone *" className="px-4 py-3 border rounded-xl" value={formData.telephone} onChange={(e) => updateFormData('telephone', e.target.value)} />
                  </div>

                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} placeholder="Mot de passe *" className="w-full px-4 py-3 border rounded-xl pr-12" value={formData.motDePasse} onChange={(e) => updateFormData('motDePasse', e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">{showPassword ? '👁️' : '👁️‍🗨️'}</button>
                  </div>

                  {/* Documents pour DEFINITIF */}
                  {!isEssai && (
                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium mb-2">📎 Documents obligatoires</label>
                      {isParticulier ? (
                        <div className="border-2 border-dashed rounded-xl p-4 text-center">
                          <input type="file" id="cin" className="hidden" onChange={(e) => handleFileUpload('CIN', e.target.files[0])} />
                          <label htmlFor="cin" className="cursor-pointer block">🪪 Carte d'identité</label>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-3">
                          <div className="border-2 border-dashed rounded-xl p-2 text-center"><input type="file" id="cinGerant" className="hidden" onChange={(e) => handleFileUpload('CIN_DIRIGEANT', e.target.files[0])} /><label htmlFor="cinGerant" className="cursor-pointer">👤 CIN Gérant</label></div>
                          <div className="border-2 border-dashed rounded-xl p-2 text-center"><input type="file" id="patente" className="hidden" onChange={(e) => handleFileUpload('PATENTE', e.target.files[0])} /><label htmlFor="patente" className="cursor-pointer">📜 Patente</label></div>
                          <div className="border-2 border-dashed rounded-xl p-2 text-center"><input type="file" id="rne" className="hidden" onChange={(e) => handleFileUpload('RNE', e.target.files[0])} /><label htmlFor="rne" className="cursor-pointer">🏢 RNE</label></div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Abonnement pour DEFINITIF */}
                  {!isEssai && (
                    <div className="border-t pt-4">
                      <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <p className="font-bold text-[#0b4ea2]">📅 Mensuel - 29€/mois</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button onClick={() => setStep('otp')} className="flex-1 bg-gray-200 py-3 rounded-xl">Retour</button>
                    <button onClick={nextStep} disabled={!isValid()} className="flex-1 bg-[#0b4ea2] text-white py-3 rounded-xl disabled:bg-gray-400">Suivant</button>
                  </div>
                </div>
              )}

              {/* ÉTAPE 2 : Choix de l'offre */}
              {formStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800">Choix de l'offre</h2>
                    <p className="text-slate-500 text-sm mt-1">Sélectionnez votre formule</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`cursor-pointer rounded-xl border-2 p-5 transition ${formData.typeInscription === 'ESSAI' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`} onClick={() => updateFormData('typeInscription', 'ESSAI')}>
                      <h3 className="text-xl font-bold">🎁 Essai gratuit</h3>
                      <div className="text-3xl font-bold text-green-600">0€</div>
                      <ul className="text-sm mt-3 space-y-1">
                        <li>✅ 30 connexions offertes</li>
                        <li>✅ Accès immédiat</li>
                        <li>✅ Sans justificatif</li>
                      </ul>
                    </div>

                    <div className={`cursor-pointer rounded-xl border-2 p-5 transition ${formData.typeInscription === 'DEFINITIF' ? 'border-[#0b4ea2] bg-blue-50' : 'border-gray-200'}`} onClick={() => updateFormData('typeInscription', 'DEFINITIF')}>
                      <h3 className="text-xl font-bold">💰 Abonnement</h3>
                      <div className="text-3xl font-bold text-[#0b4ea2]">29€</div>
                      <ul className="text-sm mt-3 space-y-1">
                        <li>✅ Connexions illimitées</li>
                        <li>✅ Support prioritaire</li>
                        <li>📎 Justificatifs requis</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button onClick={prevStep} className="flex-1 bg-gray-200 py-3 rounded-xl">Retour</button>
                    <button onClick={nextStep} disabled={!formData.typeInscription} className="flex-1 bg-[#0b4ea2] text-white py-3 rounded-xl">Suivant</button>
                  </div>
                </div>
              )}

              {/* ÉTAPE 3 : Confirmation */}
              {formStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800">Vérification</h2>
                    <p className="text-slate-500 text-sm mt-1">Vérifiez vos informations</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <p><strong>Type de compte :</strong> {formData.typeCompte === 'PARTICULIER' ? 'Particulier' : 'Entreprise'}</p>
                    <p><strong>Identité :</strong> {isParticulier ? `${formData.prenom} ${formData.nom}` : formData.raisonSociale}</p>
                    <p><strong>Email :</strong> {formData.email}</p>
                    <p><strong>Téléphone :</strong> {formData.telephone}</p>
                    <p><strong>Offre :</strong> {isEssai ? 'Essai gratuit (30 connexions)' : 'Abonnement mensuel (29€/mois)'}</p>
                    {!isEssai && <p><strong>Documents :</strong> {formData.documents?.length || 0} fichier(s)</p>}
                  </div>

                  {error && <div className="p-3 bg-red-100 text-red-700 rounded-xl">{error}</div>}

                  <div className="flex gap-4">
                    <button onClick={prevStep} className="flex-1 bg-gray-200 py-3 rounded-xl">Retour</button>
                    <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-[#0b4ea2] text-white py-3 rounded-xl disabled:bg-gray-400">
                      {loading ? 'Inscription...' : 'Confirmer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RegisterSimplified;