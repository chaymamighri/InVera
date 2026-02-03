import React, { useState } from 'react';
import Button from './Button';

const LoginForm = ({ onSubmit, loading: externalLoading = false }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [internalLoading, setInternalLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Utilise le loading externe s'il est fourni, sinon le loading interne
  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Effacer aussi l'erreur générale
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Réinitialiser les erreurs
    setErrors({});
    
    // 2. Validation simple (pas de loading ici)
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    if (!formData.password) {
      newErrors.password = 'Mot de passe requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Pas de loading, on s'arrête ici
    }

    // 3. Si validation OK, on démarre le loading
    if (externalLoading === undefined) {
      setInternalLoading(true);
    }
    
    try {
      // 4. Appeler la fonction onSubmit (doit gérer la redirection si succès)
      await onSubmit(formData);
      
      // 5. Si succès: onSubmit doit faire la redirection
      // Le loading s'arrêtera automatiquement avec la navigation
      
    } catch (error) {
      // 6. Si erreur: arrêter le loading et afficher l'erreur
      const errorMessage = error.message || error.toString();
      
      // Détection du type d'erreur
      if (
        errorMessage.toLowerCase().includes('mot de passe') ||
        errorMessage.toLowerCase().includes('password') ||
        errorMessage.toLowerCase().includes('incorrect') ||
        errorMessage.toLowerCase().includes('invalid') ||
        errorMessage.includes('401')
      ) {
        setErrors({ 
          submit: 'Mot de passe incorrect. Veuillez réessayer.',
          password: 'Mot de passe incorrect'
        });
      } else if (
        errorMessage.toLowerCase().includes('utilisateur') ||
        errorMessage.toLowerCase().includes('user') ||
        errorMessage.toLowerCase().includes('email') ||
        errorMessage.toLowerCase().includes('compte')
      ) {
        setErrors({ 
          submit: 'Aucun compte trouvé avec cet email.',
          email: 'Email non reconnu'
        });
      } else {
        setErrors({ submit: errorMessage || 'Une erreur est survenue lors de la connexion' });
      }
      
    } finally {
      // 7. Toujours arrêter le loading (même en cas d'erreur)
      if (externalLoading === undefined) {
        setInternalLoading(false);
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="max-w-md w-full space-y-6">
      {/* En-tête du formulaire */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Connectez-vous à votre compte
        </h2>
        <p className="mt-2 text-gray-600">
          Entrez vos identifiants pour accéder à la plateforme
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Champ Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Adresse email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className={`block w-full pl-10 pr-3 py-3 border ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              } rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              placeholder="vous@entreprise.com"
              disabled={isLoading}
            />
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Champ Mot de passe */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <button
              type="button"
              onClick={() => alert('Fonctionnalité à implémenter')}
              className="text-sm text-blue-600 hover:text-blue-500 font-medium disabled:text-gray-400"
              disabled={isLoading}
            >
              Mot de passe oublié ?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              className={`block w-full pl-10 pr-12 py-3 border ${
                errors.password ? 'border-red-300' : 'border-gray-300'
              } rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              placeholder="••••••••"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={isLoading}
            >
              {showPassword ? (
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center">
          <input
            id="remember-me"
            name="rememberMe"
            type="checkbox"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
            disabled={isLoading}
          />
          <label htmlFor="remember-me" className="ml-2 text-sm text-gray-700">
            Se souvenir de moi 
          </label>
        </div>

        {/* Bouton de connexion */}
        <Button
          type="submit"
          loading={isLoading}
          fullWidth
          variant="primary"
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? 'Connexion...' : 'Se connecter'}
        </Button>

        {/* Message d'erreur général */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.submit}
            </div>
          </div>
        )}
      </form>

      {/* Séparateur */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Ou contacter Nous</span>
        </div>
      </div>
      
      {/* Bouton pour contacter */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => alert('Page contact à implémenter')}
          className="inline-flex items-center justify-center w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium"
          disabled={isLoading}
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Contactez l'administrateur
        </button>
        <p className="mt-2 text-xs text-gray-500">
          Pour obtenir un compte ou assistance technique
        </p>
      </div>
    </div>
  );
};

export default LoginForm;