/**
 * CreatePasswordPage - Page d'activation de compte
 * 
 * RÔLE : Permettre à un nouvel utilisateur d'activer son compte et créer son mot de passe
 * ROUTE : /create-password
 * 
 * FONCTIONNALITÉS :
 * - Activation via email + code à 6 chiffres
 * - Création de mot de passe sécurisé (8 caractères, majuscule, chiffre, spécial)
 * - Validation en temps réel des champs
 * - Pré-remplissage via paramètres URL (?email=...&code=...)
 * - Redirection vers login après activation
 * - Nettoyage automatique des anciennes sessions
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import Button from '../components/Button';

// ============================================
// CONSTANTES DE VALIDATION
// ============================================

/** Regex validation email standard */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Regex validation code à 6 chiffres */
const CODE_REGEX = /^\d{6}$/;

/** Regex validation caractères spéciaux */
const SPECIAL_CHARACTER_REGEX = /(?=.*[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~])/;

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

const CreatePasswordPage = () => {
  // Récupération des paramètres URL (email et code pré-remplis)
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ===== ÉTATS =====
  const [formData, setFormData] = useState({
    email: searchParams.get('email') || '',
    code: searchParams.get('code') || searchParams.get('token') || '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);      // État de chargement
  const [success, setSuccess] = useState(false);      // Activation réussie
  const [errors, setErrors] = useState({});           // Erreurs de validation
  const [showPassword, setShowPassword] = useState(false);           // Afficher/masquer MDP
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ============================================
  // FONCTIONS DE VALIDATION
  // ============================================

  /**
   * Valide le format de l'email
   * @param {string} email - Email à valider
   * @returns {string} Message d'erreur ou chaîne vide
   */
  const validateEmail = (email) => {
    if (!email?.trim()) {
      return 'Veuillez renseigner votre adresse email.';
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return "L'adresse email n'est pas valide.";
    }
    return '';
  };

  /**
   * Valide le code d'activation (6 chiffres exactement)
   * @param {string} code - Code à valider
   * @returns {string} Message d'erreur ou chaîne vide
   */
  const validateCode = (code) => {
    if (!code?.trim()) {
      return "Veuillez saisir le code d'activation.";
    }
    if (!CODE_REGEX.test(code.trim())) {
      return 'Le code doit contenir exactement 6 chiffres.';
    }
    return '';
  };

  /**
   * Valide le mot de passe (critères de sécurité)
   * @param {string} password - Mot de passe à valider
   * @returns {string} Message d'erreur ou chaîne vide
   */
  const validatePassword = (password) => {
    if (!password) {
      return 'Veuillez saisir un mot de passe.';
    }
    if (password.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères.';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Ajoutez au moins une lettre majuscule.';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Ajoutez au moins un chiffre.';
    }
    if (!SPECIAL_CHARACTER_REGEX.test(password)) {
      return 'Ajoutez au moins un caractère spécial.';
    }
    return '';
  };

  /**
   * Nettoie les données d'authentification dans les stockages
   * Évite les conflits avec une session existante
   */
  const clearAuthStorage = () => {
    ['token', 'userRole', 'userName', 'userEmail', 'userDashboard'].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  };

  // ============================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ============================================

  /**
   * Gère les changements dans les champs du formulaire
   * - Filtre le code pour n'accepter que 6 chiffres
   * - Efface les erreurs du champ modifié
   * @param {Event} event - Événement de changement
   */
  const handleChange = ({ target: { name, value } }) => {
    // Le code doit être uniquement des chiffres, max 6 caractères
    const nextValue = name === 'code' ? value.replace(/\D/g, '').slice(0, 6) : value;

    setFormData((current) => ({
      ...current,
      [name]: nextValue
    }));

    // Efface l'erreur du champ modifié
    setErrors((current) => {
      if (!current[name] && !current.submit) return current;
      const nextErrors = { ...current };
      delete nextErrors[name];
      delete nextErrors.submit;
      return nextErrors;
    });
  };

  /**
   * Soumet le formulaire d'activation
   * - Valide tous les champs
   * - Appelle l'API d'activation
   * - Nettoie les anciennes sessions
   * - Redirige vers login
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validation de tous les champs
    const nextErrors = {};
    const emailError = validateEmail(formData.email);
    const codeError = validateCode(formData.code);
    const passwordError = validatePassword(formData.password);

    if (emailError) nextErrors.email = emailError;
    if (codeError) nextErrors.code = codeError;
    if (passwordError) nextErrors.password = passwordError;

    // Validation de la confirmation
    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Veuillez confirmer votre mot de passe.';
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Les mots de passe ne correspondent pas.';
    }

    // Affichage des erreurs si présentes
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Appel API d'activation
      await authService.createPassword(
        formData.code.trim(),
        formData.email.trim().toLowerCase(),
        formData.password
      );

      // Nettoyage et succès
      clearAuthStorage();
      setSuccess(true);

      // Redirection après 1.5 secondes
      window.setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
      
    } catch (error) {
      setErrors({
        submit:
          error?.response?.data?.message ||
          error?.message ||
          "Impossible d'activer le compte. Vérifiez le code saisi ou demandez un nouveau code."
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDU PRINCIPAL
  // ============================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl sm:p-10">
        
        {/* En-tête */}
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Activer votre compte</h1>
          <p className="text-sm text-gray-600">
            Saisissez l'email de votre compte, le code reçu par email, puis choisissez un mot de passe.
          </p>
        </div>

        {/* Message info sur le code */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-semibold">Code d'activation</p>
          <p className="mt-1">
            Le code envoyé par email est valable 24 heures. Si vous avez ouvert un ancien lien, les champs
            ci-dessous seront pré-remplis automatiquement.
          </p>
        </div>

        {/* Succès ou formulaire */}
        {success ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <p className="font-semibold">Compte activé avec succès.</p>
            <p className="mt-1">Redirection vers la page de connexion...</p>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* Champ Email */}
            <div>
              <label htmlFor="activation-email" className="mb-2 block text-sm font-medium text-gray-700">
                Adresse email
              </label>
              <input
                id="activation-email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className={`block w-full rounded-lg border px-3 py-3 text-sm shadow-sm outline-none transition-all ${
                  errors.email ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                } focus:border-transparent focus:ring-2`}
                placeholder="vous@entreprise.com"
              />
              {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Champ Code d'activation (6 chiffres) */}
            <div>
              <label htmlFor="activation-code" className="mb-2 block text-sm font-medium text-gray-700">
                Code d'activation
              </label>
              <input
                id="activation-code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={formData.code}
                onChange={handleChange}
                disabled={loading}
                className={`block w-full rounded-lg border px-3 py-3 text-center text-lg font-semibold tracking-[0.3em] shadow-sm outline-none transition-all ${
                  errors.code ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                } focus:border-transparent focus:ring-2`}
                placeholder="123456"
              />
              {errors.code && <p className="mt-2 text-sm text-red-600">{errors.code}</p>}
            </div>

            {/* Champ Nouveau mot de passe */}
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className={`block w-full rounded-lg border px-3 py-3 pr-20 text-sm shadow-sm outline-none transition-all ${
                    errors.password ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                  } focus:border-transparent focus:ring-2`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 px-4 text-sm text-gray-500"
                >
                  {showPassword ? 'Masquer' : 'Afficher'}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                8 caractères minimum, avec une majuscule, un chiffre et un caractère spécial.
              </p>
              {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* Champ Confirmation mot de passe */}
            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-gray-700">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  className={`block w-full rounded-lg border px-3 py-3 pr-20 text-sm shadow-sm outline-none transition-all ${
                    errors.confirmPassword
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200'
                  } focus:border-transparent focus:ring-2`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 px-4 text-sm text-gray-500"
                >
                  {showConfirmPassword ? 'Masquer' : 'Afficher'}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            {/* Erreur générale */}
            {errors.submit && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errors.submit}
              </div>
            )}

            {/* Bouton d'activation */}
            <Button type="submit" loading={loading} fullWidth variant="primary" size="lg">
              {loading ? 'Activation...' : 'Activer mon compte'}
            </Button>

            {/* Lien retour connexion */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-500"
              >
                Retour à la connexion
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreatePasswordPage;