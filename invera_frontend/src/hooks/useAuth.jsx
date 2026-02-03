import { useState } from 'react';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Base de données des utilisateurs avec 3 rôles
  const usersDatabase = {
    // Administrateur
    'admin@invera.com': {
      password: 'password123',
      role: 'admin',
      name: 'Ahmed mazlout',
      dashboard: '/dashboard/admin'
    },
    
    // Responsable Commerciale (Ventes)
    'commercial@invera.com': {
      password: 'commercial1234',
      role: 'sales',
      name: 'Amal ben salah',
      dashboard: '/dashboard/sales'
    },
    
    // Responsable Achat et Stock
    'procurement@invera.com': {
      password: 'procurement123',
      role: 'procurement',
      name: 'Jean Leroy',
      dashboard: '/dashboard/procurement'
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Vérifier si l'utilisateur existe
      const user = usersDatabase[credentials.email];
      
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }
      
      if (user.password !== credentials.password) {
        throw new Error('Mot de passe incorrect');
      }
      
      // Générer un token mock
      const mockToken = `mock-jwt-token-${Date.now()}-${user.role}`;
      
      // Stocker les données utilisateur ESSENTIELLES
      localStorage.setItem('token', mockToken);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userEmail', credentials.email);
      localStorage.setItem('userDashboard', user.dashboard);
      
      // Sauvegarder "remember me" si coché
      if (credentials.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('savedEmail', credentials.email);
      }
      
      return { 
        success: true, 
        data: { 
          token: mockToken,
          user: {
            email: credentials.email,
            name: user.name,
            role: user.role,
            dashboard: user.dashboard
          }
        } 
      };
      
    } catch (err) {
      setError(err.message);
      // IMPORTANT: Relancer l'erreur pour que le LoginForm la capture
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Supprimer toutes les données d'authentification
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userDashboard');
    localStorage.removeItem('savedEmail');
    // Note: Ne pas supprimer 'rememberMe' pour garder le choix utilisateur
  };

  // Vérifier si l'utilisateur est connecté
  const isAuthenticated = () => {
    return !!localStorage.getItem('token');
  };

  // Obtenir les données utilisateur actuelles
  const getCurrentUser = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    return {
      token: token,
      role: localStorage.getItem('userRole'),
      name: localStorage.getItem('userName'),
      email: localStorage.getItem('userEmail'),
      dashboard: localStorage.getItem('userDashboard')
    };
  };

  // Obtenir le rôle de l'utilisateur
  const getUserRole = () => {
    return localStorage.getItem('userRole');
  };

  return {
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    getCurrentUser,
    getUserRole
  };
};