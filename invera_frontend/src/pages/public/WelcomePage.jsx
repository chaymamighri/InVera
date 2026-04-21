import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import commercialStatsCapture from '../../assets/images/welcome/commercialDashboard.png';
import achatsStatsCapture from '../../assets/images/welcome/dashboardStock.png';
import adminStatsCapture from '../../assets/images/welcome/StatestiqueAdmin.png';

const dashboardPreviews = [
  {
    title: 'Dashboard Commercial',
    eyebrow: 'Performance commerciale',
    description: 'Vue des statistiques commerciales, des clients et de l activite des ventes.',
    accent: 'from-cyan-500 to-blue-500',
    metrics: ['Ventes', 'Clients', 'Commandes'],
    imageSrc: commercialStatsCapture,
  },
  {
    title: 'Dashboard Achats',
    eyebrow: 'Pilotage des achats',
    description: 'Vue des approvisionnements, du stock et du suivi des operations achat.',
    accent: 'from-emerald-500 to-teal-500',
    metrics: ['Stock', 'Commandes', 'Fournisseurs'],
    imageSrc: achatsStatsCapture,
  },
  {
    title: 'Dashboard Admin',
    eyebrow: 'Vue administrative',
    description: 'Vue d ensemble des statistiques, du pilotage et du suivi global de la plateforme.',
    accent: 'from-violet-500 to-indigo-500',
    metrics: ['Utilisateurs', 'Suivi', 'Rapports'],
    imageSrc: adminStatsCapture,
  },
];

const featurePoints = [
  'Une plateforme unique pour les ventes, les achats, le stock et la facturation.',
  'Une gestion claire des roles pour l administration, le commercial et l approvisionnement.',
  'Une base SaaS moderne concue pour evoluer avec les besoins du client.',
];

const companyStats = [
  { label: 'Modules', value: '04' },
  { label: 'Modele', value: 'SaaS' },
  { label: 'Univers', value: 'ERP' },
];

