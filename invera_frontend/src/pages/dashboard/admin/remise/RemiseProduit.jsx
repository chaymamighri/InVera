import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLanguage } from '../../../../context/LanguageContext';
import useClients from '../../../../hooks/useClient';
import useProducts from '../../../../hooks/useProducts';
import { commandeService } from '../../../../services/commandeService';

const CLIENT_TYPE_ORDER = ['VIP', 'ENTREPRISE', 'FIDELE'];

const copy = {
  fr: {
    title: 'Gestion des remises',
    description: 'Configurez les remises clients et produits depuis une seule interface.',
    clientsTab: 'Clients',
    productsTab: 'Produits',
    total: 'Total',
    individual: 'Particuliers',
    vip: 'VIP',
    companies: 'Entreprises',
    loyal: 'Fideles',
    searchClient: 'Rechercher un client...',
    allTypes: 'Tous les types',
    loadingClients: 'Chargement des clients...',
    noClient: 'Aucun client trouve',
    name: 'Nom',
    phone: 'Telephone',
    type: 'Type',
    orders: 'Commandes',
    revenue: 'CA Total',
    discount: 'Remise',
    changeType: 'Changer le type',
    discountsByType: 'Remises par type de client',
    save: 'Enregistrer',
    discountsHint: 'Ces remises appliquent a tous les clients du type correspondant.',
    searchProduct: 'Rechercher un produit...',
    loadingProducts: 'Chargement des produits...',
    noProduct: 'Aucun produit trouve',
    image: 'Image',
    category: 'Categorie',
    price: 'Prix',
    stock: 'Stock',
    units: 'unites',
    previous: 'Precedent',
    next: 'Suivant',
    pageOf: 'Page {{page}} sur {{total}}',
    currency: 'dt',
    confirmTypeChange: 'Confirmation changement de type',
    newType: 'Nouveau type',
    selectType: 'Sélectionner un type',
    typeUpdated: 'Type de client modifié avec succès',
    typeChangeSuccess: 'Type de client modifié avec succès',
    typeChangeError: 'Erreur lors du changement de type',
    currentType: 'Type actuel',
    clientInfo: 'Informations client',
    statsInfo: 'Statistiques du client',
    ordersCount: 'Commandes',
    totalRevenue: 'CA total',
    warningMessage: 'Le passage de {oldType} à {newType} peut modifier la remise applicable à ce client.',
    confirm: 'Confirmer',
    cancel: 'Annuler',
  },
  en: {
    title: 'Discount management',
    description: 'Manage client and product discounts from a single workspace.',
    clientsTab: 'Clients',
    productsTab: 'Products',
    total: 'Total',
    individual: 'Individuals',
    vip: 'VIP',
    companies: 'Companies',
    loyal: 'Loyal',
    searchClient: 'Search for a client...',
    allTypes: 'All types',
    loadingClients: 'Loading clients...',
    noClient: 'No client found',
    name: 'Name',
    phone: 'Phone',
    type: 'Type',
    orders: 'Orders',
    revenue: 'Total Revenue',
    discount: 'Discount',
    changeType: 'Change type',
    discountsByType: 'Discounts by client type',
    save: 'Save',
    discountsHint: 'These discounts apply to all clients of the matching type.',
    searchProduct: 'Search for a product...',
    loadingProducts: 'Loading products...',
    noProduct: 'No product found',
    image: 'Image',
    category: 'Category',
    price: 'Price',
    stock: 'Stock',
    units: 'units',
    previous: 'Previous',
    next: 'Next',
    pageOf: 'Page {{page}} of {{total}}',
    currency: 'TND',
    confirmTypeChange: 'Confirm type change',
    newType: 'New type',
    selectType: 'Select a type',
    typeUpdated: 'Client type updated successfully',
    typeChangeSuccess: 'Client type changed successfully',
    typeChangeError: 'Error changing client type',
    currentType: 'Current type',
    clientInfo: 'Client information',
    statsInfo: 'Client statistics',
    ordersCount: 'Orders',
    totalRevenue: 'Total revenue',
    warningMessage: 'Changing from {oldType} to {newType} may affect the discount applicable to this client.',
    confirm: 'Confirm',
    cancel: 'Cancel',
  },
  ar: {
    title: 'إدارة الخصومات',
    description: 'قم بضبط خصومات العملاء والمنتجات من واجهة واحدة.',
    clientsTab: 'العملاء',
    productsTab: 'المنتجات',
    total: 'الإجمالي',
    individual: 'الأفراد',
    vip: 'VIP',
    companies: 'الشركات',
    loyal: 'الأوفياء',
    searchClient: 'ابحث عن عميل...',
    allTypes: 'كل الأنواع',
    loadingClients: 'جاري تحميل العملاء...',
    noClient: 'لم يتم العثور على عملاء',
    name: 'الاسم',
    phone: 'الهاتف',
    type: 'النوع',
    orders: 'الطلبات',
    revenue: 'إجمالي المبيعات',
    discount: 'الخصم',
    changeType: 'تغيير النوع',
    discountsByType: 'الخصومات حسب نوع العميل',
    save: 'حفظ',
    discountsHint: 'تطبق هذه الخصومات على جميع العملاء من النوع نفسه.',
    searchProduct: 'ابحث عن منتج...',
    loadingProducts: 'جاري تحميل المنتجات...',
    noProduct: 'لم يتم العثور على منتجات',
    image: 'الصورة',
    category: 'الفئة',
    price: 'السعر',
    stock: 'المخزون',
    units: 'وحدة',
    previous: 'السابق',
    next: 'التالي',
    pageOf: 'الصفحة {{page}} من {{total}}',
    currency: 'د.ت',
    confirmTypeChange: 'تأكيد تغيير نوع العميل',
    newType: 'نوع جديد',
    selectType: 'اختر نوع',
    typeUpdated: 'تم تحديث نوع العميل بنجاح',
    typeChangeSuccess: 'تم تغيير نوع العميل بنجاح',
    typeChangeError: 'خطأ في تغيير نوع العميل',
    currentType: 'النوع الحالي',
    clientInfo: 'معلومات العميل',
    statsInfo: 'إحصائيات العميل',
    ordersCount: 'الطلبات',
    totalRevenue: 'إجمالي المبيعات',
    warningMessage: 'تغيير النوع من {oldType} إلى {newType} قد يؤثر على الخصم المطبق لهذا العميل.',
    confirm: 'تأكيد',
    cancel: 'إلغاء',
  },
};

