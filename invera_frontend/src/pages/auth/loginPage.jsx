import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoginForm from '../../components/LoginForm';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/images/logo.png';

const signals = [
  {
    value: '01',
    label: 'Espace de gestion unifie',
    description:
      'Centralisez l ensemble de vos operations dans un environnement unique et coherent.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  },
  {
    value: '02',
    label: 'Acces metier structure',
    description:
      'Des interfaces dediees pour les commerciaux, achats et administrateurs, avec les bons outils.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    value: '03',
    label: 'Pilotage plus lisible',
    description:
      'Tableaux de bord clairs et indicateurs pertinents pour des decisions eclairees.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState(null);
  const [essaiExpire, setEssaiExpire] = useState(false);
  const [connexionsRestantes, setConnexionsRestantes] = useState(null);

  useEffect(() => {
    const msg = sessionStorage.getItem('authError');
    if (msg) {
      setLoginError(msg);
      sessionStorage.removeItem('authError');
    }

    const essaiMessage = sessionStorage.getItem('essaiExpire');
    if (essaiMessage) {
      setEssaiExpire(true);
      sessionStorage.removeItem('essaiExpire');
    }

    const connexionsRest = sessionStorage.getItem('connexionsRestantes');
    if (connexionsRest !== null) {
      setConnexionsRestantes(parseInt(connexionsRest, 10));
      sessionStorage.removeItem('connexionsRestantes');
    }
  }, []);

  const handleSubmit = async (credentials) => {
    setLoginError(null);
    setEssaiExpire(false);

    try {
      const result = await login(credentials);

      if (result?.success) {
        const userRole = localStorage.getItem('userRole');

        let dashboardPath = '/dashboard';
        if (userRole === 'SUPER_ADMIN') dashboardPath = '/super-admin/dashboard';
        else if (userRole === 'ADMIN') dashboardPath = '/dashboard/admin';
        else if (userRole === 'COMMERCIAL') dashboardPath = '/dashboard/sales/dashboard';
        else if (userRole === 'RESPONSABLE_ACHAT') dashboardPath = '/dashboard/procurement';

        navigate(dashboardPath, { replace: true });
      }
    } catch (err) {
      const backendMessage = err?.response?.data?.message;
      const errorCode = err?.response?.data?.error;

      if (errorCode === 'ESSAI_EXPIRE' || backendMessage?.includes("periode d'essai")) {
        setEssaiExpire(true);
        setLoginError(
          "Votre periode d essai a expire. Veuillez souscrire un abonnement pour continuer a utiliser la plateforme."
        );
      } else {
        setLoginError(
          backendMessage ||
            err.message ||
            'Impossible de se connecter. Verifiez votre email et mot de passe.'
        );
      }
    }
  };

  const getSavedEmail = () => localStorage.getItem('savedEmail') || '';

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f0f4fa] via-[#f8fafc] to-[#eef2f8]">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 h-[500px] w-[500px] rounded-full bg-[#0b4ea2] opacity-[0.03] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-[#1d75d6] opacity-[0.02] blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-sky-200 opacity-20 blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="mb-8 flex flex-col items-start justify-between gap-4 rounded-2xl bg-white/70 px-6 py-4 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#0b2f6b] shadow-md transition-all hover:shadow-lg">
              <img src={logo} alt="InVera" className="max-h-11 max-w-full object-contain" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0b4ea2]">
                InVera ERP
              </span>
              <h1 className="text-xl font-semibold tracking-tight text-slate-800">
                Plateforme de gestion integree
              </h1>
            </div>
          </div>

          <Link
            to="/welcome"
            className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-sky-300 hover:bg-white hover:text-sky-700 hover:shadow"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour a l'accueil
          </Link>
        </header>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b2f6b] via-[#0b4ea2] to-[#1a5fc4] p-8 text-white shadow-2xl md:p-10">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-32 left-12 h-80 w-80 rounded-full bg-sky-300/10 blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium tracking-wide backdrop-blur-sm">
                Experience nouvelle generation
              </div>

              <h2 className="mt-8 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                Connexion simple,
                <br />
                pilotage <span className="text-sky-200">sans friction</span>
              </h2>

              <p className="mt-5 text-base leading-relaxed text-sky-50/90 md:text-lg">
                Accedez a un environnement pense pour la performance : roles clairs, donnees
                centralisees, et decisions rapides.
              </p>

              <div className="mt-10 grid gap-5">
                {signals.map((signal) => (
                  <div
                    key={signal.value}
                    className="group flex gap-5 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:bg-white/10"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 text-sky-100 shadow-sm">
                      {signal.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold text-sky-200">
                          {signal.value}
                        </span>
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
                <div className="flex items-center gap-3 text-sm">
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
                    <p className="font-medium text-white">Securite et conformite</p>
                    <p className="text-xs text-sky-100/70">Connexion chiffree · RBAC integre</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-full rounded-2xl border border-white/60 bg-white/90 p-6 shadow-xl backdrop-blur-md transition-all md:p-8">
              <div className="mb-6 text-center sm:text-left">
                <div className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#0b4ea2]">
                  Acces securise
                </div>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-800">
                  Bienvenue
                </h2>
                <p className="mt-2 text-slate-500">
                  Identifiez-vous pour acceder a votre espace de travail
                </p>
              </div>

              {essaiExpire && !loading && (
                <div className="mb-5 rounded-xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm text-orange-800">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-base">!</span>
                    <div>
                      <p className="font-semibold">Periode d essai terminee</p>
                      <p className="mt-1 leading-6">
                        Votre periode d essai gratuite est expiree. Veuillez souscrire un abonnement
                        pour continuer a utiliser InVera ERP.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {connexionsRestantes !== null && connexionsRestantes <= 5 && connexionsRestantes > 0 && !loading && (
                <div className="mb-5 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm text-yellow-800">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-base">!</span>
                    <div>
                      <p className="font-semibold">Periode d essai bientot terminee</p>
                      <p className="mt-1 leading-6">
                        Il vous reste {connexionsRestantes} connexion{connexionsRestantes > 1 ? 's' : ''}{' '}
                        avant la fin de votre periode d essai.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-white p-1 md:p-2">
                <LoginForm
                  onSubmit={handleSubmit}
                  loading={loading}
                  savedEmail={getSavedEmail()}
                />

                {loginError && !loading && !essaiExpire && (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50/80 px-5 py-4 text-sm text-red-700 backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                        <span className="text-xs font-bold">!</span>
                      </div>
                      <span className="leading-relaxed">{loginError}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row">
                <p className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  Connexion securisee TLS 1.3
                </p>
                <p>© {new Date().getFullYear()} InVera ERP - Tous droits reserves</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          <span>Un probleme ? </span>
          <button
            type="button"
            className="font-medium text-[#0b4ea2] transition hover:underline"
            onClick={() => alert("Contactez votre administrateur ou l equipe support InVera.")}
          >
            Contacter le support
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
