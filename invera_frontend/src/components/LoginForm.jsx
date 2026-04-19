/**
 * COMPOSANT LOGIN FORM - Formulaire d'authentification principal
 * 
 * @description
 * Formulaire complet gérant :
 * - La connexion utilisateur avec "Se souvenir de moi"
 * - La réinitialisation du mot de passe (3 étapes)
 * - L'affichage des erreurs et messages de succès
 * 
 * 
 * @example
 * // Utilisation dans une page de connexion
 * <LoginForm 
 *   onSubmit={handleLogin}
 *   loading={isLoggingIn}
 *   savedEmail={storedEmail}
 * />
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { useAuth } from '../hooks/useAuth'; 

const LoginForm = ({ onSubmit, loading: externalLoading = false, savedEmail }) => {
  const navigate = useNavigate();
  const { forgotPassword, resetPassword, loading: authLoading } = useAuth(); 
  
  // ===== ÉTATS =====
  const [mode, setMode] = useState('login');              // 'login' ou 'forgot'
  const [formData, setFormData] = useState({
    email: savedEmail || '',
    password: '',
    rememberMe: false,
    resetCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [step, setStep] = useState(1);                    // Étape réinitialisation (1,2,3)
  const [internalLoading, setInternalLoading] = useState(false);
  const [errors, setErrors] = useState({});               // Erreurs de validation
  const [message, setMessage] = useState({ type: '', text: '' }); // Messages succès/erreur
  const [showPassword, setShowPassword] = useState({      // Visibilité des mots de passe
    password: false,
    newPassword: false,
    confirmPassword: false
  });
  const [countdown, setCountdown] = useState(0);          // Timer renvoi code (60s)

  // ===== EFFETS =====
  
  /**
   * Effet : Restaure l'email sauvegardé si "Se souvenir de moi" était actif
   * Vérifie également l'expiration du token
   */
  useEffect(() => {
    const rememberMe = localStorage.getItem('rememberMe');
    const savedEmail = localStorage.getItem('savedEmail');
    const expiry = localStorage.getItem('tokenExpiry');
    
    // Nettoyer si token expiré
    if (expiry && new Date(expiry) < new Date()) {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('savedEmail');
      localStorage.removeItem('tokenExpiry');
      return;
    }
    
    // Restaurer l'email
    if (rememberMe === 'true' && savedEmail) {
      setFormData(prev => ({
        ...prev,
        email: savedEmail,
        rememberMe: true
      }));
    }
  }, []);

  /**
   * Effet : Gère le compte à rebours pour le renvoi de code
   */
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // ===== VARIABLES DÉRIVÉES =====
  const isLoading = externalLoading || internalLoading || authLoading;

  // ===== VALIDATIONS =====
  
  /**
   * Valide le format d'un email
   * @param {string} email - Email à valider
   * @returns {string} Message d'erreur ou chaîne vide
   */
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email?.trim()) return 'Email requis';
    if (!emailRegex.test(email)) return 'Format d\'email invalide';
    return '';
  };

  /**
   * Valide le mot de passe de connexion
   * @param {string} password - Mot de passe à valider
   * @returns {string} Message d'erreur ou chaîne vide
   */
  const validatePassword = (password) => {
    if (!password?.trim()) return 'Mot de passe requis';
    if (password.length < 6) return 'Minimum 6 caractères';
    return '';
  };

  /**
   * Valide le nouveau mot de passe (réinitialisation)
   * @param {string} password - Nouveau mot de passe
   * @returns {string} Message d'erreur ou chaîne vide
   */
  const validateNewPassword = (password) => {
    if (!password?.trim()) return 'Mot de passe requis';
    if (password.length < 8) return 'Minimum 8 caractères';
    if (!/(?=.*[A-Z])/.test(password)) return 'Au moins une majuscule';
    if (!/(?=.*\d)/.test(password)) return 'Au moins un chiffre';
    if (!/(?=.*[!@#$%^&*])/.test(password)) return 'Au moins un caractère spécial';
    return '';
  };

  // ===== GESTIONNAIRES DE FORMULAIRE =====
  
  /**
   * Gère les changements dans les champs du formulaire
   * @param {Event} e - Événement de changement
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Efface les erreurs du champ modifié
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (message.text) setMessage({ type: '', text: '' });
  };

  /**
   * Affiche/masque un champ de mot de passe
   * @param {string} field - Champ à basculer ('password', 'newPassword', 'confirmPassword')
   */
  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // ===== CONNEXION =====
  
  /**
   * Soumet le formulaire de connexion
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Validation des champs
    const newErrors = {};
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;
    
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setInternalLoading(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Login error:', error);
      
      // Gestion des erreurs par type
      if (error.message) {
        if (error.message.includes('Email ou mot de passe incorrect') || 
            error.message.includes('401')) {
          setErrors({ 
            submit: 'Email ou mot de passe incorrect',
            password: 'Mot de passe incorrect'
          });
        } else if (error.message.includes('non trouvé') || 
                   error.message.includes('not found') || 
                   error.message.includes('404')) {
          setErrors({ 
            submit: 'Aucun compte trouvé avec cet email',
            email: 'Email non reconnu'
          });
        } else {
          setErrors({ 
            submit: error.message || 'Une erreur est survenue lors de la connexion'
          });
        }
      } else {
        setErrors({ 
          submit: 'Impossible de se connecter au serveur. Vérifiez votre connexion.'
        });
      }
    } finally {
      setInternalLoading(false);
    }
  };

  // ===== RÉINITIALISATION MOT DE PASSE =====
  
  /**
   * Étape 1 : Envoie le code de réinitialisation par email
   */
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrors({});
    
    const emailError = validateEmail(formData.email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setInternalLoading(true);
    try {
      await forgotPassword(formData.email);
      setMessage({
        type: 'success',
        text: `Un code de réinitialisation a été envoyé à ${formData.email}`
      });
      setStep(2);
      setCountdown(60);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Impossible d\'envoyer le code'
      });
    } finally {
      setInternalLoading(false);
    }
  };

  /**
   * Étape 2 : Vérifie le code saisi
   */
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!formData.resetCode?.trim()) {
      setErrors({ resetCode: 'Code requis' });
      return;
    }
    if (formData.resetCode.length !== 6) {
      setErrors({ resetCode: 'Le code doit contenir 6 chiffres' });
      return;
    }

    setStep(3);
    setMessage({
      type: 'success',
      text: 'Code vérifié avec succès'
    });
  };

  /**
   * Étape 3 : Réinitialise le mot de passe avec le code validé
   */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation du nouveau mot de passe
    const passwordError = validateNewPassword(formData.newPassword);
    if (passwordError) {
      setErrors({ newPassword: passwordError });
      return;
    }

    // Vérification de la confirmation
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Les mots de passe ne correspondent pas' });
      return;
    }

    setInternalLoading(true);
    try {
      await resetPassword(
        formData.resetCode,
        formData.email,
        formData.newPassword
      );
      
      setMessage({
        type: 'success',
        text: 'Mot de passe réinitialisé avec succès ! Redirection...'
      });
      
      // Retour à la connexion après 3 secondes
      setTimeout(() => {
        setMode('login');
        setStep(1);
        setFormData(prev => ({ 
          ...prev, 
          resetCode: '', 
          newPassword: '', 
          confirmPassword: '' 
        }));
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Reset password error:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Code invalide ou expiré'
      });
    } finally {
      setInternalLoading(false);
    }
  };

  /**
   * Renvoie un nouveau code de réinitialisation
   */
  const handleResendCode = async () => {
    if (countdown > 0) return;
    setInternalLoading(true);
    try {
      await forgotPassword(formData.email);
      setCountdown(60);
      setMessage({
        type: 'success',
        text: 'Un nouveau code a été envoyé'
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Impossible de renvoyer le code'
      });
    } finally {
      setInternalLoading(false);
    }
  };

  // ===== RENDU DES FORMULAIRES =====
  
  /**
   * Rendu du formulaire de connexion
   */
  const renderLoginForm = () => (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {/* Champ Email avec icône */}
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
        {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
      </div>

      {/* Champ Mot de passe avec icône et bouton d'affichage */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Mot de passe
          </label>
          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setStep(1);
              setErrors({});
              setMessage({ type: '', text: '' });
            }}
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
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
            type={showPassword.password ? "text" : "password"}
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
            onClick={() => togglePasswordVisibility('password')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword.password ? (
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
        {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
      </div>

        {/* Checkbox "Se souvenir de moi" */}
        <div className="flex items-center">
        <input
          id="remember-me"
          name="rememberMe"
          type="checkbox"
          checked={formData.rememberMe}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          disabled={isLoading}
        />
        <label htmlFor="remember-me" className="ml-2 text-sm text-gray-700">
          Se souvenir de moi
        </label>
      </div>

      {/* Bouton de soumission */}
      <Button
        type="submit"
        loading={isLoading}
        fullWidth
        size="lg"
        className="bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-900 hover:to-blue-900 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl text-white font-medium"
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
  );

  /**
   * Rendu du formulaire de réinitialisation (3 étapes)
   */
  const renderForgotForm = () => {
    /**
     * Indicateur visuel des étapes (1,2,3)
     */
    const renderStepIndicator = () => (
      <div className="flex items-center justify-center mb-6">
        {[1, 2, 3].map((stepNumber) => (
          <React.Fragment key={stepNumber}>
            <div className="flex flex-col items-center">
              <div className={`
                h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold
                ${step === stepNumber ? 'bg-blue-600 text-white' : 
                  step > stepNumber ? 'bg-green-500 text-white' : 
                  'bg-gray-200 text-gray-500'}
              `}>
                {stepNumber}
              </div>
            </div>
            {stepNumber < 3 && (
              <div className={`h-0.5 w-8 mx-1 ${step > stepNumber ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );

    return (
      <div className="space-y-5">
        {/* Bouton retour à la connexion */}
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setStep(1);
            setErrors({});
            setMessage({ type: '', text: '' });
          }}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium transition-all duration-200 group"
        >
          <svg className="h-4 w-4 mr-1 text-blue-600 group-hover:text-blue-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Retour à la connexion</span>
        </button>

        {/* En-tête de l'étape */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {step === 1 && 'Réinitialisation du mot de passe'}
            {step === 2 && 'Vérification du code'}
            {step === 3 && 'Nouveau mot de passe'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1 && 'Entrez votre email pour recevoir un code'}
            {step === 2 && `Code envoyé à ${formData.email}`}
            {step === 3 && 'Choisissez un mot de passe sécurisé'}
          </p>
        </div>

        {/* Indicateur d'étapes */}
        {renderStepIndicator()}

        {/* Message de succès/erreur */}
        {message.text && (
          <div className={`p-3 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <div className="flex items-center text-sm">
              <svg className={`h-4 w-4 mr-2 flex-shrink-0 ${
                message.type === 'success' ? 'text-green-500' : 'text-red-500'
              }`} fill="currentColor" viewBox="0 0 20 20">
                {message.type === 'success' ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
              </svg>
              {message.text}
            </div>
          </div>
        )}

        {/* ÉTAPE 1 : Email */}
        {step === 1 && (
          <form onSubmit={handleForgotPassword}>
            <div className="mb-4">
              <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2.5 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="vous@entreprise.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              size="md"
              className="bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl text-white font-medium"
            >
              {isLoading ? 'Envoi...' : 'Envoyer le code'}
            </Button>
          </form>
        )}

        {/* ÉTAPE 2 : Code de vérification */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode}>
            <div className="mb-4">
              <label htmlFor="resetCode" className="block text-sm font-medium text-gray-700 mb-2">
                Code de vérification
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="resetCode"
                  name="resetCode"
                  type="text"
                  maxLength="6"
                  value={formData.resetCode}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2.5 border ${
                    errors.resetCode ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="123456"
                  disabled={isLoading}
                />
              </div>
              {errors.resetCode && <p className="mt-1 text-xs text-red-600">{errors.resetCode}</p>}
            </div>

            <div className="flex justify-between items-center mb-4">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={countdown > 0 || isLoading}
                className={`text-xs font-medium ${
                  countdown > 0 ? 'text-gray-400' : 'text-blue-600 hover:text-blue-500'
                }`}
              >
                {countdown > 0 ? `Renvoyer (${countdown}s)` : 'Renvoyer le code'}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Modifier l'email
              </button>
            </div>
            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              size="md"
              className="bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl text-white font-medium"
            >
              {isLoading ? 'Vérification...' : 'Vérifier le code'}
            </Button>
          </form>
        )}

        {/* ÉTAPE 3 : Nouveau mot de passe */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword.newPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-12 py-2.5 border ${
                    errors.newPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('newPassword')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword.newPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword.confirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-12 py-2.5 border ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword.confirmPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
            </div>
            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              size="md"
              className="bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl text-white font-medium"
            >
              {isLoading ? 'Réinitialisation...' : 'Réinitialiser'}
            </Button>
          </form>
        )}
      </div>
    );
  };

  // ===== RENDU PRINCIPAL =====
  return (
    <div className="max-w-lg w-full space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {mode === 'login' ? 'Connectez-vous à votre compte' : 'Réinitialisation'}
        </h2>
        <p className="mt-2 text-gray-600">
          {mode === 'login' 
            ? 'Entrez vos identifiants pour accéder à la plateforme'
            : 'Suivez les étapes pour réinitialiser votre mot de passe'
          }
        </p>
      </div>

      {mode === 'login' ? renderLoginForm() : renderForgotForm()}
    </div>
  );
};

export default LoginForm;
