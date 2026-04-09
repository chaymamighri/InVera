// components/RejectModal.jsx
import React from 'react';
import { XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const RejectModal = ({ isOpen, onClose, onConfirm, commandeReference, isLoading }) => {
  const [motif, setMotif] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setMotif('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!motif.trim()) {
      alert('Veuillez saisir un motif de rejet');
      return;
    }
    onConfirm(motif);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 transform transition-all">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <XCircleIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Rejeter la commande</h3>
          <p className="text-sm text-gray-500 mb-4">
            Veuillez indiquer le motif du rejet pour la commande <span className="font-semibold">{commandeReference}</span> :
          </p>
          <textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Expliquez pourquoi cette commande est rejetée..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[100px] mb-4"
            autoFocus
            disabled={isLoading}
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Rejet...</span>
                </>
              ) : (
                'Confirmer le rejet'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectModal;