import React from "react";
import {
  UsersIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const AdminDashboard = () => {
  return (
    <div className="p-6">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Gestion des utilisateurs (COMMERCIAL, ACHATS)
        </p>
      </div>

      {/* Alert */}
      <div className="mb-8 p-4 rounded-lg bg-yellow-50 border border-yellow-300 text-yellow-800">
        ⚠️ Tableau de bord provisoire — fonctionnalités en cours de développement.
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Utilisateurs" value="--" icon={UsersIcon} />
        <StatCard title="Ventes" value="--" icon={ShoppingBagIcon} />
        <StatCard title="Chiffre d’affaires" value="--" icon={CurrencyDollarIcon} />
        <StatCard title="Rapports" value="--" icon={ChartBarIcon} />
      </div>

      {/* User Management Section */}
      <div className="mt-10 bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Gestion des utilisateurs
        </h2>

        <p className="text-gray-600 mb-6">
          L’administrateur peut gérer les comptes <b>COMMERCIAL</b> et <b>ACHATS</b>.
        </p>

        <div className="flex gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            ➕ Ajouter un utilisateur
          </button>

          <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">
            👥 Voir la liste des utilisateurs
          </button>
        </div>
      </div>
    </div>
  );
};

/* Stat Card */
const StatCard = ({ title, value, icon: Icon }) => {
  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
    </div>
  );
};

export default AdminDashboard;
