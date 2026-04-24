// src/pages/Register/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sendOtp, verifyOtp, register, fetchOffres } from '../../services/registerService';
import logo from '../../assets/images/logo.png';

// Import des icônes Heroicons
import { 
  ArrowLeftIcon,
  EnvelopeIcon,
  KeyIcon,
  CheckCircleIcon,
  UserIcon,
  GiftIcon,
  CreditCardIcon,
  IdentificationIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  PhoneIcon,
  LockClosedIcon,
  BriefcaseIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  WalletIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

import { CheckBadgeIcon } from '@heroicons/react/24/solid';

const RegisterPage = () => {
  // Étape 0: Vérification OTP
  const [step, setStep] = useState('otp');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Offres depuis l'API
  const [offres, setOffres] = useState([]);
  const [offresLoading, setOffresLoading] = useState(false);
  const [selectedOffre, setSelectedOffre] = useState(null);

  // Formulaire principal
  const [formData, setFormData] = useState({
    typeCompte: 'PARTICULIER',
    typeAbonnement: 'ESSAI',
    nom: '',
    prenom: '',
    raisonSociale: '',
    matriculeFiscal: '',
    telephone: '',
    motDePasse: '',
    email: '',
    documents: []
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Charger les offres depuis l'API
  useEffect(() => {
    const loadOffres = async () => {
      setOffresLoading(true);
      const result = await fetchOffres();
      if (result.success) {
        setOffres(result.data);
      }
      setOffresLoading(false);
    };
    loadOffres();
  }, []);

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
    const existingIndex = newDocs.findIndex(d => d.type === field);
    
    if (existingIndex !== -1) {
      newDocs[existingIndex] = { type: field, file };
    } else {
      newDocs.push({ type: field, file });
    }
    updateFormData('documents', newDocs);
  };

  const hasDocument = (field) => {
    return formData.documents?.some(d => d.type === field);
  };

  const isEssai = formData.typeAbonnement === 'ESSAI';
  const isPayant = formData.typeAbonnement === 'PAYANT';
  const isParticulier = formData.typeCompte === 'PARTICULIER';

  const isValid = () => {
    const hasBasicInfo = formData.email && formData.telephone && formData.motDePasse;
    
    if (!hasBasicInfo) return false;
    
    if (isParticulier) {
      if (!formData.nom || !formData.prenom) return false;
    } else {
      if (!formData.raisonSociale) return false;
    }
    
    if (isPayant) {
      if (isParticulier) {
        if (!hasDocument('CIN')) return false;
      } else {
        const hasGerantCin = hasDocument('GERANT_CIN');
        const hasPatente = hasDocument('PATENTE');
        const hasRne = hasDocument('RNE');
        if (!hasGerantCin || !hasPatente || !hasRne) return false;
      }
      if (!selectedOffre) return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    const registerData = {
      email: formData.email,
      telephone: formData.telephone,
      typeCompte: formData.typeCompte,
      typeInscription: isEssai ? 'ESSAI' : 'DEFINITIF',
      code: otpCode,
      motDePasse: formData.motDePasse,
      documents: formData.documents,
      nom: formData.nom || '',
      prenom: formData.prenom || '',
      raisonSociale: formData.raisonSociale || '',
      matriculeFiscal: formData.matriculeFiscal || '',
      offreId: selectedOffre?.id || null
    };
    
    const result = await register(registerData);
    
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  // Grouper les offres par durée
  const groupedOffres = offres.reduce((acc, offre) => {
    const key = offre.dureeMois;
    if (!acc[key]) acc[key] = [];
    acc[key].push(offre);
    return acc;
  }, {});

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
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#0b4ea2]">InVera ERP</p>
                  <h1 className="text-xl font-semibold text-slate-950">Gestion intelligente des operations</h1>
                </div>
              </Link>
              <Link to="/" className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700">
                <ArrowLeftIcon className="w-4 h-4" /> Retour à l'accueil
              </Link>
            </div>
          </header>
          <main className="pt-14">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-2xl border border-sky-100 p-8 shadow-sm">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <EnvelopeIcon className="w-8 h-8 text-[#0b4ea2]" />
                  </div>
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
                      className="w-full bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition disabled:bg-gray-400 flex items-center justify-center gap-2"
                    >
                      {otpLoading ? <>⏳ Envoi en cours...</> : <><EnvelopeIcon className="w-5 h-5" /> Recevoir le code</>}
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
                        <p className="text-xs text-gray-500 mt-2">Un code a été envoyé à <span className="font-medium text-slate-700">{email}</span></p>
                      </div>
                      <button
                        onClick={handleVerifyOtp}
                        disabled={otpLoading || !otpCode}
                        className="w-full bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition disabled:bg-gray-400 flex items-center justify-center gap-2"
                      >
                        {otpLoading ? <>⏳ Vérification...</> : <><KeyIcon className="w-5 h-5" /> Vérifier le code</>}
                      </button>
                      <button
                        onClick={() => { setOtpSent(false); setOtpError(''); setOtpCode(''); }}
                        className="w-full text-[#0b4ea2] py-2 text-sm hover:underline transition flex items-center justify-center gap-1"
                      >
                        <ArrowLeftIcon className="w-4 h-4" /> Modifier mon email
                      </button>
                    </>
                  )}
                  {otpError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-5 h-5" /> {otpError}
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
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#0b4ea2]">InVera ERP</p>
                  <h1 className="text-xl font-semibold text-slate-950">Gestion intelligente des operations</h1>
                </div>
              </Link>
              <Link to="/" className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700">
                <ArrowLeftIcon className="w-4 h-4" /> Retour à l'accueil
              </Link>
            </div>
          </header>
          <main className="pt-14">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-2xl border border-sky-100 p-8 shadow-sm text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckBadgeIcon className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {isEssai ? 'Compte essai créé !' : 'Inscription enregistrée !'}
                </h2>
                {isEssai ? (
                  <>
                    <p className="text-gray-600 mb-4">Vous pouvez dès maintenant vous connecter.</p>
                    <button onClick={() => window.location.href = '/login'} className="w-full bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition">Se connecter</button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 mb-4">Votre dossier est en cours de validation par l'administrateur.</p>
                    <p className="text-sm text-gray-500 mb-4">Vous serez notifié par email dès que votre compte sera activé.</p>
                    <button onClick={() => window.location.href = '/'} className="w-full bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition">Retour à l'accueil</button>
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ==================== ÉCRAN PRINCIPAL (FORMULAIRE) ====================
  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f9fc] text-slate-900">
      <div className="absolute inset-x-0 top-0 -z-10 h-[460px] bg-[linear-gradient(180deg,#eef6ff_0%,#f6f9fc_100%)]" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-24 pt-6">
        
        {/* Header */}
        <header className="rounded-[28px] border border-sky-100 bg-white px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link to="/" className="flex items-center gap-4 group cursor-pointer">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b2f6b] p-2 transition group-hover:bg-[#0b4ea2]">
                <img src={logo} alt="InVera logo" className="max-h-full max-w-full object-contain" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#0b4ea2]">InVera ERP</p>
                <h1 className="text-xl font-semibold text-slate-950">Gestion intelligente des operations</h1>
              </div>
            </Link>
            <Link to="/" className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700">
              <ArrowLeftIcon className="w-4 h-4" /> Retour à l'accueil
            </Link>
          </div>
        </header>

        <main className="pt-14">
          {/* En-tête */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900">Créer mon compte</h1>
            <p className="text-slate-500 mt-2">Choisissez votre formule et créez votre compte en quelques étapes</p>
            <div className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600 mt-3 items-center gap-1">
              <CheckCircleIcon className="w-4 h-4" /> Email vérifié
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* ==================== COLONNE GAUCHE ==================== */}
            <div className="space-y-6">
              
              {/* 1. TYPE DE COMPTE */}
              <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-[#0b4ea2]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">Type de compte</h2>
                    <p className="text-xs text-gray-400">Sélectionnez votre profil</p>
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={formData.typeCompte}
                    onChange={(e) => updateFormData('typeCompte', e.target.value)}
                    className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2] bg-white cursor-pointer"
                  >
                    <option value="PARTICULIER">👤 Particulier</option>
                    <option value="ENTREPRISE">🏢 Entreprise</option>
                  </select>
                  <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* 2. INFORMATIONS PERSONNELLES */}
              <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <IdentificationIcon className="w-5 h-5 text-[#0b4ea2]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">Informations personnelles</h2>
                    <p className="text-xs text-gray-400">Vos coordonnées</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {isParticulier ? (
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="Nom *" className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]" value={formData.nom} onChange={(e) => updateFormData('nom', e.target.value)} />
                      <input type="text" placeholder="Prénom *" className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]" value={formData.prenom} onChange={(e) => updateFormData('prenom', e.target.value)} />
                    </div>
                  ) : (
                    <>
                      <input type="text" placeholder="Raison sociale *" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]" value={formData.raisonSociale} onChange={(e) => updateFormData('raisonSociale', e.target.value)} />
                      <input type="text" placeholder="Matricule fiscal *" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]" value={formData.matriculeFiscal} onChange={(e) => updateFormData('matriculeFiscal', e.target.value)} />
                    </>
                  )}
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="email" placeholder="Email *" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]" value={formData.email} onChange={(e) => updateFormData('email', e.target.value)} />
                  </div>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="tel" placeholder="Téléphone *" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]" value={formData.telephone} onChange={(e) => updateFormData('telephone', e.target.value)} />
                  </div>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type={showPassword ? "text" : "password"} placeholder="Mot de passe *" className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]" value={formData.motDePasse} onChange={(e) => updateFormData('motDePasse', e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. DOCUMENTS JUSTIFICATIFS (AFFICHÉ UNIQUEMENT SI ABONNEMENT PAYANT) */}
              {isPayant && (
                <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <DocumentDuplicateIcon className="w-5 h-5 text-[#0b4ea2]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">Documents justificatifs</h2>
                      <p className="text-xs text-gray-400">Requis pour valider votre inscription</p>
                    </div>
                  </div>

                  {isParticulier ? (
                    <div className="space-y-3">
                      <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${hasDocument('CIN') ? 'border-green-400 bg-green-50' : 'border-dashed border-gray-300 hover:border-[#0b4ea2]'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasDocument('CIN') ? 'bg-green-500' : 'bg-gray-100'}`}>
                            <IdentificationIcon className={`w-5 h-5 ${hasDocument('CIN') ? 'text-white' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">Carte d'identité nationale</p>
                            <p className="text-xs text-gray-400">JPG, PNG ou PDF</p>
                          </div>
                        </div>
                        <div>
                          <input type="file" id="cin" className="hidden" accept="image/jpeg,image/png,application/pdf" onChange={(e) => handleFileUpload('CIN', e.target.files[0])} />
                          {hasDocument('CIN') ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-green-600 truncate max-w-[150px]">
                                {formData.documents.find(d => d.type === 'CIN')?.file?.name}
                              </span>
                              <label htmlFor="cin" className="cursor-pointer text-[#0b4ea2] text-sm font-medium hover:underline">
                                Modifier
                              </label>
                            </div>
                          ) : (
                            <label htmlFor="cin" className="cursor-pointer bg-[#0b4ea2] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0b3d82] transition">
                              📎 Uploader
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Document 1: Carte d'identité du gérant */}
                      <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${hasDocument('GERANT_CIN') ? 'border-green-400 bg-green-50' : 'border-dashed border-gray-300 hover:border-[#0b4ea2]'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasDocument('GERANT_CIN') ? 'bg-green-500' : 'bg-gray-100'}`}>
                            <UserIcon className={`w-5 h-5 ${hasDocument('GERANT_CIN') ? 'text-white' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">Carte d'identité du gérant</p>
                            <p className="text-xs text-gray-400">JPG, PNG ou PDF</p>
                          </div>
                        </div>
                        <div>
                          <input type="file" id="cinGerant" className="hidden" accept="image/jpeg,image/png,application/pdf" onChange={(e) => handleFileUpload('GERANT_CIN', e.target.files[0])} />
                          {hasDocument('GERANT_CIN') ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-green-600 truncate max-w-[150px]">
                                {formData.documents.find(d => d.type === 'GERANT_CIN')?.file?.name}
                              </span>
                              <label htmlFor="cinGerant" className="cursor-pointer text-[#0b4ea2] text-sm font-medium hover:underline">
                                Modifier
                              </label>
                            </div>
                          ) : (
                            <label htmlFor="cinGerant" className="cursor-pointer bg-[#0b4ea2] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0b3d82] transition">
                              📎 Uploader
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Document 2: Patente */}
                      <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${hasDocument('PATENTE') ? 'border-green-400 bg-green-50' : 'border-dashed border-gray-300 hover:border-[#0b4ea2]'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasDocument('PATENTE') ? 'bg-green-500' : 'bg-gray-100'}`}>
                            <DocumentTextIcon className={`w-5 h-5 ${hasDocument('PATENTE') ? 'text-white' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">Patente</p>
                            <p className="text-xs text-gray-400">Document officiel</p>
                          </div>
                        </div>
                        <div>
                          <input type="file" id="patente" className="hidden" accept="image/jpeg,image/png,application/pdf" onChange={(e) => handleFileUpload('PATENTE', e.target.files[0])} />
                          {hasDocument('PATENTE') ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-green-600 truncate max-w-[150px]">
                                {formData.documents.find(d => d.type === 'PATENTE')?.file?.name}
                              </span>
                              <label htmlFor="patente" className="cursor-pointer text-[#0b4ea2] text-sm font-medium hover:underline">
                                Modifier
                              </label>
                            </div>
                          ) : (
                            <label htmlFor="patente" className="cursor-pointer bg-[#0b4ea2] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0b3d82] transition">
                              📎 Uploader
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Document 3: Extrait RNE */}
                      <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${hasDocument('RNE') ? 'border-green-400 bg-green-50' : 'border-dashed border-gray-300 hover:border-[#0b4ea2]'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasDocument('RNE') ? 'bg-green-500' : 'bg-gray-100'}`}>
                            <BriefcaseIcon className={`w-5 h-5 ${hasDocument('RNE') ? 'text-white' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">Extrait RNE</p>
                            <p className="text-xs text-gray-400">Moins de 3 mois</p>
                          </div>
                        </div>
                        <div>
                          <input type="file" id="rne" className="hidden" accept="image/jpeg,image/png,application/pdf" onChange={(e) => handleFileUpload('RNE', e.target.files[0])} />
                          {hasDocument('RNE') ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-green-600 truncate max-w-[150px]">
                                {formData.documents.find(d => d.type === 'RNE')?.file?.name}
                              </span>
                              <label htmlFor="rne" className="cursor-pointer text-[#0b4ea2] text-sm font-medium hover:underline">
                                Modifier
                              </label>
                            </div>
                          ) : (
                            <label htmlFor="rne" className="cursor-pointer bg-[#0b4ea2] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0b3d82] transition">
                              📎 Uploader
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Avertissement RNE */}
                      {!hasDocument('RNE') && (
                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
                          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-yellow-800">
                            <strong>Attention :</strong> L'extrait RNE doit dater de <strong>moins de 3 mois</strong>.
                            L'administrateur vérifiera visuellement la date sur le document.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ==================== COLONNE DROITE - ABONNEMENT ==================== */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm sticky top-6">
                
                {/* 4. TYPE D'ABONNEMENT */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <WalletIcon className="w-5 h-5 text-[#0b4ea2]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">Abonnement</h2>
                    <p className="text-xs text-gray-400">Choisissez votre formule</p>
                  </div>
                </div>

                <div className="relative mb-6">
                  <select
                    value={formData.typeAbonnement}
                    onChange={(e) => { updateFormData('typeAbonnement', e.target.value); setSelectedOffre(null); }}
                    className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2] bg-white cursor-pointer"
                  >
                    <option value="ESSAI">🎁 Essai gratuit (30 jours)</option>
                    <option value="PAYANT">💰 Abonnement payant</option>
                  </select>
                  <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>

    {/* Offres (si payant) */}
{isPayant ? (
  <div className="mt-4">
    <p className="text-sm font-medium text-slate-700 mb-3">Choisissez votre formule :</p>
    
    {offresLoading ? (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-2">Chargement des offres...</p>
      </div>
    ) : (
      <>
        {/* Offres mensuelles */}
        {groupedOffres[1]?.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-400 mb-2">📅 Formules mensuelles</p>
            {groupedOffres[1].map(offre => (
              <div 
                key={offre.id} 
                className={`border rounded-xl p-4 mb-3 cursor-pointer transition-all ${
                  selectedOffre?.id === offre.id 
                    ? 'border-green-500 bg-green-50 shadow-md' 
                    : 'border-gray-200 hover:border-green-400 hover:bg-green-50/30'
                }`} 
                onClick={() => setSelectedOffre(offre)}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 text-base">{offre.nom}</h3>
                    <p className="text-xs text-gray-500 mt-1">{offre.duree}</p>
                    {offre.description && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed border-t border-gray-100 pt-2">
                        {offre.description}
                      </p>
                    )}
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-bold text-green-600 text-xl">{offre.prix} TND</p>
                    <p className="text-xs text-gray-400">/ mois</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Offres annuelles */}
        {groupedOffres[12]?.length > 0 && (
          <div className="border-t border-gray-200 pt-4 mt-2">
            
            {groupedOffres[12].map(offre => (
              <div 
                key={offre.id} 
                className={`border rounded-xl p-4 mb-3 cursor-pointer transition-all ${
                  selectedOffre?.id === offre.id 
                    ? 'border-green-500 bg-green-50 shadow-md' 
                    : 'border-gray-200 hover:border-green-400 hover:bg-green-50/30'
                }`} 
                onClick={() => setSelectedOffre(offre)}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 text-base">{offre.nom}</h3>
                    <p className="text-xs text-gray-500 mt-1">{offre.duree}</p>
                    {offre.description && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed border-t border-gray-100 pt-2">
                        {offre.description}
                      </p>
                    )}
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-bold text-green-600 text-xl">{offre.prix} TND</p>
                  </div>
                </div>
              </div>
              
            ))}
          </div>
          
        )}
      </>
    )}
   <div className="mb-4 p-3 bg-green-100 rounded-lg text-center">
  <p className="text-sm font-semibold text-green-800">
    ⭐ Choisissez l’abonnement annuel et économisez
  </p>
  <p className="text-xs text-green-700">
    Le meilleur rapport qualité-prix • Paiement 100% sécurisé
  </p>
</div>
  </div>
) : (
  <div className="bg-green-50 rounded-xl p-5 text-center border border-green-200">
    <GiftIcon className="w-10 h-10 text-green-500 mx-auto mb-2" />
    <p className="font-semibold text-green-700 text-base">Essai gratuit de 30 jours</p>
    <p className="text-sm text-green-600 mt-1">Accédez immédiatement à toutes les fonctionnalités</p>
    <p className="text-xs text-green-500 mt-2">Aucune information bancaire requise</p>
  </div>
)}
                {/* BOUTON CRÉER MON COMPTE */}
                <button 
                  onClick={handleSubmit} 
                  disabled={loading || !isValid()} 
                  className="w-full mt-6 bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" /> 
                      {isEssai ? 'Commencer l\'essai gratuit' : 'Créer mon compte'}
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-gray-400 mt-4">
                  En cliquant sur "Créer mon compte", vous acceptez nos conditions générales d'utilisation
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