import React, { useState, useEffect, useMemo } from "react";
import useClients from "../../../../hooks/useClient";
import useProducts from "../../../../hooks/useProducts";

const Remise = () => {
  // Tab state: "clients" or "products"
  const [activeTab, setActiveTab] = useState("clients");

  // Clients state
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientType, setSelectedClientType] = useState("TOUS");
  const [clientDiscounts, setClientDiscounts] = useState({}); // { type: discount }

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

  // Debounce client search
  useEffect(() => {
    const t = setTimeout(() => {
      fetchClients();
    }, 400);
    return () => clearTimeout(t);
  }, [clientSearch, fetchClients]);

  // Debounce product search
  useEffect(() => {
    const t = setTimeout(() => {
      if (productSearch) {
        searchProducts(productSearch);
      } else {
        loadProducts();
      }
    }, 400);
    return () => clearTimeout(t);
  }, [productSearch, searchProducts, loadProducts]);

  // Load client type discounts
  useEffect(() => {
    const loadDiscounts = async () => {
      if (!clientTypes.length) return;
      const newDiscounts = {};
      for (const type of clientTypes) {
        try {
          const res = await getRemiseForType(type);
          newDiscounts[type] = res?.remise ?? 0;
        } catch (err) {
          console.error(`Failed to load discount for ${type}`);
        }
      }
      setClientDiscounts(newDiscounts);
    };
    loadDiscounts();
  }, [clientTypes, getRemiseForType]);

  // Filter clients by type
  const filteredClients = useMemo(() => {
    if (selectedClientType === "TOUS") return clients;
    return clients.filter((c) => c.typeClient === selectedClientType);
  }, [clients, selectedClientType]);

  // Handle client discount change
  const handleClientDiscountChange = (type, value) => {
    setClientDiscounts((prev) => ({ ...prev, [type]: value }));
  };

  // Save client type discount
  const saveClientTypeDiscount = async (type) => {
    try {
      await updateTypeDiscount(type, clientDiscounts[type]);
    } catch (err) {
      // Error already toasted in hook
    }
  };

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
    <div className="space-y-8 p-6">
{/* Tabs sans ombre */}
<div className="bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-gray-200 inline-flex">
  <button
    onClick={() => setActiveTab("clients")}
    className={`
      px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300
      ${
        activeTab === "clients"
          ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white scale-105"
          : "text-gray-600"
      }
    `}
  >
    Clients
  </button>
  <button
    onClick={() => setActiveTab("products")}
    className={`
      px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300
      ${
        activeTab === "products"
          ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white scale-105"
          : "text-gray-600"
      }
    `}
  >
    Produits
  </button>
