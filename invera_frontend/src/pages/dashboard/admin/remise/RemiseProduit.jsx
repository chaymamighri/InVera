import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../../../context/LanguageContext';
import useClients from '../../../../hooks/useClient';
import useProducts from '../../../../hooks/useProducts';

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
    discount: 'Remise',
    discountsByType: 'Remises par type de client',
    save: 'Enregistrer',
    discountsHint: 'Ces remises s appliquent a tous les clients du type correspondant.',
    searchProduct: 'Rechercher un produit...',
    loadingProducts: 'Chargement des produits...',
    noProduct: 'Aucun produit trouve',
    image: 'Image',
    category: 'Categorie',
    price: 'Prix',
    stock: 'Stock',
    units: 'unites',
    confirmDiscount: 'Confirmer la nouvelle remise de {{value}}% pour ce produit ?',
    updateError: 'Erreur lors de la mise a jour',
    previous: 'Precedent',
    next: 'Suivant',
    pageOf: 'Page {{page}} sur {{total}}',
    confirm: 'Confirmer',
    cancel: 'Annuler',
    currency: 'dt',
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
    discount: 'Discount',
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
    confirmDiscount: 'Confirm the new discount of {{value}}% for this product?',
    updateError: 'Error during update',
    previous: 'Previous',
    next: 'Next',
    pageOf: 'Page {{page}} of {{total}}',
    confirm: 'Confirm',
    cancel: 'Cancel',
    currency: 'TND',
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
    discount: 'الخصم',
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
    confirmDiscount: 'هل تؤكد الخصم الجديد {{value}}% لهذا المنتج؟',
    updateError: 'خطأ أثناء التحديث',
    previous: 'السابق',
    next: 'التالي',
    pageOf: 'الصفحة {{page}} من {{total}}',
    confirm: 'تأكيد',
    cancel: 'إلغاء',
    currency: 'د.ت',
  },
};

