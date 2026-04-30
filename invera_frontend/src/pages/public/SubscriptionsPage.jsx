import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../../components/PublicHeader';
import { useLanguage } from '../../context/LanguageContext';

const SubscriptionsPage = () => {
  const { t } = useLanguage();

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
        setOffres(Array.isArray(data) ? data : []);
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
    }

    if (dureeMois === 12) {
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

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {offres.map((offre) => {
              const style = getPlanStyle(offre.dureeMois);
              const estAnnuel = offre.dureeMois === 12;
              const prixMensuel = estAnnuel ? (offre.prix / 12).toFixed(2) : null;

              return (
                <article
                  key={offre.id}
                  className="flex h-full flex-col rounded-[30px] border border-sky-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition-all hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`inline-flex rounded-full bg-gradient-to-r ${style.tone} px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white`}
                    >
                      {style.badge}
                    </div>

                    {estAnnuel && (
                      <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Économie
                      </span>
                    )}
                  </div>

                  <div className="mt-5">
                    <h3 className="text-2xl font-bold text-slate-950">{offre.nom}</h3>

                    <div className="mt-3">
                      <p className="text-3xl font-bold text-[#0b4ea2]">
                        {offre.prix}{' '}
                        <span className="text-base font-normal text-slate-500">
                          {offre.devise || 'TND'}
                        </span>
                      </p>

                      <p className="text-sm text-slate-500">
                        {estAnnuel ? 'par an' : `pour ${offre.dureeMois} mois`}
                      </p>

                      {estAnnuel && (
                        <p className="mt-1 text-xs text-green-600">
                          Soit {prixMensuel} {offre.devise || 'TND'}/mois
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex-grow">
                    <p className="text-sm leading-relaxed text-slate-600">
                      {offre.description ||
                        (estAnnuel
                          ? 'Abonnement annuel avec économies substantielles'
                          : 'Formule flexible pour découvrir la plateforme')}
                    </p>
                  </div>

                  <div className="mt-6 rounded-[22px] bg-[#f8fbff] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0b4ea2]">
                      Durée
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      {offre.dureeMois === 1
                        ? '1 mois'
                        : offre.dureeMois === 12
                          ? '12 mois'
                          : `${offre.dureeMois} mois`}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Idéal pour
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {estAnnuel
                        ? 'Engagement long terme avec économies'
                        : 'Flexibilité mensuelle, test de la plateforme'}
                    </p>
                  </div>

                  <div className="mt-6">
                    <Link
                      to="/register"
                      className="block w-full rounded-full bg-gradient-to-r from-[#0b4ea2] to-[#1d75d6] px-4 py-3 text-center text-sm font-semibold text-white transition hover:from-[#0b3d82] hover:to-[#0b4ea2]"
                    >
                      🚀 S'inscrire et choisir cette offre
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>

          {offres.length === 0 && !loading && (
            <div className="py-12 text-center">
              <p className="text-slate-500">Aucune offre disponible pour le moment.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SubscriptionsPage;