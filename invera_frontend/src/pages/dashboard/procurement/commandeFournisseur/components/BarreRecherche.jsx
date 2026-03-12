// components/BarreRecherche.jsx
import React from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PlusIcon,
  ArchiveBoxIcon  // ← NOUVEAU: icône pour les archives
} from '@heroicons/react/24/outline';

const BarreRecherche = ({
  searchTerm,
  setSearchTerm,
  selectedStatut,
  setSelectedStatut,
  showFilters,
  setShowFilters,
  onSearch,
  onNouvelleCommande,
  onShowArchives,  // ← NOUVEAU: prop pour afficher les archives
  showArchives,     // ← NOUVEAU: état pour savoir si on affiche les archives
  statuts,
  dateDebut,
  setDateDebut,
  dateFin,
  setDateFin,
  onSearchByPeriode,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Recherche principale */}
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro ou fournisseur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSearch()}
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={onSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Rechercher
          </button>
        </div>

        {/* Filtres et actions */}
        <div className="flex gap-2">
          <select
            value={selectedStatut}
            onChange={(e) => setSelectedStatut(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les statuts</option>
            {Object.values(statuts).map(statut => (
              <option key={statut} value={statut}>{statut}</option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
              showFilters ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
            Filtres
          </button>

          {/* ✅ NOUVEAU: Bouton Archives */}
          <button
            onClick={onShowArchives}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
              showArchives 
                ? 'bg-purple-100 text-purple-700 border-purple-300' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            title={showArchives ? "Masquer les archives" : "Afficher les commandes supprimées"}
          >
            <ArchiveBoxIcon className="w-5 h-5" />
            {showArchives ? 'Archives' : 'Archives'}
          </button>

          <button
            onClick={onNouvelleCommande}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Nouvelle commande
          </button>
        </div>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={onSearchByPeriode}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Appliquer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarreRecherche;