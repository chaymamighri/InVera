const API_URL = 'http://localhost:8081/api/auth';

export const authService = {
  // Connexion
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Erreur de connexion';
        
        if (response.status === 401) {
          errorMessage = 'Email ou mot de passe incorrect';
        } else if (response.status === 403) {
          errorMessage = 'Accès non autorisé';
        } else {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            // Si on ne peut pas parser le JSON
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Sauvegarder rememberMe si coché
      if (credentials.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('savedEmail', credentials.email);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('savedEmail');
      }
      
      return {
        success: true,
        data: {
          token: data.jwt,
          user: {
            email: data.email,
            name: `${data.nom} ${data.prenom}`,
            role: data.role,
            firstName: data.prenom,
            lastName: data.nom
          }
        }
      };
    } catch (error) {
      // Si c'est déjà une Error, la renvoyer
      if (error instanceof Error) {
        throw error;
      }
      // Sinon, créer une Error
      throw new Error(error.message || 'Erreur de connexion');
    }
  },

  // Déconnexion
  logout: async () => {
    // Nettoyer le localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userDashboard');
    return { success: true };
  },

  // Récupérer l'utilisateur courant
  getCurrentUser: async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Non authentifié');
    }

    try {
      const response = await fetch(`${API_URL}/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expiré ou invalide
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userName');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userDashboard');
        }
        throw new Error('Erreur de récupération de l\'utilisateur');
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          id: data.id,
          username: data.username,
          email: data.email,
          name: `${data.nom} ${data.prenom}`,
          role: data.role,
          firstName: data.prenom,
          lastName: data.nom
        }
      };
    } catch (error) {
      throw error;
    }
  },

  // Mot de passe oublié
  forgotPassword: async (email) => {
    try {
      // Note: Vous devrez créer cet endpoint dans votre backend
      // Pour l'instant, simulation
      await new Promise(resolve => setTimeout(resolve, 800));
      return { 
        success: true, 
        message: 'Instructions envoyées par email' 
      };
    } catch (error) {
      throw new Error('Erreur lors de la récupération du mot de passe');
    }
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // Vérifier si le token est expiré (basique)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  // Obtenir le token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Fonction utilitaire pour les requêtes authentifiées
  fetchWithAuth: async (url, options = {}) => {
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Déconnecter l'utilisateur
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userName');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userDashboard');
          window.location.href = '/login';
        }
        
        let errorMessage = 'Erreur de requête';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Ne rien faire si on ne peut pas parser
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
};