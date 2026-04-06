/**
 * CONTEXTE D'AUTHENTIFICATION - Gestion centrale de l'authentification
 * 
 * @description
 * Provider React qui gère l'état d'authentification global de l'application.
 * Fournit les fonctions de connexion, déconnexion, rafraîchissement du token,
 * et maintient la session utilisateur avec un polling automatique.
 * 
 * @module context/AuthContext
 * @requires react-router-dom
 * @requires ../services/authService
 * 
 * @example
 * // 1. Envelopper l'application dans App.jsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * 
 * @example
 * // 2. Utilisation dans un composant
 * const { user, login, logout, authenticated } = useAuthContext();
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

// ===== CONSTANTES =====
/** Intervalle de polling pour rafraîchir les données utilisateur (20 secondes) */
const POLL_INTERVAL_MS = 20000;

// ===== CRÉATION DU CONTEXTE =====
const AuthContext = createContext(null);

// ===== FONCTIONS UTILITAIRES =====

/**
 * Persiste les informations utilisateur dans localStorage
 * @param {Object} user - Utilisateur connecté
 * @param {string} user.name - Nom complet
 * @param {string} user.nom - Nom de famille (fallback)
 * @param {string} user.prenom - Prénom (fallback)
 * @param {string} user.lastName - Nom (fallback anglais)
 * @param {string} user.firstName - Prénom (fallback anglais)
 * @param {string} user.role - Rôle utilisateur
 * @param {string} user.email - Adresse email
 */
const persistUser = (user) => {
  if (!user) return;

  // Construction du nom complet (priorité aux champs français)
  const fullName =
    user.name ||
    `${user.nom || user.lastName || ''} ${user.prenom || user.firstName || ''}`.trim() ||
    'Utilisateur';

  // Sauvegarde dans localStorage
  if (user.role) localStorage.setItem('userRole', user.role);
  if (fullName) localStorage.setItem('userName', fullName);
  if (user.email) localStorage.setItem('userEmail', user.email);
};

// ===== PROVIDER PRINCIPAL =====

