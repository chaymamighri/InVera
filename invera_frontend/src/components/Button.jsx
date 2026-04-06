/**
 * COMPOSANT BOUTON - Interface d'authentification
 * 
 * @description
 * Composant réutilisable pour les boutons des formulaires d'authentification.
 * Il offre trois styles visuels (primaire, secondaire, contour) et gère 
 * automatiquement les états de chargement et de désactivation.
 * 
 * @usage
 * Utilisé principalement dans :
 * - LoginForm : Bouton de connexion principal
 * - ForgotPassword : Boutons d'envoi de code et de réinitialisation
 * 
 * 
 */

import React from 'react';

const Button = ({ 
  children, 
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  className = '',
  ...props 
}) => {
  // Classes de base communes à tous les boutons
  const baseClasses = "px-6 py-3 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  // Styles selon la variante
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",   // Bouton principal (connexion)
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500", // Bouton secondaire (annulation)
    outline: "border border-blue-600 text-blue-600 hover:bg-blue-50"         // Bouton contour (actions alternatives)
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      disabled={disabled || loading}  // Désactivé si loading ou disabled = true
      onClick={onClick}
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${widthClass}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        // État de chargement : spinner + texte
        <span className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Chargement...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;