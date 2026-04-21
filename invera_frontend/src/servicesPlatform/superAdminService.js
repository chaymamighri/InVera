import platformApi from './platformApi';

export const superAdminService = {
  login: async (email, motDePasse) => {
    try {
      const response = await platformApi.post('/super-admin/login', { email, motDePasse });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  getMe: async () => {
    try {
      const response = await platformApi.get('/super-admin/me');
      return response.data;
    } catch (error) {
      console.error('Get super admin profile error:', error);
      throw error;
    }
  },

  updateProfile: async (payload) => {
    try {
      const response = await platformApi.put('/super-admin/update-profile', payload);
      return response.data;
    } catch (error) {
      console.error('Update super admin profile error:', error);
      throw error;
    }
  },

  changePassword: async (payload) => {
    try {
      const response = await platformApi.put('/super-admin/change-password', payload);
      return response.data;
    } catch (error) {
      console.error('Change super admin password error:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    localStorage.removeItem('superAdminInfo');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    window.location.href = '/super-admin/login';
  },
};
