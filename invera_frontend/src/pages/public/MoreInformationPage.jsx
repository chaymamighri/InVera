import React from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../../components/PublicHeader';
import { useLanguage } from '../../context/LanguageContext';

const sections = [
  {
    key: 'about',
    title: {
      fr: 'A propos d InVera',
      en: 'About InVera',
      ar: 'حول InVera',
    },
    text: {
      fr: 'InVera est une plateforme ERP SaaS pensee pour centraliser les activites commerciales, les achats, le stock, la facturation et le pilotage administratif dans une interface claire et professionnelle.',
      en: 'InVera is a SaaS ERP platform designed to centralize sales activity, procurement, stock, invoicing, and administrative oversight in one clear professional interface.',
      ar: 'InVera هي منصة ERP سحابية صممت لتجميع المبيعات والمشتريات والمخزون والفوترة والمتابعة الإدارية داخل واجهة واضحة واحترافية.',
    },
  },
  {
    key: 'vision',
    title: {
      fr: 'Notre vision',
      en: 'Our vision',
      ar: 'رؤيتنا',
    },
    text: {
      fr: 'L objectif du projet est d offrir un environnement de gestion moderne, structure et evolutif, adapte aux equipes qui ont besoin d un outil fiable pour suivre leurs operations au quotidien.',
      en: 'The goal is to provide a modern, structured, and scalable management environment for teams that need a reliable tool to follow their daily operations.',
      ar: 'هدف المشروع هو تقديم بيئة إدارة حديثة ومنظمة وقابلة للتطور للفرق التي تحتاج إلى أداة موثوقة لمتابعة عملياتها اليومية.',
    },
  },
  {
    key: 'support',
    title: {
      fr: 'Support et accompagnement',
      en: 'Support and onboarding',
      ar: 'الدعم والمرافقة',
    },
    text: {
      fr: 'La plateforme peut integrer un espace de support, un canal de contact commercial, une prise de rendez-vous de demonstration, ainsi qu un accompagnement pour l onboarding des nouveaux clients.',
      en: 'The platform can include support space, direct commercial contact, demo booking, and onboarding guidance for new clients.',
      ar: 'يمكن للمنصة أن تتضمن مساحة دعم وقناة تواصل تجاري وحجز عرض توضيحي ومرافقة لدمج العملاء الجدد.',
    },
  },
];

const contactItems = [
  { key: 'sales', value: 'contact@invera.app' },
  { key: 'support', value: 'support@invera.app' },
  { key: 'phone', value: '+216 00 000 000' },
];

const contactLabels = {
  sales: { fr: 'Email commercial', en: 'Sales email', ar: 'بريد المبيعات' },
  support: { fr: 'Email support', en: 'Support email', ar: 'بريد الدعم' },
  phone: { fr: 'Telephone', en: 'Phone', ar: 'الهاتف' },
};

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
  const { language, t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#f6f9fc] text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <PublicHeader
          title={t('publicInfo.pageTitle')}
          backTo="/welcome"
          backLabel={t('common.backToWelcome')}
          actions={
            <Link
              to="/login"
              className="inline-flex rounded-full bg-[#0b2f6b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b4ea2]"
            >
              {t('common.login')}
            </Link>
          }
        />

        <main className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] border border-sky-100 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0b4ea2]">
              {t('publicInfo.offersBadge')}
            </p>
            <div className="mt-6 space-y-6">
              {sections.map((section) => (
                <div key={section.key} className="rounded-[22px] bg-[#f8fbff] p-5">
                  <h2 className="text-xl font-semibold text-slate-950">{section.title[language]}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{section.text[language]}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-[28px] border border-[#d7e6fb] bg-[linear-gradient(180deg,#0b2f6b_0%,#0b4ea2_100%)] p-8 text-white shadow-[0_24px_80px_rgba(11,47,107,0.18)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-200">
              {t('common.moreInformation')}
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">
              {t('publicInfo.title')}
            </h2>
            <div className="mt-8 space-y-4">
              {contactItems.map((item) => (
                <div key={item.key} className="rounded-[22px] border border-white/15 bg-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">
                    {contactLabels[item.key][language]}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4">
              <div className="rounded-[22px] border border-emerald-300/20 bg-emerald-500/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                  WhatsApp
                </p>
                <p className="mt-3 text-sm leading-7 text-sky-50">
                  {t('publicInfo.description')}
                </p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-3 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1fb85a]"
                >
                  <WhatsAppIcon />
                  WhatsApp
                </a>
              </div>

              <div className="rounded-[22px] border border-sky-300/20 bg-sky-400/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">
                  Telegram
                </p>
                <p className="mt-3 text-sm leading-7 text-sky-50">
                  {t('publicInfo.description')}
                </p>
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-3 rounded-full bg-[#229ED9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1b87bb]"
                >
                  <TelegramIcon />
                  Telegram
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
