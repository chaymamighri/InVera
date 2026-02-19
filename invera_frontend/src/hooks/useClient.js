import { useState, useEffect, useCallback } from 'react';
import clientService from '../services/clientService';
import { toast } from 'react-hot-toast';

const useClients = (filters = {}) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientTypes, setClientTypes] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    particulier: 0,
    professionnel: 0,
    entreprise: 0,
    vip: 0,
    fidele: 0
  });
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0
  });

  // ✅ Fonction pour calculer les stats localement
  const calculateLocalStats = useCallback((clientsList) => {
    const newStats = {
      total: clientsList?.length || 0,
      particulier: clientsList?.filter(c => c.typeClient === 'PARTICULIER').length || 0,
      professionnel: clientsList?.filter(c => c.typeClient === 'PROFESSIONNEL').length || 0,
      entreprise: clientsList?.filter(c => c.typeClient === 'ENTREPRISE').length || 0,
      vip: clientsList?.filter(c => c.typeClient === 'VIP').length || 0,
      fidele: clientsList?.filter(c => c.typeClient === 'FIDELE').length || 0
    };
    setStats(newStats);
    return newStats;
  }, []);

  // Charger tous les clients
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      
      if (filters?.search) {
        response = await clientService.searchClients(filters.search);
      } else {
        response = await clientService.getAllClients({
          page: pagination.page,
          size: pagination.pageSize,
          ...filters
        });
      }
      
      if (response?.success) {
        setClients(response.clients || []);
        // ✅ Calculer les stats localement
        calculateLocalStats(response.clients || []);
        if (response.total) {
          setPagination(prev => ({ ...prev, total: response.total }));
        }
      }
      setError(null);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des clients');
      toast.error('Impossible de charger les clients');
    } finally {
      setLoading(false);
    }
  }, [filters?.search, pagination.page, pagination.pageSize, calculateLocalStats]);

  // Charger les types de clients
  const fetchClientTypes = useCallback(async () => {
    try {
      const response = await clientService.getClientTypes();
      if (response?.success) {
        setClientTypes(response.types || []);
      }
    } catch (err) {
      console.error('Erreur chargement types:', err);
    }
  }, []);


  // Créer un nouveau client
  const createClient = async (clientData) => {
    try {
      const response = await clientService.createClient(clientData);
      if (response?.success) {
        toast.success(response.message || 'Client créé avec succès');
        await fetchClients(); 
        return response;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Erreur lors de la création';
      toast.error(errorMsg);
      throw err;
    }
  };

  // Mettre à jour un client
  const updateClient = async (id, clientData) => {
    try {
      const response = await clientService.updateClient(id, clientData);
      if (response?.success) {
        toast.success(response.message || 'Client modifié avec succès');
        await fetchClients(); 
        return response;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Erreur lors de la modification';
      toast.error(errorMsg);
      throw err;
    }
  };

  // Vérifier si un téléphone existe
  const checkTelephone = async (telephone) => {
    try {
      const response = await clientService.checkTelephone?.(telephone);
      return response;
    } catch (err) {
      console.error('Erreur vérification téléphone:', err);
      throw err;
    }
  };

  // Récupérer la remise par type
  const getRemiseForType = async (typeClient) => {
    try {
      console.log(`🔍 Récupération remise pour ${typeClient} via clientService`);
      const response = await clientService.getRemiseByType(typeClient);
      console.log('✅ Réponse remise:', response);
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération remise ${typeClient}:`, error);
      throw error;
    }
  };

  // Supprimer un client
  const deleteClient = async (id) => {
    try {
      const response = await clientService.deleteClient?.(id);
      if (response?.success) {
        toast.success('Client supprimé avec succès');
        await fetchClients(); 
      }
    } catch (err) {
      toast.error('Erreur lors de la suppression');
      throw err;
    }
  };

  // Chargement initial
  useEffect(() => {
    fetchClients();
    fetchClientTypes();
  }, [fetchClients, fetchClientTypes]); 

  // Optionnel: Recalculer les stats quand clients change
  useEffect(() => {
    if (clients.length > 0) {
      calculateLocalStats(clients);
    }
  }, [clients, calculateLocalStats]);

  return {
    // Données
    clients,
    loading,
    error,
    clientTypes,
    stats,           
    pagination,
    
    // Actions
    fetchClients,
    fetchClientTypes,
    createClient,
    updateClient,
    deleteClient,
    checkTelephone,
    getRemiseForType,
    
    // Pagination
    setPagination
  };
};

export default useClients;