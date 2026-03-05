// produits/Produits.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import {
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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
  // ========== HOOKS ==========
  const {
    products = [],
    loading: productsLoading,
    error: productsError,
    pagination = { page: 0, size: 10, total: 0, totalPages: 0 },
    searchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    reactivateProduct,
    updateStock,
    filters,           
    setFilters,      
    resetFilters,     
    changePage,
    getStatusLabel = (s) => s || '',
    getStatusColor = (s) => 'gray'
  } = useProducts({ actif: '' }) || {}; 
  
  const { user } = useAuth();
  const userRole = user?.role;

  // Hook pour les catégories
  const { categories, loading: categoriesLoading } = useCategories();

  // ========== ÉTATS LOCAUX SÉPARÉS ==========
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchInput, setSearchInput] = useState(''); 
  const [showFilters, setShowFilters] = useState(false);

  // Synchroniser l'input avec la recherche du hook
  useEffect(() => {
    setSearchInput(filters.keyword || '');
  }, [filters.keyword]);

  // ========== GESTIONNAIRES ==========
  const handleAddProduit = () => {
    console.log('➕ Ouverture formulaire création');
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduit = (produit) => {
    console.log('✏️ Édition produit:', produit?.id, produit?.libelle);
    if (!produit) return;
    setEditingProduct(produit);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    console.log('❌ Fermeture formulaire');
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  // ✅ FONCTION SÉPARÉE POUR LA CRÉATION
  const handleCreateProduct = async (formData) => {
    console.log('➕ handleCreateProduct - Création produit');
    console.log('📦 formData type:', formData instanceof FormData ? 'FormData' : typeof formData);
    
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
      console.error('❌ Response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  // ✅ FONCTION SÉPARÉE POUR LA MODIFICATION
  const handleUpdateProduct = async (id, formData) => {
    console.log('✏️ handleUpdateProduct - Modification produit ID:', id);
    console.log('📦 formData type:', formData instanceof FormData ? 'FormData' : typeof formData);
    
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
      } else {
        toast.error(response?.message || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('❌ Erreur modification:', error);
      console.error('❌ Response:', error.response?.data);
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
      }
    } catch (error) {
      console.error('❌ Erreur toggle:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleStockAdjustment = async (id, nouvelleQuantite) => {
    if (!id || nouvelleQuantite === undefined) return;
    
    try {
      const response = await updateStock(id, nouvelleQuantite);
      if (response?.success) {
        toast.success('Stock ajusté');
      }
    } catch (error) {
      console.error('❌ Erreur stock:', error);
      toast.error("Erreur lors de l'ajustement");
    }
  };

  // RECHERCHE avec debounce
  const handleSearch = useCallback((keyword) => {
    setFilters(prev => ({
      ...prev,
      keyword: keyword || undefined
    }));
  }, [setFilters]);

  // CHANGEMENT DE FILTRE
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  }, [setFilters]);

  // RÉINITIALISATION TOTALE
  const handleResetFilters = useCallback(() => {
    setSearchInput('');
    resetFilters();
  }, [resetFilters]);

  // RAFRAÎCHIR
  const handleRefresh = useCallback(() => {
    searchProducts(filters);
    toast.success('Liste actualisée');
  }, [filters, searchProducts]);

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
                  onStockAdjust={handleStockAdjustment}
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

          {pagination?.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => changePage?.(pagination.page - 1)}
                disabled={pagination.page === 0}
                className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <span className="px-4 py-2">
                Page {pagination.page + 1} / {pagination.totalPages}
              </span>
              <button
                onClick={() => changePage?.(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages - 1}
                className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Formulaire avec fonctions séparées */}
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