/**
 * AuthProvider - Fournisseur du contexte d'authentification
 * 
 * Responsabilités :
 * - Initialisation de la session au chargement
 * - Gestion des états (connexion, chargement, erreur)
 * - Persistance des données utilisateur
 * - Polling automatique pour maintenir la session
 * - Redirection après connexion selon le rôle
 */
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  
  // ===== ÉTATS =====
  const [loading, setLoading] = useState(true);           // Chargement en cours
  const [error, setError] = useState(null);               // Erreur d'authentification
  const [user, setUser] = useState(null);                 // Données utilisateur
  const [authenticated, setAuthenticated] = useState(authService.isAuthenticated()); // État authentifié
  
  // ===== REFS =====
  const logoutInProgressRef = useRef(false);              // Évite les double déconnexion

  // ===== FONCTIONS INTERNES =====

  /**
   * Applique les données utilisateur et les persiste
   * @param {Object} nextUser - Nouvel utilisateur
   */
  const applyUser = useCallback((nextUser) => {
    setUser(nextUser);
    setAuthenticated(Boolean(nextUser));
    persistUser(nextUser);
  }, []);

  /**
   * Nettoie l'état d'authentification (déconnexion)
   */
  const clearAuthState = useCallback(() => {
    setUser(null);
    setAuthenticated(false);
  }, []);

  // ===== FONCTIONS EXPOSÉES =====

  /**
   * Rafraîchit les données de l'utilisateur courant
   * @param {Object} options - Options de rafraîchissement
   * @param {boolean} options.force - Force le rafraîchissement (ignore le cache)
   * @param {boolean} options.silent - Mode silencieux (sans indicateur de chargement)
   * @returns {Promise<Object>} Résultat de l'opération
   */
  const refreshUser = useCallback(
    async ({ force = false, silent = false } = {}) => {
      // Vérification de la présence d'un token
      if (!authService.isAuthenticated()) {
        clearAuthState();
        return { success: false, data: null };
      }

      if (!silent) setLoading(true);

      try {
        const result = await authService.getCurrentUser({ force });

        if (result?.success) {
          applyUser(result.data);
          setError(null);
        }

        return result;
      } catch (err) {
        clearAuthState();
        setError(err?.message || 'Erreur d\'authentification');
        throw err;
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [applyUser, clearAuthState]
  );

  /**
   * Déconnecte l'utilisateur
   * @param {Object} options - Options de déconnexion
   * @param {boolean} options.redirect - Rediriger vers /login (défaut: true)
   * @returns {Promise<Object>} Résultat de l'opération
   */
  const logout = useCallback(
    async ({ redirect = true } = {}) => {
      // Évite les appels multiples
      if (logoutInProgressRef.current) return { success: true };

      logoutInProgressRef.current = true;
      setLoading(true);

      try {
        await authService.logout();
        clearAuthState();
        setError(null);

        if (redirect) navigate('/login', { replace: true });

        return { success: true };
      } catch (err) {
        setError(err?.message || 'Erreur lors de la déconnexion');
        throw err;
      } finally {
        logoutInProgressRef.current = false;
        setLoading(false);
      }
    },
    [clearAuthState, navigate]
  );

  /**
   * Connecte l'utilisateur
   * @param {Object} credentials - Identifiants de connexion
   * @param {string} credentials.email - Adresse email
   * @param {string} credentials.password - Mot de passe
   * @param {boolean} credentials.rememberMe - Se souvenir de moi
   * @returns {Promise<Object>} Résultat avec dashboard redirection
   */
  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      const result = await authService.login(credentials);

      if (!result?.success) throw new Error('Erreur de connexion');

      // Application des données utilisateur
      applyUser(result.data.user);
      setAuthenticated(true);

      // Redirection selon le rôle
      let dashboardPath = '/dashboard';
      switch (result.data.user.role) {
        case 'ADMIN':
          dashboardPath = '/dashboard/admin';
          break;
        case 'COMMERCIAL':
          dashboardPath = '/dashboard/sales';
          break;
        case 'RESPONSABLE_ACHAT':
          dashboardPath = '/dashboard/procurement';
          break;
        default:
          break;
      }

      localStorage.setItem('userDashboard', dashboardPath);
      return { success: true, data: result.data, dashboard: dashboardPath };
    } catch (err) {
      setError(err?.message || 'Erreur de connexion');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [applyUser]);

  // ===== EFFETS =====

  /**
   * Effet : Initialisation de l'authentification au chargement
   * Vérifie la présence d'un token et charge l'utilisateur
   */
  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      // Pas de token → état non authentifié
      if (!authService.isAuthenticated()) {
        if (!cancelled) {
          clearAuthState();
          setLoading(false);
        }
        return;
      }

      try {
        const result = await authService.getCurrentUser();

        if (!cancelled && result?.success) {
          applyUser(result.data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          clearAuthState();
          setError(err?.message || 'Erreur d\'authentification');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initializeAuth();

    return () => { cancelled = true; };
  }, [applyUser, clearAuthState]);

  /**
   * Effet : Polling automatique pour maintenir la session
   * Rafraîchit les données utilisateur toutes les 20 secondes
   * En cas d'erreur 401/403, déconnecte automatiquement
   */
  useEffect(() => {
    if (!authenticated) return undefined;

    const intervalId = window.setInterval(async () => {
      try {
        const result = await authService.getCurrentUser({ force: true });

        if (result?.success) {
          applyUser(result.data);
        }
      } catch (err) {
        // Token expiré ou invalide → déconnexion automatique
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          await logout();
        }
      }
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [applyUser, authenticated, logout]);

  // ===== VALEUR DU CONTEXTE =====
  const value = useMemo(
    () => ({
      // États
      loading,        // bool - Indicateur de chargement
      error,          // string|null - Message d'erreur
      user,           // Object|null - Données utilisateur
      authenticated,  // bool - État de connexion

      // Méthodes principales
      login,          // (credentials) => Promise - Connexion
      logout,         // (options) => Promise - Déconnexion
      refreshUser,    // (options) => Promise - Rafraîchissement

      // Méthodes d'authentification
      forgotPassword: authService.forgotPassword,  // (email) => Promise
      resetPassword: authService.resetPassword,    // (code, email, password) => Promise
      isAuthenticated: () => authenticated,        // () => bool
      getCurrentUser: () => user,                  // () => Object|null
      getUserRole: () => user?.role || null,       // () => string|null

      // Utilitaires
      getSavedEmail: () => {
        const rememberMe = localStorage.getItem('rememberMe');
        return rememberMe === 'true' ? localStorage.getItem('savedEmail') || '' : '';
      },
      fetchWithAuth: authService.fetchWithAuth,    // Requête HTTP authentifiée
    }),
    [authenticated, error, loading, login, logout, refreshUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ===== HOOK PERSONNALISÉ =====

/**
 * Hook pour utiliser le contexte d'authentification
 * @throws {Error} Si utilisé en dehors d'un AuthProvider
 * @returns {Object} Valeur du contexte AuthContext
 * 
 * @example
 * const { user, login, logout, authenticated } = useAuthContext();
 */
export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;