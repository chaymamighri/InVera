import React from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../../components/PublicHeader';
import { useLanguage } from '../../context/LanguageContext';

const pageCopy = {
  fr: {
    support: {
      eyebrow: 'Support',
      title: 'Centre de support et accompagnement',
      description:
        'Reliez cette page a votre formulaire de contact, centre de support, demande de demo ou informations equipe.',
    },
    about: {
      eyebrow: 'A propos',
      title: 'A propos de InVera',
      description:
        'Reliez cette page a votre histoire, votre mission, votre vision produit et la presentation de votre equipe.',
    },
    backToWelcome: "Retour a l'accueil",
    goToLogin: 'Aller a la connexion',
  },
  en: {
    support: {
      eyebrow: 'Support',
      title: 'Support center and assistance',
      description:
        'Connect this page to your contact form, support center, demo request flow, or team information.',
    },
    about: {
      eyebrow: 'About',
      title: 'About InVera',
      description:
        'Connect this page to your story, mission, product vision, and team presentation.',
    },
    backToWelcome: 'Back to welcome',
    goToLogin: 'Go to login',
  },
  ar: {
    support: {
      eyebrow: 'الدعم',
      title: 'مركز الدعم والمرافقة',
      description:
        'اربط هذه الصفحة بنموذج التواصل أو مركز الدعم أو طلب عرض توضيحي أو معلومات الفريق.',
    },
    about: {
      eyebrow: 'من نحن',
      title: 'حول InVera',
      description:
        'اربط هذه الصفحة بقصة المشروع ورسالتك ورؤية المنتج وتقديم الفريق.',
    },
    backToWelcome: 'العودة إلى الرئيسية',
    goToLogin: 'الانتقال إلى تسجيل الدخول',
  },
};

const PublicInfoPage = ({ type = 'about' }) => {
  const { language, isArabic, t } = useLanguage();
  const localized = pageCopy[language] || pageCopy.fr;
  const config = localized[type] || localized.about;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <PublicHeader
          title={config.title}
          subtitle={config.eyebrow}
          backTo="/welcome"
          backLabel={localized.backToWelcome}
          actions={
            <Link
              to="/login"
              className="rounded-full border border-slate-950 px-6 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-slate-950 hover:text-white"
            >
              {localized.goToLogin}
            </Link>
          }
        />

        <div
          dir={isArabic ? 'rtl' : 'ltr'}
          className={`mt-10 rounded-[36px] border border-white/60 bg-white/90 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.10)] backdrop-blur md:p-12 ${isArabic ? 'text-right' : ''}`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
            {config.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{config.title}</h1>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-600">{config.description}</p>

          <div className="mt-10 grid gap-4 rounded-[28px] border border-sky-100 bg-sky-50/70 p-6 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">{t('welcome.companyModules')}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">04</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">{t('welcome.companyModel')}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{t('welcome.modelValue')}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">{t('welcome.companyUniverse')}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{t('welcome.universeValue')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicInfoPage;
