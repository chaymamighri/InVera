/**
 * FournisseurForm - Formulaire de création/modification fournisseur
 * 
 * RÔLE : Gérer la saisie des informations d'un fournisseur
 * 
 * FONCTIONNALITÉS :
 * - Champs : nom, email, téléphone, adresse, ville, pays
 * - Validation HTML5 (required)
 * - Pré-remplissage en mode modification
 * - En-tête gradient avec titre dynamique
 * - Boutons Annuler / Créer (ou Modifier)
 * - État de chargement (loading)
 * 
 * @param {Object} initialData - Données du fournisseur (mode modification)
 * @param {Function} onSubmit - Callback à la soumission
 * @param {Function} onCancel - Callback à l'annulation
 * @param {boolean} loading - État de chargement
 */

import React, { useState, useEffect } from "react";

const FournisseurForm = ({ initialData, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    nomFournisseur: "",
    email: "",
    telephone: "",
    adresse: "",
    ville: "",
    pays: "Tunisie",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Header Gradient */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 
                      -mx-6 -mt-6 px-6 py-4 mb-4 rounded-t-xl 
                      flex items-center justify-between">

        <div className="flex items-center gap-2">

        <svg
  className="w-5 h-5 text-white"
  fill="none"
  stroke="currentColor"
  viewBox="0 0 24 24"
>
  <path
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"
  />
</svg>

          <h3 className="text-lg font-semibold text-white">
            {initialData ? "Modifier le fournisseur" : "Nouveau fournisseur"}
          </h3>

        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          className="text-white/80 hover:text-white transition"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Champs */}
      <div className="space-y-3">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du fournisseur <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nomFournisseur"
            value={formData.nomFournisseur}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            placeholder="Ex: SOTUGAT S.A."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            placeholder="contact@fournisseur.tn"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="telephone"
            value={formData.telephone}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            placeholder="+216 71 234 567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adresse <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="adresse"
            value={formData.adresse}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            placeholder="Adresse complète"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ville <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="ville"
              value={formData.ville}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="Tunis"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pays <span className="text-red-500">*</span>
            </label>
            <select
              name="pays"
              value={formData.pays}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              <option value="">Sélectionner un pays</option>
              <option value="Tunisie">🇹🇳 Tunisie</option>
              <option value="Algérie">🇩🇿 Algérie</option>
              <option value="Maroc">🇲🇦 Maroc</option>
              <option value="France">🇫🇷 France</option>
              <option value="Autre">🌍 Autre</option>
            </select>
          </div>

        </div>

      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">

        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50 transition shadow-sm"
        >
          {loading ? "..." : initialData ? "Modifier" : "Créer"}
        </button>

      </div>
    </form>
  );
};

export default FournisseurForm;