/**
 * CONTEXTE D'AUTHENTIFICATION - Gestion centrale de l'authentification
 * 
 * @description
 * Provider React qui gère l'état d'authentification global de l'application.
 * Fournit les fonctions de connexion, déconnexion, rafraîchissement du token,
 * et maintient la session utilisateur avec un polling automatique.
 * 
 * @module context/AuthContext
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
 */
const persistUser = (user) => {
  if (!user) return;

  const fullName =
    user.name ||
    `${user.nom || user.lastName || ''} ${user.prenom || user.firstName || ''}`.trim() ||
    'Utilisateur';

  if (user.role) localStorage.setItem('userRole', user.role);
  if (fullName) localStorage.setItem('userName', fullName);
  if (user.email) localStorage.setItem('userEmail', user.email);
  if (user.clientId) localStorage.setItem('clientId', user.clientId);
  if (user.clientName) localStorage.setItem('clientName', user.clientName);
};

// ===== PROVIDER PRINCIPAL =====

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(authService.isAuthenticated());
  
  const logoutInProgressRef = useRef(false);

  const applyUser = useCallback((nextUser) => {
    setUser(nextUser);
    setAuthenticated(Boolean(nextUser));
    persistUser(nextUser);
  }, []);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setAuthenticated(false);
  }, []);

  const refreshUser = useCallback(
    async ({ force = false, silent = false } = {}) => {
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

  const logout = useCallback(
    async ({ redirect = true } = {}) => {
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
   * ✅ Gère les rôles backend : SUPER_ADMIN, ADMIN_CLIENT, COMMERCIAL, RESPONSABLE_ACHAT
   */
  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      const result = await authService.login(credentials);

      if (!result?.success) throw new Error('Erreur de connexion');

      // ✅ Garder le rôle exact du backend
      const userData = {
        ...result.data.user,
        role: result.data.user.role,
        originalRole: result.data.user.role
      };
      
      applyUser(userData);
      setAuthenticated(true);

      // ✅ Redirection selon le rôle backend
      let dashboardPath = '/dashboard';
      switch (result.data.user.role) {
        case 'SUPER_ADMIN':
          dashboardPath = '/dashboard/admin';
          break;
        case 'ADMIN_CLIENT':
          dashboardPath = '/dashboard';
          break;
        case 'COMMERCIAL':
          dashboardPath = '/dashboard/sales/dashboard';
          break;
        case 'RESPONSABLE_ACHAT':
          dashboardPath = '/dashboard/procurement';
          break;
        default:
          dashboardPath = '/dashboard';
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

  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
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

  useEffect(() => {
    if (!authenticated) return undefined;

    const intervalId = window.setInterval(async () => {
      try {
        const result = await authService.getCurrentUser({ force: true });

        if (result?.success) {
          applyUser(result.data);
        }
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          await logout();
        }
      }
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [applyUser, authenticated, logout]);

  const value = useMemo(
    () => ({
      loading,
      error,
      user,
      authenticated,
      login,
      logout,
      refreshUser,
      forgotPassword: authService.forgotPassword,
      resetPassword: authService.resetPassword,
      isAuthenticated: () => authenticated,
      getCurrentUser: () => user,
      getUserRole: () => user?.role || null,
      getSavedEmail: () => {
        const rememberMe = localStorage.getItem('rememberMe');
        return rememberMe === 'true' ? localStorage.getItem('savedEmail') || '' : '';
      },
      fetchWithAuth: authService.fetchWithAuth,
    }),
    [authenticated, error, loading, login, logout, refreshUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;