import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

const plans = [
  {
    name: 'Gratuite',
    price: 'Gratuit',
    tone: 'from-slate-700 to-slate-900',
    badge: 'Decouverte',
    description:
      'Une formule simple pour explorer la plateforme, comprendre les modules et presenter le produit.',
    durations: ['Acces de decouverte'],
    features: [
      'Presentation generale de la plateforme',
      'Decouverte de l interface et des modules',
      'Convient pour une premiere prise en main',
    ],
    idealFor: 'Prospects et demonstrations initiales',
  },
  {
    name: 'Client',
    price: 'Selon la duree',
    tone: 'from-[#0b4ea2] to-[#1d75d6]',
    badge: 'Standard',
    description:
      'Une formule adaptee aux structures qui souhaitent acceder a un environnement de gestion sur une periode definie.',
    durations: ['1 mois', '3 mois', '1 an'],
    features: [
      'Acces a la plateforme selon la duree choisie',
      'Utilisation des modules metier disponibles',
      'Formule flexible pour un besoin progressif',
    ],
    idealFor: 'Clients ayant besoin d un acces metier classique',
  },
  {
    name: 'Entreprise',
    price: 'Selon la duree',
    tone: 'from-emerald-600 to-teal-500',
    badge: 'Avancee',
    description:
      'Une formule plus large pour les entreprises qui ont besoin d un cadre plus complet et evolutif.',
    durations: ['1 mois', '3 mois', '1 an'],
    features: [
      'Cadre plus adapte aux besoins d entreprise',
      'Possibilite d evolution selon l organisation',
      'Approche plus complete pour un usage professionnel regulier',
    ],
    idealFor: 'Entreprises avec besoin de structure et de continuite',
  },
];

const SubscriptionsPage = () => {
  return (
    <div className="min-h-screen bg-[#f6f9fc] text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <header className="rounded-[28px] border border-sky-100 bg-white px-6 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b2f6b] p-2">
                <img src={logo} alt="InVera logo" className="max-h-full max-w-full object-contain" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#0b4ea2]">
                  InVera ERP
                </p>
                <h1 className="text-2xl font-semibold text-slate-950">Types d&apos;abonnement</h1>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/welcome"
                className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
              >
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Retour a l accueil
                </span>
              </Link>
              <Link
                to="/login"
                className="inline-flex rounded-full bg-[#0b2f6b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b4ea2]"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </header>

        <main className="mt-8">
          <section className="mb-8 rounded-[30px] border border-sky-100 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0b4ea2]">
              Offres
            </p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-slate-950">
              Consultez les formules d abonnement et la structure des durees.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Les types d abonnement disponibles sont `Gratuite`, `Client` et `Entreprise`.
              Les formules `Client` et `Entreprise` peuvent etre proposees sur `1 mois`, `3 mois`
              ou `1 an`.
            </p>
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className="rounded-[30px] border border-sky-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]"
              >
                <div className={`inline-flex rounded-full bg-gradient-to-r ${plan.tone} px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white`}>
                  {plan.badge}
                </div>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-3xl font-semibold text-slate-950">{plan.name}</h3>
                    <p className="mt-2 text-sm text-slate-500">{plan.price}</p>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-7 text-slate-600">{plan.description}</p>

                <div className="mt-6 rounded-[22px] bg-[#f8fbff] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0b4ea2]">
                    Durees
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {plan.durations.map((duration) => (
                      <span
                        key={duration}
                        className="rounded-full border border-sky-100 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
                      >
                        {duration}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex gap-3 rounded-2xl bg-[#f8fbff] p-3">
                      <span className="mt-2 h-2.5 w-2.5 flex-none rounded-full bg-[#0b4ea2]" />
                      <p className="text-sm leading-6 text-slate-600">{feature}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Ideal pour
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{plan.idealFor}</p>
                </div>
              </article>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
};

export default SubscriptionsPage;
