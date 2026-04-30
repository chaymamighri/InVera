import React from 'react';
import { XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../../../../context/LanguageContext';

const copy = {
  fr: {
    emptyReason: 'Veuillez saisir un motif de rejet',
    title: 'Rejeter la commande',
    subtitle: 'Veuillez indiquer le motif du rejet pour la commande {{reference}} :',
    placeholder: 'Expliquez pourquoi cette commande est rejetee...',
    cancel: 'Annuler',
    rejecting: 'Rejet...',
    confirm: 'Confirmer le rejet',
  },
  en: {
    emptyReason: 'Please enter a rejection reason',
    title: 'Reject order',
    subtitle: 'Please provide the rejection reason for order {{reference}}:',
    placeholder: 'Explain why this order is rejected...',
    cancel: 'Cancel',
    rejecting: 'Rejecting...',
    confirm: 'Confirm rejection',
  },
  ar: {
    emptyReason: 'يرجى إدخال سبب الرفض',
    title: 'رفض الطلب',
    subtitle: 'يرجى توضيح سبب رفض الطلب {{reference}}:',
    placeholder: 'اشرح سبب رفض هذا الطلب...',
    cancel: 'إلغاء',
    rejecting: 'جاري الرفض...',
    confirm: 'تأكيد الرفض',
  },
};

const RejectModal = ({ isOpen, onClose, onConfirm, commandeReference, isLoading }) => {
  const { language, isArabic } = useLanguage();
  const text = copy[language] || copy.fr;
  const [motif, setMotif] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setMotif('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!motif.trim()) {
      alert(text.emptyReason);
      return;
    }
    onConfirm(motif);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className={`relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl ${isArabic ? 'text-right' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <XCircleIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">{text.title}</h3>
          <p className="mb-4 text-sm text-gray-500">
            {text.subtitle.replace('{{reference}}', commandeReference || '')}
          </p>
          <textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder={text.placeholder}
            className="mb-4 min-h-[100px] w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
            autoFocus
            disabled={isLoading}
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
            >
              {text.cancel}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>{text.rejecting}</span>
                </>
              ) : (
                text.confirm
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectModal;