const localeMap = {
  fr: 'fr-FR',
  en: 'en-US',
  ar: 'ar-TN',
};

const getTypeClientClasses = (type) => {
  const classes = {
    'PARTICULIER': 'bg-gray-100 text-gray-700 border-gray-200',
    'VIP': 'bg-amber-100 text-amber-800 border-amber-200',
    'ENTREPRISE': 'bg-blue-100 text-blue-800 border-blue-200',
    'PROFESSIONNEL': 'bg-purple-100 text-purple-800 border-purple-200',
    'FIDELE': 'bg-teal-100 text-teal-800 border-teal-200',
  };
  return classes[type] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const StatCard = ({ label, value, color, icon }) => {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
    emerald: 'from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700',
    amber: 'from-amber-50 to-amber-100 border-amber-200 text-amber-700',
    violet: 'from-violet-50 to-violet-100 border-violet-200 text-violet-700',
    teal: 'from-teal-50 to-teal-100 border-teal-200 text-teal-700',
  };

  return (
    <div className={`rounded-xl border bg-gradient-to-br p-5 shadow-sm transition-all hover:shadow-md ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-xs font-medium opacity-80">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <span className="text-3xl opacity-50">{icon}</span>
      </div>
    </div>
  );
};

// Composant Modal de confirmation
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, isArabic }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ${isArabic ? 'text-right' : ''}`}>
        <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>
        <p className="mb-6 text-gray-600">{message}</p>
        <div className={`flex gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-white transition-all hover:from-emerald-600 hover:to-emerald-700"
          >
            {confirmText || 'Confirmer'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-all hover:bg-gray-50"
          >
            {cancelText || 'Annuler'}
          </button>
        </div>
      </div>
    </div>
  );
};

const getCategoryName = (product) => {
  if (product?.categorieNom) return product.categorieNom;
  if (product?.categorie?.nomCategorie) return product.categorie.nomCategorie;
  if (product?.nomCategorie) return product.nomCategorie;
  if (product?.categorieId) return `Catégorie #${product.categorieId}`;
  return 'Sans catégorie';
};

const getCategoryDiscount = (product) => {
  if (product?.categorieRemiseStandard !== undefined && product?.categorieRemiseStandard !== null) {
    return product.categorieRemiseStandard;
  }
  if (product?.categorie?.remiseStandard !== undefined && product?.categorie?.remiseStandard !== null) {
    return product.categorie.remiseStandard;
  }
  if (product?.remiseStandard !== undefined && product?.remiseStandard !== null) {
    return product.remiseStandard;
  }
  return 0;
};

const ProductRow = ({ product, index, isArabic, formatPrice, text }) => {
  const categoryName = getCategoryName(product);
  const categoryDiscount = getCategoryDiscount(product);

  return (
    <tr className={`transition-colors hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'}`}>
      <td className="px-4 py-3">
        {product.imageUrl ? (
          <img
            src={product.imageUrl.startsWith('http') ? product.imageUrl : `http://localhost:8081/${product.imageUrl.replace(/^\/+/, '')}`}
            alt={product.libelle}
            className="h-10 w-10 rounded-lg border border-gray-200 object-cover shadow-sm"
            onError={(event) => { event.target.onerror = null; event.target.src = '/images/default-product.png'; }}
            loading="lazy"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gradient-to-br from-teal-500 to-cyan-500 text-sm font-bold text-white">
            {product.libelle?.charAt(0).toUpperCase() || 'P'}
          </div>
        )}
      </td>
      <td className="px-4 py-3 font-medium text-gray-900">{product.libelle || '-'}</td>
      <td className="px-4 py-3">
        <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
          {categoryName}
        </span>
      </td>
      <td className="px-4 py-3 font-medium text-teal-600">
        {product.prixVente ? formatPrice(product.prixVente) : '-'}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${product.quantiteStock > 10 ? 'bg-green-100 text-green-700' : product.quantiteStock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
          {product.quantiteStock ?? 0} {text.units}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
          <span className="text-sm font-medium text-gray-900">
            {categoryDiscount > 0 ? `${categoryDiscount}%` : '0%'}
          </span>
        </div>
      </td>
    </tr>
  );
};

const Remise = () => {
  const { language, isArabic } = useLanguage();
  const text = useMemo(() => copy[language] || copy.fr, [language]);
  const numberLocale = localeMap[language] || localeMap.fr;
  const [activeTab, setActiveTab] = useState('clients');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientType, setSelectedClientType] = useState('TOUS');
  const [clientDiscounts, setClientDiscounts] = useState({});
  const [draftClientDiscounts, setDraftClientDiscounts] = useState({});
  const [productSearch, setProductSearch] = useState('');
  
  const [clientStatsMap, setClientStatsMap] = useState({});
  const [loadingStats, setLoadingStats] = useState({});
  const [changingTypeId, setChangingTypeId] = useState(null);
  const [changingTypeValue, setChangingTypeValue] = useState({});
  
  // État pour le modal
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    clientId: null,
    newType: null,
    oldType: null
  });

  const {
    clients,
    loading: clientsLoading,
    error: clientsError,
    stats: clientStats,
    clientTypes,
    fetchClients,
    getRemiseForType,
    updateTypeDiscount,
    updateClientType,
  } = useClients({ search: clientSearch });

  const {
    products,
    loading: productsLoading,
    error: productsError,
    loadProducts,
    searchProducts,
    pagination,
  } = useProducts({ search: productSearch });

  // Optimisation: loadClientStats avec useCallback
  const loadClientStats = useCallback(async (clientId) => {
    if (clientStatsMap[clientId]) return;
    
    setLoadingStats(prev => ({ ...prev, [clientId]: true }));
    try {
      const response = await commandeService.getCommandesByClientId(clientId);
      const commandes = response.commandes || response || [];
      const totalCommandes = commandes.length;
      const caTotal = commandes.reduce((sum, cmd) => sum + (cmd.total || cmd.montantTotal || 0), 0);
      setClientStatsMap(prev => ({ ...prev, [clientId]: { totalCommandes, caTotal } }));
    } catch (error) {
      console.error(`Erreur chargement stats client ${clientId}:`, error);
      setClientStatsMap(prev => ({ ...prev, [clientId]: { totalCommandes: 0, caTotal: 0 } }));
    } finally {
      setLoadingStats(prev => ({ ...prev, [clientId]: false }));
    }
  }, [clientStatsMap]);

  const filteredClients = useMemo(() => {
    if (selectedClientType === 'TOUS') return clients || [];
    return (clients || []).filter((client) => client.typeClient === selectedClientType);
  }, [clients, selectedClientType]);

  // Chargement des stats uniquement pour les clients visibles
  useEffect(() => {
    if (filteredClients && filteredClients.length > 0) {
      filteredClients.forEach(client => {
        if (client.idClient && !clientStatsMap[client.idClient] && !loadingStats[client.idClient]) {
          loadClientStats(client.idClient);
        }
      });
    }
  }, [filteredClients, clientStatsMap, loadingStats, loadClientStats]);

  const configurableClientTypes = useMemo(() => {
    const allowedTypes = (clientTypes || []).filter((type) => type !== 'PARTICULIER');
    const knownTypes = CLIENT_TYPE_ORDER.filter((type) => allowedTypes.includes(type));
    const customTypes = allowedTypes.filter((type) => !CLIENT_TYPE_ORDER.includes(type));
    return [...knownTypes, ...customTypes];
  }, [clientTypes]);

  // Debounce pour la recherche client
  useEffect(() => {
    const timer = setTimeout(() => { 
      fetchClients(); 
    }, 500);
    return () => clearTimeout(timer);
  }, [clientSearch, fetchClients]);

  // Debounce pour la recherche produit
  useEffect(() => {
    if (activeTab !== 'products') return;
    const timer = setTimeout(() => {
      if (productSearch) searchProducts({ keyword: productSearch });
      else loadProducts();
    }, 500);
    return () => clearTimeout(timer);
  }, [activeTab, productSearch, searchProducts, loadProducts]);

  // Chargement des remises en parallèle
  useEffect(() => {
    const loadDiscounts = async () => {
      if (!configurableClientTypes.length) return;
      const newDiscounts = {};
      await Promise.all(
        configurableClientTypes.map(async (type) => {
          try {
            const response = await getRemiseForType(type);
            newDiscounts[type] = Number(response?.remise ?? 0);
          } catch {}
        })
      );
      setClientDiscounts(newDiscounts);
      setDraftClientDiscounts(newDiscounts);
    };
    loadDiscounts();
  }, [configurableClientTypes, getRemiseForType]);

  const handleClientDiscountChange = (type, value) => { 
    setDraftClientDiscounts((previous) => ({ ...previous, [type]: value })); 
  };

  const saveClientTypeDiscount = async (type) => {
    try {
      const discount = Number(draftClientDiscounts[type] ?? 0);
      await updateTypeDiscount(type, discount);
      const refreshedDiscount = await getRemiseForType(type);
      const savedDiscount = Number(refreshedDiscount?.remise ?? discount);
      setClientDiscounts((previous) => ({ ...previous, [type]: savedDiscount }));
      setDraftClientDiscounts((previous) => ({ ...previous, [type]: savedDiscount }));
      await fetchClients();
    } catch (error) { 
      console.error(`Erreur pour ${type}:`, error); 
    }
  };

  const getClientDiscount = (type) => Number(clientDiscounts[type] ?? 0);

  const formatPrice = (value) =>
    `${Number(value || 0).toLocaleString(numberLocale, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ${text.currency}`;

  // Ouvrir le modal de confirmation
  const openConfirmationModal = (clientId, newType, oldType) => {
    const warningMsg = text.warningMessage
      .replace('{oldType}', oldType)
      .replace('{newType}', newType);
    
    setModalConfig({
      isOpen: true,
      clientId,
      newType,
      oldType,
      warningMessage: warningMsg
    });
  };

  // Confirmer le changement de type
  const confirmTypeChange = async () => {
    const { clientId, newType, oldType } = modalConfig;
    setChangingTypeId(clientId);
    
    try {
      await updateClientType(clientId, newType);
      await fetchClients();
      await loadClientStats(clientId);
    } catch (error) {
      console.error('Erreur changement type:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || text.typeChangeError;
      alert(errorMessage);
      setChangingTypeValue(prev => ({ ...prev, [clientId]: oldType }));
    } finally {
      setChangingTypeId(null);
      setModalConfig({ isOpen: false, clientId: null, newType: null, oldType: null });
    }
  };

  // Fermer le modal
  const closeModal = () => {
    setModalConfig({ isOpen: false, clientId: null, newType: null, oldType: null });
  };

  const handleTypeChange = (clientId, newType, oldType) => {
    if (newType === oldType) return;
    setChangingTypeValue(prev => ({ ...prev, [clientId]: newType }));
    openConfirmationModal(clientId, newType, oldType);
  };

  const spinnerTypes = useMemo(() => ['PARTICULIER', 'VIP', 'FIDELE'], []);

  // Mémoriser les options du select
  const typeOptions = useMemo(() => 
    spinnerTypes.map((type) => (
      <option key={type} value={type}>{type}</option>
    )), 
    [spinnerTypes]
  );

  return (
    <div className={`min-h-screen space-y-6 bg-gray-50 p-4 md:p-6 ${isArabic ? 'text-right' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Modal de confirmation */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={confirmTypeChange}
        title={text.confirmTypeChange}
        message={modalConfig.warningMessage}
        confirmText={text.confirm}
        cancelText={text.cancel}
        isArabic={isArabic}
      />

      <div className={`flex flex-col justify-between gap-4 md:flex-row md:items-center ${isArabic ? 'md:flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{text.description}</p>
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          <button onClick={() => setActiveTab('clients')} className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${activeTab === 'clients' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            {text.clientsTab}
          </button>
          <button onClick={() => setActiveTab('products')} className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${activeTab === 'products' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            {text.productsTab}
          </button>
        </div>
      </div>

      {activeTab === 'clients' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <StatCard label={text.total} value={clientStats.total} color="blue" icon="👥" />
            <StatCard label={text.individual} value={clientStats.particulier} color="emerald" icon="👤" />
            <StatCard label={text.vip} value={clientStats.vip} color="amber" icon="💼" />
            <StatCard label={text.companies} value={clientStats.entreprise} color="violet" icon="🏢" />
            <StatCard label={text.loyal} value={clientStats.fidele} color="teal" icon="🔁" />
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input 
              type="text" 
              placeholder={text.searchClient} 
              value={clientSearch} 
              onChange={(e) => setClientSearch(e.target.value)} 
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20" 
            />
            <select 
              value={selectedClientType} 
              onChange={(e) => setSelectedClientType(e.target.value)} 
              className="min-w-[160px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="TOUS">{text.allTypes}</option>
              {clientTypes.map((type) => (<option key={type} value={type}>{type}</option>))}
            </select>
          </div>

          {clientsLoading && (<div className="py-12 text-center"><div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-500 border-r-transparent"></div><p className="mt-2 text-sm text-gray-500">{text.loadingClients}</p></div>)}
          {clientsError && (<div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-sm text-red-600">{clientsError}</p></div>)}
          {!clientsLoading && filteredClients.length === 0 && (<div className="rounded-lg border border-gray-200 bg-white py-12 text-center"><p className="mt-2 text-sm text-gray-500">{text.noClient}</p></div>)}

          {!clientsLoading && filteredClients.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${isArabic ? 'text-right' : 'text-left'}`}>{text.name}</th>
                      <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${isArabic ? 'text-right' : 'text-left'}`}>{text.phone}</th>
                      <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${isArabic ? 'text-right' : 'text-left'}`}>{text.type}</th>
                      <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${isArabic ? 'text-right' : 'text-left'}`}>{text.orders}</th>
                      <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${isArabic ? 'text-right' : 'text-left'}`}>{text.revenue}</th>
                      <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${isArabic ? 'text-right' : 'text-left'}`}>{text.discount}</th>
                      <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${isArabic ? 'text-right' : 'text-left'}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredClients.map((client, index) => {
                      const stats = clientStatsMap[client.idClient] || { totalCommandes: 0, caTotal: 0 };
                      const isLoadingStats = loadingStats[client.idClient];
                      const currentType = client.typeClient;
                      const isChanging = changingTypeId === client.idClient;
                      const selectedValue = changingTypeValue[client.idClient] ?? currentType;
                      const showSpinner = currentType !== 'ENTREPRISE';
                      return (
                        <tr key={client.idClient || client.id} className={`transition-colors hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'}`}>
                          <td className="px-4 py-3 font-medium text-gray-900">{[client.prenom, client.nom || client.name].filter(Boolean).join(' ') || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{client.telephone || '-'}</td>
                          <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getTypeClientClasses(currentType)}`}>{currentType}</span></td>
                          <td className="px-4 py-3 text-sm text-gray-700">{isLoadingStats ? <div className="h-4 w-8 animate-pulse bg-gray-200 rounded"></div> : <span className="font-medium">{stats.totalCommandes}</span>}</td>
                          <td className="px-4 py-3 text-sm">{isLoadingStats ? <div className="h-4 w-16 animate-pulse bg-gray-200 rounded"></div> : <span className="font-medium text-emerald-600">{new Intl.NumberFormat(numberLocale, { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(stats.caTotal)} DT</span>}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{getClientDiscount(currentType)}%</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {showSpinner ? (
                                <>
                                  <select 
                                    value={selectedValue} 
                                    onChange={(e) => { 
                                      const newValue = e.target.value; 
                                      handleTypeChange(client.idClient, newValue, currentType); 
                                    }} 
                                    disabled={isChanging} 
                                    className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-50"
                                  >
                                    {typeOptions}
                                  </select>
                                  {isChanging && <div className="animate-spin rounded-full h-3 w-3 border-2 border-teal-500 border-t-transparent"></div>}
                                </>
                              ) : (<span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${getTypeClientClasses(currentType)}`}>{currentType}</span>)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {configurableClientTypes.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-medium text-gray-700">{text.discountsByType}</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {configurableClientTypes.map((type) => (
                  <div key={type} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-teal-200">
                    <span className="text-sm font-medium text-gray-700">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <input 
                          type="number" 
                          min="0" 
                          max="100" 
                          step="0.1" 
                          value={draftClientDiscounts[type] ?? clientDiscounts[type] ?? 0} 
                          onChange={(e) => { 
                            const newValue = parseFloat(e.target.value) || 0; 
                            const validValue = Math.min(100, Math.max(0, newValue)); 
                            handleClientDiscountChange(type, validValue); 
                          }} 
                          className="w-16 border-0 px-2 py-1.5 text-right text-sm focus:ring-0" 
                        />
                        <span className="px-1 text-sm text-gray-500">%</span>
                      </div>
                      <button onClick={() => saveClientTypeDiscount(type)} className="rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1.5 text-xs text-white shadow-sm transition-all hover:from-emerald-600 hover:to-blue-600">{text.save}</button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-gray-500">{text.discountsHint}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-6">
          <input 
            type="text" 
            placeholder={text.searchProduct} 
            value={productSearch} 
            onChange={(e) => setProductSearch(e.target.value)} 
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20" 
          />

          {productsLoading && (<div className="py-12 text-center"><div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-500 border-r-transparent"></div><p className="mt-2 text-sm text-gray-500">{text.loadingProducts}</p></div>)}
          {productsError && (<div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-sm text-red-600">{productsError}</p></div>)}
          {!productsLoading && products.length === 0 && (<div className="rounded-lg border border-gray-200 bg-white py-12 text-center"><p className="mt-2 text-sm text-gray-500">{text.noProduct}</p></div>)}

          {!productsLoading && products.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${isArabic ? 'text-right' : 'text-left'}`}>{text.image}</th>
                      <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${isArabic ? 'text-right' : 'text-left'}`}>{text.name}</th>
                      <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${isArabic ? 'text-right' : 'text-left'}`}>{text.category}</th>
                      <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${isArabic ? 'text-right' : 'text-left'}`}>{text.price}</th>
                      <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${isArabic ? 'text-right' : 'text-left'}`}>{text.stock}</th>
                      <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${isArabic ? 'text-right' : 'text-left'}`}>{text.discount}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product, index) => (
                      <ProductRow
                        key={product.idProduit}
                        product={product}
                        index={index}
                        isArabic={isArabic}
                        formatPrice={formatPrice}
                        text={text}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-sm text-gray-500">{text.pageOf.replace('{{page}}', String(pagination.page + 1)).replace('{{total}}', String(pagination.totalPages))}</p>
                  <div className="flex gap-2">
                    <button onClick={() => loadProducts(pagination.page - 1)} disabled={pagination.page <= 0} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-all hover:border-teal-200 hover:bg-gray-50 hover:text-teal-600 disabled:cursor-not-allowed disabled:opacity-50">{text.previous}</button>
                    <button onClick={() => loadProducts(pagination.page + 1)} disabled={pagination.page + 1 >= pagination.totalPages} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-all hover:border-teal-200 hover:bg-gray-50 hover:text-teal-600 disabled:cursor-not-allowed disabled:opacity-50">{text.next}</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Remise;