const PreviewMock = ({ accent, metrics }) => (
  <div className="h-full rounded-[30px] border border-[#d9e1ef] bg-[#f8fafc] p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
    <div className="mb-4 flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
      <div className="ml-auto h-7 w-24 rounded-full bg-white" />
    </div>

    <div className={`mb-4 rounded-[24px] bg-gradient-to-br ${accent} p-4 text-white`}>
      <div className="mb-2 h-3 w-24 rounded-full bg-white/40" />
      <div className="mb-4 h-7 w-36 rounded-full bg-white/25" />
      <div className="flex flex-wrap gap-2">
        {metrics.map((metric) => (
          <span key={metric} className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            {metric}
          </span>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-3 gap-3">
      <div className="col-span-2 space-y-3 rounded-[24px] bg-white p-3">
        <div className="h-3 w-20 rounded-full bg-slate-200" />
        <div className="h-20 rounded-[18px] bg-[#eef4ff]" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-14 rounded-2xl bg-[#eef4ff]" />
          <div className="h-14 rounded-2xl bg-[#eef4ff]" />
        </div>
      </div>
      <div className="space-y-3 rounded-[24px] bg-white p-3">
        <div className="h-3 w-12 rounded-full bg-slate-200" />
        <div className="h-14 rounded-2xl bg-[#eef4ff]" />
        <div className="h-14 rounded-2xl bg-[#eef4ff]" />
        <div className="h-14 rounded-2xl bg-[#eef4ff]" />
      </div>
    </div>
  </div>
);

const PreviewCard = ({ preview }) => (
  <article className="w-[560px] flex-none">
    <div className="mb-4 flex items-center justify-between gap-4 px-2">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          {preview.eyebrow}
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-900">{preview.title}</h3>
      </div>
      <span className={`rounded-full bg-gradient-to-r ${preview.accent} px-3 py-1 text-xs font-semibold text-white`}>
        Apercu live
      </span>
    </div>

    <div className="overflow-hidden rounded-[34px] border border-sky-100 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="h-[390px] bg-slate-100">
        {preview.imageSrc ? (
          <img
            src={preview.imageSrc}
            alt={preview.title}
            className="h-full w-full object-contain bg-[#eef6ff]"
          />
        ) : (
          <PreviewMock accent={preview.accent} metrics={preview.metrics} />
        )}
      </div>
      <div className="border-t border-slate-100 px-5 py-4">
        <p className="text-sm leading-7 text-slate-600">{preview.description}</p>
      </div>
    </div>
  </article>
);

const WelcomePage = () => {
  const carouselItems = [...dashboardPreviews, ...dashboardPreviews];

  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f9fc] text-slate-900">
      <style>
        {`
          @keyframes dashboard-marquee {
            from { transform: translate3d(8%, -12px, 0); }
            to { transform: translate3d(calc(-50% - 16px), -12px, 0); }
          }

          .dashboard-marquee {
            animation: dashboard-marquee 38s linear infinite;
          }

          .dashboard-marquee:hover {
            animation-play-state: paused;
          }
        `}
      </style>

      <div className="absolute inset-x-0 top-0 -z-10 h-[460px] bg-[linear-gradient(180deg,#eef6ff_0%,#f6f9fc_100%)]" />

      <div className="mx-auto max-w-7xl px-6 pb-24 pt-6 lg:px-8">
        <header className="rounded-[28px] border border-sky-100 bg-white px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b2f6b] p-2">
                <img src={logo} alt="InVera logo" className="max-h-full max-w-full object-contain" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#0b4ea2]">
                  InVera ERP
                </p>
                <h1 className="text-xl font-semibold text-slate-950">Gestion intelligente des operations</h1>
              </div>
            </div>

            <nav className="flex flex-col gap-3 sm:flex-row">
              {/* ✅ NOUVEAU BOUTON INSCRIPTION - MIS EN AVANT */}
              <Link
                to="/register"
                className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl"
              >
                🚀 S'inscrire gratuitement
              </Link>
              <Link
                to="/login"
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
              >
                Se connecter
              </Link>
              <Link
                to="/more-information"
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
              >
                Plus d&apos;informations
              </Link>
              <Link
                to="/subscriptions"
                className="rounded-full bg-[#0b2f6b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b4ea2]"
              >
                Abonnements
              </Link>
            </nav>
          </div>
        </header>

        <main className="pt-14">
          <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-[#0b4ea2] shadow-sm">
                Une plateforme ERP moderne
              </span>

              <h2 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.05] text-slate-950 md:text-[4.6rem]">
                Centralisez vos ventes, vos achats, votre stock et votre pilotage dans une interface claire et professionnelle.
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                InVera propose une experience SaaS ERP coherente, inspiree des besoins metier reels,
                avec une presentation sobre, lisible et adaptee a l univers visuel du produit.
              </p>

              {/* ✅ BANNIÈRE PROMOTIONNELLE POUR L'INSCRIPTION */}
              <div className="mt-8 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 p-5 border border-emerald-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-emerald-800">🚀 Lancez-vous sans risque !</p>
                    <p className="text-sm text-emerald-600">Profitez de 30 jours d'essai gratuit, sans engagement.</p>
                  </div>
                  <Link
                    to="/register"
                    className="whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-emerald-600 hover:to-teal-600"
                  >
                    Commencer l'essai gratuit →
                  </Link>
                </div>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {companyStats.map((stat) => (
                  <div key={stat.label} className="rounded-[24px] border border-sky-100 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                    <p className="text-3xl font-semibold text-slate-950">{stat.value}</p>
                    <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative rounded-[30px] border border-[#d7e6fb] bg-[linear-gradient(180deg,#0b2f6b_0%,#0b4ea2_100%)] px-6 py-8 text-white shadow-[0_24px_70px_rgba(11,47,107,0.16)]">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-200">
                    Pourquoi choisir InVera
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold leading-tight text-white">
                    Une presentation simple, lisible et alignee avec les besoins de gestion.
                  </h3>
                </div>
                <div className="hidden h-14 w-14 rounded-full border border-white/10 bg-white/10 lg:block" />
              </div>

              <div className="space-y-4">
                {featurePoints.map((point) => (
                  <div key={point} className="flex gap-4 rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <span className="mt-1 h-3 w-3 flex-none rounded-full bg-sky-400" />
                    <p className="text-sm leading-7 text-slate-200">{point}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-[28px] border border-white/10 bg-white/8 p-5">
                <p className="text-sm font-medium text-slate-100">Offre spéciale</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  🎁Profitez de 30 connexions gratuites pour découvrir notre solution.
                  Toutes les fonctionnalités sont disponibles pendant l'essai.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-24">
            <div className="mb-10 flex items-end justify-between gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#0b4ea2]">
                  Vues produit
                </p>
                <h3 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 md:text-5xl">
                  Captures reelles des dashboards
                </h3>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Les apercus ci-dessous affichent directement vos vraies captures. Elles ont ete
                  agrandies pour privilegier la lisibilite et une presentation plus propre.
                </p>
              </div>
              
              {/* ✅ BOUTON CTA SUPPLEMENTAIRE */}
              <Link
                to="/register"
                className="hidden sm:flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-emerald-600 hover:to-teal-600"
              >
                <span>✨</span>
                Essai gratuit
              </Link>
            </div>

            <div className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen overflow-x-auto overflow-y-visible pb-6 [scrollbar-width:thin]">
              <div className="overflow-hidden">
                <div className="dashboard-marquee flex w-max gap-10 px-6 pt-4 lg:px-12">
                  {carouselItems.map((preview, index) => (
                    <PreviewCard key={`${preview.title}-${index}`} preview={preview} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default WelcomePage;