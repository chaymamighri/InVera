<<<<<<< HEAD
import React, { useEffect, useMemo, useState } from 'react';
=======
/**
 * COMPOSANT LOGIN FORM - Formulaire d'authentification principal
 * 
 * @description
 * Formulaire complet gérant :
 * - La connexion utilisateur avec "Se souvenir de moi"
 * - La réinitialisation du mot de passe (3 étapes)
 * - L'affichage des erreurs et messages de succès
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5
import Button from './Button';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';

const copy = {
  fr: {
    emailRequired: 'Email requis',
    emailInvalid: "Format d'email invalide",
    passwordRequired: 'Mot de passe requis',
    passwordMinLogin: 'Minimum 6 caracteres',
    passwordMinReset: 'Minimum 8 caracteres',
    passwordUppercase: 'Au moins une majuscule',
    passwordDigit: 'Au moins un chiffre',
    passwordSpecial: 'Au moins un caractere special',
    loginIncorrect: 'Email ou mot de passe incorrect',
    passwordIncorrect: 'Mot de passe incorrect',
    accountNotFound: 'Aucun compte trouve avec cet email',
    emailUnknown: 'Email non reconnu',
    loginServerError: 'Impossible de se connecter au serveur. Verifiez votre connexion.',
    loginActionError: 'Une erreur est survenue lors de la connexion',
    resetSent: 'Un code de reinitialisation a ete envoye a {{email}}',
    resetSendError: "Impossible d'envoyer le code",
    codeRequired: 'Code requis',
    codeLength: 'Le code doit contenir 6 chiffres',
    codeVerified: 'Code verifie avec succes',
    passwordsMismatch: 'Les mots de passe ne correspondent pas',
    passwordResetSuccess: 'Mot de passe reinitialise avec succes. Redirection...',
    invalidCode: 'Code invalide ou expire',
    newCodeSent: 'Un nouveau code a ete envoye',
    resendFailed: 'Impossible de renvoyer le code',
    emailLabel: 'Adresse email',
    emailPlaceholder: 'vous@entreprise.com',
    passwordLabel: 'Mot de passe',
    forgotPassword: 'Mot de passe oublie ?',
    rememberMe: 'Se souvenir de moi',
    loggingIn: 'Connexion...',
    login: 'Se connecter',
    backToLogin: 'Retour a la connexion',
    forgotTitle: 'Reinitialisation du mot de passe',
    verifyCodeTitle: 'Verification du code',
    newPasswordTitle: 'Nouveau mot de passe',
    forgotDescription: 'Entrez votre email pour recevoir un code',
    verifyCodeDescription: 'Code envoye a {{email}}',
    newPasswordDescription: 'Choisissez un mot de passe securise',
    sendCode: 'Envoyer le code',
    sending: 'Envoi...',
    verificationCode: 'Code de verification',
    verifyCode: 'Verifier le code',
    verifying: 'Verification...',
    resendCode: 'Renvoyer le code',
    resendCountdown: 'Renvoyer ({{count}}s)',
    editEmail: "Modifier l'email",
    newPasswordLabel: 'Nouveau mot de passe',
    confirmPasswordLabel: 'Confirmer le mot de passe',
    resetting: 'Reinitialisation...',
    reset: 'Reinitialiser',
    loginTitle: 'Connectez-vous a votre compte',
    loginDescription: 'Entrez vos identifiants pour acceder a la plateforme',
    forgotFlowTitle: 'Reinitialisation',
    forgotFlowDescription: 'Suivez les etapes pour reinitialiser votre mot de passe',
    hiddenPassword: 'Masquer',
    visiblePassword: 'Afficher',
  },
  en: {
    emailRequired: 'Email is required',
    emailInvalid: 'Invalid email format',
    passwordRequired: 'Password is required',
    passwordMinLogin: 'Minimum 6 characters',
    passwordMinReset: 'Minimum 8 characters',
    passwordUppercase: 'At least one uppercase letter',
    passwordDigit: 'At least one number',
    passwordSpecial: 'At least one special character',
    loginIncorrect: 'Incorrect email or password',
    passwordIncorrect: 'Incorrect password',
    accountNotFound: 'No account found with this email',
    emailUnknown: 'Unknown email',
    loginServerError: 'Unable to connect to the server. Check your connection.',
    loginActionError: 'An error occurred during sign in',
    resetSent: 'A reset code was sent to {{email}}',
    resetSendError: 'Unable to send the code',
    codeRequired: 'Code is required',
    codeLength: 'The code must contain 6 digits',
    codeVerified: 'Code verified successfully',
    passwordsMismatch: 'Passwords do not match',
    passwordResetSuccess: 'Password reset successfully. Redirecting...',
    invalidCode: 'Invalid or expired code',
    newCodeSent: 'A new code has been sent',
    resendFailed: 'Unable to resend the code',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@company.com',
    passwordLabel: 'Password',
    forgotPassword: 'Forgot password?',
    rememberMe: 'Remember me',
    loggingIn: 'Signing in...',
    login: 'Sign in',
    backToLogin: 'Back to login',
    forgotTitle: 'Password reset',
    verifyCodeTitle: 'Code verification',
    newPasswordTitle: 'New password',
    forgotDescription: 'Enter your email to receive a code',
    verifyCodeDescription: 'Code sent to {{email}}',
    newPasswordDescription: 'Choose a secure password',
    sendCode: 'Send code',
    sending: 'Sending...',
    verificationCode: 'Verification code',
    verifyCode: 'Verify code',
    verifying: 'Verifying...',
    resendCode: 'Resend code',
    resendCountdown: 'Resend ({{count}}s)',
    editEmail: 'Edit email',
    newPasswordLabel: 'New password',
    confirmPasswordLabel: 'Confirm password',
    resetting: 'Resetting...',
    reset: 'Reset',
    loginTitle: 'Sign in to your account',
    loginDescription: 'Enter your credentials to access the platform',
    forgotFlowTitle: 'Reset',
    forgotFlowDescription: 'Follow the steps to reset your password',
    hiddenPassword: 'Hide',
    visiblePassword: 'Show',
  },
  ar: {
    emailRequired: 'البريد الإلكتروني مطلوب',
    emailInvalid: 'صيغة البريد الإلكتروني غير صحيحة',
    passwordRequired: 'كلمة المرور مطلوبة',
    passwordMinLogin: 'الحد الأدنى 6 أحرف',
    passwordMinReset: 'الحد الأدنى 8 أحرف',
    passwordUppercase: 'أضف حرفًا كبيرًا واحدًا على الأقل',
    passwordDigit: 'أضف رقمًا واحدًا على الأقل',
    passwordSpecial: 'أضف رمزًا خاصًا واحدًا على الأقل',
    loginIncorrect: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    passwordIncorrect: 'كلمة المرور غير صحيحة',
    accountNotFound: 'لم يتم العثور على حساب بهذا البريد',
    emailUnknown: 'البريد الإلكتروني غير معروف',
    loginServerError: 'تعذر الاتصال بالخادم. تحقق من اتصالك.',
    loginActionError: 'حدث خطأ أثناء تسجيل الدخول',
    resetSent: 'تم إرسال رمز إعادة التعيين إلى {{email}}',
    resetSendError: 'تعذر إرسال الرمز',
    codeRequired: 'الرمز مطلوب',
    codeLength: 'يجب أن يتكون الرمز من 6 أرقام',
    codeVerified: 'تم التحقق من الرمز بنجاح',
    passwordsMismatch: 'كلمتا المرور غير متطابقتين',
    passwordResetSuccess: 'تمت إعادة تعيين كلمة المرور بنجاح. جارٍ التحويل...',
    invalidCode: 'الرمز غير صالح أو منتهي الصلاحية',
    newCodeSent: 'تم إرسال رمز جديد',
    resendFailed: 'تعذر إعادة إرسال الرمز',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'you@company.com',
    passwordLabel: 'كلمة المرور',
    forgotPassword: 'هل نسيت كلمة المرور؟',
    rememberMe: 'تذكرني',
    loggingIn: 'جارٍ تسجيل الدخول...',
    login: 'تسجيل الدخول',
    backToLogin: 'العودة إلى تسجيل الدخول',
    forgotTitle: 'إعادة تعيين كلمة المرور',
    verifyCodeTitle: 'التحقق من الرمز',
    newPasswordTitle: 'كلمة المرور الجديدة',
    forgotDescription: 'أدخل بريدك الإلكتروني لتلقي الرمز',
    verifyCodeDescription: 'تم إرسال الرمز إلى {{email}}',
    newPasswordDescription: 'اختر كلمة مرور آمنة',
    sendCode: 'إرسال الرمز',
    sending: 'جارٍ الإرسال...',
    verificationCode: 'رمز التحقق',
    verifyCode: 'تحقق من الرمز',
    verifying: 'جارٍ التحقق...',
    resendCode: 'إعادة إرسال الرمز',
    resendCountdown: 'إعادة الإرسال ({{count}}ث)',
    editEmail: 'تعديل البريد الإلكتروني',
    newPasswordLabel: 'كلمة المرور الجديدة',
    confirmPasswordLabel: 'تأكيد كلمة المرور',
    resetting: 'جارٍ إعادة التعيين...',
    reset: 'إعادة التعيين',
    loginTitle: 'سجل الدخول إلى حسابك',
    loginDescription: 'أدخل بياناتك للوصول إلى المنصة',
    forgotFlowTitle: 'إعادة التعيين',
    forgotFlowDescription: 'اتبع الخطوات لإعادة تعيين كلمة المرور',
    hiddenPassword: 'إخفاء',
    visiblePassword: 'إظهار',
  },
};

const PasswordVisibilityButton = ({ visible, onClick, isArabic, text }) => (
  <button
    type="button"
    onClick={onClick}
    className={`absolute inset-y-0 flex items-center px-3 text-sm text-gray-500 ${
      isArabic ? 'left-0' : 'right-0'
    }`}
  >
    {visible ? text.hiddenPassword : text.visiblePassword}
  </button>
);

const FieldIcon = ({ children, isArabic }) => (
  <div
    className={`absolute inset-y-0 flex items-center pointer-events-none ${
      isArabic ? 'right-0 pr-3' : 'left-0 pl-3'
    }`}
  >
    {children}
  </div>
);

const LoginForm = ({ onSubmit, loading: externalLoading = false, savedEmail }) => {
<<<<<<< HEAD
  const { language, isArabic } = useLanguage();
  const text = useMemo(() => copy[language] || copy.fr, [language]);
  const { forgotPassword, resetPassword, loading: authLoading } = useAuth();

=======
  const navigate = useNavigate();
  const { forgotPassword, resetPassword, loading: authLoading } = useAuth(); 
  
  // ===== ÉTATS =====
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
    email: savedEmail || '',
    password: '',
    rememberMe: false,
    resetCode: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [step, setStep] = useState(1);
  const [internalLoading, setInternalLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState({
    password: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [countdown, setCountdown] = useState(0);

<<<<<<< HEAD
=======
  // ===== EFFETS =====
  
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5
  useEffect(() => {
    const rememberMe = localStorage.getItem('rememberMe');
    const localSavedEmail = localStorage.getItem('savedEmail');
    const expiry = localStorage.getItem('tokenExpiry');
<<<<<<< HEAD

=======
    
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5
    if (expiry && new Date(expiry) < new Date()) {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('savedEmail');
      localStorage.removeItem('tokenExpiry');
      return;
    }
<<<<<<< HEAD

    if (rememberMe === 'true' && localSavedEmail) {
      setFormData((previous) => ({
        ...previous,
        email: localSavedEmail,
        rememberMe: true,
=======
    
    if (rememberMe === 'true' && savedEmail) {
      setFormData(prev => ({
        ...prev,
        email: savedEmail,
        rememberMe: true
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5
      }));
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const isLoading = externalLoading || internalLoading || authLoading;

<<<<<<< HEAD
=======
  // ===== VALIDATIONS =====
  
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email?.trim()) return text.emailRequired;
    if (!emailRegex.test(email)) return text.emailInvalid;
    return '';
  };

  const validatePassword = (password) => {
    if (!password?.trim()) return text.passwordRequired;
    if (password.length < 6) return text.passwordMinLogin;
    return '';
  };

  const validateNewPassword = (password) => {
    if (!password?.trim()) return text.passwordRequired;
    if (password.length < 8) return text.passwordMinReset;
    if (!/(?=.*[A-Z])/.test(password)) return text.passwordUppercase;
    if (!/(?=.*\d)/.test(password)) return text.passwordDigit;
    if (!/(?=.*[!@#$%^&*])/.test(password)) return text.passwordSpecial;
    return '';
  };

<<<<<<< HEAD
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) setErrors((previous) => ({ ...previous, [name]: '' }));
=======
  // ===== GESTIONNAIRES DE FORMULAIRE =====
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5
    if (message.text) setMessage({ type: '', text: '' });
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

<<<<<<< HEAD
  const resetForgotFlow = () => {
    setMode('login');
    setStep(1);
    setErrors({});
    setMessage({ type: '', text: '' });
    setFormData((previous) => ({
      ...previous,
      resetCode: '',
      newPassword: '',
      confirmPassword: '',
    }));
  };
=======
  // ===== CONNEXION =====
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    const newErrors = {};
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;
    
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});

    const nextErrors = {};
    const emailError = validateEmail(formData.email);
    if (emailError) nextErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) nextErrors.password = passwordError;

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setInternalLoading(true);

    try {
      const response = await onSubmit(formData);
      const data = response?.data || response;
      
      // Stocker les informations dans localStorage
      if (data) {
        if (data.connexionsRestantes !== undefined) localStorage.setItem('connexionsRestantes', data.connexionsRestantes);
        if (data.connexionsMax !== undefined) localStorage.setItem('connexionsMax', data.connexionsMax);
        if (data.typeInscription) localStorage.setItem('typeInscription', data.typeInscription);
        if (data.hasActiveSubscription !== undefined) localStorage.setItem('hasActiveSubscription', data.hasActiveSubscription);
        if (data.statut) localStorage.setItem('clientStatut', data.statut);
        if (data.clientId) localStorage.setItem('clientId', data.clientId);
        if (data.motifRefus) localStorage.setItem('motifRefus', data.motifRefus);
      }
      
      // ⭐ STOCKER UN FLAG POUR AFFICHER LE TOAST DANS LE DASHBOARD
      sessionStorage.setItem('justLoggedIn', 'true');
      
      // Redirection après un court délai
      setTimeout(() => {
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'SUPER_ADMIN') {
          navigate('/super-admin/dashboard/clients');
        } else if (userRole === 'ADMIN_CLIENT') {
          navigate('/dashboard/admin');
        } else if (userRole === 'COMMERCIAL') {
          navigate('/dashboard/sales/dashboard');
        } else if (userRole === 'RESPONSABLE_ACHAT') {
          navigate('/dashboard/procurement');
        } else {
          navigate('/dashboard');
        }
      }, 300);
      
    } catch (error) {
<<<<<<< HEAD
      if (error.message) {
        if (error.message.includes('Email ou mot de passe incorrect') || error.message.includes('401')) {
          setErrors({ submit: text.loginIncorrect, password: text.passwordIncorrect });
        } else if (
          error.message.includes('non trouvé') ||
          error.message.includes('not found') ||
          error.message.includes('404')
        ) {
          setErrors({ submit: text.accountNotFound, email: text.emailUnknown });
=======
      console.error('Login error:', error);
      
      if (error.message) {
        if (error.message.includes('Email ou mot de passe incorrect') || 
            error.message.includes('401')) {
          setErrors({ 
            submit: 'Email ou mot de passe incorrect',
            password: 'Mot de passe incorrect'
          });
        } else if (error.message.includes('non trouvé') || 
                   error.message.includes('not found') || 
                   error.message.includes('404')) {
          setErrors({ 
            submit: 'Aucun compte trouvé avec cet email',
            email: 'Email non reconnu'
          });
        } else if (error.message.includes('Période d\'essai expirée') || 
                   error.message.includes('ESSAI_EXPIRE')) {
          toast.error(
            <div className="flex flex-col gap-2">
              <span className="font-semibold">❌ Période d'essai expirée</span>
              <p className="text-sm">Veuillez souscrire un abonnement pour continuer.</p>
              <button
                onClick={() => window.location.href = '/subscriptions'}
                className="mt-2 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
              >
                Souscrire un abonnement
              </button>
            </div>,
            { duration: 8000 }
          );
        } else if (error.message.includes('refusé') || error.message.includes('REFUSE')) {
          toast.error(
            <div className="flex flex-col gap-2">
              <span className="font-semibold">⛔ Compte refusé</span>
              <p className="text-sm">Votre dossier a été refusé. Contactez le support.</p>
            </div>,
            { duration: 5000 }
          );
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5
        } else {
          setErrors({ submit: error.message || text.loginActionError });
        }
      } else {
        setErrors({ submit: text.loginServerError });
      }
    } finally {
      setInternalLoading(false);
    }
  };

<<<<<<< HEAD
  const handleForgotPassword = async (event) => {
    event.preventDefault();
=======
  // ===== RÉINITIALISATION MOT DE PASSE =====
  
  const handleForgotPassword = async (e) => {
    e.preventDefault();
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5
    setErrors({});

    const emailError = validateEmail(formData.email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setInternalLoading(true);
    try {
      await forgotPassword(formData.email);
      setMessage({
        type: 'success',
        text: text.resetSent.replace('{{email}}', formData.email),
      });
      setStep(2);
      setCountdown(60);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || text.resetSendError,
      });
    } finally {
      setInternalLoading(false);
    }
  };

<<<<<<< HEAD
  const handleVerifyCode = async (event) => {
    event.preventDefault();
=======
  const handleVerifyCode = async (e) => {
    e.preventDefault();
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5
    setErrors({});

    if (!formData.resetCode?.trim()) {
      setErrors({ resetCode: text.codeRequired });
      return;
    }
    if (formData.resetCode.length !== 6) {
      setErrors({ resetCode: text.codeLength });
      return;
    }

    setStep(3);
    setMessage({ type: 'success', text: text.codeVerified });
  };

<<<<<<< HEAD
  const handleResetPassword = async (event) => {
    event.preventDefault();
=======
  const handleResetPassword = async (e) => {
    e.preventDefault();
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5
    setErrors({});

    const passwordError = validateNewPassword(formData.newPassword);
    if (passwordError) {
      setErrors({ newPassword: passwordError });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: text.passwordsMismatch });
      return;
    }

    setInternalLoading(true);
    try {
<<<<<<< HEAD
      await resetPassword(formData.resetCode, formData.email, formData.newPassword);
      setMessage({ type: 'success', text: text.passwordResetSuccess });
=======
      await resetPassword(
        formData.resetCode,
        formData.email,
        formData.newPassword
      );
      
      setMessage({
        type: 'success',
        text: 'Mot de passe réinitialisé avec succès ! Redirection...'
      });
      
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5
      setTimeout(() => {
        resetForgotFlow();
      }, 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || text.invalidCode,
      });
    } finally {
      setInternalLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    setInternalLoading(true);
    try {
      await forgotPassword(formData.email);
      setCountdown(60);
      setMessage({ type: 'success', text: text.newCodeSent });
    } catch {
      setMessage({ type: 'error', text: text.resendFailed });
    } finally {
      setInternalLoading(false);
    }
  };

<<<<<<< HEAD
  const renderInputBaseClasses = (hasError, withToggle = false) =>
    `block w-full py-3 border ${hasError ? 'border-red-300' : 'border-gray-300'} rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
      isArabic
        ? withToggle
          ? 'pr-10 pl-12 text-right'
          : 'pr-10 pl-3 text-right'
        : withToggle
        ? 'pl-10 pr-12'
        : 'pl-10 pr-3'
    }`;

  const renderStepIndicator = () => (
    <div className="mb-6 flex items-center justify-center">
      {[1, 2, 3].map((stepNumber) => (
        <React.Fragment key={stepNumber}>
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                step === stepNumber
                  ? 'bg-blue-600 text-white'
                  : step > stepNumber
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {stepNumber}
            </div>
          </div>
          {stepNumber < 3 && (
            <div className={`mx-1 h-0.5 w-8 ${step > stepNumber ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

=======
  // ===== RENDU DES FORMULAIRES =====
  
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5
  const renderLoginForm = () => (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
          {text.emailLabel}
        </label>
        <div className="relative">
          <FieldIcon isArabic={isArabic}>
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </FieldIcon>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            className={renderInputBaseClasses(Boolean(errors.email))}
            placeholder={text.emailPlaceholder}
            disabled={isLoading}
          />
        </div>
        {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
      </div>

      <div>
        <div className={`mb-2 flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            {text.passwordLabel}
          </label>
          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setStep(1);
              setErrors({});
              setMessage({ type: '', text: '' });
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            {text.forgotPassword}
          </button>
        </div>
        <div className="relative">
          <FieldIcon isArabic={isArabic}>
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </FieldIcon>
          <input
            id="password"
            name="password"
            type={showPassword.password ? 'text' : 'password'}
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            className={renderInputBaseClasses(Boolean(errors.password), true)}
            placeholder="••••••••"
            disabled={isLoading}
          />
          <PasswordVisibilityButton
            visible={showPassword.password}
            onClick={() => togglePasswordVisibility('password')}
            isArabic={isArabic}
            text={text}
          />
        </div>
        {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
      </div>

<<<<<<< HEAD
      <div className={`flex items-center ${isArabic ? 'flex-row-reverse justify-end' : ''}`}>
=======
      <div className="flex items-center">
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5
        <input
          id="remember-me"
          name="rememberMe"
          type="checkbox"
          checked={formData.rememberMe}
          onChange={handleChange}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          disabled={isLoading}
        />
        <label htmlFor="remember-me" className={`${isArabic ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>
          {text.rememberMe}
        </label>
      </div>

      <Button
        type="submit"
        loading={isLoading}
        fullWidth
        size="lg"
        className="bg-gradient-to-r from-blue-800 to-blue-600 text-white font-medium shadow-lg transition-all duration-200 hover:from-blue-900 hover:to-blue-900 hover:shadow-xl hover:scale-[1.02]"
      >
        {isLoading ? text.loggingIn : text.login}
      </Button>

      {errors.submit && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className={`flex items-center ${isArabic ? 'flex-row-reverse' : ''}`}>
            <svg className={`${isArabic ? 'ml-2' : 'mr-2'} h-5 w-5`} fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {errors.submit}
          </div>
        </div>
      )}
    </form>
  );

<<<<<<< HEAD
  const renderForgotForm = () => (
    <div className="space-y-5">
      <button
        type="button"
        onClick={resetForgotFlow}
        className={`flex items-center text-sm font-medium text-blue-600 transition-all duration-200 hover:text-blue-700 ${isArabic ? 'flex-row-reverse' : ''}`}
      >
        <svg
          className={`${isArabic ? 'ml-1 rotate-180' : 'mr-1'} h-4 w-4 text-blue-600 transition-colors group-hover:text-blue-700`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
=======
  const renderForgotForm = () => {
    const renderStepIndicator = () => (
      <div className="flex items-center justify-center mb-6">
        {[1, 2, 3].map((stepNumber) => (
          <React.Fragment key={stepNumber}>
            <div className="flex flex-col items-center">
              <div className={`
                h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold
                ${step === stepNumber ? 'bg-blue-600 text-white' : 
                  step > stepNumber ? 'bg-green-500 text-white' : 
                  'bg-gray-200 text-gray-500'}
              `}>
                {stepNumber}
              </div>
            </div>
            {stepNumber < 3 && (
              <div className={`h-0.5 w-8 mx-1 ${step > stepNumber ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );

    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setStep(1);
            setErrors({});
            setMessage({ type: '', text: '' });
          }}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium transition-all duration-200 group"
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>{text.backToLogin}</span>
      </button>

<<<<<<< HEAD
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {step === 1 && text.forgotTitle}
          {step === 2 && text.verifyCodeTitle}
          {step === 3 && text.newPasswordTitle}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {step === 1 && text.forgotDescription}
          {step === 2 && text.verifyCodeDescription.replace('{{email}}', formData.email)}
          {step === 3 && text.newPasswordDescription}
        </p>
=======
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {step === 1 && 'Réinitialisation du mot de passe'}
            {step === 2 && 'Vérification du code'}
            {step === 3 && 'Nouveau mot de passe'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1 && 'Entrez votre email pour recevoir un code'}
            {step === 2 && `Code envoyé à ${formData.email}`}
            {step === 3 && 'Choisissez un mot de passe sécurisé'}
          </p>
        </div>

        {renderStepIndicator()}

        {message.text && (
          <div className={`p-3 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <div className="flex items-center text-sm">
              <svg className={`h-4 w-4 mr-2 flex-shrink-0 ${
                message.type === 'success' ? 'text-green-500' : 'text-red-500'
              }`} fill="currentColor" viewBox="0 0 20 20">
                {message.type === 'success' ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
              </svg>
              {message.text}
            </div>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleForgotPassword}>
            <div className="mb-4">
              <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2.5 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="vous@entreprise.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              size="md"
              className="bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl text-white font-medium"
            >
              {isLoading ? 'Envoi...' : 'Envoyer le code'}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode}>
            <div className="mb-4">
              <label htmlFor="resetCode" className="block text-sm font-medium text-gray-700 mb-2">
                Code de vérification
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="resetCode"
                  name="resetCode"
                  type="text"
                  maxLength="6"
                  value={formData.resetCode}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2.5 border ${
                    errors.resetCode ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="123456"
                  disabled={isLoading}
                />
              </div>
              {errors.resetCode && <p className="mt-1 text-xs text-red-600">{errors.resetCode}</p>}
            </div>

            <div className="flex justify-between items-center mb-4">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={countdown > 0 || isLoading}
                className={`text-xs font-medium ${
                  countdown > 0 ? 'text-gray-400' : 'text-blue-600 hover:text-blue-500'
                }`}
              >
                {countdown > 0 ? `Renvoyer (${countdown}s)` : 'Renvoyer le code'}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Modifier l'email
              </button>
            </div>
            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              size="md"
              className="bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl text-white font-medium"
            >
              {isLoading ? 'Vérification...' : 'Vérifier le code'}
            </Button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword.newPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-12 py-2.5 border ${
                    errors.newPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('newPassword')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword.newPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword.confirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-12 py-2.5 border ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword.confirmPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
            </div>
            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              size="md"
              className="bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl text-white font-medium"
            >
              {isLoading ? 'Réinitialisation...' : 'Réinitialiser'}
            </Button>
          </form>
        )}
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5
      </div>

      {renderStepIndicator()}

      {message.text && (
        <div
          className={`rounded-lg p-3 ${
            message.type === 'success'
              ? 'border border-green-200 bg-green-50 text-green-700'
              : 'border border-red-200 bg-red-50 text-red-700'
          }`}
        >
          <div className={`flex items-center text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
            <svg
              className={`${isArabic ? 'ml-2' : 'mr-2'} h-4 w-4 flex-shrink-0 ${
                message.type === 'success' ? 'text-green-500' : 'text-red-500'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {message.type === 'success' ? (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              )}
            </svg>
            {message.text}
          </div>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleForgotPassword}>
          <div className="mb-4">
            <label htmlFor="forgot-email" className="mb-2 block text-sm font-medium text-gray-700">
              {text.emailLabel}
            </label>
            <div className="relative">
              <FieldIcon isArabic={isArabic}>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </FieldIcon>
              <input
                id="forgot-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={renderInputBaseClasses(Boolean(errors.email))}
                placeholder={text.emailPlaceholder}
                disabled={isLoading}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>
          <Button
            type="submit"
            loading={isLoading}
            fullWidth
            size="md"
            className="bg-gradient-to-r from-blue-800 to-blue-600 text-white font-medium shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-[1.02]"
          >
            {isLoading ? text.sending : text.sendCode}
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyCode}>
          <div className="mb-4">
            <label htmlFor="resetCode" className="mb-2 block text-sm font-medium text-gray-700">
              {text.verificationCode}
            </label>
            <div className="relative">
              <FieldIcon isArabic={isArabic}>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </FieldIcon>
              <input
                id="resetCode"
                name="resetCode"
                type="text"
                maxLength="6"
                value={formData.resetCode}
                onChange={handleChange}
                className={renderInputBaseClasses(Boolean(errors.resetCode))}
                placeholder="123456"
                disabled={isLoading}
              />
            </div>
            {errors.resetCode && <p className="mt-1 text-xs text-red-600">{errors.resetCode}</p>}
          </div>

          <div className={`mb-4 flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={countdown > 0 || isLoading}
              className={`text-xs font-medium ${
                countdown > 0 ? 'text-gray-400' : 'text-blue-600 hover:text-blue-500'
              }`}
            >
              {countdown > 0
                ? text.resendCountdown.replace('{{count}}', String(countdown))
                : text.resendCode}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {text.editEmail}
            </button>
          </div>
          <Button
            type="submit"
            loading={isLoading}
            fullWidth
            size="md"
            className="bg-gradient-to-r from-blue-800 to-blue-600 text-white font-medium shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-[1.02]"
          >
            {isLoading ? text.verifying : text.verifyCode}
          </Button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword}>
          <div className="mb-4">
            <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-gray-700">
              {text.newPasswordLabel}
            </label>
            <div className="relative">
              <FieldIcon isArabic={isArabic}>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </FieldIcon>
              <input
                id="newPassword"
                name="newPassword"
                type={showPassword.newPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleChange}
                className={renderInputBaseClasses(Boolean(errors.newPassword), true)}
                placeholder="••••••••"
                disabled={isLoading}
              />
              <PasswordVisibilityButton
                visible={showPassword.newPassword}
                onClick={() => togglePasswordVisibility('newPassword')}
                isArabic={isArabic}
                text={text}
              />
            </div>
            {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
              {text.confirmPasswordLabel}
            </label>
            <div className="relative">
              <FieldIcon isArabic={isArabic}>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </FieldIcon>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword.confirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                className={renderInputBaseClasses(Boolean(errors.confirmPassword), true)}
                placeholder="••••••••"
                disabled={isLoading}
              />
              <PasswordVisibilityButton
                visible={showPassword.confirmPassword}
                onClick={() => togglePasswordVisibility('confirmPassword')}
                isArabic={isArabic}
                text={text}
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
          <Button
            type="submit"
            loading={isLoading}
            fullWidth
            size="md"
            className="bg-gradient-to-r from-blue-800 to-blue-600 text-white font-medium shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-[1.02]"
          >
            {isLoading ? text.resetting : text.reset}
          </Button>
        </form>
      )}
    </div>
  );

  return (
    <div className={`w-full max-w-lg space-y-6 ${isArabic ? 'text-right' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {mode === 'login' ? text.loginTitle : text.forgotFlowTitle}
        </h2>
        <p className="mt-2 text-gray-600">
          {mode === 'login' ? text.loginDescription : text.forgotFlowDescription}
        </p>
      </div>

      {mode === 'login' ? renderLoginForm() : renderForgotForm()}
    </div>
  );
};

export default LoginForm;