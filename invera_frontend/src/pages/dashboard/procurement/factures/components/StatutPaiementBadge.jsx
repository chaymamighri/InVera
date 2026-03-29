// pages/dashboard/procurement/factures/components/StatutPaiementBadge.jsx
import React from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const StatutPaiementBadge = ({ statut }) => {
  if (statut === 'PAYE') {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        <CheckCircleIcon className="w-3 h-3 mr-1" />
        Payée
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
      <XCircleIcon className="w-3 h-3 mr-1" />
      Non payée
    </span>
  );
};

export default StatutPaiementBadge;