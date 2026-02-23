import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../../../../services/api';

const ClientsTab = () => {
  // ✅ Récupérer les filtres depuis le contexte
  const { filters } = useOutletContext();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // ✅ Ref pour éviter les appels multiples
  const prevFiltersRef = useRef(null);

  // ✅ Fonction pour nettoyer les filtres
  const cleanFilters = useCallback((filtersToClean) => {
    if (!filtersToClean || typeof filtersToClean !== 'object') {
      return {};
    }
    
    const cleaned = {};
    
    Object.entries(filtersToClean).forEach(([key, value]) => {
      if (value !== null && 
          value !== undefined && 
          value !== '' && 
          value !== 'null' && 
          value !== 'all') {
        
        if (key.includes('Date') && value) {
          cleaned[key] = value;
        } else {
          cleaned[key] = value;
        }
      }
    });
    
    return cleaned;
  }, []);

  // ✅ Fonction pour comparer les filtres
  const haveFiltersChanged = useCallback((newFilters) => {
    const newClean = cleanFilters(newFilters);
    const prevClean = cleanFilters(prevFiltersRef.current);
    
    return JSON.stringify(newClean) !== JSON.stringify(prevClean);
  }, [cleanFilters]);

  // ✅ Charger les données
  const fetchData = useCallback(async () => {
    // Vérifier le token
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté pour voir ce rapport');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const cleanFilterParams = cleanFilters(filters);
      
      // Mettre à jour la ref des filtres
      prevFiltersRef.current = filters;
      
      const params = new URLSearchParams();
      Object.entries(cleanFilterParams).forEach(([key, value]) => {
        params.append(key, value);
      });
      
      const queryString = params.toString();
      const url = `/reports/clients${queryString ? `?${queryString}` : ''}`;
      
      console.log('📡 ClientsTab - URL:', url);
      console.log('📡 ClientsTab - Paramètres:', cleanFilterParams);
      
      const response = await api.get(url);
      console.log('✅ ClientsTab - Données reçues:', response.data);
      setData(response.data);
    } catch (error) {
      console.error('❌ ClientsTab - Erreur:', error);
      
      if (error.response?.status === 403) {
        setError('Session expirée. Veuillez vous reconnecter.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.response?.status === 401) {
        setError('Non authentifié. Veuillez vous connecter.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(error.response?.data?.message || 'Erreur de chargement');
      }
    } finally {
      setLoading(false);
    }
  }, [filters, cleanFilters]);

  // ✅ useEffect avec condition pour éviter la boucle infinie
  useEffect(() => {
    console.log('📥 ClientsTab - Filters reçus:', filters);
    
    if (haveFiltersChanged(filters)) {
      console.log('🔄 ClientsTab - Filtres modifiés, chargement...');
      fetchData();
    } else {
      console.log('⏭️ ClientsTab - Filtres identiques, pas de rechargement');
    }
  }, [filters, fetchData, haveFiltersChanged]);

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
        <p className="mt-2 text-gray-600">Chargement des données clients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button 
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ En-tête sans boutons */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Analyse clientèle</h2>
        <p className="text-sm text-gray-500 mt-1">
          {data.summary?.totalClients || 0} clients au total
        </p>
      </div>

      {/* Cartes résumé */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-xl">
          <p className="text-sm text-blue-600">Total clients</p>
          <p className="text-2xl font-bold">{data.summary?.totalClients || 0}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-xl">
          <p className="text-sm text-green-600">Nouveaux clients</p>
          <p className="text-2xl font-bold">{data.summary?.nouveauxClients || 0}</p>
          <p className="text-xs text-green-500">dans la période</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-xl">
          <p className="text-sm text-purple-600">Clients actifs</p>
          <p className="text-2xl font-bold">{data.summary?.clientsActifs || 0}</p>
          <p className="text-xs text-purple-500">ont passé commande</p>
        </div>
        <div className="bg-orange-50 p-6 rounded-xl">
          <p className="text-sm text-orange-600">CA total</p>
          <p className="text-2xl font-bold">{data.summary?.caTotal || 0} DT</p>
        </div>
      </div>

      {/* Top clients */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold">Top 10 clients</h3>
          <span className="text-xs text-gray-500">Basé sur le CA total</span>
        </div>
        
        {data.topClients?.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Commandes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">CA total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Panier moyen</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.topClients.map((client, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{client.nom}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                      {client.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{client.commandes}</td>
                  <td className="px-6 py-4 text-sm font-medium">{client.ca} DT</td>
                  <td className="px-6 py-4 text-sm">{client.panierMoyen || 0} DT</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Aucune donnée client disponible
          </div>
        )}
      </div>

      {/* ✅ Répartition par type - Interface améliorée avec légendes */}
      {data.repartitionParType && Object.keys(data.repartitionParType).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="font-semibold">Répartition par type de client</h3>
            <p className="text-xs text-gray-500 mt-1">Analyse détaillée par catégorie</p>
          </div>
          
          <div className="p-6">
        
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(data.repartitionParType).map(([type, stats]) => {
                // Calcul du pourcentage pour la barre de progression
                const totalClients = data.summary?.totalClients || 1;
                const percentage = ((stats.nombre / totalClients) * 100).toFixed(1);
                
                // Définir une couleur selon le type
                const getTypeColor = (type) => {
                  const colors = {
                    'VIP': 'bg-yellow-500',
                    'PROFESSIONNEL': 'bg-blue-500',
                    'ENTREPRISE': 'bg-purple-500',
                    'FIDELE': 'bg-green-500',
                    'PARTICULIER': 'bg-orange-500',
                    'NON_DEFINI': 'bg-gray-500'
                  };
                  return colors[type] || 'bg-indigo-500';
                };

                return (
                  <div key={type} className="bg-gray-50 rounded-xl p-5 hover:shadow-md transition-shadow">
                    {/* En-tête avec type */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getTypeColor(type)}`}></div>
                        <h4 className="font-semibold text-gray-800">{type}</h4>
                      </div>
                      
                    </div>
                    
                    {/* Barre de progression - Part des clients */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500 flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Part des clients
                        </span>
                        <span className="font-medium">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`${getTypeColor(type)} h-2.5 rounded-full`} 
                          style={{ width: `${percentage}%` }}
                          title={`${percentage}% des clients sont de type ${type}`}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Indicateurs principaux */}
                    <div className="grid grid-cols-3 gap-2 text-center mb-4">
                      <div className="bg-white p-2 rounded-lg">
                        <p className="text-xs text-gray-500">Clients</p>
                        <p className="text-lg font-bold">{stats.nombre}</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg">
                        <p className="text-xs text-gray-500">CA</p>
                        <p className="text-sm font-semibold text-green-600">{stats.ca} DT</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg">
                        <p className="text-xs text-gray-500">Panier</p>
                        <p className="text-sm font-semibold">{stats.panierMoyen || 0} DT</p>
                      </div>
                    </div>
                    
                    {/* ✅ Indicateur de performance basé sur le PANIER MOYEN */}
                    <div className="border-t pt-3">
                      <p className="text-xs text-gray-500 mb-2">Performance par panier moyen :</p>
                      {stats.panierMoyen > 1000 ? (
                        <div className="text-xs text-purple-600 flex items-center gap-2">
                          <span className="text-base">⭐⭐⭐</span>
                          <span className="font-medium">Panier très élevé (&gt;1000 DT)</span>
                        </div>
                      ) : stats.panierMoyen > 500 ? (
                        <div className="text-xs text-green-600 flex items-center gap-2">
                          <span className="text-base">⭐⭐</span>
                          <span className="font-medium">Panier élevé (500-1000 DT)</span>
                        </div>
                      ) : stats.panierMoyen > 200 ? (
                        <div className="text-xs text-yellow-600 flex items-center gap-2">
                          <span className="text-base">⭐</span>
                          <span className="font-medium">Panier moyen (200-500 DT)</span>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="text-base">○</span>
                          <span className="font-medium">Panier faible (&lt;200 DT)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
         </div>
        </div>
      )}
    </div>
  );
};

export default ClientsTab;