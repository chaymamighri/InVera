import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

const sections = [
  {
    title: 'A propos d’InVera',
    text: "InVera est une plateforme ERP SaaS pensée pour centraliser les activites commerciales, les achats, le stock, la facturation et le pilotage administratif dans une interface claire et professionnelle.",
  },
  {
    title: 'Notre vision',
    text: "L’objectif du projet est d’offrir un environnement de gestion moderne, structure et evolutif, adapte aux equipes qui ont besoin d’un outil fiable pour suivre leurs operations au quotidien.",
  },
  {
    title: 'Support et accompagnement',
    text: "La plateforme peut integrer un espace de support, un canal de contact commercial, une prise de rendez-vous de demonstration, ainsi qu’un accompagnement pour l’onboarding des nouveaux clients.",
  },
];

const contactItems = [
  { label: 'Email commercial', value: 'contact@invera.app' },
  { label: 'Email support', value: 'support@invera.app' },
  { label: 'Telephone', value: '+216 00 000 000' },
];

const whatsappUrl =
  'https://wa.me/21600000000?text=Bonjour%20InVera%2C%20je%20souhaite%20obtenir%20des%20informations%20sur%20la%20plateforme.';

const telegramUrl = 'https://t.me/InVeraSupportBot';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
    <path d="M19.05 4.94A9.77 9.77 0 0 0 12.09 2C6.67 2 2.26 6.41 2.26 11.83c0 1.74.45 3.44 1.31 4.95L2 22l5.38-1.41a9.8 9.8 0 0 0 4.7 1.2h.01c5.42 0 9.83-4.41 9.83-9.83 0-2.63-1.02-5.1-2.87-7.02Zm-6.96 15.19h-.01a8.12 8.12 0 0 1-4.14-1.14l-.3-.18-3.19.84.85-3.11-.2-.32a8.14 8.14 0 0 1-1.25-4.39c0-4.5 3.66-8.16 8.17-8.16 2.18 0 4.22.85 5.76 2.39a8.1 8.1 0 0 1 2.38 5.77c0 4.5-3.66 8.16-8.16 8.16Zm4.47-6.11c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.93-1.19-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.41-.41-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 1.99s.86 2.31.98 2.47c.12.16 1.69 2.58 4.09 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.42-.58 1.62-1.15.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
    <path d="M21.5 4.5 18.4 19c-.2 1-.8 1.2-1.6.8l-4.5-3.3-2.2 2.1c-.2.2-.4.4-.8.4l.3-4.7 8.6-7.8c.4-.4-.1-.6-.6-.3L6.9 12.7 2.5 11.3c-1-.3-1-1 .2-1.5l17.1-6.6c.8-.3 1.5.2 1.2 1.3Z" />
  </svg>
);

const MoreInformationPage = () => {
  return (
    <div className="min-h-screen bg-[#f6f9fc] text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
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
                <h1 className="text-2xl font-semibold text-slate-950">Plus d&apos;informations</h1>
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

        <main className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] border border-sky-100 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0b4ea2]">
              Presentation
            </p>
            <div className="mt-6 space-y-6">
              {sections.map((section) => (
                <div key={section.title} className="rounded-[22px] bg-[#f8fbff] p-5">
                  <h2 className="text-xl font-semibold text-slate-950">{section.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{section.text}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-[28px] border border-[#d7e6fb] bg-[linear-gradient(180deg,#0b2f6b_0%,#0b4ea2_100%)] p-8 text-white shadow-[0_24px_80px_rgba(11,47,107,0.18)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-200">
              Contact direct
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">
              Un seul espace pour comprendre le projet et savoir comment nous joindre.
            </h2>
            <div className="mt-8 space-y-4">
              {contactItems.map((item) => (
                <div key={item.label} className="rounded-[22px] border border-white/15 bg-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4">
              <div className="rounded-[22px] border border-emerald-300/20 bg-emerald-500/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                  Assistance WhatsApp
                </p>
                <p className="mt-3 text-sm leading-7 text-sky-50">
                  Un bouton WhatsApp est deja pret cote frontend. Il pourra ensuite etre relie a votre
                  chatbot pour repondre automatiquement aux questions sur l application.
                </p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-3 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1fb85a]"
                >
                  <WhatsAppIcon />
                  Ouvrir WhatsApp
                </a>
              </div>

              <div className="rounded-[22px] border border-sky-300/20 bg-sky-400/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">
                  Chatbot Telegram
                </p>
                <p className="mt-3 text-sm leading-7 text-sky-50">
                  Ce bouton Telegram est pret cote frontend pour accueillir plus tard votre chatbot
                  capable de repondre aux questions des visiteurs sur l application.
                </p>
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-3 rounded-full bg-[#229ED9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1b87bb]"
                >
                  <TelegramIcon />
                  Ouvrir Telegram
                </a>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default MoreInformationPage;
