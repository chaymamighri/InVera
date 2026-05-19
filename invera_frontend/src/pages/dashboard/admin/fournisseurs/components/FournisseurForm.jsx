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
    matriculeFiscale: '',
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    
    // Pour le matricule, conversion en majuscules
    if (name === 'matriculeFiscale') {
      newValue = value.toUpperCase();
    }
    
    setFormData({
      ...formData,
      [name]: newValue,
    });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    validateField(name, formData[name]);
  };

  const validateField = (fieldName, value) => {
    let error = '';
    
    switch (fieldName) {
      case 'nomFournisseur':
        if (!value || value.trim() === '') {
          error = 'Le nom du fournisseur est obligatoire';
        } else if (value.length < 3) {
          error = 'Le nom doit contenir au moins 3 caractères';
        }
        break;
        
      case 'matriculeFiscale':
        const matriculeRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{3,50}$/;
        if (!value || value.trim() === '') {
          error = 'Le matricule fiscal est obligatoire';
        } else if (!matriculeRegex.test(value.trim())) {
          error = 'Le matricule doit contenir à la fois des lettres ET des chiffres';
        }
        break;
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value || value.trim() === '') {
          error = 'L\'email est obligatoire';
        } else if (!emailRegex.test(value)) {
          error = 'Format d\'email invalide';
        }
        break;
        
      case 'telephone':
        if (!value || value.trim() === '') {
          error = 'Le téléphone est obligatoire';
        } else if (!/^[0-9+\-\s]{8,20}$/.test(value)) {
          error = 'Format de téléphone invalide';
        }
        break;
        
      case 'adresse':
        if (!value || value.trim() === '') {
          error = 'L\'adresse est obligatoire';
        }
        break;
        
      case 'ville':
        if (!value || value.trim() === '') {
          error = 'La ville est obligatoire';
        }
        break;
        
      case 'pays':
        if (!value || value.trim() === '') {
          error = 'Le pays est obligatoire';
        }
        break;
        
      default:
        break;
    }
    
    setErrors(prev => ({ ...prev, [fieldName]: error }));
    return error === '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Nettoyage des données
    const cleanedData = {
      nomFournisseur: formData.nomFournisseur?.trim(),
      matriculeFiscale: formData.matriculeFiscale?.trim().toUpperCase(),
      email: formData.email?.trim().toLowerCase(),
      telephone: formData.telephone?.trim().replace(/\s/g, ''), // Supprime les espaces
      adresse: formData.adresse?.trim(),
      ville: formData.ville?.trim(),
      pays: formData.pays
    };
    
    // Validation
    const missingFields = [];
    if (!cleanedData.nomFournisseur) missingFields.push('Nom');
    if (!cleanedData.matriculeFiscale) missingFields.push('Matricule Fiscal');
    if (!cleanedData.email) missingFields.push('Email');
    if (!cleanedData.telephone) missingFields.push('Téléphone');
    if (!cleanedData.adresse) missingFields.push('Adresse');
    if (!cleanedData.ville) missingFields.push('Ville');
    if (!cleanedData.pays) missingFields.push('Pays');
    
    if (missingFields.length > 0) {
      alert(`Champs obligatoires manquants: ${missingFields.join(', ')}`);
      return;
    }
    
    console.log('📤 Envoi des données:', cleanedData);
    onSubmit(cleanedData);
  };

  const localizedFields = useMemo(() => {
    switch (language) {
      case 'en':
        return {
          emailPlaceholder: 'contact@supplier.tn',
          phonePlaceholder: '+216 71 234 567',
          cityPlaceholder: 'Tunis',
          taxIdPlaceholder: 'MF12345678',
          submitting: 'Submitting...',
        };
      case 'ar':
        return {
          emailPlaceholder: 'contact@supplier.tn',
          phonePlaceholder: '+216 71 234 567',
          cityPlaceholder: 'تونس',
          taxIdPlaceholder: 'MF12345678',
          submitting: 'جار المعالجة...',
        };
      case 'fr':
      default:
        return {
          emailPlaceholder: 'contact@fournisseur.tn',
          phonePlaceholder: '+216 71 234 567',
          cityPlaceholder: 'Tunis',
          taxIdPlaceholder: 'MF12345678',
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

  const ErrorMessage = ({ fieldName }) => {
    if (touched[fieldName] && errors[fieldName]) {
      return <p className="mt-1 text-xs text-red-500">{errors[fieldName]}</p>;
    }
    return null;
  };

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
            onBlur={handleBlur}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            placeholder={text.supplierNamePlaceholder}
          />
          <ErrorMessage fieldName="nomFournisseur" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {text.taxId || 'Matricule Fiscal'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="matriculeFiscale"
            value={formData.matriculeFiscale}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono uppercase focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            placeholder={localizedFields.taxIdPlaceholder}
          />
          <ErrorMessage fieldName="matriculeFiscale" />
          <p className="mt-1 text-xs text-gray-500">Lettres ET chiffres obligatoires (ex: MF12345678)</p>
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
            onBlur={handleBlur}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            placeholder={localizedFields.emailPlaceholder}
          />
          <ErrorMessage fieldName="email" />
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
            onBlur={handleBlur}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            placeholder={localizedFields.phonePlaceholder}
          />
          <ErrorMessage fieldName="telephone" />
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
            onBlur={handleBlur}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            placeholder={text.addressPlaceholder}
          />
          <ErrorMessage fieldName="adresse" />
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
              onBlur={handleBlur}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder={localizedFields.cityPlaceholder}
            />
            <ErrorMessage fieldName="ville" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {text.country} <span className="text-red-500">*</span>
            </label>
            <select
              name="pays"
              value={formData.pays}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">{text.selectCountry}</option>
              <option value="Tunisie">{countryLabels.tunisia}</option>
              <option value="Algérie">Algérie</option>
              <option value="Maroc">{countryLabels.morocco}</option>
              <option value="France">{countryLabels.france}</option>
              <option value="Autre">{text.other}</option>
            </select>
            <ErrorMessage fieldName="pays" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
        <button type="button" onClick={onCancel} className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-200">
          {text.cancel}
        </button>
        <button type="submit" disabled={loading} className="rounded-lg bg-gradient-to-r from-emerald-500 to-blue-500 px-4 py-2 text-sm text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50">
          {loading ? localizedFields.submitting : initialData ? text.edit : text.create}
        </button>
      </div>
    </form>
  );
};

export default FournisseurForm;