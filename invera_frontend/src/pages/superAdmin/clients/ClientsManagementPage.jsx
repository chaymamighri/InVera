// ClientsManagementPage.jsx - Version corrigée avec ouverture dans nouvel onglet

import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  XCircleIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  UserIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

import { clientPlatformService } from '../../../servicesPlatform/clientPlatformService';

// ⭐ STATUTS pour clients DEFINITIF
const STATUS_OPTIONS = [
  { label: 'Tous', value: 'ALL' },
  { label: 'En attente', value: 'EN_ATTENTE' },
  { label: 'Validé', value: 'VALIDE' },
  { label: 'Actifs', value: 'ACTIF' },
  { label: 'Refusés', value: 'REFUSE' },
];

const formatDate = (value) => {
  if (!value) return 'Non renseigné';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getFullName = (client) => {
  if (client?.raisonSociale) return client.raisonSociale;
  return [client?.prenom, client?.nom].filter(Boolean).join(' ') || client?.nom || 'Client';
};

const getStatusPillClass = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIF':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'EN_ATTENTE':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'VALIDE':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'REFUSE':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getStatusLabel = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIF':
      return 'Actif';
    case 'EN_ATTENTE':
      return 'En attente de validation';
    case 'VALIDE':
      return 'Validé (en attente paiement)';
    case 'REFUSE':
      return 'Refusé';
    default:
      return status || 'N/A';
  }
};

const summaryCardClass = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm';
const tabButtonClass = (active) => `px-4 py-2 text-sm font-medium rounded-lg transition ${
  active 
    ? 'bg-purple-600 text-white' 
    : 'text-gray-600 hover:bg-gray-100'
}`;

