// src/services/userService.js
import api from './api';

export const userService = {
  getAllUsers: async () => {
    const response = await api.get('/auth/all');
    
    // ✅ Corrigé : extraire le tableau users de la réponse
    // Le backend retourne { success: true, users: [...], count: X }
    if (response.data && response.data.users && Array.isArray(response.data.users)) {
      return response.data.users;
    }
    
    // Fallback si la réponse est directement un tableau
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // Fallback si la réponse a une propriété data
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
    
    // ✅ Correction similaire pour filter
    if (response.data && response.data.users && Array.isArray(response.data.users)) {
      return response.data.users;
    }
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    return response.data;
  },

 // userService.js
createUser: async (userData) => {
  // Mapping des rôles si nécessaire
  let backendRole = userData.role;
  
  // Convertir les rôles frontend en backend
  if (backendRole === 'sales') {
    backendRole = 'COMMERCIAL';
  } else if (backendRole === 'procurement') {
    backendRole = 'RESPONSABLE_ACHAT';
  } else if (backendRole === 'admin') {
    backendRole = 'ADMIN_CLIENT';
  }
  
  const payload = {
    email: userData.email,
    nom: userData.nom,
    prenom: userData.prenom || '',
    role: backendRole,
  };
  
  console.log('📤 createUser - Payload final:', payload);
  
  const response = await api.post('/auth/register', payload);
  return response.data;
},

// src/services/userService.js
updateUserById: async (userId, userData) => {
  // ✅ Construction correcte du payload
  const payload = {
    nom: userData.name || '',        
    role: userData.role,
    active: userData.active
  };
  
  console.log('📤 updateUserById - userId:', userId);
  console.log('📤 updateUserById - Payload:', payload);
  
  const response = await api.put(`/auth/update/${userId}`, payload);
  return response.data;
},

  // src/services/userService.js
updateUserById: async (userId, userData) => {
  // ✅ Construction correcte du payload avec tous les champs
  const payload = {
    nom: userData.nom || userData.name || '',  // nom
    prenom: userData.prenom || '',              // prénom
    email: userData.email,                      // email
    role: userData.role,
    active: userData.active
  };
  
  console.log('📤 updateUserById - userId:', userId);
  console.log('📤 updateUserById - Payload:', payload);
  
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