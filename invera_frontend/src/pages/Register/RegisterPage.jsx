// src/pages/Register/RegisterPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { sendOtp, verifyOtp, register, fetchOffres } from '../../services/registerService';
import logo from '../../assets/images/logo.png';
import ReactCountryFlag from "react-country-flag";

// Import des icônes Heroicons
import { 
  ArrowLeftIcon,
  EnvelopeIcon,
  KeyIcon,
  CheckCircleIcon,
  UserIcon,
  GiftIcon,
  IdentificationIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  PhoneIcon,
  LockClosedIcon,
  BriefcaseIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  WalletIcon,
  ChevronDownIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

import { useNavigate } from 'react-router-dom';
import PublicHeader from '../../components/PublicHeader';
import { useLanguage } from '../../context/LanguageContext';

const registerCopy = {
  fr: {
    otpTitle: 'Vérification email',
    otpDescription: 'Saisissez votre email pour recevoir un code.',
    emailLabel: 'Email',
    emailPlaceholder: 'exemple@email.com',
    sendCode: 'Recevoir le code',
    sendingCode: 'Envoi en cours...',
    codeLabel: 'Code de vérification',
    codePlaceholder: 'Code à 6 chiffres',
    codeSentTo: 'Un code a été envoyé à {{email}}',
    verifyCode: 'Vérifier le code',
    verifyingCode: 'Vérification...',
    editEmail: 'Modifier mon email',
    emailRequired: 'Veuillez saisir votre email.',
    codeRequired: 'Veuillez saisir le code reçu.',
    invalidCode: 'Code invalide. Veuillez réessayer.',
    genericOtpError: "Erreur lors de l'envoi du code",
    pageTitle: 'Créer mon compte',
    pageDescription: '30 connexions offertes pour découvrir la plateforme',
    emailVerified: 'Email vérifié',
    accountType: 'Type de compte',
    individual: 'Particulier',
    company: 'Entreprise',
    registrationType: "Type d'inscription",
    trial: 'Essai gratuit',
    trialConnections: '30 connexions',
    subscription: 'Abonnement',
    subscriptionPrice: '29€/mois',
    lastName: 'Nom *',
    firstName: 'Prénom *',
    companyName: 'Raison sociale *',
    siret: 'SIRET (14 chiffres)',
    phone: 'Téléphone *',
    password: 'Mot de passe *',
    mandatoryDocuments: 'Documents justificatifs obligatoires',
    nationalId: "Carte d'identité nationale",
    managerId: "Carte d'identité du gérant",
    patent: 'Patente',
    rne: 'Extrait RNE',
    acceptedFormats: 'JPG, PNG ou PDF',
    uploaded: 'Document chargé',
    rneWarningTitle: 'Attention',
    rneWarning:
      "L'extrait RNE doit dater de moins de 3 mois. L'administrateur vérifiera visuellement la date sur le document.",
    monthlySubscription: 'Abonnement mensuel - 29€ HT / mois',
    paymentInfo: 'Paiement à effectuer après validation de votre dossier',
    submit: "S'inscrire",
    submitting: 'Inscription en cours...',
    terms: "En cliquant sur \"S'inscrire\", vous acceptez nos conditions générales d'utilisation.",
    successTrialTitle: 'Compte essai créé !',
    successTrialDescription: 'Vous pouvez dès maintenant vous connecter.',
    successValidatedTitle: 'Inscription enregistrée !',
    successValidatedDescription: "Votre dossier est en cours de validation par l'administrateur.",
    successValidatedHint: 'Vous serez notifié par email dès que votre compte sera activé.',
    loginNow: 'Se connecter',
    backToHome: "Retour à l'accueil",
  },
  en: {
    otpTitle: 'Email verification',
    otpDescription: 'Enter your email to receive a code.',
    emailLabel: 'Email',
    emailPlaceholder: 'example@email.com',
    sendCode: 'Receive code',
    sendingCode: 'Sending...',
    codeLabel: 'Verification code',
    codePlaceholder: '6-digit code',
    codeSentTo: 'A code was sent to {{email}}',
    verifyCode: 'Verify code',
    verifyingCode: 'Verifying...',
    editEmail: 'Edit my email',
    emailRequired: 'Please enter your email.',
    codeRequired: 'Please enter the code you received.',
    invalidCode: 'Invalid code. Please try again.',
    genericOtpError: 'Failed to send the code',
    pageTitle: 'Create my account',
    pageDescription: '30 free logins to discover the platform',
    emailVerified: 'Email verified',
    accountType: 'Account type',
    individual: 'Individual',
    company: 'Company',
    registrationType: 'Registration type',
    trial: 'Free trial',
    trialConnections: '30 logins',
    subscription: 'Subscription',
    subscriptionPrice: '29€/month',
    lastName: 'Last name *',
    firstName: 'First name *',
    companyName: 'Company name *',
    siret: 'SIRET (14 digits)',
    phone: 'Phone *',
    password: 'Password *',
    mandatoryDocuments: 'Required supporting documents',
    nationalId: 'National identity card',
    managerId: "Manager's identity card",
    patent: 'Patent certificate',
    rne: 'RNE extract',
    acceptedFormats: 'JPG, PNG, or PDF',
    uploaded: 'Document uploaded',
    rneWarningTitle: 'Warning',
    rneWarning:
      'The RNE extract must be less than 3 months old. The administrator will check the date visually on the document.',
    monthlySubscription: 'Monthly subscription - 29€ excl. tax / month',
    paymentInfo: 'Payment is required after your file is validated',
    submit: 'Register',
    submitting: 'Registering...',
    terms: 'By clicking "Register", you accept our general terms of use.',
    successTrialTitle: 'Trial account created!',
    successTrialDescription: 'You can now log in.',
    successValidatedTitle: 'Registration recorded!',
    successValidatedDescription: 'Your file is being reviewed by the administrator.',
    successValidatedHint: 'You will receive an email once your account is activated.',
    loginNow: 'Log in',
    backToHome: 'Back to home',
  },
  ar: {
    otpTitle: 'التحقق من البريد الإلكتروني',
    otpDescription: 'أدخل بريدك الإلكتروني للحصول على رمز.',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'example@email.com',
    sendCode: 'استلام الرمز',
    sendingCode: 'جاري الإرسال...',
    codeLabel: 'رمز التحقق',
    codePlaceholder: 'رمز من 6 أرقام',
    codeSentTo: 'تم إرسال رمز إلى {{email}}',
    verifyCode: 'التحقق من الرمز',
    verifyingCode: 'جاري التحقق...',
    editEmail: 'تعديل بريدي الإلكتروني',
    emailRequired: 'يرجى إدخال بريدك الإلكتروني.',
    codeRequired: 'يرجى إدخال الرمز الذي استلمته.',
    invalidCode: 'رمز غير صالح. حاول مرة أخرى.',
    genericOtpError: 'تعذر إرسال الرمز',
    pageTitle: 'إنشاء حسابي',
    pageDescription: '30 عملية دخول مجانية لاكتشاف المنصة',
    emailVerified: 'تم التحقق من البريد',
    accountType: 'نوع الحساب',
    individual: 'فردي',
    company: 'شركة',
    registrationType: 'نوع التسجيل',
    trial: 'تجربة مجانية',
    trialConnections: '30 عملية دخول',
    subscription: 'اشتراك',
    subscriptionPrice: '29€/شهريًا',
    lastName: 'اللقب *',
    firstName: 'الاسم *',
    companyName: 'الاسم التجاري *',
    siret: 'SIRET (14 رقمًا)',
    phone: 'الهاتف *',
    password: 'كلمة المرور *',
    mandatoryDocuments: 'الوثائق الإلزامية',
    nationalId: 'بطاقة الهوية الوطنية',
    managerId: 'بطاقة هوية المدير',
    patent: 'الباتيندة',
    rne: 'مستخرج السجل الوطني للمؤسسات',
    acceptedFormats: 'JPG أو PNG أو PDF',
    uploaded: 'تم رفع الوثيقة',
    rneWarningTitle: 'تنبيه',
    rneWarning:
      'يجب أن يكون مستخرج RNE أقل من 3 أشهر. سيقوم المسؤول بالتحقق من التاريخ بصريًا على الوثيقة.',
    monthlySubscription: 'اشتراك شهري - 29€ دون ضرائب / شهريًا',
    paymentInfo: 'يتم الدفع بعد التحقق من الملف',
    submit: 'تسجيل',
    submitting: 'جاري التسجيل...',
    terms: 'بالنقر على "تسجيل"، فإنك توافق على الشروط العامة للاستخدام.',
    successTrialTitle: 'تم إنشاء الحساب التجريبي!',
    successTrialDescription: 'يمكنك الآن تسجيل الدخول.',
    successValidatedTitle: 'تم تسجيل الطلب!',
    successValidatedDescription: 'ملفك قيد المراجعة من طرف المسؤول.',
    successValidatedHint: 'ستتلقى إشعارًا عبر البريد الإلكتروني بمجرد تفعيل الحساب.',
    loginNow: 'تسجيل الدخول',
    backToHome: 'العودة إلى الرئيسية',
  },
};

const cardBaseClass =
  'border-2 rounded-xl p-4 text-center transition hover:border-[#0b4ea2]';

// Liste des pays avec code, indicatif
const countryCodes = [
  { code: 'TN', name: 'Tunisie', dialCode: '+216' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'MA', name: 'Maroc', dialCode: '+212' },
  { code: 'DZ', name: 'Algérie', dialCode: '+213' },
  { code: 'SN', name: 'Sénégal', dialCode: '+221' },
  { code: 'CI', name: 'Côte d\'Ivoire', dialCode: '+225' },
  { code: 'CM', name: 'Cameroun', dialCode: '+237' },
  { code: 'BE', name: 'Belgique', dialCode: '+32' },
  { code: 'CH', name: 'Suisse', dialCode: '+41' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'US', name: 'États-Unis', dialCode: '+1' },
];

// Fonction pour parser les erreurs et afficher des messages clairs
const parseErrorMessage = (errorMessage) => {
  if (!errorMessage) return "Une erreur est survenue lors de l'inscription";
  
  const msg = errorMessage.toLowerCase();
  
  // Erreur de doublon email
  if ((msg.includes("email") || msg.includes("e-mail")) && 
      (msg.includes("already") || msg.includes("existe") || msg.includes("duplicate") || msg.includes("utilisé"))) {
    return "email_exists";
  }
  
  // Erreur de doublon téléphone
  if ((msg.includes("telephone") || msg.includes("phone") || msg.includes("téléphone")) && 
      (msg.includes("already") || msg.includes("existe") || msg.includes("duplicate") || msg.includes("utilisé"))) {
    return "phone_exists";
  }
  
  // Erreur générique de contrainte unique
  if (msg.includes("duplicate") || msg.includes("unique constraint")) {
    if (msg.includes("email")) return "email_exists";
    if (msg.includes("telephone") || msg.includes("phone")) return "phone_exists";
    return "duplicate_error";
  }
  
  return errorMessage;
};

// Fonction pour obtenir le message utilisateur
const getUserFriendlyMessage = (errorCode) => {
  switch (errorCode) {
    case "email_exists":
      return {
        title: "Email déjà utilisé",
        message: "Cet email est déjà associé à un compte existant.",
        action: "Connectez-vous à votre compte existant ou utilisez un autre email."
      };
    case "phone_exists":
      return {
        title: "Téléphone déjà utilisé",
        message: "Ce numéro de téléphone est déjà associé à un compte existant.",
        action: "Utilisez un autre numéro de téléphone ou connectez-vous à votre compte."
      };
    default:
      return {
        title: "Inscription impossible",
        message: errorCode,
        action: "Vérifiez vos informations et réessayez."
      };
  }
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { language, isArabic, t } = useLanguage();
  const copy = registerCopy[language] || registerCopy.fr;

  const [step, setStep] = useState('otp');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryDropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    typeCompte: 'PARTICULIER',
    typeInscription: 'ESSAI',
    nom: '',
    prenom: '',
    raisonSociale: '',
    matriculeFiscal: '',
    siret: '',
    telephone: '',
    paysCode: '+216',
    selectedCountry: countryCodes.find(c => c.code === 'TN') || countryCodes[0],
    motDePasse: '',
    email: '',
    documents: [],
    typeAbonnement: 'ESSAI', // Ajout pour la fusion
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptConditions, setAcceptConditions] = useState(false);
  const [offres, setOffres] = useState([]);
  const [offresLoading, setOffresLoading] = useState(false);
  const [selectedOffre, setSelectedOffre] = useState(null);

  // Fermer le dropdown quand on clique dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Charger les offres au montage
  useEffect(() => {
    const loadOffres = async () => {
      setOffresLoading(true);
      try {
        const data = await fetchOffres();
        setOffres(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erreur chargement offres:', err);
        setOffres([]);
      } finally {
        setOffresLoading(false);
      }
    };
    loadOffres();
  }, []);

  const isEssai = formData.typeInscription === 'ESSAI' || formData.typeAbonnement === 'ESSAI';
  const isPayant = formData.typeAbonnement === 'PAYANT';
  const isParticulier = formData.typeCompte === 'PARTICULIER';

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field, file) => {
    if (!file) return;
    const currentDocs = formData.documents || [];
    const newDocs = [...currentDocs];
    const existingIndex = newDocs.findIndex((d) => d.type === field);

    if (existingIndex !== -1) {
      newDocs[existingIndex] = { type: field, file };
    } else {
      newDocs.push({ type: field, file });
    }
    updateFormData('documents', newDocs);
  };

  const hasDocument = (field) => formData.documents?.some((d) => d.type === field);

  const handleCountrySelect = (country) => {
    setFormData(prev => ({ ...prev, paysCode: country.dialCode, selectedCountry: country }));
    setShowCountryDropdown(false);
  };

  const getFullPhoneNumber = () => {
    return `${formData.paysCode}${formData.telephone}`;
  };

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
        if (!hasDocument('GERANT_CIN') || !hasDocument('PATENTE') || !hasDocument('RNE')) return false;
      }
      if (!selectedOffre) return false;
    }
    
    if (!acceptConditions) return false;
    
    return true;
  };

  const handleSendOtp = async () => {
    if (!email) {
      setOtpError(copy.emailRequired);
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    const result = await sendOtp(email);
    if (result.success) {
      setOtpSent(true);
    } else {
      setOtpError(result.message || copy.genericOtpError);
    }
    setOtpLoading(false);
  };

  const handleVerifyOtp = async () => {
    const cleanedCode = otpCode ? otpCode.toString().trim() : '';

    if (!cleanedCode) {
      setOtpError(copy.codeRequired);
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    const isValidCode = await verifyOtp(email, cleanedCode);

    if (isValidCode) {
      setStep('form');
      setFormData((prev) => ({ ...prev, email }));
    } else {
      setOtpError(copy.invalidCode);
    }

    setOtpLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const registerData = {
      email: formData.email,
      telephone: getFullPhoneNumber(),
      typeCompte: formData.typeCompte,
      typeInscription: isEssai ? 'ESSAI' : 'DEFINITIF',
      code: otpCode,
      motDePasse: formData.motDePasse,
      documents: formData.documents,
      nom: formData.nom || '',
      prenom: formData.prenom || '',
      raisonSociale: formData.raisonSociale || '',
      matriculeFiscal: formData.matriculeFiscal || '',
      siret: formData.siret || '',
      offreId: selectedOffre?.id || null
    };
    
    const result = await register(registerData);
    
    if (result.success) {
      setSuccess(true);
    } else {
      const errorCode = parseErrorMessage(result.message);
      const userFriendly = getUserFriendlyMessage(errorCode);
      setError({ code: errorCode, ...userFriendly });
      console.error('Erreur inscription:', result.message);
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
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#0b4ea2]">InVera ERP</p>
                  <h1 className="text-xl font-semibold text-slate-950">Gestion intelligente des opérations</h1>
                </div>
              </Link>
              <Link to="/" className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700">
                <ArrowLeftIcon className="w-4 h-4" /> {copy.backToHome}
              </Link>
            </div>
          </header>
          <main className="pt-14">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-2xl border border-sky-100 p-8 shadow-sm">
                <div className={`text-center mb-8 ${isArabic ? 'text-right' : ''}`}>
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <EnvelopeIcon className="w-8 h-8 text-[#0b4ea2]" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">{copy.otpTitle}</h1>
                  <p className="text-slate-500 mt-1">{copy.otpDescription}</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{copy.emailLabel}</label>
                    <input
                      type="email"
                      placeholder={copy.emailPlaceholder}
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
                      {otpLoading ? copy.sendingCode : copy.sendCode}
                    </button>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{copy.codeLabel}</label>
                        <input
                          type="text"
                          placeholder={copy.codePlaceholder}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2] transition"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          {copy.codeSentTo.replace('{{email}}', email)}
                        </p>
                      </div>

                      <button
                        onClick={handleVerifyOtp}
                        disabled={otpLoading || !otpCode}
                        className="w-full bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition disabled:bg-gray-400"
                      >
                        {otpLoading ? copy.verifyingCode : copy.verifyCode}
                      </button>

                      <button
                        onClick={() => {
                          setOtpSent(false);
                          setOtpError('');
                          setOtpCode('');
                        }}
                        className="w-full text-[#0b4ea2] py-2 text-sm hover:underline transition"
                      >
                        ← {copy.editEmail}
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
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#0b4ea2]">InVera ERP</p>
                  <h1 className="text-xl font-semibold text-slate-950">Gestion intelligente des opérations</h1>
                </div>
              </Link>
              <Link to="/" className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700">
                <ArrowLeftIcon className="w-4 h-4" /> {copy.backToHome}
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
                  {isEssai ? copy.successTrialTitle : copy.successValidatedTitle}
                </h2>
                {isEssai ? (
                  <>
                    <p className="text-gray-600 mb-4">{copy.successTrialDescription}</p>
                    <button 
                      onClick={() => navigate('/login')} 
                      className="w-full bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition"
                    >
                      {copy.loginNow}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-left space-y-3 mb-6">
                      <p className="text-gray-700">✅ Votre inscription a été bien enregistrée !</p>
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <p className="text-blue-800 text-sm font-medium mb-2">🎁 Période d'essai offerte</p>
                        <p className="text-blue-700 text-sm">Vous bénéficiez immédiatement de <strong>30 connexions gratuites</strong> pour découvrir la plateforme en attendant la validation de votre dossier.</p>
                      </div>
                      <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                        <p className="text-yellow-800 text-sm font-medium mb-2">⏳ En attente de validation</p>
                        <p className="text-yellow-700 text-sm">Votre dossier est en cours de vérification par notre équipe administrative. Vous recevrez un email dès que votre compte sera validé pour finaliser votre abonnement.</p>
                      </div>
                    </div>
                    <button onClick={() => navigate('/login')} className="w-full bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition">
                      🔑 {copy.loginNow}
                    </button>
                    <div className="mt-4">
                      <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 transition">
                        ← {copy.backToHome}
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ==================== ÉCRAN PRINCIPAL (FORMULAIRE VERTICAL) ====================
  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f9fc] text-slate-900" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="absolute inset-x-0 top-0 -z-10 h-[460px] bg-[linear-gradient(180deg,#eef6ff_0%,#f6f9fc_100%)]" />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-24 pt-6">
        
        {/* Header */}
        <header className="rounded-[28px] border border-sky-100 bg-white px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link to="/" className="flex items-center gap-4 group cursor-pointer">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b2f6b] p-2 transition group-hover:bg-[#0b4ea2]">
                <img src={logo} alt="InVera logo" className="max-h-full max-w-full object-contain" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#0b4ea2]">InVera ERP</p>
                <h1 className="text-xl font-semibold text-slate-950">Gestion intelligente des opérations</h1>
              </div>
            </Link>
            <Link to="/" className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700">
              <ArrowLeftIcon className="w-4 h-4" /> {copy.backToHome}
            </Link>
          </div>
        </header>

        <main className="pt-14">
          {/* En-tête */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900">Créer un compte</h1>
            <div className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600 mt-3 items-center gap-1">
              <CheckCircleIcon className="w-4 h-4" /> {copy.emailVerified}
            </div>
          </div>

          {/* Affichage des erreurs amélioré */}
          {error && (
            <div className={`mb-6 p-4 rounded-xl border ${
              error.code === 'email_exists' || error.code === 'phone_exists'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  error.code === 'email_exists' || error.code === 'phone_exists'
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`} />
                <div className="flex-1">
                  <p className={`font-semibold ${
                    error.code === 'email_exists' || error.code === 'phone_exists'
                      ? 'text-amber-800'
                      : 'text-red-800'
                  }`}>{error.title}</p>
                  <p className={`text-sm mt-1 ${
                    error.code === 'email_exists' || error.code === 'phone_exists'
                      ? 'text-amber-700'
                      : 'text-red-700'
                  }`}>{error.message}</p>
                  <p className="text-sm mt-2 text-gray-600">{error.action}</p>
                  {(error.code === 'email_exists' || error.code === 'phone_exists') && (
                    <Link to="/login" className="inline-block mt-3 text-sm font-medium text-[#0b4ea2] hover:underline">
                      🔑 Se connecter à mon compte →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Formulaire vertical avec onSubmit */}
          <form onSubmit={handleSubmit} autoComplete="on" className="space-y-6">
            
            {/* SECTION 1: TYPE DE COMPTE */}
            <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-[#0b4ea2]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">1. Informations du compte</h2>
                  <p className="text-xs text-gray-400">Type de compte</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type de compte *</label>
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
            </div>

            {/* SECTION 2: INFORMATIONS PERSONNELLES */}
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nom *</label>
                    <input 
                      type="text" 
                      placeholder="Nom" 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]" 
                      value={formData.nom} 
                      onChange={(e) => updateFormData('nom', e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Prénom *</label>
                    <input 
                      type="text" 
                      placeholder="Prénom" 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]" 
                      value={formData.prenom} 
                      onChange={(e) => updateFormData('prenom', e.target.value)} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="email" 
                      name="email"
                      autoComplete="email"
                      placeholder="exemple@email.com" 
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]" 
                      value={formData.email} 
                      onChange={(e) => updateFormData('email', e.target.value)} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone *</label>
                  <div className="flex gap-2">
                    <div className="relative w-40" ref={countryDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="w-full flex items-center justify-between px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2] bg-white"
                      >
                        <span className="flex items-center gap-2">
                          <ReactCountryFlag 
                            countryCode={formData.selectedCountry?.code} 
                            svg 
                            style={{ width: '1.5em', height: '1.5em' }}
                          />
                          <span className="text-sm">{formData.selectedCountry?.dialCode}</span>
                        </span>
                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                      </button>
                      
                      {showCountryDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                          {countryCodes.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => handleCountrySelect(country)}
                              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                            >
                              <ReactCountryFlag 
                                countryCode={country.code} 
                                svg 
                                style={{ width: '1.5em', height: '1.5em' }}
                              />
                              <span className="text-sm font-medium">{country.name}</span>
                              <span className="text-xs text-gray-500 ml-auto">{country.dialCode}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="relative flex-1">
                      <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="tel" 
                        name="telephone"
                        autoComplete="tel"
                        placeholder="Numéro de téléphone" 
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]" 
                        value={formData.telephone}  
                        onChange={(e) => updateFormData('telephone', e.target.value)} 
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Exemple: {formData.paysCode} XX XXX XXX
                  </p>
                </div>

                {!isParticulier && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Raison sociale *</label>
                      <input 
                        type="text" 
                        placeholder="Raison sociale" 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]" 
                        value={formData.raisonSociale} 
                        onChange={(e) => updateFormData('raisonSociale', e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Matricule fiscal *</label>
                      <input 
                        type="text" 
                        placeholder="Matricule fiscal" 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]" 
                        value={formData.matriculeFiscal} 
                        onChange={(e) => updateFormData('matriculeFiscal', e.target.value)} 
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe *</label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="password"
                      autoComplete="new-password"
                      placeholder="Mot de passe" 
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]" 
                      value={formData.motDePasse} 
                      onChange={(e) => updateFormData('motDePasse', e.target.value)} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: ABONNEMENT */}
            <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <WalletIcon className="w-5 h-5 text-[#0b4ea2]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">2. Abonnement</h2>
                  <p className="text-xs text-gray-400">Choisissez votre formule</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type d'abonnement *</label>
                <div className="relative mb-4">
                  <select
                    value={formData.typeAbonnement}
                    onChange={(e) => { updateFormData('typeAbonnement', e.target.value); setSelectedOffre(null); }}
                    className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2] bg-white cursor-pointer"
                  >
                    <option value="ESSAI">🎁 Essai gratuit 30 connexions</option>
                    <option value="PAYANT">💰 Choisir une formule payante</option>
                  </select>
                  <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {isPayant && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-3">Durée de l'abonnement *</label>
                  
                  {offresLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0b4ea2] mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Chargement des offres...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {offres.map((offre) => (
                        <div 
                          key={offre.id}
                          className={`border rounded-xl p-4 text-center cursor-pointer transition-all ${
                            selectedOffre?.id === offre.id 
                              ? 'border-green-500 bg-green-50 shadow-md' 
                              : 'border-gray-200 hover:border-green-400 hover:bg-green-50/30'
                          }`}
                          onClick={() => setSelectedOffre(offre)}
                        >
                          <p className="font-bold text-slate-800 text-base">{offre.duree}</p>
                          <p className="text-green-600 font-semibold text-xl mt-1">{offre.prix} TND</p>
                          {offre.dureeMois === 3 && (
                            <p className="text-xs text-gray-400 mt-1">(26,33 TND/mois)</p>
                          )}
                          {offre.dureeMois === 12 && (
                            <p className="text-xs text-gray-400 mt-1">(22,42 TND/mois)</p>
                          )}
                          {offre.description && (
                            <p className="text-xs text-gray-500 mt-2">{offre.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {offres.length === 0 && !offresLoading && (
                    <div className="text-center py-4 text-gray-500">
                      Aucune offre disponible pour le moment
                    </div>
                  )}
                </div>
              )}

              {isEssai && (
                <div className="bg-green-50 rounded-xl p-5 text-center border border-green-200">
                  <GiftIcon className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold text-green-700 text-base">30 connexions offertes</p>
                  <p className="text-sm text-green-600 mt-1">Testez toutes les fonctionnalités de la plateforme avant de choisir votre abonnement.</p>
                </div>
              )}
            </div>

            {/* SECTION 4: DOCUMENTS JUSTIFICATIFS */}
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
                  <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${hasDocument('CIN') ? 'border-green-400 bg-green-50' : 'border-dashed border-gray-300 hover:border-[#0b4ea2]'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasDocument('CIN') ? 'bg-green-500' : 'bg-gray-100'}`}>
                        <IdentificationIcon className={`w-5 h-5 ${hasDocument('CIN') ? 'text-white' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">Carte d'identité nationale *</p>
                        <p className="text-xs text-gray-400">JPG, PNG ou PDF</p>
                      </div>
                    </div>
                    <div>
                      <input type="file" id="cin" className="hidden" accept="image/jpeg,image/png,application/pdf" onChange={(e) => handleFileUpload('CIN', e.target.files[0])} />
                      {hasDocument('CIN') ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-green-600 truncate max-w-[150px]">{formData.documents.find(d => d.type === 'CIN')?.file?.name}</span>
                          <label htmlFor="cin" className="cursor-pointer text-[#0b4ea2] text-sm font-medium hover:underline">Modifier</label>
                        </div>
                      ) : (
                        <label htmlFor="cin" className="flex items-center gap-2 cursor-pointer bg-[#0b4ea2] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0b3d82] transition">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Importer
                        </label>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${hasDocument('GERANT_CIN') ? 'border-green-400 bg-green-50' : 'border-dashed border-gray-300 hover:border-[#0b4ea2]'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasDocument('GERANT_CIN') ? 'bg-green-500' : 'bg-gray-100'}`}>
                          <UserIcon className={`w-5 h-5 ${hasDocument('GERANT_CIN') ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">Carte d'identité du gérant *</p>
                          <p className="text-xs text-gray-400">JPG, PNG ou PDF</p>
                        </div>
                      </div>
                      <div>
                        <input type="file" id="cinGerant" className="hidden" accept="image/jpeg,image/png,application/pdf" onChange={(e) => handleFileUpload('GERANT_CIN', e.target.files[0])} />
                        {hasDocument('GERANT_CIN') ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-green-600 truncate max-w-[150px]">{formData.documents.find(d => d.type === 'GERANT_CIN')?.file?.name}</span>
                            <label htmlFor="cinGerant" className="cursor-pointer text-[#0b4ea2] text-sm font-medium hover:underline">Modifier</label>
                          </div>
                        ) : (
                          <label htmlFor="cinGerant" className="flex items-center gap-2 cursor-pointer bg-[#0b4ea2] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0b3d82] transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Importer
                          </label>
                        )}
                      </div>
                    </div>

                    <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${hasDocument('PATENTE') ? 'border-green-400 bg-green-50' : 'border-dashed border-gray-300 hover:border-[#0b4ea2]'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasDocument('PATENTE') ? 'bg-green-500' : 'bg-gray-100'}`}>
                          <DocumentTextIcon className={`w-5 h-5 ${hasDocument('PATENTE') ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">Patente *</p>
                          <p className="text-xs text-gray-400">Document officiel</p>
                        </div>
                      </div>
                      <div>
                        <input type="file" id="patente" className="hidden" accept="image/jpeg,image/png,application/pdf" onChange={(e) => handleFileUpload('PATENTE', e.target.files[0])} />
                        {hasDocument('PATENTE') ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-green-600 truncate max-w-[150px]">{formData.documents.find(d => d.type === 'PATENTE')?.file?.name}</span>
                            <label htmlFor="patente" className="cursor-pointer text-[#0b4ea2] text-sm font-medium hover:underline">Modifier</label>
                          </div>
                        ) : (
                          <label htmlFor="patente" className="flex items-center gap-2 cursor-pointer bg-[#0b4ea2] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0b3d82] transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Importer
                          </label>
                        )}
                      </div>
                    </div>

                    <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${hasDocument('RNE') ? 'border-green-400 bg-green-50' : 'border-dashed border-gray-300 hover:border-[#0b4ea2]'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasDocument('RNE') ? 'bg-green-500' : 'bg-gray-100'}`}>
                          <BriefcaseIcon className={`w-5 h-5 ${hasDocument('RNE') ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">Extrait RNE *</p>
                          <p className="text-xs text-gray-400">Moins de 3 mois</p>
                        </div>
                      </div>
                      <div>
                        <input type="file" id="rne" className="hidden" accept="image/jpeg,image/png,application/pdf" onChange={(e) => handleFileUpload('RNE', e.target.files[0])} />
                        {hasDocument('RNE') ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-green-600 truncate max-w-[150px]">{formData.documents.find(d => d.type === 'RNE')?.file?.name}</span>
                            <label htmlFor="rne" className="cursor-pointer text-[#0b4ea2] text-sm font-medium hover:underline">Modifier</label>
                          </div>
                        ) : (
                          <label htmlFor="rne" className="flex items-center gap-2 cursor-pointer bg-[#0b4ea2] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0b3d82] transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Importer
                          </label>
                        )}
                      </div>
                    </div>

                    {!hasDocument('RNE') && (
                      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-800"><strong>Attention :</strong> L'extrait RNE doit dater de <strong>moins de 3 mois</strong>.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Checkbox pour les conditions générales */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptConditions}
                  onChange={(e) => setAcceptConditions(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-[#0b4ea2] focus:ring-[#0b4ea2] cursor-pointer"
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    J'accepte les{' '}
                    <a href="/conditions-invera" target="_blank" className="text-[#0b4ea2] underline font-medium">
                      conditions générales et politique de confidentialité d'InVera
                    </a>
                  </p>
                </div>
              </label>
            </div>

            {/* BOUTON CRÉER UN COMPTE */}
            <button 
              type="submit"
              disabled={loading || !isValid()} 
              className="w-full mt-6 bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" /> 
                  Créer un compte
                </>
              )}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default RegisterPage;