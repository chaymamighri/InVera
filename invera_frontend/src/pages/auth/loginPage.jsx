import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoginForm from '../../components/LoginForm';
import PublicHeader from '../../components/PublicHeader';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';

const pageCopy = {
  fr: {
    featureBadge: 'Experience nouvelle generation',
    heroTitleStart: 'Connexion simple,',
    heroTitleAccent: 'sans friction',
    heroDescription:
      'Accedez a un environnement pense pour la performance : roles clairs, donnees centralisees, et decisions rapides.',
    signals: [
      {
        value: '01',
        label: 'Espace de gestion unifie',
        description: 'Centralisez l ensemble de vos operations dans un environnement unique et coherent.',
      },
      {
        value: '02',
        label: 'Acces metier structure',
        description: 'Des interfaces dediees pour les commerciaux, achats et administrateurs, avec les bons outils.',
      },
      {
        value: '03',
        label: 'Pilotage plus lisible',
        description: 'Tableaux de bord clairs et indicateurs pertinents pour des decisions eclairees.',
      },
    ],
    securityTitle: 'Securite et conformite',
    securityDescription: 'Connexion chiffree · RBAC integre',
    accessBadge: 'Acces securise',
    welcomeTitle: 'Bienvenue',
    welcomeDescription: 'Identifiez-vous pour acceder a votre espace de travail',
    noAccount: 'Pas encore de compte ?',
    registerFree: "S'inscrire gratuitement",
    loginErrorFallback: 'Impossible de se connecter. Verifiez votre email et mot de passe.',
    footerCopyright: 'Tous droits reserves',
    emailRequired: 'L\'email est requis',
    invalidEmail: 'Veuillez saisir un email valide (exemple@domaine.com)',
    passwordRequired: 'Le mot de passe est requis',
    invalidPassword: 'Le mot de passe doit contenir au moins 8 caractères',
    accountInactive: 'Votre compte est inactif. Veuillez contacter l\'administrateur.',
    paymentPending: 'Vos documents ont été validés. Veuillez finaliser votre paiement.',
    subscriptionExpired: 'Votre abonnement a expiré. Veuillez le renouveler.',
    accountRejected: 'Votre inscription a été refusée. Contactez le support.',
  },
  en: {
    featureBadge: 'Next-generation experience',
    heroTitleStart: 'Simple sign in,',
    heroTitleAccent: 'frictionless control',
    heroDescription:
      'Access a workspace built for performance: clear roles, centralized data, and faster decisions.',
    signals: [
      {
        value: '01',
        label: 'Unified management space',
        description: 'Centralize all your operations in a single consistent environment.',
      },
      {
        value: '02',
        label: 'Structured business access',
        description: 'Dedicated interfaces for sales, procurement, and administrators with the right tools.',
      },
      {
        value: '03',
        label: 'Clearer steering',
        description: 'Clear dashboards and useful indicators for informed decisions.',
      },
    ],
    securityTitle: 'Security and compliance',
    securityDescription: 'Encrypted sign in · Built-in RBAC',
    accessBadge: 'Secure access',
    welcomeTitle: 'Welcome',
    welcomeDescription: 'Sign in to access your workspace',
    noAccount: 'No account yet?',
    registerFree: 'Register for free',
    loginErrorFallback: 'Unable to sign in. Check your email and password.',
    footerCopyright: 'All rights reserved',
    emailRequired: 'Email is required',
    invalidEmail: 'Please enter a valid email (example@domain.com)',
    passwordRequired: 'Password is required',
    invalidPassword: 'Password must be at least 8 characters',
    accountInactive: 'Your account is inactive. Please contact the administrator.',
    paymentPending: 'Your documents have been validated. Please complete your payment.',
    subscriptionExpired: 'Your subscription has expired. Please renew it.',
    accountRejected: 'Your registration has been rejected. Contact support.',
  },
  ar: {
    featureBadge: 'تجربة من الجيل الجديد',
    heroTitleStart: 'دخول بسيط،',
    heroTitleAccent: 'تشغيل بلا تعقيد',
    heroDescription:
      'ادخل إلى بيئة مصممة للأداء: أدوار واضحة وبيانات مركزية وقرارات أسرع.',
    signals: [
      {
        value: '01',
        label: 'مساحة إدارة موحدة',
        description: 'قم بمركزة جميع عملياتك داخل بيئة واحدة متناسقة.',
      },
      {
        value: '02',
        label: 'وصول مهني منظم',
        description: 'واجهات مخصصة للتجاري والمشتريات والإدارة مع الأدوات المناسبة.',
      },
      {
        value: '03',
        label: 'قيادة أوضح',
        description: 'لوحات واضحة ومؤشرات مفيدة لاتخاذ قرارات دقيقة.',
      },
    ],
    securityTitle: 'الأمان والامتثال',
    securityDescription: 'دخول مشفر · صلاحيات مدمجة',
    accessBadge: 'وصول آمن',
    welcomeTitle: 'مرحبًا',
    welcomeDescription: 'سجل الدخول للوصول إلى مساحة العمل الخاصة بك',
    noAccount: 'ليس لديك حساب بعد؟',
    registerFree: 'إنشاء حساب مجانًا',
    loginErrorFallback: 'تعذر تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.',
    footerCopyright: 'جميع الحقوق محفوظة',
    emailRequired: 'البريد الإلكتروني مطلوب',
    invalidEmail: 'يرجى إدخال بريد إلكتروني صالح (example@domain.com)',
    passwordRequired: 'كلمة المرور مطلوبة',
    invalidPassword: 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل',
    accountInactive: 'حسابك غير نشط. يرجى الاتصال بالمسؤول.',
    paymentPending: 'تم التحقق من مستنداتك. يرجى إتمام الدفع.',
    subscriptionExpired: 'اشتراكك منتهي. يرجى تجديده.',
    accountRejected: 'تم رفض تسجيلك. اتصل بالدعم.',
  },
};

