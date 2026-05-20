import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { BuildingOfficeIcon, IdentificationIcon } from '@heroicons/react/24/outline';

const UpdateClientModal = ({ 
  open, 
  onClose, 
  client, 
  onSuccess, 
  updateClient, 
  checkMatriculeFiscale,
  t = (key) => key, 
  isArabic = false 
}) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    adresse: '',
    typeClient: 'PARTICULIER',
    raisonSociale: '',
    matriculeFiscale: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [clientRemise, setClientRemise] = useState(0);
  const [matriculeError, setMatriculeError] = useState('');
  const [showEntrepriseFields, setShowEntrepriseFields] = useState(false);

  // Vérifier si le type actuel est ENTREPRISE
  const isEntreprise = formData.typeClient === 'ENTREPRISE';

  useEffect(() => {
    if (client) {
      setFormData({
        nom: client.nom || '',
        prenom: client.prenom || '',
        telephone: client.telephone || '',
        email: client.email || '',
        adresse: client.adresse || '',
        typeClient: client.typeClient || 'PARTICULIER',
        raisonSociale: client.raisonSociale || '',
        matriculeFiscale: client.matriculeFiscale || ''
      });
      setClientRemise(client.remise || 0);
      setShowEntrepriseFields(client.typeClient === 'ENTREPRISE');
    }
  }, [client]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom?.trim()) {
      newErrors.nom = t('salesPages.nameRequired');
    }

    if (!formData.prenom?.trim()) {
      newErrors.prenom = t('salesPages.firstNameRequired');
    }

    if (!formData.telephone?.trim()) {
      newErrors.telephone = t('salesPages.phoneRequired');
    } else if (!/^[0-9+\-\s]{8,}$/.test(formData.telephone)) {
      newErrors.telephone = t('salesPages.invalidPhone');
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('salesPages.invalidEmail');
    }

    if (!formData.typeClient) {
      newErrors.typeClient = t('salesPages.clientTypeRequired');
    }

    // Validation des champs entreprise si le type est ENTREPRISE
    if (formData.typeClient === 'ENTREPRISE') {
      if (!formData.raisonSociale?.trim()) {
        newErrors.raisonSociale = t('salesPages.companyNameRequired');
      }
      if (!formData.matriculeFiscale?.trim()) {
        newErrors.matriculeFiscale = t('salesPages.taxNumberRequired');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const verifyMatriculeFiscale = async (matricule) => {
    if (!checkMatriculeFiscale) return;
    if (matricule === client?.matriculeFiscale) return; // Pas de vérification si inchangé
    
    try {
      const response = await checkMatriculeFiscale(matricule);
      if (response?.exists) {
        setMatriculeError(t('salesPages.taxNumberAlreadyUsed'));
      } else {
        setMatriculeError('');
      }
    } catch (error) {
      console.error('Erreur vérification matricule:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }

    // Si on change le type client, gérer l'affichage des champs entreprise
    if (name === 'typeClient') {
      const newIsEntreprise = value === 'ENTREPRISE';
      setShowEntrepriseFields(newIsEntreprise);
      
      // Si on change de ENTREPRISE vers autre chose, nettoyer les champs
      if (!newIsEntreprise) {
        setFormData(prev => ({
          ...prev,
          raisonSociale: '',
          matriculeFiscale: ''
        }));
        setMatriculeError('');
      }
    }
    
    // Vérifier l'unicité du matricule si c'est une entreprise
    if (name === 'matriculeFiscale' && value.length >= 5 && formData.typeClient === 'ENTREPRISE') {
      verifyMatriculeFiscale(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Vérifier les erreurs de matricule
    if (matriculeError) {
      toast.error(matriculeError);
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        telephone: formData.telephone.trim(),
        email: formData.email?.trim() || null,
        adresse: formData.adresse?.trim() || null,
        type: formData.typeClient, // Note: l'API attend 'type' pas 'typeClient'
        ...(formData.typeClient === 'ENTREPRISE' && {
          raisonSociale: formData.raisonSociale?.trim() || null,
          matriculeFiscale: formData.matriculeFiscale?.trim() || null
        })
      };

      console.log('🔵 Modification du client:', client.idClient);
      console.log('📤 Données envoyées:', updateData);

      const response = await updateClient(client.idClient, updateData);
      
      console.log('✅ Réponse reçue:', response);

      if (response?.success) {
        onSuccess(t('salesPages.clientUpdatedSuccess'));
        onClose();
      }
    } catch (error) {
      console.error('❌ Erreur lors de la modification:', error);
      
      // Gestion des erreurs
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          if (typeof data === 'object') {
            Object.entries(data).forEach(([field, message]) => {
              toast.error(`${field}: ${message}`);
            });
          } else {
            toast.error('Données invalides: ' + (data.message || 'Vérifiez les champs'));
          }
        } else if (status === 404) {
          toast.error(t('salesPages.clientNotFound'));
        } else if (status === 409) {
          toast.error(t('salesPages.phoneOrTaxNumberAlreadyUsed'));
        } else {
          toast.error(t('salesPages.updateError'));
        }
      } else {
        toast.error(t('salesPages.updateError'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
        <div className="bg-blue-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h2 className="text-xl font-semibold text-white">{t('salesPages.editClient')}</h2>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-md font-medium text-gray-700">{t('salesPages.identity')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t('salesPages.name')} required name="nom" value={formData.nom} onChange={handleChange} error={errors.nom} placeholder="Dupont" />
              <Field label={t('salesPages.firstName')} required name="prenom" value={formData.prenom} onChange={handleChange} error={errors.prenom} placeholder="Jean" />
            </div>

            <h3 className="text-md font-medium text-gray-700">{t('salesPages.contact')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t('salesPages.email')} type="email" name="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="client@email.com" />
              <Field label={t('salesPages.phone')} required type="tel" name="telephone" value={formData.telephone} onChange={handleChange} error={errors.telephone} placeholder="98 765 432" />
            </div>

            <h3 className="text-md font-medium text-gray-700">{t('salesPages.address')}</h3>
            <textarea
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              rows="2"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder={t('salesPages.addressPlaceholder')}
            />

            {/* SECTION CATÉGORIE */}
            <div className="space-y-3">
              <h3 className="text-md font-medium text-gray-700">{t('salesPages.category')}</h3>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {t('salesPages.clientType')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="typeClient"
                  value={formData.typeClient}
                  onChange={handleChange}
                  disabled={true}  // Désactivé - seul l'admin peut modifier
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-100 text-gray-500 cursor-not-allowed"
                >
                  <option value="PARTICULIER">{t('salesPages.individual')}</option>
                  <option value="VIP">{t('salesPages.vip')}</option>
                  <option value="ENTREPRISE">{t('salesPages.company')}</option>
                  <option value="FIDELE">{t('salesPages.loyalCustomer')}</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {t('salesPages.clientTypeCannotBeChanged')}
                </p>
              </div>

              {/* SECTION INFORMATIONS ENTREPRISE (affiche uniquement si type = ENTREPRISE) */}
              {isEntreprise && (
                <div className="mt-4 space-y-3 animate-in fade-in duration-300">
                  <div className="border-t border-gray-200 pt-3">
                    <h4 className="text-sm font-semibold text-blue-700 flex items-center gap-2 mb-3">
                      <BuildingOfficeIcon className="w-4 h-4" />
                      {t('salesPages.companyInformation')}
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          {t('salesPages.companyName')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="raisonSociale"
                          value={formData.raisonSociale}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder={t('salesPages.companyNamePlaceholder')}
                        />
                        {errors.raisonSociale && (
                          <p className="text-xs text-red-500 mt-1">{errors.raisonSociale}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          {t('salesPages.taxNumber')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="matriculeFiscale"
                            value={formData.matriculeFiscale}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder={t('salesPages.taxNumberPlaceholder')}
                          />
                        </div>
                        {matriculeError && (
                          <p className="text-xs text-red-500 mt-1">{matriculeError}</p>
                        )}
                        {errors.matriculeFiscale && (
                          <p className="text-xs text-red-500 mt-1">{errors.matriculeFiscale}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Affichage de la remise */}
              {clientRemise > 0 && (
                <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-600">{t('salesPages.appliedDiscount')}</span>
                    </div>
                    <span className="text-lg font-semibold text-blue-600">{clientRemise}%</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-all" disabled={loading}>
                {t('salesPages.cancel')}
              </button>
              <button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center">
                {loading ? t('salesPages.updating') : t('salesPages.edit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, required, error, ...props }) => (
  <div>
    <label className="block text-sm text-gray-600 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input {...props} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export default UpdateClientModal;