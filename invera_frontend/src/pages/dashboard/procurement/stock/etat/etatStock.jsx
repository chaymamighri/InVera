// dashboard/procurement/stock/etat
import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon as DownloadIcon,
  BellAlertIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { stockEtatService } from '../../../../../services/stockService';

const EtatStock = () => {
  const [produits, setProduits] = useState([]);
  const [produitsFiltres, setProduitsFiltres] = useState([]);
  const [produitsPagines, setProduitsPagines] = useState([]);
  const [stats, setStats] = useState({
    totalValeurStock: 0,
    totalProduits: 0,
    produitsAlerte: 0,
    produitsRupture: 0,
    produitsNormaux: 0,
    produitsCritique: 0,
    produitsFaible: 0,
    valeurStockAlerte: 0,
    valeurStockRupture: 0,
    pourcentageAlerte: 0,
    pourcentageRupture: 0,
    topProduitsValeur: []
  });
  const [loading, setLoading] = useState(true);
  const [filtres, setFiltres] = useState({
    categorieId: '',
    seuilAlerte: false,
    rupture: false
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    chargerDonnees();
  }, []);

  useEffect(() => {
    appliquerFiltres();
  }, [produits, filtres]);

  useEffect(() => {
    paginerProduits();
  }, [produitsFiltres, currentPage, itemsPerPage]);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      const etatStock = await stockEtatService.getEtatStock();
      console.log('Produits reçus:', etatStock);
      setProduits(etatStock || []);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const appliquerFiltres = () => {
    let resultats = [...produits];
    
    if (filtres.categorieId) {
      resultats = resultats.filter(p => p.categorieId === parseInt(filtres.categorieId));
    }
    
    if (filtres.seuilAlerte) {
      resultats = resultats.filter(p => p.statutStock === 'FAIBLE' || p.statutStock === 'CRITIQUE');
    }
    
    if (filtres.rupture) {
      resultats = resultats.filter(p => p.statutStock === 'RUPTURE');
    }
    
    setProduitsFiltres(resultats);
    setCurrentPage(1);
    calculerStatsAvancees(resultats);
  };

  const paginerProduits = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = produitsFiltres.slice(startIndex, endIndex);
    setProduitsPagines(paginated);
    setTotalPages(Math.ceil(produitsFiltres.length / itemsPerPage));
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const calculerStatsAvancees = (produitsData) => {
    let totalValeur = 0;
    let alerte = 0;
    let rupture = 0;
    let critique = 0;
    let faible = 0;
    let normal = 0;
    let valeurAlerte = 0;
    let valeurRupture = 0;
    
    const produitsAvecValeur = produitsData.map(p => ({
      ...p,
      valeurStock: p.valeurStock || 0
    }));
    
    const topProduitsValeur = [...produitsAvecValeur]
      .sort((a, b) => b.valeurStock - a.valeurStock)
      .slice(0, 5);
    
    produitsData.forEach(produit => {
      const valeur = produit.valeurStock || 0;
      totalValeur += valeur;
      
      if (produit.statutStock === 'RUPTURE') {
        rupture++;
        valeurRupture += valeur;
      } else if (produit.statutStock === 'CRITIQUE') {
        critique++;
        alerte++;
        valeurAlerte += valeur;
      } else if (produit.statutStock === 'FAIBLE') {
        faible++;
        alerte++;
        valeurAlerte += valeur;
      } else {
        normal++;
      }
    });
    
    const totalProduits = produitsData.length;
    const pourcentageAlerte = totalProduits > 0 ? (alerte / totalProduits) * 100 : 0;
    const pourcentageRupture = totalProduits > 0 ? (rupture / totalProduits) * 100 : 0;
    
    setStats({
      totalValeurStock: totalValeur,
      totalProduits: totalProduits,
      produitsAlerte: alerte,
      produitsRupture: rupture,
      produitsNormaux: normal,
      produitsCritique: critique,
      produitsFaible: faible,
      valeurStockAlerte: valeurAlerte,
      valeurStockRupture: valeurRupture,
      pourcentageAlerte: pourcentageAlerte,
      pourcentageRupture: pourcentageRupture,
      topProduitsValeur: topProduitsValeur
    });
  };

  const handleExportCSV = () => {
    try {
      if (!produitsFiltres || produitsFiltres.length === 0) {
        alert('Aucune donnée à exporter');
        return;
      }
      
      const colonnes = [
        'Référence',
        'Produit',
        'Catégorie',
        'Quantité',
        'Unité',
        'Prix Unitaire (TND)',
        'Valeur Stock (TND)',
        'Seuil Alerte',
        'Statut'
      ];
      
      const lignes = produitsFiltres.map(produit => [
        produit.reference || '',
        produit.libelle || '',
        produit.categorieNom || '',
        produit.quantiteActuelle || 0,
        produit.unite || '',
        produit.prixUnitaire || 0,
        produit.valeurStock || 0,
        produit.seuilAlerte || '',
        produit.statutStock === 'EN_STOCK' ? 'En stock' :
        produit.statutStock === 'FAIBLE' ? 'Stock faible' :
        produit.statutStock === 'CRITIQUE' ? 'Critique' : 'Rupture'
      ]);
      
      const date = new Date().toLocaleString('fr-FR');
      const resume = [
        [''],
        ['=== RÉSUMÉ ==='],
        [`Date d'export: ${date}`],
        [`Valeur totale du stock: ${stats.totalValeurStock?.toLocaleString()} TND`],
        [`Nombre total de produits: ${stats.totalProduits}`],
        [`Produits en stock normal: ${stats.produitsNormaux}`],
        [`Produits en stock faible: ${stats.produitsFaible}`],
        [`Produits en stock critique: ${stats.produitsCritique}`],
        [`Produits en rupture: ${stats.produitsRupture}`]
      ];
      
      const csvContent = [
        colonnes.join(';'),
        ...lignes.map(ligne => ligne.join(';')),
        ...resume.map(r => r.join(';'))
      ].join('\n');
      
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.href = url;
      link.setAttribute('download', `etat-stock-${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Erreur export CSV:', error);
      alert('Erreur lors de l\'export du fichier CSV');
    }
  };

  const resetFilters = () => {
    setFiltres({
      categorieId: '',
      seuilAlerte: false,
      rupture: false
    });
  };

  // ✅ NOUVEAU COMPOSANT STATCARD AVEC EFFET GRIS
  const StatCard = ({ title, value, icon: Icon, color, subtitle, hasData }) => {
    const isEmpty = !hasData && (value === 0 || value === '0 TND' || value === '0');
    
    return (
      <div className={`rounded-lg shadow p-6 transition-shadow ${isEmpty ? 'bg-gray-50' : 'bg-white hover:shadow-lg'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${isEmpty ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
            {isEmpty ? (
              <p className="text-2xl font-bold mt-2 text-gray-400">—</p>
            ) : (
              <p className="text-2xl font-bold mt-2 text-gray-800">{value}</p>
            )}
            {subtitle && !isEmpty && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-full ${isEmpty ? 'bg-gray-300' : color}`}>
            <Icon className={`w-6 h-6 ${isEmpty ? 'text-gray-400' : 'text-white'}`} />
          </div>
        </div>
      </div>
    );
  };

  const StatutBadge = ({ statut }) => {
    const config = {
      EN_STOCK: { bg: 'bg-green-100', text: 'text-green-800', label: 'En stock', icon: CheckCircleIcon },
      FAIBLE: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Stock faible', icon: BellAlertIcon },
      CRITIQUE: { bg: 'bg-red-100', text: 'text-red-800', label: 'Critique', icon: ExclamationTriangleIcon },
      RUPTURE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Rupture', icon: XCircleIcon }
    };
    
    const { bg, text, label, icon: Icon } = config[statut] || config.EN_STOCK;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </span>
    );
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return '0';
    return value.toLocaleString('fr-FR');
  };

  const formatPrice = (value) => {
    if (!value && value !== 0) return '0 TND';
    return `${value.toLocaleString('fr-FR')} TND`;
  };

  const Pagination = () => {
    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages, start + maxVisible - 1);
      
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    };

    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, produitsFiltres.length)} sur {produitsFiltres.length} produits
          </span>
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg border ${
              currentPage === 1 
                ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                : 'border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          
          {getPageNumbers().map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded-lg ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg border ${
              currentPage === totalPages 
                ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                : 'border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-500">Chargement de l'état de stock...</p>
      </div>
    );
  }

  if (produits.length === 0) {
    return (
      <div className="p-12 text-center">
        <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
        <p className="text-gray-500">Aucun produit trouvé</p>
        <p className="text-xs text-gray-400 mt-1">
          Vérifiez que vous avez des produits et des mouvements de stock
        </p>
      </div>
    );
  }

  const categoriesUniques = [...new Map(produits.map(p => [p.categorieId, p.categorieNom])).entries()];

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="flex justify-end mb-6">
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <DownloadIcon className="w-4 h-4" />
          Exporter CSV
        </button>
      </div>

      {/* Statistiques - Ligne 1 avec effet gris */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Valeur totale du stock"
          value={formatPrice(stats.totalValeurStock)}
          icon={CurrencyDollarIcon}
          color="bg-blue-500"
          hasData={stats.totalValeurStock > 0}
        />
        <StatCard
          title="Total produits"
          value={formatNumber(stats.totalProduits)}
          icon={ShoppingBagIcon}
          color="bg-purple-500"
          hasData={stats.totalProduits > 0}
        />
        <StatCard
          title="Produits en stock"
          value={formatNumber(stats.produitsNormaux)}
          icon={CheckCircleIcon}
          color="bg-green-500"
          hasData={stats.produitsNormaux > 0}
        />
      </div>

      {/* Statistiques - Ligne 2 avec effet gris */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Stock critique"
          value={formatNumber(stats.produitsCritique)}
          icon={ExclamationTriangleIcon}
          color="bg-red-500"
          subtitle="Action immédiate"
          hasData={stats.produitsCritique > 0}
        />
        <StatCard
          title="Stock faible"
          value={formatNumber(stats.produitsFaible)}
          icon={ClockIcon}
          color="bg-yellow-500"
          subtitle="À réapprovisionner"
          hasData={stats.produitsFaible > 0}
        />
        <StatCard
          title="Produits en rupture"
          value={formatNumber(stats.produitsRupture)}
          icon={XCircleIcon}
          color="bg-gray-500"
          subtitle={`${stats.pourcentageRupture.toFixed(1)}% du total`}
          hasData={stats.produitsRupture > 0}
        />
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="w-full lg:w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie
            </label>
            <select
              value={filtres.categorieId}
              onChange={(e) => setFiltres({ ...filtres, categorieId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Toutes les catégories</option>
              {categoriesUniques.map(([id, nom]) => (
                <option key={id} value={id}>{nom}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:w-1/3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filtres.seuilAlerte}
                onChange={(e) => setFiltres({
                  ...filtres,
                  seuilAlerte: e.target.checked,
                  rupture: e.target.checked ? false : filtres.rupture
                })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Stock faible / critique</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filtres.rupture}
                onChange={(e) => setFiltres({
                  ...filtres,
                  rupture: e.target.checked,
                  seuilAlerte: e.target.checked ? false : filtres.seuilAlerte
                })}
                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">Rupture</span>
            </label>
          </div>

          <div className="w-full lg:w-auto lg:ml-auto">
            <button
              onClick={resetFilters}
              className="w-full lg:w-auto px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Réf.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qté</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unité</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prix unit.</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valeur stock</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Seuil</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {produitsPagines.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p>Aucun produit ne correspond aux filtres sélectionnés</p>
                  </td>
                </tr>
              ) : (
                produitsPagines.map((produit) => (
                  <tr key={produit.produitId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {produit.reference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {produit.libelle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {produit.categorieNom || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      <span className={produit.quantiteActuelle === 0 ? 'text-red-600 font-bold' : 'text-gray-900'}>
                        {formatNumber(produit.quantiteActuelle)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {produit.unite || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      {formatPrice(produit.prixUnitaire)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-600">
                      {formatPrice(produit.valeurStock)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <StatutBadge statut={produit.statutStock} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {produit.seuilAlerte || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <Pagination />
      </div>
    </div>
  );
};

export default EtatStock;