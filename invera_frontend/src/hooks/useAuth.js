import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export const useAuth = () => {
  const [loading, setLoading] = useState(true); // ← DÉMARRER À TRUE !
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // ← AJOUTÉ
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        // Vérifier l'authentification
        const authenticated = authService.isAuthenticated();
        
        if (!authenticated) {
          setLoading(false);
          setIsAuthenticated(false);
          return;
        }

        // Charger l'utilisateur
        const result = await authService.getCurrentUser();
        
        if (result.success) {
          setUser(result.data);
          setIsAuthenticated(true);

          localStorage.setItem('userRole', result.data.role);
          localStorage.setItem('userName', result.data.name);
          localStorage.setItem('userEmail', result.data.email);
        } else {
          await authService.logout();
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Erreur initialisation auth:', error);
        await authService.logout();
        setIsAuthenticated(false);
      } finally {
        setLoading(false); // ← TOUJOURS appelé à la fin !
      }
    };

    initializeAuth();
  }, [navigate]);

  // Poll pour vérifier si l'utilisateur est toujours actif
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        const result = await authService.getCurrentUser();
        if (result?.data?.active === false) {
          await logout();
        }
      } catch {
        // Ignorer les erreurs
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      const result = await authService.login(credentials);

      if (result.success) {
        setUser(result.data.user);
        setIsAuthenticated(true);

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
        }

        localStorage.setItem('userDashboard', dashboardPath);
        return { success: true, data: result.data, dashboard: dashboardPath };
      }

      throw new Error('Erreur de connexion');
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

// 1. logout appelé
logout: async () => {
  localStorage.clear();  
  sessionStorage.clear();
  return { success: true };
}

// useAuth.js
const logout = useCallback(async () => {
  setLoading(true);
  try {
    await authService.logout();  
    
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    
    navigate('/login');
    
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}, [navigate]);


 const getUserRole = useCallback(() => {
  if (!user) return null;
  return user.role;
}, [user]);


  const getCurrentUser = useCallback(() => {
    return user;
  }, [user]);




// Ou mieux : utilisez simplement user.role directement
  return {
    loading,
    error,
    user,
    isAuthenticated, // ← EXPOSÉ pour les composants
    login,
    logout,
    forgotPassword: authService.forgotPassword,
    resetPassword: authService.resetPassword,
    isAuthenticated: () => isAuthenticated, // ← Version fonction
    getCurrentUser,
    getUserRole,
    getSavedEmail: () => {
      const rememberMe = localStorage.getItem('rememberMe');
      return rememberMe === 'true' ? localStorage.getItem('savedEmail') || '' : '';
    },
    fetchWithAuth: authService.fetchWithAuth
  };
};

export default useAuth;