</div>
     {/* Clients Tab Content */}
{/* Clients Tab Content */}
{activeTab === "clients" && (
  <div className="space-y-6">
    {/* Client Stats with gradient cards */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <StatCard 
    label="Total" 
    value={clientStats.total} 
    gradient="from-blue-400 to-blue-500" 
  />
  <StatCard 
    label="Particuliers" 
    value={clientStats.particulier} 
    gradient="from-emerald-400 to-emerald-500" 
  />
  <StatCard 
    label="Professionnels" 
    value={clientStats.professionnel} 
    gradient="from-amber-400 to-amber-500" 
  />
  <StatCard 
    label="Entreprises" 
    value={clientStats.entreprise} 
    gradient="from-violet-400 to-violet-500" 
  />
</div>

          {/* Client Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
            <select
              value={selectedClientType}
              onChange={(e) => setSelectedClientType(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all min-w-[160px]"
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
            <div className="text-center py-8 text-gray-500">Chargement des clients...</div>
          )}
          {clientsError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{clientsError}</div>
          )}

          {!clientsLoading && filteredClients.length === 0 && (
            <div className="text-center py-8 text-gray-500">Aucun client trouvé.</div>
          )}

          {!clientsLoading && filteredClients.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase">Nom</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase">Téléphone</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase">Remise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-gradient-to-r hover:from-teal-50/30 hover:to-transparent transition-all">
                        <td className="px-4 py-3 text-gray-900">{client.nom || client.name || "-"}</td>
                        <td className="px-4 py-3 text-gray-600">{client.telephone || "-"}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 rounded-full text-xs font-medium">
                            {client.typeClient}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{client.remise ?? 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Client Type Discount Configuration */}
          {clientTypes.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Remises par type de client</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {clientTypes.map((type) => (
                  <div
                    key={type}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:border-teal-200 transition-all"
                  >
                    <span className="text-xs font-medium text-gray-700">{type}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={clientDiscounts[type] || 0}
                        onChange={(e) =>
                          handleClientDiscountChange(
                            type,
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-16 px-2 py-1 text-xs border border-gray-200 rounded text-right focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      />
                      <span className="text-xs text-gray-500">%</span>
                      <button
                        onClick={() => saveClientTypeDiscount(type)}
                        className="px-3 py-1 text-xs bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded hover:from-teal-700 hover:to-teal-800 transition-all shadow-sm hover:shadow"
                      >
                        Enreg.
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                * Ces remises s'appliquent à tous les clients du type correspondant.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Products Tab Content */}
      {activeTab === "products" && (
        <div className="space-y-6">
          {/* Product Search */}
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>

          {/* Product Table */}
          {productsLoading && (
            <div className="text-center py-8 text-gray-500">Chargement des produits...</div>
          )}
          {productsError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{productsError}</div>
          )}

          {!productsLoading && products.length === 0 && (
            <div className="text-center py-8 text-gray-500">Aucun produit trouvé.</div>
          )}

          {!productsLoading && products.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase">Image</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase">Nom</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase">Catégorie</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase">Prix</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase">Stock</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase">Remise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.idProduit} className="hover:bg-gradient-to-r hover:from-teal-50/30 hover:to-transparent transition-all">
                        <td className="px-4 py-3">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.libelle}
                              className="w-10 h-10 object-cover rounded shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                              -
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-900">{product.libelle || "-"}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full text-xs">
                            {product.categorie?.nomCategorie ||
                              product.categorie?.nom_categorie ||
                              "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-900 font-medium">{product.prixVente ? `${product.prixVente} dt` : "-"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium ${
                              product.quantiteStock > 10
                                ? "text-green-600"
                                : product.quantiteStock > 0
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {product.quantiteStock ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {editingProductId === product.idProduit ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={editingDiscount}
                                onChange={(e) => setEditingDiscount(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, product.idProduit)}
                                className="w-14 px-1.5 py-1 text-xs border border-gray-200 rounded text-right focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                autoFocus
                              />
                              <span className="text-xs text-gray-500">%</span>
                              <button
                                onClick={() => handleSaveDiscount(product.idProduit)}
                                className="p-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded hover:from-green-600 hover:to-green-700 transition-all shadow-sm"
                                title="Confirmer"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setEditingProductId(null)}
                                className="p-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded hover:from-red-600 hover:to-red-700 transition-all shadow-sm"
                                title="Annuler"
                              >
                                ✗
                              </button>
                            </div>
                          ) : (
                            <div
                              className="flex items-center gap-2 cursor-pointer group"
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
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-all"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
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

              {/* Pagination avec dégradé */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <p className="text-xs text-gray-500">
                    Page {pagination.page} sur {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadProducts(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="px-3 py-1 text-xs border border-gray-200 rounded bg-white hover:bg-gradient-to-r hover:from-teal-50 hover:to-teal-100 hover:text-teal-700 hover:border-teal-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 transition-all shadow-sm"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => loadProducts(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-3 py-1 text-xs border border-gray-200 rounded bg-white hover:bg-gradient-to-r hover:from-teal-50 hover:to-teal-100 hover:text-teal-700 hover:border-teal-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 transition-all shadow-sm"
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

// StatCard component with gradient
const StatCard = ({ label, value, gradient }) => (
  <div className={`bg-gradient-to-br ${gradient} p-4 rounded-lg shadow-sm hover:shadow-md transition-all`}>
    <p className="text-xs text-white/80 mb-1">{label}</p>
    <p className="text-xl font-semibold text-white">{value}</p>
  </div>
);

export default Remise;