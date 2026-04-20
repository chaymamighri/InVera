// src/pages/Register/RegisterPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendOtp, verifyOtp, register } from '../../services/registerService';
import logo from '../../assets/images/logo.png';

const RegisterPage = () => {
  // Étape 0: Vérification OTP
  const [step, setStep] = useState('otp');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Formulaire principal (tout en un)
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
      <div className="min-h-screen overflow-hidden bg-[#f6f9fc] text-slate-900">
        <div className="absolute inset-x-0 top-0 -z-10 h-[460px] bg-[linear-gradient(180deg,#eef6ff_0%,#f6f9fc_100%)]" />

        <div className="mx-auto max-w-7xl px-6 pb-24 pt-6 lg:px-8">
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
              <Link to="/" className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700">
                ← Retour à l'accueil
              </Link>
            </div>
          </header>

          <main className="pt-14">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-2xl border border-sky-100 p-8 shadow-sm">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-slate-900">Vérification email</h1>
                  <p className="text-slate-500 mt-1">Saisissez votre email pour recevoir un code</p>
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
          </main>
        </div>
      </div>
    );
  }

  // ==================== ÉCRAN DE SUCCÈS ====================
  if (success) {
    return (
      <div className="min-h-screen overflow-hidden bg-[#f6f9fc] text-slate-900">
        <div className="absolute inset-x-0 top-0 -z-10 h-[460px] bg-[linear-gradient(180deg,#eef6ff_0%,#f6f9fc_100%)]" />

        <div className="mx-auto max-w-7xl px-6 pb-24 pt-6 lg:px-8">
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
              <Link to="/" className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700">
                ← Retour à l'accueil
              </Link>
            </div>
          </header>

          <main className="pt-14">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-2xl border border-sky-100 p-8 shadow-sm text-center">
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
          </main>
        </div>
      </div>
    );
  }

  // ==================== ÉCRAN PRINCIPAL (FORMULAIRE UNIQUE) ====================
  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f9fc] text-slate-900">
      <div className="absolute inset-x-0 top-0 -z-10 h-[460px] bg-[linear-gradient(180deg,#eef6ff_0%,#f6f9fc_100%)]" />

      <div className="mx-auto max-w-7xl px-6 pb-24 pt-6 lg:px-8">
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
            <Link to="/" className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700">
              ← Retour à l'accueil
            </Link>
          </div>
        </header>

        <main className="pt-14">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Créer mon compte</h1>
              <p className="text-slate-500 mt-2">30 connexions offertes pour découvrir la plateforme</p>
              <div className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600 mt-2">
                ✓ Email vérifié
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-sky-100 p-8 shadow-sm">
              <div className="space-y-6">
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
                    <input type="text" placeholder="Raison sociale *" className="w-full px-4 py-3 border rounded-xl" value={formData.raisonSociale} onChange={(e) => updateFormData('raisonSociale', e.target.value)} />
                    <input type="text" placeholder="SIRET (optionnel)" className="w-full px-4 py-3 border rounded-xl" value={formData.siret} onChange={(e) => updateFormData('siret', e.target.value)} />
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
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="font-bold text-[#0b4ea2]">📅 Mensuel - 29€/mois</p>
                  </div>
                )}

                {error && <div className="p-3 bg-red-100 text-red-700 rounded-xl">{error}</div>}

                <button
                  onClick={handleSubmit}
                  disabled={loading || !isValid()}
                  className="w-full bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition disabled:bg-gray-400"
                >
                  {loading ? 'Inscription en cours...' : '📝 S\'inscrire'}
                </button>

                <p className="text-center text-xs text-gray-400">
                  En cliquant sur "S'inscrire", vous acceptez nos conditions générales d'utilisation
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RegisterPage;