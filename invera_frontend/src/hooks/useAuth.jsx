import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Initialiser l'utilisateur au chargement
  useEffect(() => {
    const initializeAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const result = await authService.getCurrentUser();
          if (result.success) {
            setUser(result.data);
            
            // Mettre à jour localStorage avec les données fraîches
            localStorage.setItem('userRole', result.data.role);
            localStorage.setItem('userName', result.data.name);
            localStorage.setItem('userEmail', result.data.email);
          }
        } catch (error) {
          // Si erreur, nettoyer et rediriger vers login
          await authService.logout();
          navigate('/login');
        }
      }
    };

    initializeAuth();
  }, [navigate]);

  // login fucntion 
  const login = async (credentials) => {
  setLoading(true);
  setError(null);
  
  try {
    const result = await authService.login(credentials);
    
    if (result.success) {
      // Stocker les données utilisateur
      localStorage.setItem('token', result.data.token);

      console.log('🔍 VÉRIFICATION IMMÉDIATE:');
console.log('   - Token reçu:', result.data.token ? 'OUI' : 'NON');
console.log('   - Token valeur:', result.data.token?.substring(0, 20) + '...');
console.log('   - localStorage.getItem("token"):', localStorage.getItem('token'));
console.log('   - Les deux sont égaux?', result.data.token === localStorage.getItem('token'));
      

      
      // Vérifiez que c'est bien stocké
      const storedToken = localStorage.getItem('token');
      console.log('🔍 Token vérifié dans localStorage:', 
        storedToken ? storedToken.substring(0, 20) + '...' : 'NULL'
      );
      
      localStorage.setItem('userRole', result.data.user.role);
      localStorage.setItem('userName', result.data.user.name);
      localStorage.setItem('userEmail', result.data.user.email);
      
      // Déterminer le dashboard
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
          dashboardPath = '/dashboard';
      }
      localStorage.setItem('userDashboard', dashboardPath);
      
      // Mettre à jour l'état
      setUser(result.data.user);
      
      // ⭐⭐ AJOUTEZ CE LOG POUR VOIR LE TOKEN STOCKÉ ⭐⭐
      console.log('🏁 Login COMPLÈTEMENT terminé');
      console.log('🔑 Token final dans localStorage:', 
        localStorage.getItem('token') ? 'PRÉSENT' : 'ABSENT'
      );
      
      return { 
        success: true, 
        data: result.data,
        dashboard: dashboardPath
      };
    }
    
    throw new Error('Erreur de connexion');
    
  } catch (err) {
    console.error('💥 Erreur dans useAuth.login:', err);
    setError(err.message);
    throw err;
  } finally {
    setLoading(false);
  }
};

//logout function

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setError(null);
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const getCurrentUser = useCallback(() => {
    if (user) return user;
    
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    return {
      role: localStorage.getItem('userRole'),
      name: localStorage.getItem('userName'),
      email: localStorage.getItem('userEmail'),
      dashboard: localStorage.getItem('userDashboard')
    };
  }, [user]);

  const getUserRole = useCallback(() => {
    return user?.role || localStorage.getItem('userRole');
  }, [user]);

  const isAuthenticated = useCallback(() => {
    return authService.isAuthenticated();
  }, []);

  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.forgotPassword(email);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Récupérer l'email sauvegardé si rememberMe est coché
  const getSavedEmail = () => {
    const rememberMe = localStorage.getItem('rememberMe');
    if (rememberMe === 'true') {
      return localStorage.getItem('savedEmail') || '';
    }
    return '';
  };

  // Fonction pour faire des requêtes authentifiées
  const fetchWithAuth = useCallback(async (url, options = {}) => {
    return authService.fetchWithAuth(url, options);
  }, []);

  return {
    loading,
    error,
    user,
    login,
    logout,
    forgotPassword,
    isAuthenticated,
    getCurrentUser,
    getUserRole,
    getSavedEmail,
    fetchWithAuth // Exporté pour usage dans d'autres composants
  };
};