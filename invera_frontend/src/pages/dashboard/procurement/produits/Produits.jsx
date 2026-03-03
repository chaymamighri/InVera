// produits/Produits.jsx
import React, { useState , useCallback } from 'react';
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
    applyFilters,
    resetFilters,
    changePage,
    getStatusLabel = (s) => s || '',
    getStatusColor = (s) => 'gray'
  } = useProducts({ actif: '' }) || {}; 

  // ✅ Hook pour les catégories (gère le fallback automatiquement)
  const { categories, loading: categoriesLoading } = useCategories();

  // ========== ÉTATS LOCAUX ==========
  const [showForm, setShowForm] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    status: '',
    categorieId: '',
    actif: ''  
  });

  // ========== GESTIONNAIRES (inchangés) ==========
  const handleAddProduit = () => {
    setSelectedProduit(null);
    setShowForm(true);
  };

  const handleEditProduit = (produit) => {
    if (!produit) return;
    setSelectedProduit(produit);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedProduit(null);
  };

  const handleSaveProduit = async (formData) => {
    if (!formData) return;
    
    try {
      const response = selectedProduit
        ? await updateProduct(selectedProduit.id, formData)
        : await createProduct(formData);
      
      if (response?.success) {
        toast.success(selectedProduit ? 'Produit modifié' : 'Produit ajouté');
        handleCloseForm();
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      toast.error(error?.response?.data?.message || 'Erreur lors de la sauvegarde');
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

const handleSearchSubmit = useCallback((e) => {
  if (e) e.preventDefault();
  
  console.log('🔍 localFilters COMPLET =', localFilters);
  console.log('🔍 localFilters.actif =', localFilters.actif, 'type:', typeof localFilters.actif);
  
  const params = {
    keyword: searchTerm || undefined,
    status: localFilters.status || undefined,
    categorieId: localFilters.categorieId || undefined
  };
  
  // Pour "Tous", on n'envoie PAS le paramètre actif
  if (localFilters.actif === 'true') {
    params.actif = true;
    console.log('✅ CAS "Actifs" détecté');
  } else if (localFilters.actif === 'false') {
    params.actif = false;
    console.log('✅ CAS "Inactifs" détecté');
  } else {
    console.log('✅ CAS "Tous" détecté (pas de paramètre actif)');
  }
  
  console.log('🔍 params final:', params);
  
  if (searchProducts) {
    searchProducts(params);
  }
}, [searchTerm, localFilters.status, localFilters.categorieId, localFilters.actif, searchProducts]);

const handleFilterChange = useCallback((key, value) => {
  console.log(`🔧 Filter change RECU dans Produits - ${key}:`, JSON.stringify(value), 'type:', typeof value);
  setLocalFilters(prev => {
    const newFilters = { ...prev, [key]: value };
    console.log('🆕 NOUVEAUX FILTRES dans Produits:', newFilters);
    return newFilters;
  });
}, []);


const handleResetFilters = useCallback(() => {
  setLocalFilters({ status: '', categorieId: '', actif: '' });
  setSearchTerm('');
  if (resetFilters) {
    resetFilters();
  }
}, [resetFilters]);

  const handleApplyFilters = () => {
    if (applyFilters) {
      applyFilters({
        status: localFilters.status || undefined,
        categorieId: localFilters.categorieId || undefined
      });
    }
    setShowFilters(false);
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
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchSubmit={handleSearchSubmit}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filters={localFilters}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        onAddProduit={handleAddProduit}
        categories={categories} 
        loadingCategories={categoriesLoading}
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
                  key={produit?.id || Math.random()}
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

      {showForm && (
        selectedProduit ? (
          <EditProduitForm
            produit={selectedProduit}
            categories={categories}
            onClose={handleCloseForm}
            onSave={handleSaveProduit}
          />
        ) : (
          <CreateProduitForm
            categories={categories}
            onClose={handleCloseForm}
            onSave={handleSaveProduit}
          />
        )
      )}
    </div>
  );
};

export default Produits;