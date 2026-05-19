// Composant Modal de confirmation
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, isArabic }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ${isArabic ? 'text-right' : ''}`}>
        <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>
        <p className="mb-6 text-gray-600">{message}</p>
        <div className={`flex gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-white transition-all hover:from-emerald-600 hover:to-emerald-700"
          >
            {confirmText || 'Confirmer'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-all hover:bg-gray-50"
          >
            {cancelText || 'Annuler'}
          </button>
        </div>
      </div>
    </div>
  );
};