// src/pages/dashboard/sales/products/components/SuccessModal.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, EyeIcon } from '@heroicons/react/24/outline';

const SuccessModal = ({
  showSuccessPopup,
  setShowSuccessPopup
}) => {
  const navigate = useNavigate();
  
  if (!showSuccessPopup) return null;

  const handleVoirCommandes = () => {
    setShowSuccessPopup(false);
    // Navigation simple avec React Router
    navigate('/dashboard/sales/orders');
  };

  const handleFermer = () => {
    setShowSuccessPopup(false);
    // Rafraîchir la page pour réinitialiser
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Commande créée avec succès</h3>
          <p className="text-gray-600 mb-6">
            La commande a été enregistrée dans la section commandes clients.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={handleFermer}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Fermer
            </button>
            <button
              onClick={handleVoirCommandes}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 font-medium flex items-center justify-center"
            >
              <EyeIcon className="h-5 w-5 mr-2" />
              Voir les Commandes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;