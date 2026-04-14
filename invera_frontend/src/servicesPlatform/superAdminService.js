import platformApi from './platformApi';

export const superAdminService = {
  login: async (email, motDePasse) => {
    try {
      const response = await platformApi.post('/super-admin/login', { email, motDePasse });
      // La réponse est dans response.data
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
};