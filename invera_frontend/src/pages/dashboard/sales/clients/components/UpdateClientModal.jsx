// UpdateClientModal.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const UpdateClientModal = ({ open, onClose, client, onSuccess, updateClient }) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    adresse: '',
    typeClient: 'PARTICULIER'
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
        typeClient: client.typeClient || 'PARTICULIER'
      });
      setClientRemise(client.remise || 0);
    }
  }, [client]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom?.trim()) {
      newErrors.nom = 'Le nom est requis';
    }

    if (!formData.prenom?.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }

    if (!formData.telephone?.trim()) {
      newErrors.telephone = 'Le téléphone est requis';
    } else if (!/^[0-9+\-\s]{8,}$/.test(formData.telephone)) {
      newErrors.telephone = 'Numéro de téléphone invalide';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.typeClient) {
      newErrors.typeClient = 'Le type de client est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
        typeClient: formData.typeClient
      };

      console.log('🔵 Modification du client:', client.idClient);
      console.log('📤 Données envoyées:', updateData);

      // ✅ Utilisation de la méthode updateClient du hook
      const response = await updateClient(client.idClient, updateData);
      
      console.log('✅ Réponse reçue:', response);

      if (response?.success) {
        onSuccess('Client modifié avec succès');
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
          toast.error('Client non trouvé');
        } else if (status === 409) {
          toast.error('Ce numéro de téléphone est déjà utilisé');
        } else {
          toast.error('Erreur lors de la modification du client');
        }
      } else {
        toast.error('Erreur de connexion au serveur');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h2 className="text-xl font-semibold text-white">
                Modifier le client
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Formulaire */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* SECTION 1: IDENTITÉ */}
            <div className="space-y-3">
              <h3 className="text-md font-medium text-gray-700">Identité</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Dupont"
                  />
                  {errors.nom && (
                    <p className="text-xs text-red-500 mt-1">{errors.nom}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Jean"
                  />
                  {errors.prenom && (
                    <p className="text-xs text-red-500 mt-1">{errors.prenom}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: CONTACT */}
            <div className="space-y-3">
              <h3 className="text-md font-medium text-gray-700">Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="jean.dupont@email.com"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="01 23 45 67 89"
                  />
                  {errors.telephone && (
                    <p className="text-xs text-red-500 mt-1">{errors.telephone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: ADRESSE */}
            <div className="space-y-3">
              <h3 className="text-md font-medium text-gray-700">Adresse</h3>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Adresse complète
                </label>
                <textarea
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="15 rue de la République, 75001 Paris"
                />
              </div>
            </div>

            {/* SECTION 4: CATÉGORIE */}
            <div className="space-y-3">
              <h3 className="text-md font-medium text-gray-700">Catégorie</h3>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Type de client <span className="text-red-500">*</span>
                </label>
                <select
                  name="typeClient"
                  value={formData.typeClient}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="PARTICULIER">Particulier</option>
                  <option value="VIP">VIP</option>
                  <option value="ENTREPRISE">Entreprise</option>
                  <option value="FIDELE">Fidèle</option>
                </select>
              </div>

              {/* Affichage de la remise */}
              {clientRemise > 0 && (
                <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-600">Remise appliquée</span>
                    </div>
                    <span className="text-lg font-semibold text-blue-600">{clientRemise}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Modification...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Modifier</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateClientModal;