const localeMap = {
  fr: 'fr-FR',
  en: 'en-US',
  ar: 'ar-TN',
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
    <div
      className={`rounded-xl border bg-gradient-to-br p-5 shadow-sm transition-all hover:shadow-md ${colorClasses[color]}`}
    >
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
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingDiscount, setEditingDiscount] = useState('');

  const {
    clients,
    loading: clientsLoading,
    error: clientsError,
    stats: clientStats,
    clientTypes,
    fetchClients,
    getRemiseForType,
    updateTypeDiscount,
  } = useClients({ search: clientSearch });

  const {
    products,
    loading: productsLoading,
    error: productsError,
    loadProducts,
    searchProducts,
    pagination,
    updateProduct,
  } = useProducts({ search: productSearch });

  const configurableClientTypes = useMemo(() => {
    const allowedTypes = clientTypes.filter((type) => type !== 'PARTICULIER');
    const knownTypes = CLIENT_TYPE_ORDER.filter((type) => allowedTypes.includes(type));
    const customTypes = allowedTypes.filter((type) => !CLIENT_TYPE_ORDER.includes(type));
    return [...knownTypes, ...customTypes];
  }, [clientTypes]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients();
    }, 400);
    return () => clearTimeout(timer);
  }, [clientSearch, fetchClients]);

  useEffect(() => {
    if (activeTab !== 'products') return;
    const timer = setTimeout(() => {
      if (productSearch) {
        searchProducts({ keyword: productSearch });
      } else {
        loadProducts();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [activeTab, productSearch, searchProducts, loadProducts]);

  useEffect(() => {
    const loadDiscounts = async () => {
      if (!configurableClientTypes.length) return;
      const newDiscounts = {};
      for (const type of configurableClientTypes) {
        try {
          const response = await getRemiseForType(type);
          newDiscounts[type] = Number(response?.remise ?? 0);
        } catch {
          // Ignore per-type loading failures to keep the page usable.
        }
      }
      setClientDiscounts(newDiscounts);
      setDraftClientDiscounts(newDiscounts);
    };
    loadDiscounts();
  }, [configurableClientTypes, getRemiseForType]);

  const filteredClients = useMemo(() => {
    if (selectedClientType === 'TOUS') return clients;
    return clients.filter((client) => client.typeClient === selectedClientType);
  }, [clients, selectedClientType]);

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
    } catch {
      // Keep the existing value when the save fails.
    }
  };

  const getClientDiscount = (type) => Number(clientDiscounts[type] ?? 0);

  const formatPrice = (value) =>
    `${Number(value || 0).toLocaleString(numberLocale, {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    })} ${text.currency}`;

  const handleSaveDiscount = async (productId) => {
    if (editingDiscount === '') return;

    const newDiscount = parseFloat(editingDiscount);
    const product = products.find((item) => item.idProduit === productId);
    const oldDiscount = product?.remiseTemporaire || 0;

    if (newDiscount === oldDiscount) {
      setEditingProductId(null);
      return;
    }

    const confirmMsg = text.confirmDiscount.replace('{{value}}', String(newDiscount));
    if (!window.confirm(confirmMsg)) {
      setEditingProductId(null);
      return;
    }

    try {
      await updateProduct(productId, {
        idProduit: product.idProduit,
        libelle: product.libelle,
        prixVente: product.prixVente,
        prixAchat: product.prixAchat,
        categorie: { idCategorie: product.categorie?.idCategorie },
        quantiteStock: product.quantiteStock,
        status: product.status,
        seuilMinimum: product.seuilMinimum,
        uniteMesure: product.uniteMesure,
        imageUrl: product.imageUrl,
        remiseTemporaire: newDiscount,
      });
      setEditingProductId(null);
    } catch (error) {
      alert(`${text.updateError}: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleKeyDown = (event, productId) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSaveDiscount(productId);
    } else if (event.key === 'Escape') {
      setEditingProductId(null);
    }
  };

  return (
    <div
      className={`min-h-screen space-y-6 bg-gray-50 p-4 md:p-6 ${isArabic ? 'text-right' : ''}`}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div
        className={`flex flex-col justify-between gap-4 md:flex-row md:items-center ${
          isArabic ? 'md:flex-row-reverse' : ''
        }`}
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{text.description}</p>
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('clients')}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              activeTab === 'clients'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {text.clientsTab}
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              activeTab === 'products'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
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
              onChange={(event) => setClientSearch(event.target.value)}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <select
              value={selectedClientType}
              onChange={(event) => setSelectedClientType(event.target.value)}
              className="min-w-[160px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="TOUS">{text.allTypes}</option>
              {clientTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {clientsLoading && (
            <div className="py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-500 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-500">{text.loadingClients}</p>
            </div>
          )}

          {clientsError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-600">{clientsError}</p>
            </div>
          )}

          {!clientsLoading && filteredClients.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
              <p className="mt-2 text-sm text-gray-500">{text.noClient}</p>
            </div>
          )}

          {!clientsLoading && filteredClients.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      {[text.name, text.phone, text.type, text.discount].map((label) => (
                        <th
                          key={label}
                          className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${
                            isArabic ? 'text-right' : 'text-left'
                          }`}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredClients.map((client, index) => (
                      <tr
                        key={client.idClient || client.id}
                        className={`transition-colors hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {[client.prenom, client.nom || client.name].filter(Boolean).join(' ') || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{client.telephone || '-'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700">
                            {client.typeClient}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {getClientDiscount(client.typeClient)}%
                        </td>
                      </tr>
                    ))}
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
                  <div
                    key={type}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-teal-200"
                  >
                    <span className="text-sm font-medium text-gray-700">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={draftClientDiscounts[type] ?? clientDiscounts[type] ?? 0}
                          onChange={(event) =>
                            handleClientDiscountChange(type, parseFloat(event.target.value) || 0)
                          }
                          className="w-16 border-0 px-2 py-1.5 text-right text-sm focus:ring-0"
                        />
                        <span className="px-1 text-sm text-gray-500">%</span>
                      </div>
                      <button
                        onClick={() => saveClientTypeDiscount(type)}
                        className="rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1.5 text-xs text-white shadow-sm transition-all hover:from-emerald-600 hover:to-blue-600"
                      >
                        {text.save}
                      </button>
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
            onChange={(event) => setProductSearch(event.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />

          {productsLoading && (
            <div className="py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-500 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-500">{text.loadingProducts}</p>
            </div>
          )}

          {productsError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-600">{productsError}</p>
            </div>
          )}

          {!productsLoading && products.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
              <p className="mt-2 text-sm text-gray-500">{text.noProduct}</p>
            </div>
          )}

          {!productsLoading && products.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      {[text.image, text.name, text.category, text.price, text.stock, text.discount].map(
                        (label) => (
                          <th
                            key={label}
                            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${
                              isArabic ? 'text-right' : 'text-left'
                            }`}
                          >
                            {label}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product, index) => (
                      <tr
                        key={product.idProduit}
                        className={`transition-colors hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'
                        }`}
                      >
                        <td className="px-4 py-3">
                          {product.imageUrl ? (
                            <img
                              src={
                                product.imageUrl.startsWith('http')
                                  ? product.imageUrl
                                  : `http://localhost:8081/${product.imageUrl.replace(/^\/+/, '')}`
                              }
                              alt={product.libelle}
                              className="h-10 w-10 rounded-lg border border-gray-200 object-cover shadow-sm"
                              onError={(event) => {
                                event.target.onerror = null;
                                event.target.src = '/images/default-product.png';
                              }}
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
                            {product.categorie?.nomCategorie || product.categorie?.nom_categorie || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-teal-600">
                          {product.prixVente ? formatPrice(product.prixVente) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              product.quantiteStock > 10
                                ? 'bg-green-100 text-green-700'
                                : product.quantiteStock > 0
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {product.quantiteStock ?? 0} {text.units}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {editingProductId === product.idProduit ? (
                            <div className="flex items-center gap-1">
                              <div className="flex items-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={editingDiscount}
                                  onChange={(event) => setEditingDiscount(event.target.value)}
                                  onKeyDown={(event) => handleKeyDown(event, product.idProduit)}
                                  className="w-14 border-0 px-2 py-1.5 text-right text-sm focus:ring-0"
                                  autoFocus
                                />
                                <span className="px-1 text-sm text-gray-500">%</span>
                              </div>
                              <button
                                onClick={() => handleSaveDiscount(product.idProduit)}
                                className="rounded bg-green-500 p-1.5 text-white shadow-sm transition-all hover:bg-green-600"
                                title={text.confirm}
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setEditingProductId(null)}
                                className="rounded bg-red-500 p-1.5 text-white shadow-sm transition-all hover:bg-red-600"
                                title={text.cancel}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div
                              className="group inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 transition-all hover:bg-gray-100"
                              onClick={() => {
                                setEditingProductId(product.idProduit);
                                setEditingDiscount(product.remiseTemporaire?.toString() || '0');
                              }}
                            >
                              <span className="text-sm font-medium text-gray-900">
                                {product.remiseTemporaire ? `${product.remiseTemporaire}%` : '0%'}
                              </span>
                              <span className="text-gray-400 group-hover:text-teal-500">✎</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-sm text-gray-500">
                    {text.pageOf
                      .replace('{{page}}', String(pagination.page))
                      .replace('{{total}}', String(pagination.totalPages))}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadProducts(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-all hover:border-teal-200 hover:bg-gray-50 hover:text-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {text.previous}
                    </button>
                    <button
                      onClick={() => loadProducts(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-all hover:border-teal-200 hover:bg-gray-50 hover:text-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {text.next}
                    </button>
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
