import React, { useState, useEffect } from 'react';

const FournisseurForm = ({ initialData, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    nomFournisseur: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: '',
    pays: 'Tunisie'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* En-tête avec dégradé conservé */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 -mx-6 -mt-6 px-6 py-4 mb-4 rounded-t-xl">
        <h3 className="text-lg font-semibold text-white">
          {initialData ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
        </h3>
      </div>

      {/* Champs sans fond de couleur */}
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
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white"
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
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white"
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
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white"
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
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white"
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
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white"
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
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white"
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

      {/* Boutons d'action */}
      <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? (
            <span className="flex items-center gap-1">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>...</span>
            </span>
          ) : (
            initialData ? 'Modifier' : 'Créer'
          )}
        </button>
      </div>
    </form>
  );
};

export default FournisseurForm;