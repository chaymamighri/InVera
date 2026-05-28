// src/services/userService.js
import api from './api';

const normalizeRole = (role) => String(role || '').trim().toUpperCase().replace(/^ROLE_/, '');

const mapRoleToAuthRequest = (role) => {
  switch (normalizeRole(role)) {
    case 'ADMIN':
    case 'ADMIN_CLIENT':
      return 'admin';
    case 'PROCUREMENT':
    case 'RESPONSABLE_ACHAT':
      return 'procurement';
    case 'SALES':
    case 'COMMERCIAL':
      return 'sales';
    default:
      return String(role || '').trim();
  }
};

export const userService = {
  getAllUsers: async () => {
    const response = await api.get('/auth/all');

    if (response.data && response.data.users && Array.isArray(response.data.users)) {
      return response.data.users;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    console.warn('Format de réponse inattendu pour getAllUsers:', response.data);
    return [];
  },

  filterUsers: async ({ nom, prenom, role } = {}) => {
    const params = new URLSearchParams();
    if (nom?.trim()) params.append('nom', nom.trim());
    if (prenom?.trim()) params.append('prenom', prenom.trim());
    if (role?.trim()) params.append('role', role.trim());

    const response = await api.get(`/auth/filter?${params.toString()}`);

    if (response.data && response.data.users && Array.isArray(response.data.users)) {
      return response.data.users;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return response.data;
  },

  createUser: async (userData) => {
    const payload = {
      email: userData.email,
      nom: userData.nom,
      prenom: userData.prenom || '',
      role: mapRoleToAuthRequest(userData.role),
    };

    console.log('createUser - Payload final:', payload);

    const response = await api.post('/auth/register', payload);
    return response.data;
  },

  updateUserById: async (userId, userData) => {
    const payload = {
      nom: userData.nom || userData.name || '',
      prenom: userData.prenom || '',
      email: userData.email,
      role: mapRoleToAuthRequest(userData.role),
      active: userData.active,
    };

    console.log('updateUserById - userId:', userId);
    console.log('updateUserById - Payload:', payload);

    const response = await api.put(`/auth/update/${userId}`, payload);
    return response.data;
  },

  deleteUser: async (email) => {
    const response = await api.delete(`/auth/delete/${encodeURIComponent(email)}`);
    return response.data;
  },

  setUserActiveStatus: async (email, active) => {
    const response = await api.patch(`/auth/activate/${encodeURIComponent(email)}?active=${active}`);
    return response.data;
  },
};
