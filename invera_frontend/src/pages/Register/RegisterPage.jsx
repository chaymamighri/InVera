// src/pages/Register/RegisterPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { sendOtp, verifyOtp, register } from '../../services/registerService';
import logo from '../../assets/images/logo.png';
import ReactCountryFlag from "react-country-flag";

// Import des icônes Heroicons
import { 
  ArrowLeftIcon,
  EnvelopeIcon,
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
  CheckBadgeIcon,
  BuildingOfficeIcon,
  PhotoIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

import { useNavigate } from 'react-router-dom';
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
    invalidCode: '❌ Code invalide. Veuillez réessayer.',
    expiredCode: '⏰ Code expiré. Veuillez en demander un nouveau.',
    genericOtpError: "❌ Erreur lors de l'envoi du code",
    resendCode: 'Renvoyer le code',
    resendCodeSuccess: '✅ Un nouveau code a été envoyé',
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
    lastName: 'Nom *',
    firstName: 'Prénom *',
    companyName: 'Raison sociale *',
    companyLogo: 'Logo Entreprise',
    companyLogoHint: 'Votre logo (optionnel)',
    matriculeFiscal: 'Matricule fiscal',
    phone: 'Téléphone *',
    password: 'Mot de passe *',
    passwordMinLength: 'Le mot de passe doit contenir au moins 8 caractères',
    invalidEmail: 'Veuillez saisir un email valide (exemple@domaine.com)',
    invalidPhone: 'Le numéro de téléphone doit contenir entre 8 et 15 chiffres',
    invalidRaisonSociale: 'La raison sociale doit contenir au moins 2 caractères',
    invalidMatriculeFiscal: 'Le matricule fiscal doit contenir des lettres ET des chiffres (5-15 caractères)',
    mandatoryDocuments: 'Documents justificatifs obligatoires',
    nationalId: "Carte d'identité nationale",
    managerId: "Carte d'identité du gérant",
    patent: 'Patente',
    rne: 'Extrait RNE',
    acceptedFormats: 'JPG, PNG ou PDF',
    uploaded: 'Document chargé',
    rneWarningTitle: 'Attention',
    rneWarning: "L'extrait RNE doit dater de moins de 3 mois.",
    submit: "S'inscrire",
    submitting: 'Inscription en cours...',
    terms: "En cliquant sur \"S'inscrire\", vous acceptez nos conditions générales d'utilisation.",
    successTrialTitle: 'Compte essai créé !',
    successTrialDescription: 'Vous pouvez dès maintenant vous connecter.',
    successWaitingTitle: 'Inscription enregistrée !',
    successWaitingDescription: "Votre dossier est en cours de validation par l'administrateur.",
    loginNow: 'Se connecter',
    backToHome: "Retour à l'accueil",
    // Messages d'erreur inscription
    emailExistsTitle: '❌ Email déjà utilisé',
    emailExistsMessage: 'Un compte existe déjà avec cette adresse email.',
    emailExistsAction: 'Veuillez vous connecter ou utiliser un autre email.',
    phoneExistsTitle: '❌ Téléphone déjà utilisé',
    phoneExistsMessage: 'Un compte existe déjà avec ce numéro de téléphone.',
    phoneExistsAction: 'Vérifiez le numéro saisi ou connectez-vous avec votre compte existant.',
    matriculeExistsTitle: '❌ Matricule fiscal déjà utilisé',
    matriculeExistsMessage: 'Ce matricule fiscal est déjà associé à un compte.',
    matriculeExistsAction: 'Vérifiez que vous avez saisi le bon matricule fiscal.',
    inscriptionErrorTitle: '❌ Échec de l\'inscription',
    inscriptionErrorMessage: 'Une erreur est survenue lors de la création de votre compte.'
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
    invalidCode: '❌ Invalid code. Please try again.',
    expiredCode: '⏰ Expired code. Please request a new one.',
    genericOtpError: '❌ Failed to send the code',
    resendCode: 'Resend code',
    resendCodeSuccess: '✅ A new code has been sent',
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
    lastName: 'Last name *',
    firstName: 'First name *',
    companyName: 'Company name *',
    companyLogo: 'Company Logo',
    companyLogoHint: 'Your logo (optional)',
    matriculeFiscal: 'Tax registration number',
    phone: 'Phone *',
    password: 'Password *',
    passwordMinLength: 'Password must be at least 8 characters',
    invalidEmail: 'Please enter a valid email (example@domain.com)',
    invalidPhone: 'Phone number must contain between 8 and 15 digits',
    invalidRaisonSociale: 'Company name must contain at least 2 characters',
    invalidMatriculeFiscal: 'Tax registration number must contain both letters AND digits (5-15 characters)',
    mandatoryDocuments: 'Required supporting documents',
    nationalId: 'National identity card',
    managerId: "Manager's identity card",
    patent: 'Patent certificate',
    rne: 'RNE extract',
    acceptedFormats: 'JPG, PNG, or PDF',
    uploaded: 'Document uploaded',
    rneWarningTitle: 'Warning',
    rneWarning: 'The RNE extract must be less than 3 months old.',
    submit: 'Register',
    submitting: 'Registering...',
    terms: 'By clicking "Register", you accept our general terms of use.',
    successTrialTitle: 'Trial account created!',
    successTrialDescription: 'You can now log in.',
    successWaitingTitle: 'Registration recorded!',
    successWaitingDescription: 'Your file is being reviewed by the administrator.',
    loginNow: 'Log in',
    backToHome: 'Back to home',
    emailExistsTitle: '❌ Email already exists',
    emailExistsMessage: 'An account already exists with this email address.',
    emailExistsAction: 'Please log in or use another email.',
    phoneExistsTitle: '❌ Phone already exists',
    phoneExistsMessage: 'An account already exists with this phone number.',
    phoneExistsAction: 'Check the number or log in with your existing account.',
    matriculeExistsTitle: '❌ Tax number already used',
    matriculeExistsMessage: 'This tax registration number is already associated with an account.',
    matriculeExistsAction: 'Verify that you entered the correct tax number.',
    inscriptionErrorTitle: '❌ Registration failed',
    inscriptionErrorMessage: 'An error occurred while creating your account.'
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
    invalidCode: '❌ رمز غير صالح. حاول مرة أخرى.',
    expiredCode: '⏰ رمز منتهي الصلاحية. يرجى طلب رمز جديد.',
    genericOtpError: '❌ تعذر إرسال الرمز',
    resendCode: 'إعادة إرسال الرمز',
    resendCodeSuccess: '✅ تم إرسال رمز جديد',
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
    lastName: 'اللقب *',
    firstName: 'الاسم *',
    companyName: 'الاسم التجاري *',
    companyLogo:'شعار الشركة',
    companyLogoHint: 'شعارك (اختياري)',
    matriculeFiscal: 'الرقم الضريبي',
    phone: 'الهاتف *',
    password: 'كلمة المرور *',
    passwordMinLength: 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل',
    invalidEmail: 'يرجى إدخال بريد إلكتروني صالح (example@domain.com)',
    invalidPhone: 'يجب أن يحتوي رقم الهاتف على ما بين 8 و 15 رقمًا',
    invalidRaisonSociale: 'يجب أن يحتوي الاسم التجاري على حرفين على الأقل',
    invalidMatriculeFiscal: 'يجب أن يحتوي الرقم الضريبي على أحرف وأرقام (5-15 حرفًا)',
    mandatoryDocuments: 'الوثائق الإلزامية',
    nationalId: 'بطاقة الهوية الوطنية',
    managerId: 'بطاقة هوية المدير',
    patent: 'الباتيندة',
    rne: 'مستخرج السجل الوطني للمؤسسات',
    acceptedFormats: 'JPG أو PNG أو PDF',
    uploaded: 'تم رفع الوثيقة',
    rneWarningTitle: 'تنبيه',
    rneWarning: 'يجب أن يكون مستخرج RNE أقل من 3 أشهر.',
    submit: 'تسجيل',
    submitting: 'جاري التسجيل...',
    terms: 'بالنقر على "تسجيل"، فإنك توافق على الشروط العامة للاستخدام.',
    successTrialTitle: 'تم إنشاء الحساب التجريبي!',
    successTrialDescription: 'يمكنك الآن تسجيل الدخول.',
    successWaitingTitle: 'تم تسجيل الطلب!',
    successWaitingDescription: 'ملفك قيد المراجعة من طرف المسؤول.',
    loginNow: 'تسجيل الدخول',
    backToHome: 'العودة إلى الرئيسية',
    emailExistsTitle: '❌ البريد الإلكتروني موجود بالفعل',
    emailExistsMessage: 'يوجد حساب بالفعل مع عنوان البريد الإلكتروني هذا.',
    emailExistsAction: 'يرجى تسجيل الدخول أو استخدام بريد إلكتروني آخر.',
    phoneExistsTitle: '❌ الهاتف موجود بالفعل',
    phoneExistsMessage: 'يوجد حساب بالفعل مع رقم الهاتف هذا.',
    phoneExistsAction: 'تحقق من الرقم أو قم بتسجيل الدخول بحسابك الحالي.',
    matriculeExistsTitle: '❌ الرقم الضريبي مستخدم بالفعل',
    matriculeExistsMessage: 'هذا الرقم الضريبي مرتبط بالفعل بحساب.',
    matriculeExistsAction: 'تحقق من إدخال الرقم الضريبي الصحيح.',
    inscriptionErrorTitle: '❌ فشل التسجيل',
    inscriptionErrorMessage: 'حدث خطأ أثناء إنشاء حسابك.'
  },
};

