// src/pages/dashboard/sales/reports/tabs/InvoicesTab.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../../../../services/api';

const InvoicesTab = () => {
  // ✅ Récupérer les filtres depuis le contexte
  const { filters } = useOutletContext();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // ✅ Ref pour éviter les appels multiples
  const prevFiltersRef = useRef(null);

  // ✅ Fonction de nettoyage avec vérification
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
        cleaned[key] = value;
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
      const url = `/reports/invoices${queryString ? `?${queryString}` : ''}`;
      
      console.log('📡 InvoicesTab - URL:', url);
      console.log('📡 InvoicesTab - Paramètres:', cleanFilterParams);
      
      const response = await api.get(url);
      console.log('✅ InvoicesTab - Données reçues:', response.data);
      setData(response.data);
    } catch (error) {
      console.error('❌ InvoicesTab - Erreur:', error);
      
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
    console.log('📥 InvoicesTab - Filters reçus:', filters);
    
    if (haveFiltersChanged(filters)) {
      console.log('🔄 InvoicesTab - Filtres modifiés, chargement...');
      fetchData();
    } else {
      console.log('⏭️ InvoicesTab - Filtres identiques, pas de rechargement');
    }
  }, [filters, fetchData, haveFiltersChanged]);

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        <p className="mt-2 text-gray-600">Chargement des factures...</p>
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
      {/* ✅ En-tête avec SEULEMENT le bouton Actualiser */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold">Détail des factures</h2>
          <p className="text-sm text-gray-500 mt-1">
            {data.factures?.length || 0} factures trouvées
          </p>
        </div>
       
      </div>

      {/* Cartes résumé */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-xl">
          <p className="text-sm text-blue-600">Total factures</p>
          <p className="text-2xl font-bold">{data.summary?.totalFactures || 0}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-xl">
          <p className="text-sm text-green-600">Payées</p>
          <p className="text-2xl font-bold">{data.summary?.payees || 0}</p>
          <p className="text-xs text-green-500">{data.summary?.montantPaye || 0} DT</p>
        </div>
        <div className="bg-yellow-50 p-6 rounded-xl">
          <p className="text-sm text-yellow-600">En retard</p>
          <p className="text-2xl font-bold">{data.summary?.enRetard || 0}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-xl">
          <p className="text-sm text-red-600">Impayées</p>
          <p className="text-2xl font-bold">{data.summary?.impayees || 0}</p>
          <p className="text-xs text-red-500">{data.summary?.montantImpaye || 0} DT</p>
        </div>
      </div>

      {/* Tableau des factures */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">N° Facture</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Montant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.factures?.map((facture, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono">{facture.numero}</td>
                <td className="px-6 py-4 text-sm">{facture.client}</td>
                <td className="px-6 py-4 text-sm">{facture.date}</td>
                <td className="px-6 py-4 text-sm font-medium">{facture.montant} DT</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    facture.statut === 'Payée' ? 'bg-green-100 text-green-700' :
                    facture.statut === 'En attente' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {facture.statut}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {(!data.factures || data.factures.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            Aucune facture trouvée pour cette période
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesTab;