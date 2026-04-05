

import React, { useState, useEffect, useMemo } from "react";
import useClients from "../../../../hooks/useClient";
import useProducts from "../../../../hooks/useProducts";

const CLIENT_TYPE_ORDER = ["VIP", "ENTREPRISE", "FIDELE"];

const Remise = () => {
  // Tab state: "clients" or "products"
  const [activeTab, setActiveTab] = useState("clients");

  // Clients state
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientType, setSelectedClientType] = useState("TOUS");
  const [clientDiscounts, setClientDiscounts] = useState({}); // { type: discount }
  const [draftClientDiscounts, setDraftClientDiscounts] = useState({}); // { type: draftDiscount }

  // Products state
  const [productSearch, setProductSearch] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingDiscount, setEditingDiscount] = useState("");

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
    const allowedTypes = clientTypes.filter((type) => type !== "PARTICULIER");
    const knownTypes = CLIENT_TYPE_ORDER.filter((type) => allowedTypes.includes(type));
    const customTypes = allowedTypes.filter((type) => !CLIENT_TYPE_ORDER.includes(type));
    return [...knownTypes, ...customTypes];
  }, [clientTypes]);

  // Debounce client search
  useEffect(() => {
    const t = setTimeout(() => {
      fetchClients();
    }, 400);
    return () => clearTimeout(t);
  }, [clientSearch, fetchClients]);

  // Debounce product search
  useEffect(() => {
    if (activeTab !== "products") return;

    const t = setTimeout(() => {
      if (productSearch) {
        searchProducts({ keyword: productSearch });
      } else {
        loadProducts();
      }
    }, 400);
    return () => clearTimeout(t);
  }, [activeTab, productSearch, searchProducts, loadProducts]);

  // Load client type discounts
  useEffect(() => {
    const loadDiscounts = async () => {
      if (!configurableClientTypes.length) return;
      const newDiscounts = {};
      for (const type of configurableClientTypes) {
        try {
          const res = await getRemiseForType(type);
          newDiscounts[type] = Number(res?.remise ?? 0);
        } catch (err) {
          console.error(`Failed to load discount for ${type}`);
        }
      }
      setClientDiscounts(newDiscounts);
      setDraftClientDiscounts(newDiscounts);
    };
    loadDiscounts();
  }, [configurableClientTypes, getRemiseForType]);

  // Filter clients by type
  const filteredClients = useMemo(() => {
    if (selectedClientType === "TOUS") return clients;
    return clients.filter((c) => c.typeClient === selectedClientType);
  }, [clients, selectedClientType]);

  // Handle client discount change
  const handleClientDiscountChange = (type, value) => {
    setDraftClientDiscounts((prev) => ({ ...prev, [type]: value }));
  };

  // Save client type discount
  const saveClientTypeDiscount = async (type) => {
    try {
      const discount = Number(draftClientDiscounts[type] ?? 0);
      await updateTypeDiscount(type, discount);
      const refreshedDiscount = await getRemiseForType(type);
      const savedDiscount = Number(refreshedDiscount?.remise ?? discount);

      setClientDiscounts((prev) => ({
        ...prev,
        [type]: savedDiscount,
      }));
      setDraftClientDiscounts((prev) => ({
        ...prev,
        [type]: savedDiscount,
      }));

      await fetchClients();
    } catch (err) {
      // Error already toasted in hook
    }
  };

  const getClientDiscount = (type) => Number(clientDiscounts[type] ?? 0);

  // ---- Product discount inline editing with confirmation button ----
  const handleSaveDiscount = async (productId) => {
    if (editingDiscount === "") return;

    const newDiscount = parseFloat(editingDiscount);
    const product = products.find((p) => p.idProduit === productId);
    const oldDiscount = product?.remiseTemporaire || 0;

    if (newDiscount === oldDiscount) {
      setEditingProductId(null);
      return;
    }

    const confirmMsg = `Confirmer la nouvelle remise de ${newDiscount}% pour ce produit ?`;
    if (!window.confirm(confirmMsg)) {
      setEditingProductId(null);
      return;
    }

    try {
      const updatedProductData = {
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
      };

      await updateProduct(productId, updatedProductData);
      setEditingProductId(null);
    } catch (err) {
      console.error("Failed to update discount", err);
      alert(
        "Erreur lors de la mise à jour : " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleKeyDown = (e, productId) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveDiscount(productId);
    } else if (e.key === "Escape") {
      setEditingProductId(null);
    }
  };
  // -----------------------------------------

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header avec titre et tabs à droite */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        
        {/* Tabs redesign - maintenant à droite avec ml-auto */}
        <div className="bg-white rounded-lg p-1 border border-gray-200 inline-flex shadow-sm ml-auto">
          <button
            onClick={() => setActiveTab("clients")}
            className={`
              px-5 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab === "clients"
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }
            `}
          >
            Clients
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`
              px-5 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab === "products"
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }
            `}
          >
            Produits
          </button>
        </div>
      </div>
        
      {/* Clients Tab Content */}
      {activeTab === "clients" && (
        <div className="space-y-6">
          {/* Client Stats with modern cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard 
              label="Total" 
              value={clientStats.total} 
              color="blue"
              icon="👥"
            />
            <StatCard 
              label="Particuliers" 
              value={clientStats.particulier} 
              color="emerald"
              icon="👤"
            />
            <StatCard 
              label="VIP" 
              value={clientStats.vip} 
              color="amber"
              icon="💼"
            />
            <StatCard 
              label="Entreprises" 
              value={clientStats.entreprise} 
              color="violet"
              icon="🏢"
            />
            <StatCard 
              label="FidÃ¨les" 
              value={clientStats.fidele} 
              color="teal"
              icon="ðŸ”"
            />
          </div>

          {/* Client Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white"
              />
            </div>
            <select
              value={selectedClientType}
              onChange={(e) => setSelectedClientType(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white min-w-[160px]"
            >
              <option value="TOUS">Tous les types</option>
              {clientTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Client Table */}
          {clientsLoading && (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-500 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-500">Chargement des clients...</p>
            </div>
          )}
          
          {clientsError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{clientsError}</p>
            </div>
          )}

          {!clientsLoading && filteredClients.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">Aucun client trouvé</p>
            </div>
          )}

        {!clientsLoading && filteredClients.length > 0 && (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100"> 
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
            <th className="ttext-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Téléphone</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Remise</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {filteredClients.map((client, index) => (
            <tr key={client.idClient || client.id} className={`hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50 transition-colors ${
              index % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'
            }`}>
              <td className="px-4 py-3 font-medium text-gray-900">
                {[client.prenom, client.nom || client.name].filter(Boolean).join(" ") || "-"}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-sm text-gray-600">{client.telephone || "-"}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
                  {client.typeClient}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="font-medium text-gray-900">{getClientDiscount(client.typeClient)}%</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}

          {/* Client Type Discount Configuration */}
        {configurableClientTypes.length > 0 && (
  <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
    <h3 className="text-sm font-medium text-gray-700 mb-4">Remises par type de client</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {configurableClientTypes.map((type) => (
        <div
          key={type}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-teal-200 transition-all"
        >
          <span className="text-sm font-medium text-gray-700">{type}</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={draftClientDiscounts[type] ?? clientDiscounts[type] ?? 0}
                  onChange={(e) =>
                    handleClientDiscountChange(
                      type,
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-16 px-2 py-1.5 text-sm border-0 focus:ring-0 text-right"
              />
              <span className="px-1 text-sm text-gray-500">%</span>
            </div>
            <button
              onClick={() => saveClientTypeDiscount(type)}
              className="px-3 py-1.5 text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all shadow-sm"
            >
              Enregistrer
            </button>
          </div>
        </div>
      ))}
    </div>
    <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Ces remises s'appliquent à tous les clients du type correspondant.
    </p>
  </div>
          )}
        </div>
      )}

      {/* Products Tab Content */}
      {activeTab === "products" && (
        <div className="space-y-6">
          {/* Product Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white"
            />
          </div>

          {/* Product Table */}
          {productsLoading && (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-500 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-500">Chargement des produits...</p>
            </div>
          )}
          
          {productsError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{productsError}</p>
            </div>
          )}

          {!productsLoading && products.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">Aucun produit trouvé</p>
            </div>
          )}

      {!productsLoading && products.length > 0 && (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Image</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Catégorie</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Prix</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Remise</th>
          </tr>
        </thead>
    
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product, index) => (
                      <tr key={product.idProduit} className={`hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'
                      }`}>
                       <td className="px-4 py-3">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl.startsWith('http') 
                                ? product.imageUrl 
                                : `http://localhost:8081/${product.imageUrl.replace(/^\/+/, '')}`
                              }
                              alt={product.libelle}
                              className="w-10 h-10 object-cover rounded-lg border border-gray-200 shadow-sm"
                              onError={(e) => {
                                console.error('Erreur chargement image:', product.imageUrl);
                                e.target.onerror = null;
                                e.target.src = '/images/default-product.png';
                              }}
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center text-white text-sm font-bold border border-gray-200">
                              {product.libelle?.charAt(0).toUpperCase() || 'P'}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{product.libelle || "-"}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {product.categorie?.nomCategorie ||
                              product.categorie?.nom_categorie ||
                              "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {product.prixVente ? (
                            <span className="text-teal-600">{product.prixVente.toFixed(3)} dt</span>
                          ) : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              product.quantiteStock > 10
                                ? "bg-green-100 text-green-700"
                                : product.quantiteStock > 0
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {product.quantiteStock ?? 0} unités
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {editingProductId === product.idProduit ? (
                            <div className="flex items-center gap-1">
                              <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={editingDiscount}
                                  onChange={(e) => setEditingDiscount(e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(e, product.idProduit)}
                                  className="w-14 px-2 py-1.5 text-sm border-0 focus:ring-0 text-right"
                                  autoFocus
                                />
                                <span className="px-1 text-sm text-gray-500">%</span>
                              </div>
                              <button
                                onClick={() => handleSaveDiscount(product.idProduit)}
                                className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-all shadow-sm"
                                title="Confirmer"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setEditingProductId(null)}
                                className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-all shadow-sm"
                                title="Annuler"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div
                              className="inline-flex items-center gap-2 cursor-pointer group bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 transition-all"
                              onClick={() => {
                                setEditingProductId(product.idProduit);
                                setEditingDiscount(
                                  product.remiseTemporaire?.toString() || "0"
                                );
                              }}
                            >
                              <span className="text-sm font-medium text-gray-900">
                                {product.remiseTemporaire
                                  ? `${product.remiseTemporaire}%`
                                  : "0%"}
                              </span>
                              <svg
                                className="h-3.5 w-3.5 text-gray-400 group-hover:text-teal-500 transition-colors"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-500">
                    Page {pagination.page} sur {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadProducts(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 hover:text-teal-600 hover:border-teal-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 transition-all shadow-sm"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => loadProducts(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 hover:text-teal-600 hover:border-teal-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 transition-all shadow-sm"
                    >
                      Suivant
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

// StatCard component modernisé
const StatCard = ({ label, value, color, icon }) => {
  const colorClasses = {
    blue: "from-blue-50 to-blue-100 border-blue-200 text-blue-700",
    emerald: "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700",
    amber: "from-amber-50 to-amber-100 border-amber-200 text-amber-700",
    violet: "from-violet-50 to-violet-100 border-violet-200 text-violet-700"
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} p-5 rounded-xl border shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium opacity-80 mb-1">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <span className="text-3xl opacity-50">{icon}</span>
      </div>
    </div>
  );
};

export default Remise;
