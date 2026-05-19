import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

const UpdateClientModal = ({ open, onClose, client, onSuccess, updateClient, t, isArabic }) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    adresse: '',
    typeClient: 'PARTICULIER',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [clientRemise, setClientRemise] = useState(0);

  useEffect(() => {
    if (client) {
      setFormData({
        nom: client.nom || '',
        prenom: client.prenom || '',
        telephone: client.telephone || '',
        email: client.email || '',
        adresse: client.adresse || '',
        typeClient: client.typeClient || 'PARTICULIER',
      });
      setClientRemise(client.remise || 0);
    }
  }, [client]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nom?.trim()) newErrors.nom = t('salesPages.nameRequired');
    if (!formData.prenom?.trim()) newErrors.prenom = t('salesPages.firstNameRequired');
    if (!formData.telephone?.trim()) newErrors.telephone = t('salesPages.phoneRequired');
    else if (!/^[0-9+\-\s]{8,}$/.test(formData.telephone)) newErrors.telephone = t('salesPages.invalidPhone');
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t('salesPages.invalidEmail');
    if (!formData.typeClient) newErrors.typeClient = t('salesPages.clientTypeRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await updateClient(client.idClient, {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        telephone: formData.telephone.trim(),
        email: formData.email?.trim() || null,
        adresse: formData.adresse?.trim() || null,
        typeClient: formData.typeClient,
      });

      if (response?.success) {
        onSuccess(t('salesPages.clientUpdatedSuccess'));
        onClose();
      }
    } catch (error) {
      if (error.response?.status === 400 && typeof error.response.data === 'object') {
        Object.entries(error.response.data).forEach(([field, message]) => toast.error(`${field}: ${message}`));
      } else if (error.response?.status === 404) {
        toast.error(t('salesPages.clientNotFound'));
      } else if (error.response?.status === 409) {
        toast.error(t('salesPages.phoneAlreadyUsed'));
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

            <h3 className="text-md font-medium text-gray-700">{t('salesPages.category')}</h3>
            <select
              name="typeClient"
              value={formData.typeClient}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            >
              <option value="PARTICULIER">{t('salesPages.individual')}</option>
              <option value="VIP">{t('salesPages.vip')}</option>
              <option value="ENTREPRISE">{t('salesPages.company')}</option>
              <option value="FIDELE">{t('salesPages.loyalCustomer')}</option>
            </select>

            {clientRemise > 0 && (
              <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('salesPages.appliedDiscount')}</span>
                  <span className="text-lg font-semibold text-blue-600">{clientRemise}%</span>
                </div>
              </div>
            )}

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