const signalIcons = [
  (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
];

const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 8;
};

const LoginPage = () => {
  const { t, language, isArabic } = useLanguage();
  const text = useMemo(() => pageCopy[language] || pageCopy.fr, [language]);
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [errorType, setErrorType] = useState(null);

  useEffect(() => {
    const message = sessionStorage.getItem('authError');
    const type = sessionStorage.getItem('authErrorType');
    if (message) {
      setLoginError(message);
      setErrorType(type);
      sessionStorage.removeItem('authError');
      sessionStorage.removeItem('authErrorType');
    }
  }, []);

  const validateForm = (email, password) => {
    const errors = {};
    
    if (!email) {
      errors.email = text.emailRequired;
    } else if (!validateEmail(email)) {
      errors.email = text.invalidEmail;
    }
    
    if (!password) {
      errors.password = text.passwordRequired;
    } else if (!validatePassword(password)) {
      errors.password = text.invalidPassword;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getErrorMessage = (errorCode, serverMessage) => {
    switch (errorCode) {
      case 'ACCOUNT_INACTIVE':
        return text.accountInactive;
      case 'PAYMENT_PENDING':
        return text.paymentPending;
      case 'SUBSCRIPTION_EXPIRED':
        return text.subscriptionExpired;
      case 'ACCOUNT_REJECTED':
        return text.accountRejected;
      default:
        return serverMessage || text.loginErrorFallback;
    }
  };

  const handleSubmit = async (credentials) => {
    if (!validateForm(credentials.email, credentials.password)) {
      const validationError = new Error('Validation failed');
      validationError.userMessage = 'Veuillez vérifier vos identifiants';
      throw validationError;
    }
    
    setLoginError(null);
    setErrorType(null);
    setValidationErrors({});

    try {
      const result = await login(credentials);

      if (result?.success) {
        const { data } = result;

        if (data) {
          if (data.connexionsRestantes !== undefined) localStorage.setItem('connexionsRestantes', data.connexionsRestantes);
          if (data.connexionsMax !== undefined) localStorage.setItem('connexionsMax', data.connexionsMax);
          if (data.typeInscription) localStorage.setItem('typeInscription', data.typeInscription);
          if (data.hasActiveSubscription !== undefined) localStorage.setItem('hasActiveSubscription', data.hasActiveSubscription);
          if (data.statut) localStorage.setItem('clientStatut', data.statut);
          if (data.clientId) localStorage.setItem('clientId', data.clientId);
          if (data.token) localStorage.setItem('token', data.token);
          sessionStorage.setItem('justLoggedIn', 'true');
        }

        const userRole = localStorage.getItem('userRole');
        let dashboardPath = '/dashboard';
        if (userRole === 'SUPER_ADMIN') dashboardPath = '/super-admin/dashboard';
        else if (userRole === 'ADMIN' || userRole === 'ADMIN_CLIENT') dashboardPath = '/dashboard/admin';
        else if (userRole === 'COMMERCIAL') dashboardPath = '/dashboard/sales/dashboard';
        else if (userRole === 'RESPONSABLE_ACHAT') dashboardPath = '/dashboard/procurement';

        navigate(dashboardPath, { replace: true });
        return;
      } else {
        throw new Error(result?.message || text.loginErrorFallback);
      }
    } catch (error) {
      console.error('🔴 LoginPage error:', error);
      
      let errorMessage = text.loginErrorFallback;
      let errorCode = null;
      
      if (error.userMessage) {
        errorMessage = error.userMessage;
      } else if (error.response?.data?.error) {
        errorCode = error.response.data.error;
        errorMessage = getErrorMessage(errorCode, error.response.data.message);
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message && error.message !== 'Validation failed') {
        errorMessage = error.message;
      }
      
      console.log('📢 LoginPage - Setting error message:', errorMessage, 'Type:', errorCode);
      
      setLoginError(errorMessage);
      setErrorType(errorCode);
      
      throw new Error(errorMessage);
    }
  };

  const getSavedEmail = () => localStorage.getItem('savedEmail') || '';

  const handleClearError = () => {
    setLoginError(null);
    setErrorType(null);
  };

  const renderErrorActions = () => {
    if (!loginError) return null;
    
    switch (errorType) {
      case 'PAYMENT_PENDING':
        return (
          <button 
            onClick={() => window.location.href = '/paiement'}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Finaliser mon paiement →
          </button>
        );
      case 'SUBSCRIPTION_EXPIRED':
        return (
          <button 
            onClick={() => window.location.href = '/abonnement'}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Renouveler mon abonnement →
          </button>
        );
      case 'ACCOUNT_INACTIVE':
        return (
          <button 
            onClick={() => window.location.href = '/contact'}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Contacter l'administrateur →
          </button>
        );
      case 'ACCOUNT_REJECTED':
        return (
          <button 
            onClick={() => window.location.href = '/support'}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Contacter le support →
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f0f4fa] via-[#f8fafc] to-[#eef2f8]">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-[#0b4ea2] opacity-[0.03] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-[#1d75d6] opacity-[0.02] blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-64 w-64 rounded-full bg-sky-200 opacity-20 blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8">
          <PublicHeader
            title={t('login.heroTitle')}
            backTo="/welcome"
            backLabel={t('common.backToWelcome')}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          {/* Section gauche - Marketing */}
          <div
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b2f6b] via-[#0b4ea2] to-[#1a5fc4] p-8 text-white shadow-2xl md:p-10 ${
              isArabic ? 'text-right' : ''
            }`}
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-32 left-12 h-80 w-80 rounded-full bg-sky-300/10 blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium tracking-wide backdrop-blur-sm">
                {text.featureBadge}
              </div>

              <h2 className="mt-8 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                {text.heroTitleStart}
                <br />
                <span className="text-sky-200">{text.heroTitleAccent}</span>
              </h2>

              <p className="mt-5 text-base leading-relaxed text-sky-50/90 md:text-lg">
                {text.heroDescription}
              </p>

              <div className="mt-10 grid gap-5">
                {text.signals.map((signal, index) => (
                  <div
                    key={signal.value}
                    className={`group flex rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:bg-white/10 ${
                      isArabic ? 'flex-row-reverse gap-5' : 'gap-5'
                    }`}
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 text-sky-100 shadow-sm">
                      {signalIcons[index]}
                    </div>
                    <div>
                      <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <span className="text-sm font-mono font-bold text-sky-200">{signal.value}</span>
                        <h3 className="text-lg font-semibold">{signal.label}</h3>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-sky-50/80">
                        {signal.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 rounded-xl border border-white/15 bg-[#08264f]/40 p-5 backdrop-blur-sm">
                <div className={`flex items-center gap-3 text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/20">
                    <svg className="h-4 w-4 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-white">{text.securityTitle}</p>
                    <p className="text-xs text-sky-100/70">{text.securityDescription}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section droite - Formulaire de connexion */}
          <div className="flex items-center">
            <div className="w-full rounded-2xl border border-white/60 bg-white/90 p-6 shadow-xl backdrop-blur-md transition-all md:p-8">
              <div className={`mb-6 ${isArabic ? 'text-right' : 'text-center sm:text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
                <div className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#0b4ea2]">
                  {text.accessBadge}
                </div>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-800">{text.welcomeTitle}</h2>
                <p className="mt-2 text-slate-500">{text.welcomeDescription}</p>
              </div>

              {/* Affichage des erreurs de validation UI */}
              {(validationErrors.email || validationErrors.password) && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <div className="space-y-1">
                    {validationErrors.email && <p className="flex items-center gap-2">• {validationErrors.email}</p>}
                    {validationErrors.password && <p className="flex items-center gap-2">• {validationErrors.password}</p>}
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-white p-1 md:p-2">
                {/* 🔴 ERREUR LOGIN AVEC ACTIONS */}
                {loginError && (
                  <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">{loginError}</p>
                        {renderErrorActions()}
                      </div>
                      <button 
                        onClick={handleClearError}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                <LoginForm 
                  onSubmit={handleSubmit} 
                  loading={loading} 
                  savedEmail={getSavedEmail()}
                  serverError={loginError}
                  onError={setLoginError}
                />
              </div>

              <div className={`mt-6 text-center ${isArabic ? 'text-right' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
                <p className="text-sm text-slate-500">
                  {text.noAccount}{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-[#0b4ea2] transition-all hover:text-[#0b3d82] hover:underline"
                  >
                    {text.registerFree}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={`mt-6 text-center text-xs text-slate-400 ${isArabic ? 'text-right' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
          <p>
            © {new Date().getFullYear()} InVera ERP - {text.footerCopyright}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;