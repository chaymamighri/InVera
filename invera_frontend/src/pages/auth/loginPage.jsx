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
    trialExpiredTitle: 'Periode d essai terminee',
    trialExpiredDescription:
      'Votre periode d essai gratuite est expiree. Veuillez souscrire un abonnement pour continuer a utiliser InVera ERP.',
    trialSoonTitle: 'Periode d essai bientot terminee',
    trialSoonDescription:
      'Il vous reste {{count}} connexion{{suffix}} avant la fin de votre periode d essai.',
    noAccount: 'Pas encore de compte ?',
    registerFree: "S'inscrire gratuitement",
    loginErrorFallback: 'Impossible de se connecter. Verifiez votre email et mot de passe.',
    trialExpiredError:
      'Votre periode d essai a expire. Veuillez souscrire un abonnement pour continuer a utiliser la plateforme.',
    footerCopyright: 'Tous droits reserves',
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
    trialExpiredTitle: 'Trial period ended',
    trialExpiredDescription:
      'Your free trial has expired. Please subscribe to continue using InVera ERP.',
    trialSoonTitle: 'Trial ending soon',
    trialSoonDescription: 'You have {{count}} login{{suffix}} remaining before your trial ends.',
    noAccount: 'No account yet?',
    registerFree: 'Register for free',
    loginErrorFallback: 'Unable to sign in. Check your email and password.',
    trialExpiredError:
      'Your trial period has expired. Please subscribe to continue using the platform.',
    footerCopyright: 'All rights reserved',
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
    trialExpiredTitle: 'انتهت فترة التجربة',
    trialExpiredDescription:
      'انتهت فترة التجربة المجانية. يرجى الاشتراك لمواصلة استخدام InVera ERP.',
    trialSoonTitle: 'التجربة ستنتهي قريبًا',
    trialSoonDescription: 'لديك {{count}} عملية دخول{{suffix}} متبقية قبل نهاية فترة التجربة.',
    noAccount: 'ليس لديك حساب بعد؟',
    registerFree: 'إنشاء حساب مجانًا',
    loginErrorFallback: 'تعذر تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.',
    trialExpiredError:
      'انتهت فترة التجربة. يرجى الاشتراك لمواصلة استخدام المنصة.',
    footerCopyright: 'جميع الحقوق محفوظة',
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

const LoginPage = () => {
  const { t, language, isArabic } = useLanguage();
  const text = useMemo(() => pageCopy[language] || pageCopy.fr, [language]);
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState(null);
  const [trialExpired, setTrialExpired] = useState(false);
  const [remainingLogins, setRemainingLogins] = useState(null);

  useEffect(() => {
    const message = sessionStorage.getItem('authError');
    if (message) {
      setLoginError(message);
      sessionStorage.removeItem('authError');
    }

    const expired = sessionStorage.getItem('essaiExpire');
    if (expired) {
      setTrialExpired(true);
      sessionStorage.removeItem('essaiExpire');
    }

    const remaining = sessionStorage.getItem('connexionsRestantes');
    if (remaining !== null) {
      setRemainingLogins(parseInt(remaining, 10));
      sessionStorage.removeItem('connexionsRestantes');
    }
  }, []);

  const handleSubmit = async (credentials) => {
    setLoginError(null);
    setTrialExpired(false);

    try {
      const result = await login(credentials);

      if (result?.success) {
        const userRole = localStorage.getItem('userRole');

        let dashboardPath = '/dashboard';
        if (userRole === 'SUPER_ADMIN') dashboardPath = '/super-admin/dashboard';
        else if (userRole === 'ADMIN' || userRole === 'ADMIN_CLIENT') dashboardPath = '/dashboard/admin';
        else if (userRole === 'COMMERCIAL') dashboardPath = '/dashboard/sales/dashboard';
        else if (userRole === 'RESPONSABLE_ACHAT') dashboardPath = '/dashboard/procurement';

        navigate(dashboardPath, { replace: true });
      }
    } catch (error) {
      const backendMessage = error?.response?.data?.message;
      const errorCode = error?.response?.data?.error;

      if (errorCode === 'ESSAI_EXPIRE' || backendMessage?.includes("periode d'essai")) {
        setTrialExpired(true);
        setLoginError(text.trialExpiredError);
      } else {
        setLoginError(backendMessage || error.message || text.loginErrorFallback);
      }
    }
  };

  const getSavedEmail = () => localStorage.getItem('savedEmail') || '';

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

          <div className="flex items-center">
            <div className="w-full rounded-2xl border border-white/60 bg-white/90 p-6 shadow-xl backdrop-blur-md transition-all md:p-8">
              <div className={`mb-6 ${isArabic ? 'text-right' : 'text-center sm:text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
                <div className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#0b4ea2]">
                  {text.accessBadge}
                </div>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-800">{text.welcomeTitle}</h2>
                <p className="mt-2 text-slate-500">{text.welcomeDescription}</p>
              </div>

              {trialExpired && !loading && (
                <div className="mb-5 rounded-xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm text-orange-800">
                  <div className={`flex items-start gap-3 ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                    <span className="mt-0.5 text-base">!</span>
                    <div>
                      <p className="font-semibold">{text.trialExpiredTitle}</p>
                      <p className="mt-1 leading-6">{text.trialExpiredDescription}</p>
                    </div>
                  </div>
                </div>
              )}

              {remainingLogins !== null && remainingLogins <= 5 && remainingLogins > 0 && !loading && (
                <div className="mb-5 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm text-yellow-800">
                  <div className={`flex items-start gap-3 ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                    <span className="mt-0.5 text-base">!</span>
                    <div>
                      <p className="font-semibold">{text.trialSoonTitle}</p>
                      <p className="mt-1 leading-6">
                        {text.trialSoonDescription
                          .replace('{{count}}', String(remainingLogins))
                          .replace('{{suffix}}', remainingLogins > 1 ? 's' : '')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-white p-1 md:p-2">
                <LoginForm onSubmit={handleSubmit} loading={loading} savedEmail={getSavedEmail()} />

                {loginError && !loading && !trialExpired && (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50/80 px-5 py-4 text-sm text-red-700 backdrop-blur-sm">
                    <div className={`flex items-start gap-3 ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                        <span className="text-xs font-bold">!</span>
                      </div>
                      <span className="leading-relaxed">{loginError}</span>
                    </div>
                  </div>
                )}
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
