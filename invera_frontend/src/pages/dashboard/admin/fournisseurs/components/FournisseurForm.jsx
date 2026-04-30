import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../../../../context/LanguageContext';

const FournisseurForm = ({ initialData, onSubmit, onCancel, loading, text }) => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    nomFournisseur: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: '',
    pays: 'Tunisie',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const localizedFields = useMemo(() => {
    switch (language) {
      case 'en':
        return {
          emailPlaceholder: 'contact@supplier.tn',
          phonePlaceholder: '+216 71 234 567',
          cityPlaceholder: 'Tunis',
          submitting: 'Submitting...',
        };
      case 'ar':
        return {
          emailPlaceholder: 'contact@supplier.tn',
          phonePlaceholder: '+216 71 234 567',
          cityPlaceholder: 'تونس',
          submitting: 'جار المعالجة...',
        };
      case 'fr':
      default:
        return {
          emailPlaceholder: 'contact@fournisseur.tn',
          phonePlaceholder: '+216 71 234 567',
          cityPlaceholder: 'Tunis',
          submitting: 'En cours...',
        };
    }
  }, [language]);

  const countryLabels = useMemo(() => {
    switch (language) {
      case 'en':
        return {
          tunisia: 'Tunisia',
          algeria: 'Algeria',
          morocco: 'Morocco',
          france: 'France',
        };
      case 'ar':
        return {
          tunisia: 'تونس',
          algeria: 'الجزائر',
          morocco: 'المغرب',
          france: 'فرنسا',
        };
      case 'fr':
      default:
        return {
          tunisia: 'Tunisie',
          algeria: 'Algerie',
          morocco: 'Maroc',
          france: 'France',
        };
    }
  }, [language]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4 -mx-6 -mt-6 flex items-center justify-between rounded-t-xl bg-gradient-to-r from-emerald-500 to-blue-500 px-6 py-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
          </svg>
          <h3 className="text-lg font-semibold text-white">
            {initialData ? text.editSupplier : text.newSupplier}
          </h3>
        </div>

        <button type="button" onClick={onCancel} className="text-white/80 transition hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {text.supplierName} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nomFournisseur"
            value={formData.nomFournisseur}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            placeholder={text.supplierNamePlaceholder}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {text.email} <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            placeholder={localizedFields.emailPlaceholder}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {text.phone} <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="telephone"
            value={formData.telephone}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            placeholder={localizedFields.phonePlaceholder}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {text.address} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="adresse"
            value={formData.adresse}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            placeholder={text.addressPlaceholder}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {text.city} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="ville"
              value={formData.ville}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder={localizedFields.cityPlaceholder}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {text.country} <span className="text-red-500">*</span>
            </label>
            <select
              name="pays"
              value={formData.pays}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">{text.selectCountry}</option>
              <option value="Tunisie">{countryLabels.tunisia}</option>
              <option value="Algérie">Algérie</option>
              <option value="Maroc">{countryLabels.morocco}</option>
              <option value="France">{countryLabels.france}</option>
              <option value="Autre">{text.other}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-200"
        >
          {text.cancel}
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-emerald-500 to-blue-500 px-4 py-2 text-sm text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50"
        >
          {loading ? localizedFields.submitting : initialData ? text.edit : text.create}
        </button>
      </div>
    </form>
  );
};

export default FournisseurForm;
