import React from 'react';
import { Link } from 'react-router-dom';

import PublicFooter from '../../components/PublicFooter';
import PublicHeader from '../../components/PublicHeader';
import { useLanguage } from '../../context/LanguageContext';

import MoreInformationPage from './MoreInformationPage';
import SubscriptionsPage from './SubscriptionsPage';

import commercialStatsCapture from '../../assets/images/welcome/photo5.png';

const WelcomePage = () => {
  const { t, isArabic, language } = useLanguage();

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const companyStats = [
    {
      label: t('welcome.companyModules'),
      value: '04',
    },
    {
      label: t('welcome.companyModel'),
      value: t('welcome.modelValue'),
    },
    {
      label: t('welcome.companyUniverse'),
      value: t('welcome.universeValue'),
    },
  ];

  const productHighlights = [
    t('welcome.featureOne'),
    t('welcome.featureTwo'),
    t('welcome.featureThree'),
  ];

  const heroContent = {
    fr: {
      description:
        "InVera rassemble les operations commerciales et administratives dans un cadre unique, structure et lisible, pense pour les equipes qui veulent gagner en maitrise autant qu'en rapidite.",
      brandLabel: 'InVera',
      heroWordOne: 'InVera',
      heroWordTwo: '',
      streamLabel: 'Vente • Achats • Facturation • Execution',
      commandKicker: 'Operations en direct',
      commandTitle: 'Centre InVera',
      commandStatus: 'Actif',
      commandItems: ['Factures synchronisees', 'Cycle commercial', 'Flux achats'],
      monitoring: 'Suivi',
      executionPulse: 'Rythme d execution',
      pulseItems: ['Ventes', 'Factures', 'Achats'],
      running: 'En cours',
    },
    en: {
      description:
        'InVera brings commercial and administrative operations into one structured workspace built for teams that need stronger control, cleaner execution, and faster visibility.',
      brandLabel: 'InVera',
      heroWordOne: 'InVera',
      heroWordTwo: '',
      streamLabel: 'Sales • Procurement • Invoicing • Execution',
      commandKicker: 'Live Operations',
      commandTitle: 'InVera Command',
      commandStatus: 'Active',
      commandItems: ['Invoices synced', 'Sales pipeline', 'Procurement flow'],
      monitoring: 'Monitoring',
      executionPulse: 'Execution Pulse',
      pulseItems: ['Sales', 'Invoices', 'Purchases'],
      running: 'Running',
    },
    ar: {
      description:
        'تجمع InVera العمليات التجارية والادارية داخل فضاء واحد منظم وواضح، موجه للفرق التي تبحث عن سيطرة افضل وتنفيذ ادق ورؤية اسرع للنشاط.',
      brandLabel: 'InVera',
      heroWordOne: 'InVera',
      heroWordTwo: '',
      streamLabel: 'المبيعات • التزويد • الفوترة • التنفيذ',
      commandKicker: 'العمليات المباشرة',
      commandTitle: 'مركز InVera',
      commandStatus: 'نشط',
      commandItems: ['فواتير متزامنة', 'المسار التجاري', 'تدفق التزويد'],
      monitoring: 'المتابعة',
      executionPulse: 'نبض التنفيذ',
      pulseItems: ['المبيعات', 'الفواتير', 'المشتريات'],
      running: 'قيد العمل',
    },
  };

  const hero = heroContent[language] || heroContent.en;

  return (
    <div
      id="welcome"
      className="min-h-screen overflow-x-hidden bg-[#eef6ff] text-slate-900"
    >
      <style>
        {`
          html {
            scroll-behavior: smooth;
          }
        `}
      </style>

      <div className="w-full bg-[#0b4ea2] px-6 pt-6 lg:px-10 xl:px-12">
        <PublicHeader
          title={t('welcome.heroTitle')}
          actions={
            <>
              <Link
                to="/register"
                className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600"
              >
                {t('common.registerFree')}
              </Link>

              <Link
                to="/login"
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
              >
                {t('common.login')}
              </Link>

              <button
                onClick={() => scrollToSection('more-information')}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
              >
                {t('common.moreInformation')}
              </button>

              <button
                onClick={() => scrollToSection('subscriptions')}
                className="rounded-full bg-[#0b4ea2] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b3f84]"
              >
                {t('common.subscriptions')}
              </button>
            </>
          }
        />
      </div>

      <main className="bg-[#0b4ea2] pt-0">
        <section className="relative w-full overflow-hidden bg-[#0b4ea2] px-6 pb-28 pt-16 text-white lg:px-10 lg:pb-32 lg:pt-20 xl:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(125,211,252,0.35),transparent_28%),radial-gradient(circle_at_82%_20%,rgba(255,255,255,0.18),transparent_26%),linear-gradient(180deg,rgba(11,78,162,0)_0%,rgba(7,42,95,0.55)_100%)]" />
          <div className="absolute -left-24 top-28 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
          <div className="absolute -right-28 bottom-10 h-96 w-96 rounded-full bg-blue-950/35 blur-3xl" />

          <div
            dir={isArabic ? 'rtl' : 'ltr'}
            className={`relative mx-auto max-w-[1500px] ${isArabic ? 'text-right' : ''}`}
          >
            <div className="grid min-h-[620px] gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
              <div className="relative z-10">
                <h2 className="max-w-2xl text-[3rem] font-semibold uppercase leading-[0.95] tracking-[-0.06em] text-white sm:text-[3.8rem] md:text-[4.5rem] lg:text-[5rem]">
                  <>
                    {hero.heroWordOne}
                    {hero.heroWordTwo ? (
                      <>
                        <br />
                        {hero.heroWordTwo}
                      </>
                    ) : null}
                  </>
                </h2>

                <p className="mt-6 max-w-lg text-base leading-8 text-sky-50 md:text-lg">
                  {hero.description}
                </p>

                <p className="mt-7 max-w-md text-sm font-medium uppercase tracking-[0.2em] text-sky-100 md:max-w-2xl md:text-base">
                  {hero.streamLabel}
                </p>

                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => scrollToSection('more-information')}
                    className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#0b4ea2] shadow-2xl shadow-blue-950/25 transition hover:-translate-y-1 hover:bg-sky-50"
                  >
                    {t('common.moreInformation')}
                  </button>

                  <button
                    onClick={() => scrollToSection('subscriptions')}
                    className="rounded-full border border-white/35 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-1 hover:bg-white/15"
                  >
                    {t('common.subscriptions')}
                  </button>
                </div>
              </div>

              <div className="relative min-h-[520px] lg:min-h-[620px]">
                <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
                <div className="absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />

                <div className="absolute left-1/2 top-[52%] w-[92%] max-w-[760px] -translate-x-1/2 -translate-y-1/2 rotate-[-4deg] rounded-[2rem] border border-white/20 bg-white/14 p-4 shadow-2xl shadow-blue-950/40 backdrop-blur-xl">
                  <div className="rounded-[1.4rem] bg-white p-4 text-slate-900 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0b4ea2]">
                          {hero.commandKicker}
                        </p>
                        <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                          {hero.commandTitle}
                        </p>
                      </div>

                      <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                        {hero.commandStatus}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      {companyStats.map((stat) => (
                        <div key={stat.label} className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-2xl font-semibold text-[#0b4ea2]">
                            {stat.value}
                          </p>
                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 space-y-3">
                      {hero.commandItems.map((item, index) => (
                        <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#0b4ea2]" />
                          <p className="flex-1 text-sm font-semibold text-slate-700">{item}</p>
                          <span className="text-xs font-semibold text-slate-400">
                            0{index + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="absolute right-0 top-16 hidden w-52 rotate-6 rounded-3xl border border-white/20 bg-white/15 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-xl md:block">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">
                    {hero.monitoring}
                  </p>
                  <div className="mt-5 flex h-24 items-end gap-2">
                    {[42, 64, 48, 78, 58, 92, 70].map((height) => (
                      <span
                        key={height}
                        className="w-full rounded-full bg-white/80"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="absolute bottom-16 left-0 hidden w-64 -rotate-6 rounded-3xl border border-white/20 bg-white/15 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-xl md:block">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">
                    {hero.executionPulse}
                  </p>
                  <div className="mt-5 space-y-3">
                    {hero.pulseItems.map((item) => (
                      <div key={item} className="flex items-center justify-between text-sm font-semibold">
                        <span>{item}</span>
                        <span className="text-sky-100">{hero.running}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative w-full">
          <div className="w-full">
            <div
              className="relative min-h-[560px] w-full bg-cover bg-center bg-fixed"
              style={{ backgroundImage: `url(${commercialStatsCapture})` }}
            >
              <div className="absolute inset-0 bg-[rgba(7,20,55,0.58)]" />

              <div className="absolute inset-y-0 right-0 w-full bg-[#0b4ea2] opacity-95 lg:w-[72%] [clip-path:polygon(38%_0,100%_0,100%_100%,16%_100%)]" />

              <div
                dir={isArabic ? 'rtl' : 'ltr'}
                className="relative z-10 flex min-h-[560px] w-full items-center px-6 py-16 lg:px-10 xl:px-12"
              >
                <div
                  className={`w-full max-w-[1600px] ${
                    isArabic ? 'mr-auto' : 'ml-auto'
                  }`}
                >
                  <div
                    className={`ml-auto max-w-[760px] text-white ${
                      isArabic ? 'mr-auto text-right' : 'lg:text-right'
                    }`}
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-100">
                      {t('common.moreInformation')}
                    </p>

                    <h3 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl xl:text-[4rem]">
                      {t('publicInfo.title')}
                    </h3>

                    <p className={`mt-6 max-w-xl text-base leading-8 text-sky-50 ${isArabic ? 'mr-auto' : 'lg:ml-auto'}`}>
                      {t('publicInfo.description')}
                    </p>

                    <div className={`mt-8 flex flex-wrap gap-3 ${isArabic ? 'justify-end' : 'lg:justify-end'}`}>
                      {productHighlights.map((point) => (
                        <span
                          key={point}
                          className="bg-white/12 px-4 py-2 text-sm font-medium text-white"
                        >
                          {point}
                        </span>
                      ))}
                    </div>

                    <div className={`mt-10 ${isArabic ? 'text-right' : ''}`}>
                      <button
                        onClick={() => scrollToSection('more-information')}
                        className="bg-white px-7 py-3.5 text-sm font-semibold text-[#0b4ea2] transition hover:bg-sky-50"
                      >
                        {t('common.moreInformation')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="more-information"
          className="scroll-mt-32"
        >
          <MoreInformationPage />
        </section>

        <section
          id="subscriptions"
          className="scroll-mt-32"
        >
          <SubscriptionsPage />
        </section>

        <div className="pb-0">
          <PublicFooter onNavigateSection={scrollToSection} />
        </div>
      </main>
    </div>
  );
};

export default WelcomePage;
