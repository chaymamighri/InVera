import React from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../../components/PublicHeader';
import { useLanguage } from '../../context/LanguageContext';

const SubscriptionsPage = () => {
  const { t } = useLanguage();

  const plans = [
    {
      name: t('subscriptions.freePlan'),
      price: t('subscriptions.freePrice'),
      tone: 'from-slate-700 to-slate-900',
      badge: t('subscriptions.freeBadge'),
      description: t('subscriptions.freeDescription'),
      durations: [t('subscriptions.freeAccess')],
      features: [
        t('subscriptions.freeFeatureOne'),
        t('subscriptions.freeFeatureTwo'),
        t('subscriptions.freeFeatureThree'),
      ],
      idealFor: t('subscriptions.freeIdeal'),
    },
    {
      name: t('subscriptions.clientPlan'),
      price: t('subscriptions.durationBasedPrice'),
      tone: 'from-[#0b4ea2] to-[#1d75d6]',
      badge: t('subscriptions.standardBadge'),
      description: t('subscriptions.clientDescription'),
      durations: [t('subscriptions.oneMonth'), t('subscriptions.threeMonths'), t('subscriptions.oneYear')],
      features: [
        t('subscriptions.clientFeatureOne'),
        t('subscriptions.clientFeatureTwo'),
        t('subscriptions.clientFeatureThree'),
      ],
      idealFor: t('subscriptions.clientIdeal'),
    },
    {
      name: t('subscriptions.companyPlan'),
      price: t('subscriptions.durationBasedPrice'),
      tone: 'from-emerald-600 to-teal-500',
      badge: t('subscriptions.advancedBadge'),
      description: t('subscriptions.companyDescription'),
      durations: [t('subscriptions.oneMonth'), t('subscriptions.threeMonths'), t('subscriptions.oneYear')],
      features: [
        t('subscriptions.companyFeatureOne'),
        t('subscriptions.companyFeatureTwo'),
        t('subscriptions.companyFeatureThree'),
      ],
      idealFor: t('subscriptions.companyIdeal'),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f9fc] text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <PublicHeader
          title={t('subscriptions.pageTitle')}
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

        <main className="mt-8">
          <section className="mb-8 rounded-[30px] border border-sky-100 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0b4ea2]">
              {t('subscriptions.badge')}
            </p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-slate-950">
              {t('subscriptions.title')}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              {t('subscriptions.description')}
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
                    {t('subscriptions.durations')}
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
                    {t('subscriptions.idealFor')}
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