// Liste des pays avec code, indicatif
const countryCodes = [
  { code: 'TN', name: 'Tunisie', dialCode: '+216' },
  { code: 'MA', name: 'Maroc', dialCode: '+212' },
  { code: 'DZ', name: 'Algérie', dialCode: '+213' },
  { code: 'LY', name: 'Libye', dialCode: '+218' },
  { code: 'EG', name: 'Égypte', dialCode: '+20' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'BE', name: 'Belgique', dialCode: '+32' },
  { code: 'CH', name: 'Suisse', dialCode: '+41' },
  { code: 'DE', name: 'Allemagne', dialCode: '+49' },
  { code: 'IT', name: 'Italie', dialCode: '+39' },
  { code: 'ES', name: 'Espagne', dialCode: '+34' },
  { code: 'GB', name: 'Royaume-Uni', dialCode: '+44' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'US', name: 'États-Unis', dialCode: '+1' },
];

// ==================== FONCTIONS DE VALIDATION ====================

const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\s/g, '');
  const phoneRegex = /^\d{8,15}$/;
  return phoneRegex.test(cleanPhone);
};

const validatePassword = (password) => {
  return password && password.length >= 8;
};

const validateRaisonSociale = (raisonSociale) => {
  if (!raisonSociale) return false;
  const regex = /^[a-zA-Z0-9\s\-\.\']{2,}$/;
  return regex.test(raisonSociale.trim());
};

const validateMatriculeFiscal = (matriculeFiscal) => {
  if (!matriculeFiscal) return true;
  if (matriculeFiscal.length < 5 || matriculeFiscal.length > 15) return false;
  const isValidChars = /^[a-zA-Z0-9]+$/.test(matriculeFiscal);
  if (!isValidChars) return false;
  const hasLetter = /[a-zA-Z]/.test(matriculeFiscal);
  const hasDigit = /[0-9]/.test(matriculeFiscal);
  return hasLetter && hasDigit;
};

const validateNomPrenom = (value) => {
  if (!value) return false;
  const regex = /^[a-zA-Z\s\-']{2,}$/;
  return regex.test(value.trim());
};

// ==================== COMPOSANT PRINCIPAL ====================

const RegisterPage = () => {
  const navigate = useNavigate();
  const { language, isArabic } = useLanguage();
  const copy = registerCopy[language] || registerCopy.fr;

  const [step, setStep] = useState('otp');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryDropdownRef = useRef(null);
  const logoInputRef = useRef(null);

  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    typeCompte: 'PARTICULIER',
    nom: '',
    prenom: '',
    raisonSociale: '',
    matriculeFiscal: '',
    telephone: '',
    paysCode: '+216',
    selectedCountry: countryCodes.find(c => c.code === 'TN') || countryCodes[0],
    motDePasse: '',
    email: '',
    documents: [],
    typeInscription: 'ESSAI',
    companyLogo: null,
    companyLogoPreview: null,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptConditions, setAcceptConditions] = useState(false);
  const [offres, setOffres] = useState([]);
  const [offresLoading, setOffresLoading] = useState(false);
  const [selectedOffre, setSelectedOffre] = useState(null);

  // ✅ Variables dérivées
  const isEssai = formData.typeInscription === 'ESSAI';
  const isPayant = formData.typeInscription === 'DEFINITIF';
  const isParticulier = formData.typeCompte === 'PARTICULIER';
  

  // ✅ Chargement des offres
  useEffect(() => {
    const loadOffres = async () => {
      setOffresLoading(true);
      try {
        const response = await fetch('http://localhost:8081/api/public/offres');
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
        const data = await response.json();
        console.log('Offres chargées:', data);
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

  // ✅ Gestion click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateField = (field, value) => {
    let error = null;
    switch (field) {
      case 'email':
        if (!value) error = copy.emailRequired;
        else if (!validateEmail(value)) error = copy.invalidEmail;
        break;
      case 'telephone':
        if (!value) error = copy.phone + ' est requis';
        else if (!validatePhone(value)) error = copy.invalidPhone;
        break;
      case 'motDePasse':
        if (!value) error = copy.password + ' est requis';
        else if (!validatePassword(value)) error = copy.passwordMinLength;
        break;
      case 'raisonSociale':
        if (!isParticulier && !value) error = copy.companyName + ' est requis';
        else if (!isParticulier && value && !validateRaisonSociale(value)) error = copy.invalidRaisonSociale;
        break;
      case 'matriculeFiscal':
        if (!isParticulier && value && !validateMatriculeFiscal(value)) error = copy.invalidMatriculeFiscal;
        break;
      default: break;
    }
    setFieldErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

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

  const handleLogoUpload = (file) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFieldErrors(prev => ({ ...prev, companyLogo: 'Format non supporté. Utilisez JPG, PNG, SVG ou WEBP' }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFieldErrors(prev => ({ ...prev, companyLogo: 'Le logo ne doit pas dépasser 2MB' }));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    updateFormData('companyLogo', file);
    updateFormData('companyLogoPreview', previewUrl);
    setFieldErrors(prev => ({ ...prev, companyLogo: null }));
  };

  const removeLogo = () => {
    if (formData.companyLogoPreview) {
      URL.revokeObjectURL(formData.companyLogoPreview);
    }
    updateFormData('companyLogo', null);
    updateFormData('companyLogoPreview', null);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const hasDocument = (field) => formData.documents?.some((d) => d.type === field);

  const handleCountrySelect = (country) => {
    setFormData(prev => ({ ...prev, paysCode: country.dialCode, selectedCountry: country }));
    setShowCountryDropdown(false);
  };

  const getFullPhoneNumber = () => {
    return `${formData.paysCode}${formData.telephone}`;
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email) errors.email = copy.emailRequired;
    else if (!validateEmail(formData.email)) errors.email = copy.invalidEmail;
    if (!formData.telephone) errors.telephone = copy.phone + ' est requis';
    else if (!validatePhone(formData.telephone)) errors.telephone = copy.invalidPhone;
    if (!formData.motDePasse) errors.motDePasse = copy.password + ' est requis';
    else if (!validatePassword(formData.motDePasse)) errors.motDePasse = copy.passwordMinLength;
    if (!formData.nom) errors.nom = copy.lastName + ' est requis';
    else if (!validateNomPrenom(formData.nom)) errors.nom = 'Le nom doit contenir au moins 2 caractères';
    if (!formData.prenom) errors.prenom = copy.firstName + ' est requis';
    else if (!validateNomPrenom(formData.prenom)) errors.prenom = 'Le prénom doit contenir au moins 2 caractères';
    if (!isParticulier) {
      if (!formData.raisonSociale) errors.raisonSociale = copy.companyName + ' est requis';
      else if (!validateRaisonSociale(formData.raisonSociale)) errors.raisonSociale = copy.invalidRaisonSociale;
      if (formData.matriculeFiscal && !validateMatriculeFiscal(formData.matriculeFiscal)) {
        errors.matriculeFiscal = copy.invalidMatriculeFiscal;
      }
    }
    if (isPayant) {
      if (isParticulier) {
        if (!hasDocument('CIN')) errors.documents = 'La carte d\'identité est obligatoire';
      } else {
        if (!hasDocument('GERANT_CIN')) errors.documents = 'La carte d\'identité du gérant est obligatoire';
        else if (!hasDocument('PATENTE')) errors.documents = 'La patente est obligatoire';
        else if (!hasDocument('RNE')) errors.documents = 'L\'extrait RNE est obligatoire';
      }
      if (!selectedOffre) errors.offre = 'Veuillez sélectionner une offre d\'abonnement';
    }
    if (!acceptConditions) errors.conditions = 'Vous devez accepter les conditions générales';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
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
    if (!validateEmail(email)) {
      setOtpError(copy.invalidEmail);
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    setOtpSuccessMessage('');

    const result = await sendOtp(email);
    if (result.success) {
      setOtpSent(true);
      setOtpSuccessMessage(copy.resendCodeSuccess);
      setResendTimer(60);
      setTimeout(() => setOtpSuccessMessage(''), 3000);
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

  try {
    const result = await verifyOtp(email, cleanedCode);
    
    console.log('Résultat verifyOtp:', result);
    console.log('Email à sauvegarder:', email);  // ← AJOUTEZ CE LOG
    
    if (result && result.success === true) {
      console.log('✅ Code valide, email:', email);  // ← LOG
      setStep('form');
      setFormData((prev) => ({ 
        ...prev, 
        email: email  // Sauvegarde l'email
      }));
      setOtpError('');
    } else {
      console.log('❌ Code invalide');
      const errorMessage = result?.message || '';
      if (errorMessage.toLowerCase().includes('expir')) {
        setOtpError(copy.expiredCode);
      } else {
        setOtpError(copy.invalidCode);
      }
    }
  } catch (error) {
    console.error('Erreur vérification OTP:', error);
    setOtpError(copy.invalidCode);
  } finally {
    setOtpLoading(false);
  }
};
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) return;
  
  // ✅ CRITIQUE: Utiliser l'email du state OTP (variable 'email' ligne 306)
  const finalEmail = email;  // 'email' est le state de l'étape OTP
  
  console.log('=== VÉRIFICATION DES VALEURS AVANT ENVOI ===');
  console.log('email (state OTP):', email);
  console.log('email (formData):', formData.email);
  console.log('email FINAL utilisé:', finalEmail);
  console.log('typeCompte:', formData.typeCompte);
  console.log('typeInscription:', formData.typeInscription);
  console.log('otpCode:', otpCode);
  
  // ✅ Vérifier que l'email existe
  if (!finalEmail || finalEmail === 'undefined' || finalEmail === '') {
    console.error('❌ Email manquant!');
    setError({ 
      code: 'missing_email',
      title: 'Email manquant',
      message: "L'adresse email est requise. Veuillez recommencer l'inscription.",
      action: 'Retour à la vérification email'
    });
    setLoading(false);
    return;
  }
  
  // ✅ FORCER LES VALEURS PAR DÉFAUT SI UNDEFINED
  const safeTypeCompte = formData.typeCompte || 'PARTICULIER';
  const safeTypeInscription = formData.typeInscription || 'ESSAI';
  const safeNom = formData.nom || '';
  const safePrenom = formData.prenom || '';
  const safePassword = formData.motDePasse || '';
  
  if (!safePassword || safePassword === 'undefined') {
    console.error('❌ Mot de passe manquant!');
    setError({ message: "Le mot de passe est requis." });
    setLoading(false);
    return;
  }
  
  setLoading(true);
  setError(null);
  
  const formDataToSend = new FormData();
  
  // ✅ UTILISER finalEmail au lieu de formData.email
  formDataToSend.append('email', finalEmail);
  formDataToSend.append('telephone', getFullPhoneNumber());
  formDataToSend.append('typeCompte', safeTypeCompte);
  formDataToSend.append('typeInscription', safeTypeInscription);
  formDataToSend.append('otp', otpCode);
  formDataToSend.append('password', safePassword);
  formDataToSend.append('nom', safeNom);
  formDataToSend.append('prenom', safePrenom);
  formDataToSend.append('raisonSociale', formData.raisonSociale || '');
  formDataToSend.append('matriculeFiscal', formData.matriculeFiscal || '');
  
  if (selectedOffre?.id) {
    formDataToSend.append('offreId', selectedOffre.id.toString());
  }
  
  if (formData.companyLogo) {
    formDataToSend.append('logo', formData.companyLogo);
    console.log('✅ Logo ajouté:', formData.companyLogo.name);
  }
  
  formData.documents?.forEach((doc) => {
    formDataToSend.append(`documents[${doc.type}]`, doc.file);
    console.log(`✅ Document ajouté: ${doc.type}`);
  });
  
  // ✅ AFFICHER TOUTES LES VALEURS ENVOYÉES
  console.log('=== FORM DATA ENVOYÉE ===');
  for (let pair of formDataToSend.entries()) {
    if (pair[1] instanceof File) {
      console.log(pair[0] + ':', '[FILE]', pair[1].name);
    } else {
      console.log(pair[0] + ':', pair[1]);
    }
  }
  
  try {
    const result = await register(formDataToSend);
    
    if (result.success) {
      setSuccess(true);
    } else {
      const errorMessage = result.message || '';
      console.log('Erreur reçue:', errorMessage);
      
      if (errorMessage.toLowerCase().includes('email déjà utilisé') || 
          errorMessage.toLowerCase().includes('email already exists') ||
          errorMessage.toLowerCase().includes('email existe déjà')) {
        setError({
          code: 'email_exists',
          title: copy.emailExistsTitle,
          message: copy.emailExistsMessage,
          action: copy.emailExistsAction
        });
      } 
      else if (errorMessage.toLowerCase().includes('téléphone déjà utilisé') || 
               errorMessage.toLowerCase().includes('phone already exists')) {
        setError({
          code: 'phone_exists',
          title: copy.phoneExistsTitle,
          message: copy.phoneExistsMessage,
          action: copy.phoneExistsAction
        });
      }
      else if (errorMessage.toLowerCase().includes('matricule fiscal déjà utilisé') || 
               errorMessage.toLowerCase().includes('matricule already exists')) {
        setError({
          code: 'matricule_exists',
          title: copy.matriculeExistsTitle,
          message: copy.matriculeExistsMessage,
          action: copy.matriculeExistsAction
        });
      }
      else {
        setError({
          code: 'unknown',
          title: copy.inscriptionErrorTitle,
          message: errorMessage || copy.inscriptionErrorMessage,
          action: 'Si le problème persiste, contactez notre support.'
        });
      }
    }
  } catch (error) {
    console.error('Erreur inscription catch:', error);
    const errorMessage = error?.response?.data?.error || error?.message || '';
    
    if (errorMessage.toLowerCase().includes('email déjà utilisé') || 
        errorMessage.toLowerCase().includes('email already exists') ||
        errorMessage.toLowerCase().includes('email existe déjà')) {
      setError({
        code: 'email_exists',
        title: copy.emailExistsTitle,
        message: copy.emailExistsMessage,
        action: copy.emailExistsAction
      });
    } 
    else {
      setError({
        code: 'unknown',
        title: copy.inscriptionErrorTitle,
        message: copy.inscriptionErrorMessage,
        action: 'Si le problème persiste, contactez notre support.'
      });
    }
  } finally {
    setLoading(false);
  }
};

  // Nettoyage du preview URL
  useEffect(() => {
    return () => {
      if (formData.companyLogoPreview) {
        URL.revokeObjectURL(formData.companyLogoPreview);
      }
    };
  }, [formData.companyLogoPreview]);

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

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setOtpSent(false);
                            setOtpError('');
                            setOtpCode('');
                            setOtpSuccessMessage('');
                          }}
                          className="flex-1 text-[#0b4ea2] py-2 text-sm hover:underline transition"
                        >
                          ← {copy.editEmail}
                        </button>
                        
                        <button
                          onClick={handleSendOtp}
                          disabled={resendTimer > 0 || otpLoading}
                          className="flex-1 text-[#0b4ea2] py-2 text-sm hover:underline transition disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {resendTimer > 0 ? `${copy.resendCode} (${resendTimer}s)` : copy.resendCode}
                        </button>
                      </div>
                    </>
                  )}

                  {otpSuccessMessage && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4" />
                      {otpSuccessMessage}
                    </div>
                  )}

                  {otpError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-red-800">
                            {otpError.includes('expiré') ? 'Code expiré' : 'Code invalide'}
                          </p>
                          <p className="text-sm text-red-700 mt-1">{otpError}</p>
                          {otpError.includes('invalide') && (
                            <p className="text-sm text-red-600 mt-2">
                              Vérifiez votre boîte email et saisissez le code à 6 chiffres correct.
                            </p>
                          )}
                          {otpError.includes('expiré') && (
                            <button
                              onClick={handleSendOtp}
                              className="mt-3 text-sm text-red-700 underline font-medium"
                            >
                              {copy.resendCode}
                            </button>
                          )}
                        </div>
                      </div>
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
                
                {isEssai ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{copy.successTrialTitle}</h2>
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
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{copy.successWaitingTitle}</h2>
                    <p className="text-gray-600 mb-4">{copy.successWaitingDescription}</p>
                    <div className="text-left space-y-3 mb-6">
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <p className="text-blue-800 text-sm font-medium mb-2 flex items-center gap-2">
                          <ClockIcon className="w-4 h-4" />
                          Dossier en cours de validation
                        </p>
                        <p className="text-blue-700 text-sm">Votre dossier sera examiné par notre équipe. Vous serez notifié par email dès son activation.</p>
                      </div>
                    </div>
                    <button onClick={() => navigate('/login')} className="w-full bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition">
                      🔑 {copy.loginNow}
                    </button>
                  </>
                )}
                <div className="mt-4">
                  <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 transition">
                    ← {copy.backToHome}
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  } 

  // ==================== ÉCRAN PRINCIPAL DU FORMULAIRE ====================
  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f9fc] text-slate-900" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="absolute inset-x-0 top-0 -z-10 h-[460px] bg-[linear-gradient(180deg,#eef6ff_0%,#f6f9fc_100%)]" />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-24 pt-6">
        
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
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900">{copy.pageTitle}</h1>
            <p className="text-slate-500 mt-2">{copy.pageDescription}</p>
            <div className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600 mt-3 items-center gap-1">
              <CheckCircleIcon className="w-4 h-4" /> {copy.emailVerified}
            </div>
          </div>

          {/* ✅ Message d'erreur d'inscription amélioré */}
          {error && (
            <div className="mb-6 p-5 rounded-xl border bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-red-800 text-lg">{error.title}</h3>
                  <p className="text-red-700 mt-1">{error.message}</p>
                  <div className="mt-3 flex gap-3">
                    {error.code === 'email_exists' && (
                      <button 
                        onClick={() => navigate('/login')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                      >
                        Se connecter
                      </button>
                    )}
                    <button 
                      onClick={() => setError(null)}
                      className="px-4 py-2 border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 transition"
                    >
                      Fermer
                    </button>
                  </div>
                  {error.action && (
                    <p className="text-sm text-red-600 mt-3 pt-2 border-t border-red-100">{error.action}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="on" className="space-y-6">
            {/* SECTION 1: TYPE DE COMPTE */}
            <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-[#0b4ea2]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">1. {copy.accountType}</h2>
                  <p className="text-xs text-gray-400">Sélectionnez votre profil</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{copy.accountType} *</label>
                <div className="relative">
                  <select
                    value={formData.typeCompte}
                    onChange={(e) => {
                      updateFormData('typeCompte', e.target.value);
                      if (e.target.value === 'PARTICULIER') {
                        setFieldErrors(prev => ({ ...prev, raisonSociale: null, matriculeFiscal: null }));
                      }
                    }}
                    className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2] bg-white cursor-pointer"
                  >
                    <option value="PARTICULIER">👤 {copy.individual}</option>
                    <option value="ENTREPRISE">🏢 {copy.company}</option>
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
                  <h2 className="text-lg font-semibold text-slate-800">2. Informations {!isParticulier ? "de l'entreprise" : "personnelles"}</h2>
                  <p className="text-xs text-gray-400">Vos coordonnées</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{copy.lastName}</label>
                    <input 
                      type="text" 
                      placeholder="Dupont" 
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2] transition-colors ${
                        fieldErrors.nom ? 'border-red-500' : 'border-gray-200'
                      }`}
                      value={formData.nom} 
                      onChange={(e) => handleFieldChange('nom', e.target.value)} 
                    />
                    {fieldErrors.nom && <p className="text-xs text-red-500 mt-1">{fieldErrors.nom}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{copy.firstName}</label>
                    <input 
                      type="text" 
                      placeholder="Jean" 
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2] transition-colors ${
                        fieldErrors.prenom ? 'border-red-500' : 'border-gray-200'
                      }`}
                      value={formData.prenom} 
                      onChange={(e) => handleFieldChange('prenom', e.target.value)} 
                    />
                    {fieldErrors.prenom && <p className="text-xs text-red-500 mt-1">{fieldErrors.prenom}</p>}
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
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2] transition-colors ${
                        fieldErrors.email ? 'border-red-500' : 'border-gray-200'
                      }`}
                      value={formData.email} 
                      onChange={(e) => handleFieldChange('email', e.target.value)} 
                    />
                  </div>
                  {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{copy.phone}</label>
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
                        placeholder="XX XXX XXX" 
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2] transition-colors ${
                          fieldErrors.telephone ? 'border-red-500' : 'border-gray-200'
                        }`}
                        value={formData.telephone} 
                        onChange={(e) => handleFieldChange('telephone', e.target.value)} 
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Exemple: {formData.paysCode} XX XXX XXX</p>
                  {fieldErrors.telephone && <p className="text-xs text-red-500 mt-1">{fieldErrors.telephone}</p>}
                </div>

                {/* SECTION LOGO */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {copy.companyLogo}
                    <span className="text-gray-400 text-xs ml-2 font-normal">{copy.companyLogoHint}</span>
                  </label>
                  
                  <div className="mt-2">
                    {!formData.companyLogoPreview ? (
                      <label className="relative w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#0b4ea2] transition-colors group block">
                        <input 
                          type="file" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          accept="image/jpeg,image/png,image/svg+xml,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleLogoUpload(file);
                          }}
                        />
                        <div className="flex flex-col items-center gap-2 pointer-events-none">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                            <BuildingOfficeIcon className="w-8 h-8 text-gray-400 group-hover:text-[#0b4ea2] transition-colors" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 group-hover:text-[#0b4ea2] transition-colors">
                              Cliquez pour importer le logo
                            </p>
                            <p className="text-xs text-gray-400 mt-1">JPG, PNG, SVG ou WEBP (max. 2MB)</p>
                          </div>
                        </div>
                      </label>
                    ) : (
                      <div className="relative w-full border border-gray-200 rounded-xl p-4 bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden border border-gray-200">
                            <img src={formData.companyLogoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain p-2" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">{formData.companyLogo?.name || 'Logo chargé'}</p>
                            <p className="text-xs text-gray-400">{(formData.companyLogo?.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button type="button" onClick={removeLogo} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50">
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>
                        <label className="mt-3 inline-block text-sm text-[#0b4ea2] hover:underline font-medium cursor-pointer">
                          Changer le logo
                          <input type="file" className="hidden" accept="image/jpeg,image/png,image/svg+xml,image/webp" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (formData.companyLogoPreview) URL.revokeObjectURL(formData.companyLogoPreview);
                              handleLogoUpload(file);
                            }
                            e.target.value = '';
                          }} />
                        </label>
                      </div>
                    )}
                  </div>
                  {fieldErrors.companyLogo && <p className="text-xs text-red-500 mt-2">{fieldErrors.companyLogo}</p>}
                </div>

                {!isParticulier && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{copy.companyName}</label>
                      <input 
                        type="text" 
                        placeholder="Ma Société SARL" 
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2] transition-colors ${
                          fieldErrors.raisonSociale ? 'border-red-500' : 'border-gray-200'
                        }`}
                        value={formData.raisonSociale} 
                        onChange={(e) => handleFieldChange('raisonSociale', e.target.value)} 
                      />
                      {fieldErrors.raisonSociale && <p className="text-xs text-red-500 mt-1">{fieldErrors.raisonSociale}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {copy.matriculeFiscal} <span className="text-gray-400">*</span>
                      </label>
                      <input 
                        type="text" 
                        placeholder="1234567X" 
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2] transition-colors ${
                          fieldErrors.matriculeFiscal ? 'border-red-500' : 'border-gray-200'
                        }`}
                        value={formData.matriculeFiscal} 
                        onChange={(e) => handleFieldChange('matriculeFiscal', e.target.value)} 
                      />
                      {fieldErrors.matriculeFiscal && <p className="text-xs text-red-500 mt-1">{fieldErrors.matriculeFiscal}</p>}
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{copy.password}</label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="password"
                      autoComplete="new-password"
                      placeholder="••••••••" 
                      className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2] transition-colors ${
                        fieldErrors.motDePasse ? 'border-red-500' : 'border-gray-200'
                      }`}
                      value={formData.motDePasse} 
                      onChange={(e) => handleFieldChange('motDePasse', e.target.value)} 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                      {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  {fieldErrors.motDePasse && <p className="text-xs text-red-500 mt-1">{fieldErrors.motDePasse}</p>}
                  <p className="text-xs text-gray-400 mt-1">Minimum 8 caractères</p>
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
                  <h2 className="text-lg font-semibold text-slate-800">3. {copy.subscription}</h2>
                  <p className="text-xs text-gray-400">Choisissez votre formule</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{copy.registrationType} *</label>
                <div className="relative mb-4">
                  <select
                    value={formData.typeInscription}
                    onChange={(e) => { 
                      updateFormData('typeInscription', e.target.value);
                      setSelectedOffre(null);
                      setFieldErrors(prev => ({ ...prev, offre: null, documents: null }));
                    }}
                    className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2] bg-white cursor-pointer"
                  >
                    <option value="ESSAI">🎁 {copy.trial} ({copy.trialConnections})</option>
                    <option value="DEFINITIF">💰 {copy.subscription}</option>
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
                  ) : offres.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {offres.map((offre) => (
                        <div 
                          key={offre.id}
                          className={`border rounded-xl p-4 text-center cursor-pointer transition-all ${
                            selectedOffre?.id === offre.id 
                              ? 'border-green-500 bg-green-50 shadow-md' 
                              : 'border-gray-200 hover:border-green-400 hover:bg-green-50/30'
                          }`}
                          onClick={() => {
                            setSelectedOffre(offre);
                            setFieldErrors(prev => ({ ...prev, offre: null }));
                          }}
                        >
                          <p className="font-bold text-slate-800 text-base">{offre.duree}</p>
                          <p className="text-green-600 font-semibold text-xl mt-1">{offre.prix} TND</p>
                          {offre.dureeMois === 3 && <p className="text-xs text-gray-400 mt-1">(26,33 TND/mois)</p>}
                          {offre.dureeMois === 12 && <p className="text-xs text-gray-400 mt-1">(22,42 TND/mois)</p>}
                          {offre.description && <p className="text-xs text-gray-500 mt-2">{offre.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">Aucune offre disponible pour le moment</div>
                  )}
                  
                  {fieldErrors.offre && <p className="text-xs text-red-500 mt-2">{fieldErrors.offre}</p>}
                </div>
              )}

              {isEssai && (
                <div className="bg-green-50 rounded-xl p-5 text-center border border-green-200">
                  <GiftIcon className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold text-green-700 text-lg">🎁 {copy.trialConnections} offertes</p>
                  <p className="text-sm text-green-600 mt-1">Testez toutes les fonctionnalités sans engagement.</p>
                  <p className="text-xs text-green-500 mt-2">Aucun document requis - Commencez immédiatement !</p>
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
                    <h2 className="text-lg font-semibold text-slate-800">4. {copy.mandatoryDocuments}</h2>
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
                        <p className="font-medium text-slate-800">{copy.nationalId} *</p>
                        <p className="text-xs text-gray-400">{copy.acceptedFormats}</p>
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
                          <PhotoIcon className="w-4 h-4" />
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
                          <p className="font-medium text-slate-800">{copy.managerId} *</p>
                          <p className="text-xs text-gray-400">{copy.acceptedFormats}</p>
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
                            <PhotoIcon className="w-4 h-4" />
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
                          <p className="font-medium text-slate-800">{copy.patent} *</p>
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
                            <PhotoIcon className="w-4 h-4" />
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
                          <p className="font-medium text-slate-800">{copy.rne} *</p>
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
                            <PhotoIcon className="w-4 h-4" />
                            Importer
                          </label>
                        )}
                      </div>
                    </div>

                    {!hasDocument('RNE') && (
                      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-800"><strong>{copy.rneWarningTitle} :</strong> {copy.rneWarning}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {fieldErrors.documents && <p className="text-xs text-red-500 mt-3">{fieldErrors.documents}</p>}
              </div>
            )}

            {/* Checkbox conditions générales */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptConditions}
                  onChange={(e) => {
                    setAcceptConditions(e.target.checked);
                    if (e.target.checked) setFieldErrors(prev => ({ ...prev, conditions: null }));
                  }}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-[#0b4ea2] focus:ring-[#0b4ea2] cursor-pointer"
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    J'accepte les{' '}
                    <a href="/conditions-invera" target="_blank" rel="noopener noreferrer" className="text-[#0b4ea2] underline font-medium">
                      conditions générales et politique de confidentialité d'InVera
                    </a>
                  </p>
                </div>
              </label>
              {fieldErrors.conditions && <p className="text-xs text-red-500 mt-2">{fieldErrors.conditions}</p>}
            </div>

            {/* BOUTON CRÉER UN COMPTE */}
            <button 
              type="submit"
              disabled={loading || !isValid()} 
              className="w-full mt-6 bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {copy.submitting}
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" /> 
                  {copy.submit}
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