import React from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../../components/PublicHeader';
import { useLanguage } from '../../context/LanguageContext';

const contactCopy = {
  fr: {
    pageTitle: 'Contactez-nous',
    title: 'Gardez une communication simple, professionnelle et facile a joindre.',
    login: 'Se connecter',
    supportExperience: "Experience d'accompagnement",
    supportTitle: 'Pret pour vos vrais canaux de support et de contact commercial.',
    supportDescription:
      'Cette page est maintenant une vraie route dans l application. Vous pouvez remplacer ces donnees de contact temporaires par vos vrais emails, numero de telephone, WhatsApp, centre de support ou lien de reservation.',
    cards: [
      {
        title: 'Email',
        value: 'contact@invera.app',
        description:
          'Utilisez cette adresse pour les demandes generales, les questions produit et les partenariats.',
      },
      {
        title: 'Support',
        value: 'support@invera.app',
        description:
          "Utilisez cette adresse pour l'aide technique, l'accompagnement de demarrage et l'assistance compte.",
      },
      {
        title: 'Telephone',
        value: '+216 00 000 000',
        description:
          'Utilisez ce numero pour le contact direct une fois votre ligne professionnelle disponible.',
      },
    ],
  },
  en: {
    pageTitle: 'Contact us',
    title: 'Keep communication simple, professional, and easy to reach.',
    login: 'Log in',
    supportExperience: 'Support experience',
    supportTitle: 'Ready for your real support channels and business contact details.',
    supportDescription:
      'This page is now a real route in the app. You can replace these temporary contact details with your real emails, phone number, WhatsApp, support center, or booking link.',
    cards: [
      {
        title: 'Email',
        value: 'contact@invera.app',
        description:
          'Use this address for general requests, product questions, and partnerships.',
      },
      {
        title: 'Support',
        value: 'support@invera.app',
        description:
          'Use this address for technical help, onboarding support, and account assistance.',
      },
      {
        title: 'Phone',
        value: '+216 00 000 000',
        description:
          'Use this number for direct contact once your business line is available.',
      },
    ],
  },
  ar: {
    pageTitle: 'تواصل معنا',
    title: 'اجعل التواصل مباشرًا واحترافيًا وسهل الوصول.',
    login: 'تسجيل الدخول',
    supportExperience: 'تجربة الدعم',
    supportTitle: 'هذه الصفحة جاهزة لبيانات الدعم والتواصل التجاري الحقيقية.',
    supportDescription:
      'هذه الصفحة أصبحت مسارًا حقيقيًا داخل التطبيق. يمكنك استبدال بيانات الاتصال المؤقتة هذه ببريدك الحقيقي ورقم الهاتف وواتساب ومركز الدعم أو رابط الحجز.',
    cards: [
      {
        title: 'البريد الإلكتروني',
        value: 'contact@invera.app',
        description:
          'استخدم هذا البريد للطلبات العامة وأسئلة المنتج وطلبات الشراكة.',
      },
      {
        title: 'الدعم',
        value: 'support@invera.app',
        description:
          'استخدم هذا البريد للمساعدة التقنية ودعم الانطلاق ومشاكل الحساب.',
      },
      {
        title: 'الهاتف',
        value: '+216 00 000 000',
        description:
          'استخدم هذا الرقم للتواصل المباشر عندما يصبح الخط المهني جاهزًا.',
      },
    ],
  },
};

const ContactUsPage = () => {
  const { language, isArabic, t } = useLanguage();
  const copy = contactCopy[language] || contactCopy.fr;

  return (
    <div className="min-h-screen bg-[#f3f4ef] px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <PublicHeader
          title={copy.pageTitle}
          subtitle={t('common.appName')}
          backTo="/welcome"
          backLabel={t('common.backToWelcome')}
          actions={
            <Link
              to="/login"
              className="inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              {copy.login}
            </Link>
          }
        />

        <main className={`mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] ${isArabic ? 'text-right' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
          <section className="rounded-[34px] border border-[#d7deea] bg-[linear-gradient(160deg,#0f172a_0%,#12243b_48%,#15314a_100%)] p-8 text-white shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-300">{copy.supportExperience}</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-white">
              {copy.title}
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-300">
              {copy.supportDescription}
            </p>
          </section>

          <section className="grid gap-4">
            {copy.cards.map((card) => (
              <div
                key={card.title}
                className="rounded-[28px] border border-white/80 bg-white/88 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">{card.title}</p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">{card.value}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
};

export default ContactUsPage;
