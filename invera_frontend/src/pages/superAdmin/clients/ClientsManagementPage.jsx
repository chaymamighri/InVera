import React, { useState } from 'react';
import { ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../../context/LanguageContext';
import DefinitifClients from './DefinitifClients';
import EssaiClients from './EssaiClients';

const ClientsManagementPage = () => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState('definitif');

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-purple-600">
              {t('dashboard.superAdminClientsEyebrow')}
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900">
              {t('dashboard.superAdminClientsTitle')}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-500">
              {t('dashboard.superAdminClientsDescription')}
            </p>
          </div>
        </div>
      </section>

      <div className="flex gap-3 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveSection('definitif')}
          className={`flex items-center gap-2 rounded-xl px-6 py-2.5 font-medium transition ${
            activeSection === 'definitif'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <ShieldCheckIcon className="h-5 w-5" />
          {t('dashboard.superAdminDefinitiveRegistrations')}
        </button>
        <button
          onClick={() => setActiveSection('essai')}
          className={`flex items-center gap-2 rounded-xl px-6 py-2.5 font-medium transition ${
            activeSection === 'essai'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <SparklesIcon className="h-5 w-5" />
          {t('dashboard.superAdminTrialRegistrations')}
        </button>
      </div>

      {activeSection === 'definitif' ? <DefinitifClients /> : <EssaiClients />}
    </div>
  );
};

export default ClientsManagementPage;
