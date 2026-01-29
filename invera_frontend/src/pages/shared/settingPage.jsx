// src/pages/settings/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  LockClosedIcon,
  ShieldCheckIcon,
  BellIcon,
  GlobeAltIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import Header from '../../components/Header';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('security');
  const [userData, setUserData] = useState({
    nom: '',
    prenom: '',
    email: ''
  });

  // États pour le changement de mot de passe
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Récupérer les données utilisateur
    const userInfo = {
      nom: localStorage.getItem('userNom') || 'Nom',
      prenom: localStorage.getItem('userPrenom') || 'Prénom',
      email: localStorage.getItem('userEmail') || 'email@exemple.com'
    };
    setUserData(userInfo);
  }, []);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    // Effacer les erreurs quand l'utilisateur modifie
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordForm.currentPassword.trim()) {
      errors.currentPassword = 'Le mot de passe actuel est requis';
    }
    
    if (!passwordForm.newPassword.trim()) {
      errors.newPassword = 'Le nouveau mot de passe est requis';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Le mot de passe doit contenir au moins 8 caractères';
    }
    
    if (!passwordForm.confirmPassword.trim()) {
      errors.confirmPassword = 'Veuillez confirmer le mot de passe';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    return errors;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    
    const errors = validatePasswordForm();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simuler une requête API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Ici, vous feriez un appel API réel
      // await api.changePassword(passwordForm);
      
      // Succès
      setSuccessMessage('Mot de passe modifié avec succès !');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
      
      // Effacer le message après 5 secondes
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
    } catch (error) {
      setErrorMessage('Erreur lors de la modification du mot de passe');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { 
      id: 'security', 
      name: 'Sécurité', 
      icon: <ShieldCheckIcon className="h-5 w-5" />,
      description: 'Gérez la sécurité de votre compte et modifiez votre mot de passe'
    },
    { 
      id: 'notifications', 
      name: 'Notifications', 
      icon: <BellIcon className="h-5 w-5" />,
      description: 'Configurez vos préférences de notifications'
    },
    { 
      id: 'language', 
      name: 'Langue', 
      icon: <GlobeAltIcon className="h-5 w-5" />,
      description: 'Choisissez votre langue préférée'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bouton retour */}
        <Link 
          to="/profile" 
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Retour au profil
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar des paramètres */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Paramètres</h2>
              
              <nav className="space-y-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 font-semibold border-l-4 border-blue-500'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`}>
                      {tab.icon}
                    </span>
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* En-tête de la section active DANS LA MÊME BORDURE */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100 p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {tabs.find(t => t.id === activeTab)?.icon}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {tabs.find(t => t.id === activeTab)?.name}
                    </h1>
                  </div>
                </div>
                <p className="text-gray-600 text-lg">
                  {tabs.find(t => t.id === activeTab)?.description}
                </p>
              </div>

              {/* Contenu selon l'onglet actif */}
              <div className="p-8">
                {activeTab === 'security' && (
                  <div className="space-y-8">
                    {/* Messages de succès/erreur */}
                    {successMessage && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                        <span className="text-green-700">{successMessage}</span>
                      </div>
                    )}
                    
                    {errorMessage && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-600 mr-3" />
                        <span className="text-red-700">{errorMessage}</span>
                      </div>
                    )}

                    {/* Changement de mot de passe */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-6">
                        <LockClosedIcon className="h-5 w-5 inline mr-2 text-blue-600" />
                        Changer le mot de passe
                      </h3>
                      
                      <form onSubmit={handlePasswordSubmit} className="space-y-6">
                        <div className="space-y-4">
                          {/* Mot de passe actuel */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Mot de passe actuel
                            </label>
                            <input
                              type="password"
                              name="currentPassword"
                              value={passwordForm.currentPassword}
                              onChange={handlePasswordChange}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                              }`}
                              placeholder="Entrez votre mot de passe actuel"
                            />
                            {passwordErrors.currentPassword && (
                              <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                            )}
                          </div>

                          {/* Nouveau mot de passe */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nouveau mot de passe
                            </label>
                            <input
                              type="password"
                              name="newPassword"
                              value={passwordForm.newPassword}
                              onChange={handlePasswordChange}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                              }`}
                              placeholder="Minimum 8 caractères"
                            />
                            {passwordErrors.newPassword && (
                              <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                              Utilisez au moins 8 caractères avec des lettres majuscules, minuscules et des chiffres
                            </p>
                          </div>

                          {/* Confirmation du mot de passe */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Confirmer le nouveau mot de passe
                            </label>
                            <input
                              type="password"
                              name="confirmPassword"
                              value={passwordForm.confirmPassword}
                              onChange={handlePasswordChange}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                              }`}
                              placeholder="Retapez votre nouveau mot de passe"
                            />
                            {passwordErrors.confirmPassword && (
                              <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-600 transition-all ${
                              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                          >
                            {isSubmitting ? (
                              <span className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Modification en cours...
                              </span>
                            ) : (
                              'Mettre à jour le mot de passe'
                            )}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Sessions actives */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        <ShieldCheckIcon className="h-5 w-5 inline mr-2 text-blue-600" />
                        Sécurité supplémentaire
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                          <div>
                            <h4 className="font-medium text-gray-800">Sessions actives</h4>
                            <p className="text-sm text-gray-600">Gérez vos sessions de connexion</p>
                          </div>
                          <Link
                            to="/sessions"
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-blue-600 hover:bg-gray-50 transition-colors"
                          >
                            Voir
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Onglet Notifications */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="text-center py-12">
                      <BellIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        Configuration des notifications
                      </h3>
                      <p className="text-gray-500">
                        Cette fonctionnalité est en cours de développement.
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Bientôt disponible !
                      </p>
                    </div>
                  </div>
                )}

                {/* Onglet Langue */}
                {activeTab === 'language' && (
                  <div className="space-y-6">
                    <div className="text-center py-12">
                      <GlobeAltIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        Sélection de la langue
                      </h3>
                      <p className="text-gray-500">
                        Cette fonctionnalité est en cours de développement.
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Bientôt disponible !
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;