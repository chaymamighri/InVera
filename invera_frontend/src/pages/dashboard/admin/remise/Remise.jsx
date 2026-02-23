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
      <h1 className="text-2xl font-bold text-gray-800">Gestion des Remises</h1>

      {/* Tabs */}
      <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-100 inline-flex">
        <button
          onClick={() => setActiveTab("clients")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === "clients"
              ? "bg-teal-500 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Clients
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === "products"
              ? "bg-teal-500 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Produits
        </button>
      </div>

      {/* Clients Tab Content */}
      {activeTab === "clients" && (
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Clients</h2>

          {/* Client Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total" value={clientStats.total} color="blue" />
            <StatCard
              label="Particuliers"
              value={clientStats.particulier}
              color="green"
            />
            <StatCard
              label="Professionnels"
              value={clientStats.professionnel}
              color="yellow"
            />
            <StatCard
              label="Entreprises"
              value={clientStats.entreprise}
              color="purple"
            />
          </div>

          {/* Client Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
            <select
              value={selectedClientType}
              onChange={(e) => setSelectedClientType(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
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
          {clientsLoading && <p>Chargement des clients...</p>}
          {clientsError && <p className="text-red-500">{clientsError}</p>}

          {!clientsLoading && filteredClients.length === 0 && (
            <p className="text-gray-500">Aucun client trouvé.</p>
          )}

          {!clientsLoading && filteredClients.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Nom</th>
                    <th className="text-left p-3">Téléphone</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Remise actuelle</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{client.nom || client.name || "-"}</td>
                      <td className="p-3">{client.telephone || "-"}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-full text-xs">
                          {client.typeClient}
                        </span>
                      </td>
                      <td className="p-3 font-medium">{client.remise ?? 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Client Type Discount Configuration */}
          {clientTypes.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">
                Remises par type de client
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clientTypes.map((type) => (
                  <div
                    key={type}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <span className="font-medium">{type}</span>
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
                        className="w-20 px-2 py-1 border rounded text-right"
                      />
                      <span>%</span>
                      <button
                        onClick={() => saveClientTypeDiscount(type)}
                        className="px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                * Ces remises s'appliquent à tous les clients du type
                correspondant.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Products Tab Content */}
      {activeTab === "products" && (
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Produits</h2>

          {/* Product Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Product Table */}
          {productsLoading && <p>Chargement des produits...</p>}
          {productsError && <p className="text-red-500">{productsError}</p>}

          {!productsLoading && products.length === 0 && (
            <p className="text-gray-500">Aucun produit trouvé.</p>
          )}

          {!productsLoading && products.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Image</th>
                    <th className="text-left p-3">Nom</th>
                    <th className="text-left p-3">Catégorie</th>
                    <th className="text-left p-3">Prix</th>
                    <th className="text-left p-3">Stock</th>
                    <th className="text-left p-3">Remise</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.idProduit} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.libelle}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
                            Aucune
                          </div>
                        )}
                      </td>
                      <td className="p-3">{product.libelle || "-"}</td>
                      <td className="p-3">
                        {product.categorie?.nomCategorie ||
                          product.categorie?.nom_categorie ||
                          "-"}
                      </td>
                      <td className="p-3">
                        {product.prixVente ? `${product.prixVente} €` : "-"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            product.quantiteStock > 10
                              ? "bg-green-50 text-green-700"
                              : product.quantiteStock > 0
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {product.quantiteStock ?? 0}
                        </span>
                      </td>
                      <td className="p-3">
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
                              className="w-16 px-2 py-1 border rounded text-right"
                              autoFocus
                            />
                            <span>%</span>
                            <button
                              onClick={() => handleSaveDiscount(product.idProduit)}
                              className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                              title="Confirmer"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingProductId(null)}
                              className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                              title="Annuler"
                            >
                              ✗
                            </button>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded flex items-center justify-between"
                            onClick={() => {
                              setEditingProductId(product.idProduit);
                              setEditingDiscount(
                                product.remiseTemporaire?.toString() || "0"
                              );
                            }}
                          >
                            <span>
                              {product.remiseTemporaire
                                ? `${product.remiseTemporaire}%`
                                : "0%"}
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 ml-2 text-gray-400 hover:text-teal-600"
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

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-gray-500">
                    Page {pagination.page} sur {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadProducts(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => loadProducts(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

// StatCard component
const StatCard = ({ label, value, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    purple: "bg-purple-50 text-purple-700",
  };
  return (
    <div className={`p-4 rounded-xl ${colors[color]}`}>
      <p className="text-sm">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

export default Remise;