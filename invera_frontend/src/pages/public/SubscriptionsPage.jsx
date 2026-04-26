import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
<<<<<<< HEAD
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
=======
import logo from '../../assets/images/logo.png';

const SubscriptionsPage = () => {
  const [offres, setOffres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOffres = async () => {
      try {
        const response = await fetch('/api/public/offres');
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des offres');
        }
        const data = await response.json();
        setOffres(data);
      } catch (err) {
        console.error('Erreur fetchOffres:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOffres();
  }, []);

  const getPlanStyle = (dureeMois) => {
    if (dureeMois === 1) {
      return {
        tone: 'from-[#0b4ea2] to-[#1d75d6]',
        badge: 'Mensuel',
      };
    } else if (dureeMois === 12) {
      return {
        tone: 'from-emerald-600 to-teal-500',
        badge: 'Annuel',
      };
    }
    return {
      tone: 'from-slate-700 to-slate-900',
      badge: `${dureeMois} mois`,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f9fc] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b4ea2] mx-auto"></div>
          <p className="mt-4 text-slate-600">Chargement des offres...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f6f9fc] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-slate-600">Erreur: {error}</p>
          <Link to="/welcome" className="mt-4 inline-block text-[#0b4ea2] hover:underline">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5

  return (
    <div className="min-h-screen bg-[#f6f9fc] text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
<<<<<<< HEAD
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
=======
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
                <h1 className="text-2xl font-semibold text-slate-950">Nos offres d'abonnement</h1>
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
                  Retour à l'accueil
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
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5

        <main className="mt-8">
          <section className="mb-8 rounded-[30px] border border-sky-100 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0b4ea2]">
<<<<<<< HEAD
              {t('subscriptions.badge')}
            </p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-slate-950">
              {t('subscriptions.title')}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              {t('subscriptions.description')}
=======
              Formules disponibles
            </p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-slate-950">
              Choisissez l'offre qui vous convient
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Découvrez nos formules d'abonnement. Chaque offre vous donne accès à toutes les fonctionnalités
              de la plateforme. Les formules annuelles vous permettent de réaliser des économies
              significatives.
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offres.map((offre) => {
              const style = getPlanStyle(offre.dureeMois);
              const estAnnuel = offre.dureeMois === 12;
              const prixMensuel = estAnnuel ? (offre.prix / 12).toFixed(2) : null;

<<<<<<< HEAD
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
=======
              return (
                <article
                  key={offre.id}
                  className="rounded-[30px] border border-sky-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition-all hover:shadow-lg flex flex-col h-full"
                >
                  {/* Badge */}
                  <div className="flex justify-between items-start">
                    <div className={`inline-flex rounded-full bg-gradient-to-r ${style.tone} px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white`}>
                      {style.badge}
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5
                    </div>
                    {estAnnuel && (
                      <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Économie
                      </span>
                    )}
                  </div>

<<<<<<< HEAD
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {t('subscriptions.idealFor')}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{plan.idealFor}</p>
                </div>
              </article>
            ))}
=======
                  {/* Nom et prix */}
                  <div className="mt-5">
                    <h3 className="text-2xl font-bold text-slate-950">{offre.nom}</h3>
                    <div className="mt-3">
                      <p className="text-3xl font-bold text-[#0b4ea2]">
                        {offre.prix} <span className="text-base font-normal text-slate-500">TND</span>
                      </p>
                      <p className="text-sm text-slate-500">
                        {estAnnuel ? 'par an' : `pour ${offre.dureeMois} mois`}
                      </p>
                      {estAnnuel && (
                        <p className="text-xs text-green-600 mt-1">
                          Soit {prixMensuel} TND/mois
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mt-4 flex-grow">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {offre.description || (estAnnuel 
                        ? "Abonnement annuel avec économies substantielles"
                        : "Formule flexible pour découvrir la plateforme")}
                    </p>
                  </div>

                  {/* Durée */}
                  <div className="mt-6 rounded-[22px] bg-[#f8fbff] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0b4ea2]">
                      Durée
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      {offre.dureeMois === 1 ? '1 mois' : offre.dureeMois === 12 ? '12 mois' : `${offre.dureeMois} mois`}
                    </p>
                  </div>

                  {/* Ideal pour */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Idéal pour
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {estAnnuel 
                        ? "Engagement long terme avec économies" 
                        : "Flexibilité mensuelle, test de la plateforme"}
                    </p>
                  </div>

                  {/* Bouton */}
                  <div className="mt-6">
                    <Link
                      to="/register"
                      className="block w-full text-center rounded-full bg-gradient-to-r from-[#0b4ea2] to-[#1d75d6] px-4 py-3 text-sm font-semibold text-white transition hover:from-[#0b3d82] hover:to-[#0b4ea2]"
                    >
                   🚀 S'inscrire et choisir cette offre
                    </Link>
                  </div>
                </article>
              );
            })}
>>>>>>> 4bc667105d982dc6fa608edeb78ac8a97bbefae5
          </section>

          {offres.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-slate-500">Aucune offre disponible pour le moment.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SubscriptionsPage;