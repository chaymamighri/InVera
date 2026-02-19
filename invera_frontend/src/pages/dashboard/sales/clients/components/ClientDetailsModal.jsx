// components/ClientDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const ClientDetailsModal = ({ open, onClose, client }) => {
  const [clientOrders, setClientOrders] = useState([]);

  useEffect(() => {
    if (client && open) {
      loadClientOrders();
    }
  }, [client, open]);

  const loadClientOrders = () => {
    try {
      const ordersData = localStorage.getItem('orders');
      if (!ordersData) {
        setClientOrders([]);
        return;
      }

      const allOrders = JSON.parse(ordersData);
      
      // Filtrer les commandes du client
      const orders = allOrders.filter(order => 
        order.client?.id === client.idClient || 
        order.client?.id === client.id
      );

      // Trier par date (plus récent d'abord)
      const sortedOrders = orders.sort((a, b) => {
        const dateA = new Date(a.date || a.dateCreation || 0);
        const dateB = new Date(b.date || b.dateCreation || 0);
        return dateB - dateA;
      });

      setClientOrders(sortedOrders);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      toast.error('Erreur lors du chargement des commandes');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date non renseignée';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(montant || 0);
  };

  const getStatusBadge = (statut) => {
    const statusLower = statut?.toLowerCase() || '';
    
    if (statusLower.includes('valid') || statusLower === 'confirmé') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Validée</span>;
    } else if (statusLower.includes('refus') || statusLower === 'refusé') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Refusée</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">En attente</span>;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h2 className="text-xl font-semibold text-white">
                Détails du client
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {client && (
            <div className="p-6 space-y-6">
              {/* Informations client */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Informations personnelles
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nom complet</p>
                    <p className="text-base font-medium text-gray-900">
                      {client.prenom} {client.nom}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-base text-gray-900">{client.email || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="text-base text-gray-900">{client.telephone || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Adresse</p>
                    <p className="text-base text-gray-900">{client.adresse || 'Non renseignée'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type de client</p>
                    <p className="text-base">
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                        client.typeClient === 'PARTICULIER' ? 'bg-gray-100 text-gray-800' :
                        client.typeClient === 'VIP' ? 'bg-purple-100 text-purple-800' :
                        client.typeClient === 'PROFESSIONNEL' ? 'bg-blue-100 text-blue-800' :
                        client.typeClient === 'ENTREPRISE' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {client.typeClient === 'PARTICULIER' ? 'Particulier' :
                         client.typeClient === 'VIP' ? 'VIP' :
                         client.typeClient === 'PROFESSIONNEL' ? 'Professionnel' :
                         client.typeClient === 'ENTREPRISE' ? 'Entreprise' :
                         client.typeClient === 'FIDELE' ? 'Fidèle' : client.typeClient}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Remise</p>
                    <p className="text-base font-semibold text-blue-600">{client.remise || 0}%</p>
                  </div>
                </div>
              </div>

              {/* Liste des commandes */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Commandes ({clientOrders.length})
                </h3>

                {clientOrders.length > 0 ? (
                  <div className="space-y-3">
                    {clientOrders.map((order) => (
                      <div key={order.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-gray-900">{order.numero}</span>
                              {getStatusBadge(order.statut)}
                            </div>
                            <div className="text-sm text-gray-600">
                              <div className="flex items-center gap-2 mb-1">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{formatDate(order.date || order.dateCreation)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <span>{order.produits?.length || 0} produit(s)</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="text-xl font-bold text-blue-600">{formatMontant(order.total)}</p>
                          </div>
                        </div>
                        
                        {/* Aperçu des produits (optionnel) */}
                        {order.produits && order.produits.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-2">Produits :</p>
                            <div className="flex flex-wrap gap-2">
                              {order.produits.slice(0, 3).map((produit, idx) => (
                                <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                  {produit.libelle || produit.nom || `Produit ${idx + 1}`} 
                                  {produit.quantite > 1 && ` (x${produit.quantite})`}
                                </span>
                              ))}
                              {order.produits.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{order.produits.length - 3} autres
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <p className="text-gray-500">Aucune commande pour ce client</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetailsModal;