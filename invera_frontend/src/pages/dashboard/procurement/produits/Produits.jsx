/**
 * Produits - Gestion des produits (catalogue)
 * 
 * RÔLE : Gérer le catalogue des produits (CRUD, filtres, pagination)
 * ROUTE : /dashboard/procurement/produits
 * 
 * FONCTIONNALITÉS :
 * - Liste des produits sous forme de cartes
 * - Recherche par nom/référence
 * - Filtres (catégorie, statut)
 * - Création de produit
 * - Modification de produit
 * - Activation/Désactivation de produit
 * - Pagination (6, 9, 12, 18, 24 par page)
 * - Rafraîchissement des données
 * 
 * HOOKS UTILISÉS :
 * - useProducts() : Gestion des produits (CRUD, pagination, filtres)
 * - useCategories() : Récupération des catégories
 * - useAuth() : Rôle utilisateur
 * 
 * COMPOSANTS :
 * - ProduitToolbar : Barre d'outils (recherche, filtres, actions)
 * - ProduitCard : Carte produit individuelle
 * - CreateProduitForm : Modal création produit
 * - EditProduitForm : Modal modification produit
 */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import {
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import ProduitCard from './components/ProduitCard';
import ProduitToolbar from './components/ProduitToolbar';
import CreateProduitForm from './components/CreateProduitForm';
import EditProduitForm from './components/EditProduitForm';
import useProducts from '../../../../hooks/useProducts';
import useCategories from '../../../../hooks/useCategories';
import toast from 'react-hot-toast';

const Produits = () => {
  // ========== HOOKS (dans le bon ordre) ==========
  const {
    products: rawProducts = [],
    loading: productsLoading,
    error: productsError,
    pagination = { page: 0, size: 9, total: 0, totalPages: 0 },
    loadProducts,        
    createProduct,
    updateProduct,
    deleteProduct,
    reactivateProduct,
    filters,           
    setFilters,      
    resetFilters,     
    changePage,
    changePageSize,
    getStatusLabel = (s) => s || '',
    getStatusColor = (s) => 'gray'
  } = useProducts({ actif: '', size: 9 }) || {}; 

  
  const { user } = useAuth();
  const userRole = user?.role;

  // ✅ Hook pour les catégories - BIEN DÉCLARÉ ICI
  const { categories: rawCategories, loading: categoriesLoading } = useCategories();

  // ✅ NORMALISER LES CATÉGORIES (après la déclaration)
  const categories = useMemo(() => {
    console.log('🔍 rawCategories dans useMemo:', rawCategories);
    if (!rawCategories?.length) return [];
    return rawCategories.map(cat => ({
      idCategorie: cat.idCategorie || cat.id,
      nomCategorie: cat.nomCategorie || cat.nom || cat.libelle || 'Sans catégorie',
      description: cat.description || '',
      tauxTVA: cat.tauxTVA || 19
    }));
  }, [rawCategories]);

  
  useEffect(() => {
  console.log('📊 État chargement catégories:', categoriesLoading);
  console.log('📊 Nombre de catégories:', categories.length);
}, [categoriesLoading, categories]);

  // ✅ Créer un map des catégories par ID
  const categoriesMap = useMemo(() => {
    const map = new Map();
    if (categories && categories.length) {
      categories.forEach(cat => {
        if (cat.idCategorie) {
          map.set(cat.idCategorie, {
            id: cat.idCategorie,
            nom: cat.nomCategorie,
            tauxTVA: cat.tauxTVA
          });
        }
      });
    }
    return map;
  }, [categories]);

  // ✅ ENRICHIR LES PRODUITS
  const products = useMemo(() => {
    if (!rawProducts?.length) return [];
    
    return rawProducts.map(product => {
      let categorieId = product.categorieId;
      
      if (!categorieId && product.idCategorie) {
        categorieId = product.idCategorie;
      }
      if (!categorieId && product.categorie && typeof product.categorie === 'number') {
        categorieId = product.categorie;
      }
      if (!categorieId && product.categorie?.idCategorie) {
        categorieId = product.categorie.idCategorie;
      }
      
      const categorieInfo = categoriesMap.get(categorieId);
      const categorieNom = categorieInfo?.nom || 'Sans catégorie';
      const tauxTVA = categorieInfo?.tauxTVA || 19;
      
      return {
        ...product,
        categorieId: categorieId,
        categorieNom: categorieNom,
        displayCategorie: categorieNom,
        tauxTVA: tauxTVA,
        categorie: categorieInfo ? {
          idCategorie: categorieInfo.id,
          nomCategorie: categorieInfo.nom,
          tauxTVA: categorieInfo.tauxTVA
        } : product.categorie
      };
    });
  }, [rawProducts, categoriesMap]);

  // ========== ÉTATS LOCAUX ==========
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchInput, setSearchInput] = useState(''); 
  const [showFilters, setShowFilters] = useState(false);

  // Synchroniser l'input avec la recherche
  useEffect(() => {
    setSearchInput(filters.keyword || '');
  }, [filters.keyword]);

  // ========== GESTIONNAIRES ==========
  const handleAddProduit = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduit = (produit) => {
    if (!produit) return;
    setEditingProduct(produit);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const handleCreateProduct = async (formData) => {
    if (!formData) {
      console.error('❌ formData null');
      toast.error('Erreur: données du formulaire manquantes');
      return;
    }
    
    try {
      const response = await createProduct(formData);
      console.log('✅ Réponse création:', response);
      
      if (response?.success) {
        toast.success('Produit ajouté avec succès');
        handleCloseForm();
      } else {
        toast.error(response?.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('❌ Erreur création:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleUpdateProduct = async (id, formData) => {
    if (!id || !formData) {
      console.error('❌ ID ou formData manquant');
      toast.error('Erreur: données manquantes pour la modification');
      return;
    }
    
    try {
      const response = await updateProduct(id, formData);
      console.log('✅ Réponse modification:', response);
      
      if (response?.success) {
        toast.success('Produit modifié avec succès');
        handleCloseForm();
        await loadProducts(pagination.page);
      } else {
        toast.error(response?.message || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('❌ Erreur modification:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    if (!id) return;
    
    try {
      const response = currentActive
        ? await deleteProduct(id)
        : await reactivateProduct(id);
      
      if (response?.success) {
        toast.success(currentActive ? 'Produit désactivé' : 'Produit activé');
        await loadProducts(pagination.page);
      }
    } catch (error) {
      console.error('❌ Erreur toggle:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleSearch = useCallback((keyword) => {
    const newFilters = { ...filters, keyword: keyword || undefined };
    setFilters(newFilters);
    loadProducts(0, newFilters);
  }, [filters, setFilters, loadProducts]);

  const handleFilterChange = useCallback((key, value) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    loadProducts(0, newFilters);
  }, [filters, setFilters, loadProducts]);

  const handleResetFilters = useCallback(() => {
    setSearchInput('');
    resetFilters();
  }, [resetFilters]);

  const handleRefresh = useCallback(() => {
    loadProducts(0, filters);
    toast.success('Liste actualisée');
  }, [filters, loadProducts]);

  // ========== RENDU DE LA PAGINATION ==========
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const currentPage = pagination.page;
    const totalPages = pagination.totalPages;
    const pageSize = pagination.size;
    
    const getPageNumbers = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];
      let l;

      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
          range.push(i);
        }
      }

      range.forEach((i) => {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(l + 1);
          } else if (i - l !== 1) {
            rangeWithDots.push('...');
          }
        }
        rangeWithDots.push(i);
        l = i;
      });

      return rangeWithDots;
    };

    const pageNumbers = getPageNumbers();

    return (
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Afficher :</span>
          <select
            value={pageSize}
            onChange={(e) => changePageSize?.(parseInt(e.target.value))}
            className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="6">6 par page</option>
            <option value="9">9 par page</option>
            <option value="12">12 par page</option>
            <option value="18">18 par page</option>
            <option value="24">24 par page</option>
          </select>
        </div>

        <div className="text-sm text-gray-500">
          Affichage de {currentPage * pageSize + 1} à{' '}
          {Math.min((currentPage + 1) * pageSize, pagination.total)} sur{' '}
          {pagination.total} produits
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => changePage?.(0)}
            disabled={currentPage === 0}
            className="p-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            title="Première page"
          >
            <ChevronDoubleLeftIcon className="h-5 w-5 text-gray-600" />
          </button>

          <button
            onClick={() => changePage?.(currentPage - 1)}
            disabled={currentPage === 0}
            className="p-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            title="Page précédente"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-1 mx-1">
            {pageNumbers.map((page, idx) => (
              page === '...' ? (
                <span key={`dots-${idx}`} className="px-2 text-gray-400">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => changePage?.(page - 1)}
                  className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page - 1
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              )
            ))}
          </div>

          <button
            onClick={() => changePage?.(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            className="p-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            title="Page suivante"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          </button>

          <button
            onClick={() => changePage?.(totalPages - 1)}
            disabled={currentPage === totalPages - 1}
            className="p-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            title="Dernière page"
          >
            <ChevronDoubleRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
    );
  };

  // ========== RENDU ==========
  if (productsError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-red-600">
        <ExclamationTriangleIcon className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">Erreur</p>
        <p className="text-sm">{productsError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProduitToolbar
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onSearch={handleSearch}
        filters={filters}          
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onAddProduit={handleAddProduit}
        categories={categories}   
        onRefresh={handleRefresh} 
        loadingCategories={categoriesLoading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      {productsLoading ? (
        <div className="flex justify-center py-12">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products && products.length > 0 ? (
              products.map(produit => (
                <ProduitCard
                  key={produit?.id || produit?.idProduit || Math.random()}
                  produit={produit || {}}
                  onEdit={handleEditProduit}
                  onToggleActive={handleToggleActive}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-gray-500">
                Aucun produit trouvé
              </div>
            )}
          </div>

          {renderPagination()}
        </>
      )}

      {isFormOpen && (
        editingProduct ? (
          <EditProduitForm
            produit={editingProduct}
            categories={categories} 
            onClose={handleCloseForm}
            onSave={handleUpdateProduct}  
            userRole={userRole} 
          />
        ) : (
          <CreateProduitForm
            categories={categories}  
            onClose={handleCloseForm}
            onSave={handleCreateProduct}  
            userRole={userRole} 
          />
        )
      )}
    </div>
  );
};

export default Produits;