import React from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../../components/PublicHeader';
import { useLanguage } from '../../context/LanguageContext';
import commercialStatsCapture from '../../assets/images/welcome/photo5.png';
import achatsStatsCapture from '../../assets/images/welcome/photo1.png';
import adminStatsCapture from '../../assets/images/welcome/photo3.png';
import { WELCOME_PREVIEW_ACCENTS } from '../../utils/publicPageContent';

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

const PreviewCard = ({ preview, liveLabel }) => (
  <article className="w-[560px] flex-none">
    <div className="mb-4 flex items-center justify-between gap-4 px-2">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          {preview.eyebrow}
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-900">{preview.title}</h3>
      </div>
      <span className={`rounded-full bg-gradient-to-r ${preview.accent} px-3 py-1 text-xs font-semibold text-white`}>
        {liveLabel}
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
  const { t } = useLanguage();

  const dashboardPreviews = [
    {
      title: t('welcome.dashboardCommercial'),
      eyebrow: t('welcome.commercialEyebrow'),
      description: t('welcome.commercialDescription'),
      accent: WELCOME_PREVIEW_ACCENTS[0],
      metrics: [t('welcome.metricsSales'), t('welcome.metricsClients'), t('welcome.metricsOrders')],
      imageSrc: commercialStatsCapture,
    },
    {
      title: t('welcome.dashboardProcurement'),
      eyebrow: t('welcome.procurementEyebrow'),
      description: t('welcome.procurementDescription'),
      accent: WELCOME_PREVIEW_ACCENTS[1],
      metrics: [t('welcome.metricsStock'), t('welcome.metricsOrders'), t('welcome.metricsSuppliers')],
      imageSrc: achatsStatsCapture,
    },
    {
      title: t('welcome.dashboardAdmin'),
      eyebrow: t('welcome.adminEyebrow'),
      description: t('welcome.adminDescription'),
      accent: WELCOME_PREVIEW_ACCENTS[2],
      metrics: [t('welcome.metricsUsers'), t('welcome.metricsTracking'), t('welcome.metricsReports')],
      imageSrc: adminStatsCapture,
    },
  ];

  const featurePoints = [t('welcome.featureOne'), t('welcome.featureTwo'), t('welcome.featureThree')];
  const companyStats = [
    { label: t('welcome.companyModules'), value: '04' },
    { label: t('welcome.companyModel'), value: t('welcome.modelValue') },
    { label: t('welcome.companyUniverse'), value: t('welcome.universeValue') },
  ];

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
        <PublicHeader
          title={t('welcome.heroTitle')}
          actions={
            <>
              <Link
                to="/register"
                className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl"
              >
                {t('common.registerFree')}
              </Link>
              <Link
                to="/login"
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
              >
                {t('common.login')}
              </Link>
              <Link
                to="/more-information"
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
              >
                {t('common.moreInformation')}
              </Link>
              <Link
                to="/subscriptions"
                className="rounded-full bg-[#0b2f6b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b4ea2]"
              >
                {t('common.subscriptions')}
              </Link>
            </>
          }
        />

        <main className="pt-14">
          <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-[#0b4ea2] shadow-sm">
                {t('welcome.heroBadge')}
              </span>

              <h2 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.05] text-slate-950 md:text-[4.6rem]">
                {t('welcome.heroHeading')}
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {t('welcome.heroDescription')}
              </p>

              <div className="mt-8 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <div>
<<<<<<< HEAD
                    <p className="text-lg font-semibold text-emerald-800">{t('common.registerFree')}</p>
                    <p className="text-sm text-emerald-600">{t('login.trialSoonDescription', { count: 30, suffix: 's' })}</p>
=======
                    <p className="text-lg font-semibold text-emerald-800">🚀 Lancez-vous sans risque !</p>
                    <p className="text-sm text-emerald-600">Profitez de 30 connexions d'essai gratuit,sans engagement.</p>
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5
                  </div>
                  <Link
                    to="/register"
                    className="whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-emerald-600 hover:to-teal-600"
                  >
                    {t('common.registerFree')} →
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
                    {t('common.moreInformation')}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold leading-tight text-white">
                    {t('publicInfo.title')}
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
            </div>
          </section>

          <section className="mt-24">
            <div className="mb-10 flex items-end justify-between gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#0b4ea2]">
                  {t('welcome.livePreview')}
                </p>
                <h3 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 md:text-5xl">
                  {t('welcome.heroTitle')}
                </h3>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  {t('publicInfo.description')}
                </p>
              </div>

              <Link
                to="/register"
                className="hidden items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-emerald-600 hover:to-teal-600 sm:flex"
              >
                <span>✨</span>
                {t('common.registerFree')}
              </Link>
            </div>

            <div className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen overflow-x-auto overflow-y-visible pb-6 [scrollbar-width:thin]">
              <div className="overflow-hidden">
                <div className="dashboard-marquee flex w-max gap-10 px-6 pt-4 lg:px-12">
                  {carouselItems.map((preview, index) => (
                    <PreviewCard
                      key={`${preview.title}-${index}`}
                      preview={preview}
                      liveLabel={t('welcome.livePreview')}
                    />
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
