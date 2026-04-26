import React from 'react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../../../../context/LanguageContext';

const copy = {
  fr: {
    title: 'Valider la commande',
    question: 'Etes-vous sur de vouloir valider la commande {{reference}} ?',
    cancel: 'Annuler',
    validate: 'Valider',
    validating: 'Validation...',
  },
  en: {
    title: 'Validate order',
    question: 'Are you sure you want to validate order {{reference}}?',
    cancel: 'Cancel',
    validate: 'Validate',
    validating: 'Validating...',
  },
  ar: {
    title: 'اعتماد الطلب',
    question: 'هل أنت متأكد من اعتماد الطلب {{reference}}؟',
    cancel: 'إلغاء',
    validate: 'اعتماد',
    validating: 'جاري الاعتماد...',
  },
};

const ValidationConfirmModal = ({ isOpen, onClose, onConfirm, commandeReference, isLoading }) => {
  const { language, isArabic } = useLanguage();
  const text = copy[language] || copy.fr;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className={`relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl ${isArabic ? 'text-right' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">{text.title}</h3>
          <p className="mb-6 text-sm text-gray-500">
            {text.question.replace('{{reference}}', commandeReference || '')}
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
            >
              {text.cancel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>{text.validating}</span>
                </>
              ) : (
                text.validate
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationConfirmModal;
