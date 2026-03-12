// components/ConfirmationModal.jsx
import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-red-500 mt-2">
              ⚠️ Cette action est irréversible
            </p>
          </div>
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Suppression...' : 'Oui, supprimer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;