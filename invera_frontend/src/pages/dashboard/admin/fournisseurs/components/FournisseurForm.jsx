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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-6 rounded-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-emerald-800 mb-2">
              Nom du fournisseur <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nomFournisseur"
              value={formData.nomFournisseur}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white"
              placeholder="Ex: SOTUGAT S.A."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-emerald-800 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white"
              placeholder="contact@fournisseur.tn"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-emerald-800 mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white"
              placeholder="+216 71 234 567"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-emerald-800 mb-2">
              Adresse
            </label>
            <input
              type="text"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white"
              placeholder="Adresse complète"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-emerald-800 mb-2">
                Ville
              </label>
              <input
                type="text"
                name="ville"
                value={formData.ville}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white"
                placeholder="Tunis"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-emerald-800 mb-2">
                Pays
              </label>
              <select
                name="pays"
                value={formData.pays}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white"
              >
                <option value="Tunisie">🇹🇳 Tunisie</option>
                <option value="Algérie">🇩🇿 Algérie</option>
                <option value="Maroc">🇲🇦 Maroc</option>
                <option value="France">🇫🇷 France</option>
                <option value="Autre">🌍 Autre</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-300 font-semibold border-2 border-gray-200"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl hover:from-emerald-600 hover:to-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Traitement...
            </span>
          ) : (
            initialData ? 'Mettre à jour' : 'Créer'
          )}
        </button>
      </div>
    </form>
  );
};

export default FournisseurForm;