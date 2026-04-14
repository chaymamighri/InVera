import api from './api';

// Service Super Admin (utilise l'api existante)
export const platformService = {
  // Authentification
  login: (email, motDePasse) => 
    api.post('/super-admin/login', { email, motDePasse }),
  
  // Vérifier si Super Admin existe
  checkExists: () => 
    api.get('/super-admin/exists'),
  
  // Créer le premier Super Admin (installation)
  register: (data) => 
    api.post('/super-admin/register', data),
  
  // Récupérer les infos du Super Admin connecté
  getMe: () => 
    api.get('/super-admin/me', {
      params: { email: JSON.parse(localStorage.getItem('adminInfo') || '{}').email }
    }),
};

// Service Clients
export const clientService = {
  getAll: () => api.get('/super-admin/clients'),
  getById: (id) => api.get(`/super-admin/clients/${id}`),
  activate: (id) => api.put(`/super-admin/clients/${id}/activate`),
  block: (id) => api.put(`/super-admin/clients/${id}/block`),
  validateDocuments: (id) => api.put(`/super-admin/clients/${id}/validate-documents`),
};

// Service Abonnements
export const abonnementService = {
  getAll: () => api.get('/super-admin/abonnements'),
  create: (data) => api.post('/super-admin/abonnements', data),
  update: (id, data) => api.put(`/super-admin/abonnements/${id}`, data),
  delete: (id) => api.delete(`/super-admin/abonnements/${id}`),
};

// Service Paiements
export const paiementService = {
  getAll: () => api.get('/super-admin/paiements'),
  getByClient: (clientId) => api.get(`/super-admin/paiements/client/${clientId}`),
};