import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

const ClientFormModal = ({ 
  open, 
  onClose, 
  client, 
  onSuccess,
  checkTelephone,
  getRemiseForType,
  clientTypes,
  createClient
}) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    typeClient: 'PARTICULIER'
  });
  const [loading, setLoading] = useState(false);
  const [telephoneError, setTelephoneError] = useState('');
  const [remiseInfo, setRemiseInfo] = useState(null);
  
  const fetchingRemise = useRef(false);
  const previousTypeClient = useRef('');

  const getTypeClientLabel = (type) => {
    const labels = {
      'PARTICULIER': 'Particulier',
      'ENTREPRISE': 'Entreprise',
    };
    return labels[type] || type;
  };

  useEffect(() => {
    if (client) {
      setFormData({
        nom: client.nom || '',
        prenom: client.prenom || '',
        email: client.email || '',
        telephone: client.telephone || '',
        adresse: client.adresse || '',
        typeClient: client.typeClient || 'PARTICULIER'
      });
    } else {
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        adresse: '',
        typeClient: 'PARTICULIER'
      });
    }
  }, [client]);

  useEffect(() => {
    const fetchRemise = async () => {
      if (!formData.typeClient || !getRemiseForType) return;
      if (fetchingRemise.current) return;
      if (previousTypeClient.current === formData.typeClient) return;
      
      fetchingRemise.current = true;
      previousTypeClient.current = formData.typeClient;
      
      try {
        const response = await getRemiseForType(formData.typeClient);
        if (response?.success) {
          setRemiseInfo(response);
        }
      } catch (error) {
        console.error('Erreur chargement remise:', error);
        setRemiseInfo(null);
      } finally {
        fetchingRemise.current = false;
      }
    };
    
    fetchRemise();
  }, [formData.typeClient, getRemiseForType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'typeClient') {
      setRemiseInfo(null);
    }
    
    if (name === 'telephone' && value.length >= 8 && checkTelephone) {
      verifyTelephone(value);
    }
  };

  const verifyTelephone = async (telephone) => {
    if (!checkTelephone) return;
    
    try {
      const response = await checkTelephone(telephone);
      if (response?.exists && (!client || client.telephone !== telephone)) {
        setTelephoneError('Ce numéro est déjà utilisé');
      } else {
        setTelephoneError('');
      }
    } catch (error) {
      console.error('Erreur vérification téléphone:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.email || !formData.telephone || !formData.adresse) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (telephoneError) {
      toast.error(telephoneError);
      return;
    }

    const dataToSend = {
      nom: formData.nom.trim(),
      prenom: formData.prenom?.trim() || "",
      email: formData.email.trim().toLowerCase(),
      telephone: formData.telephone.replace(/\s/g, ''),
      adresse: formData.adresse.trim(),
      type: formData.typeClient.toUpperCase()  
    };

    setLoading(true);
    try {
      const response = await createClient(dataToSend);
      
      if (response?.success) {
        if (onSuccess) {
          onSuccess(response.message || 'Client créé avec succès');
        }
        if (onClose) {
          onClose();
        }
      } else {
        toast.error(response?.message || 'Erreur lors de la création');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 border border-gray-200">
        {/* Header avec dégradé */}
        <div className="bg-gradient-to-r from-green-600 to-indigo-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">
                {client ? 'Modifier le client' : 'Nouveau client'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-all p-1.5 hover:bg-white/20 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Formulaire */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* SECTION 1: IDENTITÉ */}
            <div className="space-y-3">
              <h3 className="text-md font-semibold text-indigo-700 flex items-center gap-2">
                <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
                Identité
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50/50 hover:bg-white"
                    placeholder="Ben Ali"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50/50 hover:bg-white"
                    placeholder="Mohamed"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: CONTACT */}
            <div className="space-y-3">
              <h3 className="text-md font-semibold text-emerald-700 flex items-center gap-2">
                <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
                Contact
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-gray-50/50 hover:bg-white"
                    placeholder="mohamed.benali@email.tn"
                  />
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-gray-50/50 hover:bg-white"
                    placeholder="98 765 432"
                  />
                  {telephoneError && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {telephoneError}
                    </p>
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
                  rows="2"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-gray-50/50 hover:bg-white"
                  placeholder="15 Avenue Habib Bourguiba, Tunis 1000"
                />
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-gray-50/50 hover:bg-white"
                >
                  {clientTypes
                    ?.filter(type => type === 'PARTICULIER' || type === 'ENTREPRISE')
                    .map((type) => (
                      <option key={type} value={type}>
                        {getTypeClientLabel(type)}
                      </option>
                    ))}
                </select>

                {remiseInfo && remiseInfo.remise > 0 && (
                  <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-sm text-purple-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                      <span className="font-medium">Remise :</span> {remiseInfo.remise}% pour ce type de client
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all hover:shadow-sm"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>En cours...</span>
                  </>
                ) : (
                  <span>{client ? 'Modifier' : 'Créer'}</span>
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