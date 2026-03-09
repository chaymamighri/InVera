import React from 'react';

const FournisseurModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay avec flou (conservé) */}
        <div
          className="fixed inset-0 bg-gradient-to-br from-emerald-900/50 to-blue-900/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel - fond blanc simple */}
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* En-tête avec dégradé (conservé) */}
          <div className="bg-gradient-to-r from-emerald-500 to-blue-500 px-4 py-3">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white focus:outline-none transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Contenu - fond blanc simple */}
          <div className="px-4 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FournisseurModal;