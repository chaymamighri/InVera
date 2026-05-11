import React from 'react';
import { Link } from 'react-router-dom';

import PublicFooter from '../../components/PublicFooter';
import PublicHeader from '../../components/PublicHeader';
import { useLanguage } from '../../context/LanguageContext';

import MoreInformationPage from './MoreInformationPage';
import SubscriptionsPage from './SubscriptionsPage';

import commercialStatsCapture from '../../assets/images/welcome/photo5.png';

const WelcomePage = () => {
  const { t, isArabic } = useLanguage();

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

  const roleSignals = [
    {
      title: t('login.signalOne'),
      description: t('login.signalOneDescription'),
    },
    {
      title: t('login.signalTwo'),
      description: t('login.signalTwoDescription'),
    },
    {
      title: t('login.signalThree'),
      description: t('login.signalThreeDescription'),
    },
  ];

  const productHighlights = [
    t('welcome.featureOne'),
    t('welcome.featureTwo'),
    t('welcome.featureThree'),
  ];

  const planLabels = [
    t('subscriptions.freePlan'),
    t('subscriptions.clientPlan'),
    t('subscriptions.companyPlan'),
  ];

  const durationLabels = [
    t('subscriptions.oneMonth'),
    t('subscriptions.threeMonths'),
    t('subscriptions.oneYear'),
  ];

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

      <div className="w-full px-6 pt-6 lg:px-10 xl:px-12">
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

      <main className="pt-14">
        <div className="w-full px-6 lg:px-10 xl:px-12">
          <section className="grid gap-12 pb-36 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:pb-44">
            <div>
              <span className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0b4ea2] shadow-sm">
                {t('welcome.heroBadge')}
              </span>

              <h2 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.05] text-slate-950 md:text-[4.4rem]">
                {t('welcome.heroHeading')}
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {t('welcome.heroDescription')}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {companyStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
                  >
                    <p className="text-3xl font-semibold text-slate-950">
                      {stat.value}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-10 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0b4ea2]">
                  {t('publicInfo.offersBadge')}
                </p>

                <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                  {t('publicInfo.title')}
                </h3>

                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                  {t('publicInfo.description')}
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {productHighlights.map((point) => (
                    <div
                      key={point}
                      className="bg-[#f8fbff] p-4"
                    >
                      <p className="text-sm leading-7 text-slate-600">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="bg-[#0b4ea2] p-7 text-white shadow-[0_24px_70px_rgba(11,78,162,0.18)]">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-100">
                  {t('login.securityTitle')}
                </p>

                <h3 className="mt-3 text-3xl font-semibold leading-tight">
                  {t('login.heroTitle')}
                </h3>

                <p className="mt-4 text-base leading-8 text-sky-50">
                  {t('login.heroDescription')}
                </p>

                <p className="mt-5 text-sm font-medium text-sky-100">
                  {t('login.securityDescription')}
                </p>
              </div>

              <div className="grid gap-4">
                {roleSignals.map((signal) => (
                  <div
                    key={signal.title}
                    className="bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.05)]"
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0b4ea2]">
                      {signal.title}
                    </p>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {signal.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-white p-6 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">
                  {t('subscriptions.badge')}
                </p>

                <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                  {t('subscriptions.title')}
                </h3>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {t('subscriptions.description')}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {planLabels.map((label) => (
                    <span
                      key={label}
                      className="bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
                    >
                      {label}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {durationLabels.map((label) => (
                    <span
                      key={label}
                      className="bg-[#f1f7ff] px-4 py-2 text-sm font-medium text-[#0b4ea2]"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="relative -mt-20 w-full lg:-mt-28">
          <div className="relative z-20 mx-auto w-full max-w-[1600px] px-6 lg:px-10 xl:px-12">
            <div className="grid gap-4 md:grid-cols-3">
              {roleSignals.map((signal) => (
                <div
                  key={signal.title}
                  className="bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.10)]"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0b4ea2]">
                    {signal.title}
                  </p>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {signal.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-[-1px] w-full bg-[#eef6ff] pt-6 lg:pt-8">
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

        <div className="w-full px-6 lg:px-10 xl:px-12">
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

          <div className="pb-24">
            <PublicFooter onNavigateSection={scrollToSection} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default WelcomePage;
