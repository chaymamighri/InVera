import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { BuildingOfficeIcon, IdentificationIcon } from '@heroicons/react/24/outline';

const ClientFormModal = ({
  open,
  onClose,
  client,
  onSuccess,
  checkTelephone,
  checkMatriculeFiscale,
  getRemiseForType,
  clientTypes,
  createClient,
  t,
  isArabic,
}) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    typeClient: 'PARTICULIER',
    raisonSociale: '',
    matriculeFiscale: ''
  });
  
  const [errors, setErrors] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    typeClient: '',
    raisonSociale: '',
    matriculeFiscale: ''
  });
  
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [telephoneExists, setTelephoneExists] = useState(false);
  const [matriculeExists, setMatriculeExists] = useState(false);
  const [remiseInfo, setRemiseInfo] = useState(null);
  const fetchingRemise = useRef(false);
  const previousTypeClient = useRef('');
  const debounceTimer = useRef(null);

  const getTypeClientLabel = (type) => {
    const labels = {
      PARTICULIER: t('salesPages.individual'),
      VIP: t('salesPages.vip'),
      PROFESSIONNEL: t('salesPages.company'),
      ENTREPRISE: t('salesPages.company'),
      FIDELE: t('salesPages.loyalCustomer'),
    };
    return labels[type] || type;
  };

  const isEntreprise = formData.typeClient === 'ENTREPRISE';

  // Réinitialisation du formulaire
  useEffect(() => {
    if (client) {
      setFormData({
        nom: client.nom || '',
        prenom: client.prenom || '',
        email: client.email || '',
        telephone: client.telephone || '',
        adresse: client.adresse || '',
        typeClient: client.typeClient || 'PARTICULIER',
        raisonSociale: client.raisonSociale || '',
        matriculeFiscale: client.matriculeFiscale || ''
      });
    } else {
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        adresse: '',
        typeClient: 'PARTICULIER',
        raisonSociale: '',
        matriculeFiscale: ''
      });
    }
    // Réinitialiser les erreurs et touches
    setErrors({});
    setTouched({});
    setTelephoneExists(false);
    setMatriculeExists(false);
  }, [client, open]);

  // Chargement de la remise
  useEffect(() => {
    const fetchRemise = async () => {
      if (!formData.typeClient || !getRemiseForType) return;
      if (fetchingRemise.current || previousTypeClient.current === formData.typeClient) return;

      fetchingRemise.current = true;
      previousTypeClient.current = formData.typeClient;

      try {
        const response = await getRemiseForType(formData.typeClient);
        setRemiseInfo(response?.success ? response : null);
      } catch (error) {
        console.error('Erreur chargement remise:', error);
        setRemiseInfo(null);
      } finally {
        fetchingRemise.current = false;
      }
    };

    fetchRemise();
  }, [formData.typeClient, getRemiseForType]);

  // Fonctions de validation
  const validateNom = (value) => {
    if (!value || value.trim() === '') {
      return 'Le nom est obligatoire';
    }
    if (value.length < 2) {
      return 'Le nom doit contenir au moins 2 caractères';
    }
    if (value.length > 50) {
      return 'Le nom ne peut pas dépasser 50 caractères';
    }
    if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(value)) {
      return 'Le nom ne doit contenir que des lettres, espaces, tirets ou apostrophes';
    }
    return '';
  };

  const validatePrenom = (value) => {
    if (value && value.length > 50) {
      return 'Le prénom ne peut pas dépasser 50 caractères';
    }
    if (value && !/^[a-zA-ZÀ-ÿ\s\-']+$/.test(value)) {
      return 'Le prénom ne doit contenir que des lettres, espaces, tirets ou apostrophes';
    }
    return '';
  };

  const validateEmail = (value) => {
    if (!value || value.trim() === '') {
      return 'L\'email est obligatoire';
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) {
      return 'Format d\'email invalide (ex: nom@domaine.com)';
    }
    return '';
  };

  const validateTelephone = (value) => {
    if (!value || value.trim() === '') {
      return 'Le téléphone est obligatoire';
    }
    const phoneRegex = /^[0-9+\-\s]{8,20}$/;
    if (!phoneRegex.test(value)) {
      return 'Format de téléphone invalide (8-20 chiffres, +, -, espaces)';
    }
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length < 8 || digitsOnly.length > 12) {
      return 'Le numéro doit contenir entre 8 et 12 chiffres';
    }
    return '';
  };

  const validateAdresse = (value) => {
    if (!value || value.trim() === '') {
      return 'L\'adresse est obligatoire';
    }
    if (value.length < 5) {
      return 'L\'adresse doit contenir au moins 5 caractères';
    }
    if (value.length > 200) {
      return 'L\'adresse ne peut pas dépasser 200 caractères';
    }
    return '';
  };

  const validateRaisonSociale = (value) => {
    if (isEntreprise) {
      if (!value || value.trim() === '') {
        return 'La raison sociale est obligatoire pour les entreprises';
      }
      if (value.length < 3) {
        return 'La raison sociale doit contenir au moins 3 caractères';
      }
      if (value.length > 100) {
        return 'La raison sociale ne peut pas dépasser 100 caractères';
      }
    }
    return '';
  };

  const validateMatriculeFiscale = (value) => {
    if (isEntreprise) {
      if (!value || value.trim() === '') {
        return 'Le matricule fiscal est obligatoire pour les entreprises';
      }
      const matriculeRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{3,50}$/;
      if (!matriculeRegex.test(value)) {
        return 'Le matricule fiscal doit contenir à la fois des lettres ET des chiffres (3-50 caractères)';
      }
    }
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'nom': return validateNom(value);
      case 'prenom': return validatePrenom(value);
      case 'email': return validateEmail(value);
      case 'telephone': return validateTelephone(value);
      case 'adresse': return validateAdresse(value);
      case 'raisonSociale': return validateRaisonSociale(value);
      case 'matriculeFiscale': return validateMatriculeFiscale(value);
      default: return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validation en temps réel
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    
    if (name === 'typeClient') {
      setRemiseInfo(null);
      // Réinitialiser les erreurs des champs entreprise quand on change de type
      if (value !== 'ENTREPRISE') {
        setErrors(prev => ({ ...prev, raisonSociale: '', matriculeFiscale: '' }));
        setMatriculeExists(false);
      }
    }
    
    // Vérifications avec debounce pour les appels API
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    if (name === 'telephone' && value.length >= 8 && checkTelephone && !error) {
      debounceTimer.current = setTimeout(() => verifyTelephone(value), 500);
    }
    
    if (name === 'matriculeFiscale' && value.length >= 5 && checkMatriculeFiscale && isEntreprise && !error) {
      debounceTimer.current = setTimeout(() => verifyMatriculeFiscale(value), 500);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const verifyTelephone = async (telephone) => {
    if (!checkTelephone) return;
    
    const digitsOnly = telephone.replace(/\D/g, '');
    try {
      const response = await checkTelephone(digitsOnly);
      if (response?.exists && (!client || client.telephone?.replace(/\D/g, '') !== digitsOnly)) {
        setTelephoneExists(true);
        setErrors(prev => ({ ...prev, telephone: 'Ce numéro de téléphone est déjà utilisé' }));
      } else {
        setTelephoneExists(false);
        const error = validateTelephone(telephone);
        setErrors(prev => ({ ...prev, telephone: error }));
      }
    } catch (error) {
      console.error('Erreur verification telephone:', error);
    }
  };

  const verifyMatriculeFiscale = async (matricule) => {
    if (!checkMatriculeFiscale) return;
    
    try {
      const response = await checkMatriculeFiscale(matricule.toUpperCase());
      if (response?.exists && (!client || client.matriculeFiscale?.toUpperCase() !== matricule.toUpperCase())) {
        setMatriculeExists(true);
        setErrors(prev => ({ ...prev, matriculeFiscale: 'Ce matricule fiscal est déjà utilisé' }));
      } else {
        setMatriculeExists(false);
        const error = validateMatriculeFiscale(matricule);
        setErrors(prev => ({ ...prev, matriculeFiscale: error }));
      }
    } catch (error) {
      console.error('Erreur vérification matricule:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Marquer tous les champs comme touchés
    const allTouched = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    // Valider tous les champs
    const newErrors = {};
    let isValid = true;
    
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      newErrors[key] = error;
      if (error) isValid = false;
    });
    
    setErrors(newErrors);
    
    // Vérifier les duplications
    if (telephoneExists) {
      toast.error('Ce numéro de téléphone est déjà utilisé');
      isValid = false;
    }
    
    if (isEntreprise && matriculeExists) {
      toast.error('Ce matricule fiscal est déjà utilisé');
      isValid = false;
    }
    
    if (!isValid) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    const dataToSend = {
      nom: formData.nom.trim(),
      prenom: formData.prenom?.trim() || "",
      email: formData.email.trim().toLowerCase(),
      telephone: formData.telephone.replace(/\s/g, ''),
      adresse: formData.adresse.trim(),
      type: formData.typeClient.toUpperCase(),
      ...(isEntreprise && {
        raisonSociale: formData.raisonSociale.trim(),
        matriculeFiscale: formData.matriculeFiscale.trim().toUpperCase()
      })
    };

    setLoading(true);
    try {
      const response = await createClient(dataToSend);

      if (response?.success) {
        if (onSuccess) {
          onSuccess(response.message || (client ? 'Client modifié avec succès' : 'Client créé avec succès'));
        }
        if (onClose) {
          onClose();
        }
      } else {
        toast.error(response?.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  // Couleur de bordure selon l'erreur
  const inputClass = (fieldName) => {
    const baseClass = "w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-offset-0 transition-all bg-gray-50/50 hover:bg-white";
    if (touched[fieldName] && errors[fieldName]) {
      return `${baseClass} border-red-500 focus:border-red-500 focus:ring-red-500/20`;
    }
    return `${baseClass} border-gray-300 focus:ring-indigo-500 focus:border-indigo-500`;
  };

  return (
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-indigo-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">
                {client ? t('salesPages.editClient') : t('salesPages.newClient')}
              </h2>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-all p-1.5 hover:bg-white/20 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECTION 1: IDENTITÉ */}
            <div className="space-y-3">
              <h3 className="text-md font-semibold text-indigo-700 flex items-center gap-2">
                <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
                {t('salesPages.identity')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={inputClass('nom')}
                    placeholder="Ben Ali"
                  />
                  {touched.nom && errors.nom && (
                    <p className="text-xs text-red-500 mt-1">{errors.nom}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={inputClass('prenom')}
                    placeholder="Mohamed"
                  />
                  {touched.prenom && errors.prenom && (
                    <p className="text-xs text-red-500 mt-1">{errors.prenom}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: CONTACT */}
            <div className="space-y-3">
              <h3 className="text-md font-semibold text-emerald-700 flex items-center gap-2">
                <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
                {t('salesPages.contact')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={inputClass('email')}
                    placeholder="mohamed.benali@email.tn"
                  />
                  {touched.email && errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={inputClass('telephone')}
                    placeholder="98 765 432"
                  />
                  {touched.telephone && errors.telephone && (
                    <p className="text-xs text-red-500 mt-1">{errors.telephone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: ADRESSE */}
            <div className="space-y-3">
              <h3 className="text-md font-semibold text-amber-700 flex items-center gap-2">
                <span className="w-1 h-5 bg-amber-500 rounded-full"></span>
                Adresse
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse complète <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  rows="2"
                  className={inputClass('adresse')}
                  placeholder="15 Avenue Habib Bourguiba, Tunis 1000"
                />
                {touched.adresse && errors.adresse && (
                  <p className="text-xs text-red-500 mt-1">{errors.adresse}</p>
                )}
              </div>
            </div>

            {/* SECTION 4: CATÉGORIE */}
            <div className="space-y-3">
              <h3 className="text-md font-semibold text-purple-700 flex items-center gap-2">
                <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
                Catégorie
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de client <span className="text-red-500">*</span>
                </label>
                <select
                  name="typeClient"
                  value={formData.typeClient}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClass('typeClient')}
                >
                  {clientTypes
                    ?.filter(type => type === 'PARTICULIER' || type === 'ENTREPRISE')
                    .map((type) => (
                      <option key={type} value={type}>
                        {getTypeClientLabel(type)}
                      </option>
                    ))}
                </select>

                {remiseInfo?.remise > 0 && (
                  <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-sm text-purple-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                      Remise de {remiseInfo.remise}% applicable à ce type de client
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 5: INFORMATIONS ENTREPRISE */}
            {isEntreprise && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <h3 className="text-md font-semibold text-blue-700 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                  Informations Entreprise
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Raison sociale <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="raisonSociale"
                        value={formData.raisonSociale}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`${inputClass('raisonSociale')} pl-10`}
                        placeholder="Nom de l'entreprise"
                      />
                    </div>
                    {touched.raisonSociale && errors.raisonSociale && (
                      <p className="text-xs text-red-500 mt-1">{errors.raisonSociale}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Matricule fiscal <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IdentificationIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="matriculeFiscale"
                        value={formData.matriculeFiscale}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`${inputClass('matriculeFiscale')} pl-10 uppercase`}
                        placeholder="1234567X"
                      />
                    </div>
                    {touched.matriculeFiscale && errors.matriculeFiscale && (
                      <p className="text-xs text-red-500 mt-1">{errors.matriculeFiscale}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Résumé des erreurs */}
            {Object.values(errors).some(e => e) && (
              <div className="rounded-lg bg-red-50 p-3 border border-red-200">
                <p className="text-sm font-medium text-red-800">⚠️ Veuillez corriger les erreurs suivantes :</p>
                <ul className="mt-1 list-disc list-inside text-xs text-red-700">
                  {Object.entries(errors).map(([field, error]) => 
                    error && <li key={field}>• {error}</li>
                  )}
                </ul>
              </div>
            )}

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all hover:shadow-sm"
              >
                {t('salesPages.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>{t('salesPages.inProgress')}</span>
                  </>
                ) : (
                  <span>{client ? t('salesPages.edit') : t('salesPages.create')}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientFormModal;