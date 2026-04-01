// pages/dashboard/procurement/factures/components/FactureTabs.jsx
import React from 'react';

const FactureTabs = ({ activeTab, setActiveTab, facturesCount, commandesCount }) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => setActiveTab('liste')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'liste'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          📄 Liste des factures ({facturesCount})
        </button>
        <button
          onClick={() => setActiveTab('generer')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'generer'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          ✨ Générer facture ({commandesCount})
        </button>
      </nav>
    </div>
  );
};

export default FactureTabs;