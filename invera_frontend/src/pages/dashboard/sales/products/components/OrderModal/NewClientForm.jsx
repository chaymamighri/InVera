// src/pages/dashboard/sales/products/components/OrderModal/NewClientForm.jsx
import React, { useState, useEffect } from 'react';
import { 
  UserPlusIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import clientService from '../../../../../../services/clientService';

const NewClientForm = ({
  nouveauClient,
  setNouveauClient,
  getTypeDisplayName,
  setSelectedClient,
  setNewClientMode,
  applyRemiseByClientType,
  loadClients
}) => {
  const [loadingNewClient, setLoadingNewClient] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [phoneChecking, setPhoneChecking] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailChecking, setEmailChecking] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingClientTypes, setLoadingClientTypes] = useState(false);
  const [availableClientTypes, setAvailableClientTypes] = useState([]);
  const [clientTypeError, setClientTypeError] = useState('');

  // Fonction pour récupérer les types de clients depuis l'API backend
  const fetchClientTypesFromAPI = async () => {
    setLoadingClientTypes(true);
    setClientTypeError('');
    
    try {
      const response = await clientService.getClientTypes();
      
      if (response && response.success && response.types && Array.isArray(response.types)) {
        setAvailableClientTypes(response.types);
        
        // Si le formulaire n'a pas encore de type défini, définir le premier comme valeur par défaut
        if (!nouveauClient.typeClient && response.types.length > 0) {
          setNouveauClient(prev => ({
            ...prev,
            typeClient: response.types[0]
          }));
        }
      } else {
        console.warn('Structure de réponse inattendue pour les types de clients:', response);
        setClientTypeError('Format de réponse inattendu de l\'API');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des types de clients:', error);
      setClientTypeError('Impossible de charger les types de clients');
    } finally {
      setLoadingClientTypes(false);
    }
  };

  // Charger les types de clients au montage du composant
  useEffect(() => {
    fetchClientTypesFromAPI();
  }, []);

  // Réinitialiser le formulaire quand on entre en mode nouveau client
  useEffect(() => {
    if (!nouveauClient.nom && !nouveauClient.telephone) {
      setFormErrors({});
      setPhoneError('');
      setEmailError('');
      setSuccessMessage('');
    }
  }, [nouveauClient.nom, nouveauClient.telephone]);

  // Valider le formulaire
  const validateForm = () => {
    const errors = {};
    
    // Validation du nom
    if (!nouveauClient.nom || !nouveauClient.nom.trim()) {
      errors.nom = 'Le nom est obligatoire';
    } else if (nouveauClient.nom.trim().length < 2) {
      errors.nom = 'Le nom doit contenir au moins 2 caractères';
    }
    
    // Validation du téléphone
    if (!nouveauClient.telephone || !nouveauClient.telephone.trim()) {
      errors.telephone = 'Le téléphone est obligatoire';
    } else if (!/^[0-9\s\-\+\(\)]{8,15}$/.test(nouveauClient.telephone.replace(/\s/g, ''))) {
      errors.telephone = 'Format de téléphone invalide';
    }
    
    // Validation de l'adresse
    if (!nouveauClient.adresse || !nouveauClient.adresse.trim()) {
      errors.adresse = 'L\'adresse est obligatoire';
    } else if (nouveauClient.adresse.trim().length < 5) {
      errors.adresse = 'L\'adresse doit contenir au moins 5 caractères';
    }
    
    // Validation de l'email si fourni
    if (nouveauClient.email && nouveauClient.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nouveauClient.email)) {
      errors.email = 'Format d\'email invalide';
    }
    
    // Validation du type de client
    if (!nouveauClient.typeClient) {
      errors.typeClient = 'Le type de client est obligatoire';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Vérifier le numéro de téléphone
  const checkPhoneNumber = async (phone) => {
    if (!phone || phone.trim() === '') {
      setPhoneError('');
      return;
    }

    setPhoneChecking(true);
    try {
      if (clientService.verifyPhone) {
        const response = await clientService.verifyPhone(phone);
        if (response.exists) {
          setPhoneError('Ce numéro de téléphone est déjà utilisé');
        } else {
          setPhoneError('');
        }
      }
    } catch (error) {
      console.error('Erreur vérification téléphone:', error);
    } finally {
      setPhoneChecking(false);
    }
  };

  // Vérifier l'email
  const checkEmail = async (email) => {
    if (!email || email.trim() === '') {
      setEmailError('');
      return;
    }

    setEmailChecking(true);
    try {
      if (clientService.verifyEmail) {
        const response = await clientService.verifyEmail(email);
        if (response.exists) {
          setEmailError('Cet email est déjà utilisé');
        } else {
          setEmailError('');
        }
      }
    } catch (error) {
      console.error('Erreur vérification email:', error);
    } finally {
      setEmailChecking(false);
    }
  };

  // Gérer l'ajout de nouveau client
  const handleAddNewClient = async () => {
    // Validation
    if (!validateForm()) {
      return;
    }

    if (phoneError || emailError) {
      return;
    }

    // S'assurer qu'il y a un type de client
    if (!nouveauClient.typeClient && availableClientTypes.length > 0) {
      setNouveauClient(prev => ({
        ...prev,
        typeClient: availableClientTypes[0]
      }));
    }

    const typeClient = nouveauClient.typeClient;
    
    // Préparer les données pour l'API
    const clientData = {
      nom: nouveauClient.nom.trim(),
      prenom: nouveauClient.prenom?.trim() || '',
      telephone: nouveauClient.telephone.trim().replace(/\s/g, ''),
      adresse: nouveauClient.adresse.trim(),
      type: typeClient,
      email: nouveauClient.email?.trim() || ''
    };

    setLoadingNewClient(true);
    setSuccessMessage('');
    
    try {
      // APPEL API RÉEL POUR CRÉER LE CLIENT
      console.log('📤 Envoi des données client à l\'API:', clientData);
      const response = await clientService.createClient(clientData);
      
      if (response.success || response.client) {
        const newClient = response.client || response.data;
        
        console.log('✅ Client ajouté à la base de données:', newClient);
        
        // Sélectionner automatiquement le nouveau client
        if (setSelectedClient && typeof setSelectedClient === 'function') {
          try {
            setSelectedClient(newClient);
            console.log('Client sélectionné avec succès:', newClient.nom);
          } catch (error) {
            console.error('Erreur lors de la sélection du client:', error);
          }
        } else {
          console.warn('setSelectedClient n\'est pas disponible ou n\'est pas une fonction');
        }
        
        // Appliquer la remise pour ce type de client
        if (applyRemiseByClientType && typeof applyRemiseByClientType === 'function') {
          try {
            await applyRemiseByClientType(typeClient);
            console.log(`Remise appliquée pour le type: ${typeClient}`);
          } catch (error) {
            console.error('Erreur lors de l\'application de la remise:', error);
          }
        }
        
        // Rafraîchir la liste des clients depuis la base
        if (loadClients && typeof loadClients === 'function') {
          try {
            await loadClients();
            console.log('✅ Liste des clients rafraîchie depuis la base');
          } catch (error) {
            console.error('Erreur lors du rafraîchissement:', error);
          }
        }
        
        // Message de succès
        const clientName = `${clientData.nom}${clientData.prenom ? ' ' + clientData.prenom : ''}`;
        setSuccessMessage(`✅ Client "${clientName}" ajouté à la base de données et sélectionné !`);
        
        // Réinitialiser le formulaire après un délai
        setTimeout(() => {
          const defaultType = availableClientTypes.length > 0 ? availableClientTypes[0] : '';
          
          const resetData = {
            nom: '',
            prenom: '',
            typeClient: defaultType || '',
            telephone: '',
            adresse: '',
            email: ''
          };
          
          setNouveauClient(resetData);
          setFormErrors({});
          setPhoneError('');
          setEmailError('');
          setSuccessMessage('');
          
          // Passer en mode client existant
          if (setNewClientMode && typeof setNewClientMode === 'function') {
            setTimeout(() => {
              setNewClientMode(false);
              console.log('🔄 Passé en mode client existant');
            }, 1000);
          }
        }, 3000);
        
      } else {
        alert(response.message || 'Erreur lors de la création du client');
      }
    } catch (error) {
      console.error('Erreur création client:', error);
      const errorMsg = error.response?.data?.message || 'Erreur lors de la création du client';
      setFormErrors(prev => ({ ...prev, _global: errorMsg }));
      
      // Message d'erreur spécifique
      if (error.response?.status === 400) {
        setFormErrors(prev => ({ ...prev, _global: 'Données invalides. Vérifiez les informations saisies.' }));
      } else if (error.response?.status === 409) {
        setFormErrors(prev => ({ ...prev, _global: 'Un client avec ce numéro de téléphone ou cet email existe déjà.' }));
      }
    } finally {
      setLoadingNewClient(false);
    }
  };

  // Fonction utilitaire pour afficher le nom du type de client
  const displayTypeName = (type) => {
    if (getTypeDisplayName && typeof getTypeDisplayName === 'function') {
      return getTypeDisplayName(type);
    }
    
    // Fallback si getTypeDisplayName n'est pas fourni
    return type
      ?.toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase()) || type;
  };

  // Fonction pour gérer les changements de champ
  const handleInputChange = (field, value) => {
    setNouveauClient(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur du champ s'il y en a
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6 p-6 border border-gray-200 rounded-xl bg-gray-50">
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-gray-800">Nouveau Client</h4>
    
      </div>
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-700 font-medium">{successMessage}</span>
          </div>
          <p className="text-xs text-green-600 mt-2">
            Le client a été enregistré dans la base de données et est maintenant sélectionné.
          </p>
        </div>
      )}
      
      {formErrors._global && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-700 font-medium">{formErrors._global}</span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={`w-full px-4 py-2.5 border ${
              formErrors.nom ? 'border-red-500' : 'border-gray-300'
            } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            value={nouveauClient.nom || ''}
            onChange={(e) => handleInputChange('nom', e.target.value)}
            placeholder="Nom"
            required
          />
          {formErrors.nom && (
            <p className="mt-1 text-sm text-red-600">{formErrors.nom}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prénom  <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={nouveauClient.prenom || ''}
            onChange={(e) => handleInputChange('prenom', e.target.value)}
            placeholder="Prénom"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de client <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              className={`w-full px-4 py-2.5 border ${
                formErrors.typeClient ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
              value={nouveauClient.typeClient || ''}
              onChange={(e) => handleInputChange('typeClient', e.target.value)}
              disabled={loadingClientTypes || availableClientTypes.length === 0}
              required
            >
              {loadingClientTypes ? (
                <option value="">Chargement des types...</option>
              ) : availableClientTypes.length === 0 ? (
                <option value="">Aucun type disponible</option>
              ) : (
                <>
                  <option value="">Sélectionner un type</option>
                  {availableClientTypes.map(type => (
                    <option key={type} value={type}>
                      {displayTypeName(type)}
                    </option>
                  ))}
                </>
              )}
            </select>
            {loadingClientTypes && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          {clientTypeError && (
            <p className="mt-1 text-sm text-yellow-600">{clientTypeError}</p>
          )}
          {formErrors.typeClient && (
            <p className="mt-1 text-sm text-red-600">{formErrors.typeClient}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Types chargés depuis la base de données
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Téléphone <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              className={`w-full px-4 py-2.5 border ${
                phoneError || formErrors.telephone ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              value={nouveauClient.telephone || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9\s\-\+\(\)]/g, '');
                handleInputChange('telephone', value);
                checkPhoneNumber(value);
              }}
              placeholder="55 123 456"
              required
            />
            {phoneChecking && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          {phoneError && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <XCircleIcon className="h-3 w-3 mr-1" /> {phoneError}
            </p>
          )}
          {formErrors.telephone && (
            <p className="mt-1 text-sm text-red-600">{formErrors.telephone}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Format: 55 123 456 ou 55123456
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email  <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="email"
            className={`w-full px-4 py-2.5 border ${
              emailError || formErrors.email ? 'border-red-500' : 'border-gray-300'
            } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            value={nouveauClient.email || ''}
            onChange={(e) => {
              handleInputChange('email', e.target.value);
              checkEmail(e.target.value);
            }}
            placeholder="email@exemple.com"
          />
          {emailChecking && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
        {emailError && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <XCircleIcon className="h-3 w-3 mr-1" /> {emailError}
          </p>
        )}
        {formErrors.email && (
          <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Adresse <span className="text-red-500">*</span>
        </label>
        <textarea
          className={`w-full px-4 py-2.5 border ${
            formErrors.adresse ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          rows="3"
          value={nouveauClient.adresse || ''}
          onChange={(e) => handleInputChange('adresse', e.target.value)}
          placeholder="Numéro, rue, ville, code postal..."
          required
        />
        {formErrors.adresse && (
          <p className="mt-1 text-sm text-red-600">{formErrors.adresse}</p>
        )}
      </div>

      <div className="pt-4">
        <button
          onClick={handleAddNewClient}
          disabled={
            loadingNewClient || 
            loadingClientTypes ||
            !nouveauClient.nom || 
            !nouveauClient.telephone || 
            !nouveauClient.adresse ||
            !nouveauClient.typeClient ||
            phoneError || 
            emailError ||
            availableClientTypes.length === 0
          }
          className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg hover:from-green-700 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center transition-all shadow-sm hover:shadow-md"
        >
          {loadingNewClient ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Ajout au système en cours...
            </>
          ) : (
            <>
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Ajouter Client
            </>
          )}
        </button>
        
        <div className="mt-3 text-xs text-gray-500 text-center">
    
          <p>Le client est automatiquement sélectionné </p>
        
        </div>
      </div>
    </div>
  );
};

export default NewClientForm;