const ClientsManagementPage = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [documentLoading, setDocumentLoading] = useState(false);

  // Charger les clients DEFINITIF
  const loadClients = async (filter = statusFilter, { silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      console.log('🔍 Chargement des clients DEFINITIF...');
      const allClients = await clientPlatformService.getAllClients();
      const allDefinitifClients = allClients.filter(client => client.typeInscription === 'DEFINITIF');
      
      console.log('📊 Clients DEFINITIF reçus:', allDefinitifClients.length);
      
      let filteredData = [...allDefinitifClients];
      
      if (filter !== 'ALL') {
        filteredData = filteredData.filter(client => client.statut === filter);
        console.log('📊 Après filtre statut:', filteredData.length);
      }
      
      setClients(filteredData);

      if (selectedClient?.id) {
        const freshSelected = filteredData.find(
          (client) => String(client.id) === String(selectedClient.id)
        ) || null;
        setSelectedClient(freshSelected);
        setActiveTab('info');
      }
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      const message = error?.response?.data?.error || error?.message || 'Impossible de charger les clients.';
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadClients('ALL');
  }, []);

  useEffect(() => {
    if (!loading) {
      loadClients(statusFilter, { silent: true });
    }
  }, [statusFilter]);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;

    return clients.filter((client) => {
      const haystack = [
        client?.nom,
        client?.prenom,
        client?.raisonSociale,
        client?.email,
        client?.telephone,
        client?.statut,
        client?.typeCompte,
        client?.typeInscription,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [clients, search]);

  const stats = useMemo(() => {
    const total = clients.length;
    const pending = clients.filter((client) => client?.statut === 'EN_ATTENTE').length;
    const validated = clients.filter((client) => client?.statut === 'VALIDE').length;
    const active = clients.filter((client) => client?.statut === 'ACTIF').length;
    const refused = clients.filter((client) => client?.statut === 'REFUSE').length;
    return { total, pending, validated, active, refused };
  }, [clients]);

  const runAction = async (actionKey, callback, successMessage) => {
    setActionLoading(actionKey);
    try {
      await callback();
      toast.success(successMessage);
      await loadClients(statusFilter, { silent: true });
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || "L'action n'a pas pu être exécutée.";
      toast.error(message);
    } finally {
      setActionLoading('');
    }
  };

  const handleValidate = async (client) => {
    await runAction(
      `validate-${client.id}`,
      () => clientPlatformService.validateClient(client.id),
      '✅ Client validé avec succès'
    );
  };

  const handleRefuse = async (client) => {
    const motif = window.prompt('Motif du refus :', client?.motifRefus || '');
    if (motif === null) return;
    await runAction(
      `refuse-${client.id}`,
      () => clientPlatformService.refuseClient(client.id, motif),
      '❌ Client refusé'
    );
  };

  const getDocumentList = (client) => {
    const documents = [];
    if (client.typeCompte === 'ENTREPRISE') {
      if (client.gerantCinUrl) documents.push({ 
        name: 'CIN du gérant', 
        type: 'gerantcin',
        url: client.gerantCinUrl
      });
      if (client.patenteUrl) documents.push({ 
        name: 'Patente', 
        type: 'patente',
        url: client.patenteUrl
      });
      if (client.rneUrl) documents.push({ 
        name: 'Registre National des Entreprises', 
        type: 'rne',
        url: client.rneUrl
      });
    } else {
      if (client.cinUrl) documents.push({ 
        name: 'CIN', 
        type: 'cin',
        url: client.cinUrl
      });
    }
    return documents;
  };

  // ✅ MODIFICATION: Ouvrir le document dans un nouvel onglet
  const handleViewDocument = async (clientId, doc) => {
    setDocumentLoading(true);
    
    try {
      // Récupérer le document sous forme de blob
      const blob = await clientPlatformService.getDocument(clientId, doc.type);
      
      // Créer une URL objet
      const url = URL.createObjectURL(blob);
      
      // Déterminer le type de fichier pour l'extension
      let extension = '.pdf';
      if (doc.url) {
        const parts = doc.url.split('.');
        extension = '.' + parts[parts.length - 1];
      }
      
      // Créer un lien temporaire pour le téléchargement/visualisation
      const link = document.createElement('a');
      link.href = url;
      
      // Pour les PDF et images, ouvrir dans un nouvel onglet
      if (extension === '.pdf' || extension === '.jpg' || extension === '.jpeg' || extension === '.png' || extension === '.gif') {
        window.open(url, '_blank');
        toast.success('Document ouvert dans un nouvel onglet');
      } else {
        // Pour les autres formats, forcer le téléchargement
        link.download = `${doc.name}${extension}`;
        link.click();
        toast.success('Téléchargement du document démarré');
      }
      
      // Nettoyer l'URL objet après un délai
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      
    } catch (error) {
      console.error('Erreur chargement document:', error);
      toast.error("Impossible de charger le document");
    } finally {
      setDocumentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-purple-600">
              Gestion clients DEFINITIF
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900">
              Validation des inscriptions DEFINITIF
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-500">
              Consultez les documents justificatifs, validez ou refusez les demandes d'inscription DEFINITIF.
              Les clients validés recevront automatiquement les instructions de paiement.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-[260px]">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un client DEFINITIF"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition focus:border-purple-300 focus:bg-white"
              />
            </div>
            <button
              onClick={() => loadClients(statusFilter, { silent: true })}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-purple-300 hover:text-purple-700"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>
      </section>

      {/* Cartes statistiques */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Total DEFINITIF</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">En attente validation</p>
          <p className="mt-2 text-3xl font-semibold text-amber-600">{stats.pending}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Validés</p>
          <p className="mt-2 text-3xl font-semibold text-blue-600">{stats.validated}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Actifs</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">{stats.active}</p>
        </div>
        <div className={summaryCardClass}>
          <p className="text-sm font-medium text-gray-500">Refusés</p>
          <p className="mt-2 text-3xl font-semibold text-rose-600">{stats.refused}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        {/* Tableau des clients */}
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      statusFilter === option.value
                        ? 'bg-purple-600 text-white'
                        : 'border border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:text-purple-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                {filteredClients.length} client DEFINITIF{filteredClients.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Inscription</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredClients.map((client) => {
                  const fullName = getFullName(client);
                  const isSelected = String(selectedClient?.id) === String(client.id);
                  const hasDocuments = getDocumentList(client).length > 0;

                  return (
                    <tr
                      key={client.id}
                      className={`cursor-pointer transition hover:bg-purple-50/40 ${isSelected ? 'bg-purple-50/60' : ''}`}
                      onClick={() => setSelectedClient(client)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-sm font-semibold text-purple-700">
                            {fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{fullName}</p>
                            <p className="text-sm text-gray-500">{client.email || 'Email non renseigné'}</p>
                          </div>
                        </div>
                       </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusPillClass(client?.statut)}`}>
                          {getStatusLabel(client?.statut)}
                        </span>
                        </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{client.typeCompte || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(client?.dateInscription || client?.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {client?.statut === 'EN_ATTENTE' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleValidate(client); }}
                              disabled={actionLoading === `validate-${client.id}`}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                              Valider
                            </button>
                          )}
                          {client?.statut === 'EN_ATTENTE' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRefuse(client); }}
                              disabled={actionLoading === `refuse-${client.id}`}
                              className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                            >
                              <XCircleIcon className="h-4 w-4" />
                              Refuser
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredClients.length === 0 && (
              <div className="px-6 py-16 text-center text-gray-500">
                Aucun client DEFINITIF ne correspond à cette recherche.
              </div>
            )}
          </div>
        </div>

        {/* Panneau latéral - Détails client avec Tabs */}
        <aside className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-900">Détail client</h2>
            <p className="mt-1 text-sm text-gray-500">
              Sélectionnez un client pour consulter ses informations.
            </p>
          </div>

          {selectedClient ? (
            <div className="flex flex-col h-full">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 px-6 pt-4 gap-2">
                <button
                  onClick={() => setActiveTab('info')}
                  className={tabButtonClass(activeTab === 'info')}
                >
                  <InformationCircleIcon className="h-4 w-4 inline mr-2" />
                  Informations
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={tabButtonClass(activeTab === 'documents')}
                >
                  <DocumentTextIcon className="h-4 w-4 inline mr-2" />
                  Documents
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Onglet Informations */}
                {activeTab === 'info' && (
                  <>
                    <div className="text-center border-b pb-4">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-100 text-2xl font-semibold text-purple-700 mx-auto mb-3">
                        {getFullName(selectedClient).substring(0, 2).toUpperCase()}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{getFullName(selectedClient)}</h3>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold mt-2 ${getStatusPillClass(selectedClient?.statut)}`}>
                        {getStatusLabel(selectedClient?.statut)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Coordonnées</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Email:</span>
                          <span className="text-gray-900 font-medium">{selectedClient.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Téléphone:</span>
                          <span className="text-gray-900">{selectedClient.telephone || 'Non renseigné'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Type compte:</span>
                          <span className="text-gray-900">{selectedClient.typeCompte}</span>
                        </div>
                        {selectedClient.matriculeFiscal && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Matricule fiscal:</span>
                            <span className="text-gray-900">{selectedClient.matriculeFiscal}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-500">Date inscription:</span>
                          <span className="text-gray-900">{formatDate(selectedClient.dateInscription)}</span>
                        </div>
                        {selectedClient.motifRefus && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Motif refus:</span>
                            <span className="text-rose-600">{selectedClient.motifRefus}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Onglet Documents - Version avec ouverture dans nouvel onglet */}
                {activeTab === 'documents' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Documents justificatifs</h4>
                    
                    {getDocumentList(selectedClient).map((doc, index) => (
                      <div key={index} className="border rounded-lg p-3 hover:bg-gray-50 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                            <div>
                              <p className="font-medium text-gray-900">{doc.name}</p>
                              <p className="text-xs text-gray-500">Cliquez pour ouvrir dans un nouvel onglet</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleViewDocument(selectedClient.id, doc)}
                            className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                            disabled={documentLoading}
                          >
                            {documentLoading ? (
                              <>
                                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Chargement...</span>
                              </>
                            ) : (
                              <>
                                <EyeIcon className="h-4 w-4" />
                                <span>Ouvrir</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {getDocumentList(selectedClient).length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <DocumentTextIcon className="h-12 w-12 mx-auto mb-2" />
                        <p>Aucun document disponible</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t p-6 space-y-3 bg-gray-50 rounded-b-3xl">
                {selectedClient?.statut === 'EN_ATTENTE' && (
                  <>
                    <button
                      onClick={() => handleValidate(selectedClient)}
                      disabled={actionLoading === `validate-${selectedClient.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      Valider la demande
                    </button>
                    <button
                      onClick={() => handleRefuse(selectedClient)}
                      disabled={actionLoading === `refuse-${selectedClient.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                    >
                      <XCircleIcon className="h-5 w-5" />
                      Refuser la demande
                    </button>
                  </>
                )}
                
                {selectedClient?.statut === 'VALIDE' && (
                  <div className="rounded-xl bg-blue-50 p-4 text-center">
                    <CheckCircleIcon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-blue-800 font-medium">Client validé</p>
                    <p className="text-xs text-blue-600 mt-1">En attente de paiement pour activation</p>
                  </div>
                )}
                
                {selectedClient?.statut === 'ACTIF' && (
                  <div className="rounded-xl bg-emerald-50 p-4 text-center">
                    <CheckCircleIcon className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm text-emerald-800 font-medium">Compte actif</p>
                  </div>
                )}
                
                {selectedClient?.statut === 'REFUSE' && (
                  <div className="rounded-xl bg-rose-50 p-4 text-center">
                    <XCircleIcon className="h-6 w-6 text-rose-600 mx-auto mb-2" />
                    <p className="text-sm text-rose-800 font-medium">Demande refusée</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[500px] flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                <UserGroupIcon className="h-8 w-8" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">Aucun client sélectionné</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                Cliquez sur un client dans le tableau pour afficher ses informations.
              </p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
};

export default ClientsManagementPage;