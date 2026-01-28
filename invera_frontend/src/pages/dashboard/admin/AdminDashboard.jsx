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
      {/* Titre */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Module en cours de développement
        </p>
      </div>

      {/* Alerte développement */}
      <div className="mb-8 p-4 rounded-lg bg-yellow-50 border border-yellow-300 text-yellow-800">
        ⚠️ Ce tableau de bord est provisoire.  
        Les fonctionnalités complètes seront disponibles dans les prochains sprints.
      </div>

      {/* Statistiques statiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Utilisateurs"
          value="--"
          icon={UsersIcon}
        />
        <StatCard
          title="Ventes"
          value="--"
          icon={ShoppingBagIcon}
        />
        <StatCard
          title="Chiffre d’affaires"
          value="--"
          icon={CurrencyDollarIcon}
        />
        <StatCard
          title="Rapports"
          value="--"
          icon={ChartBarIcon}
        />
      </div>
    </div>
  );
};

/* Composant simple pour les cartes */
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
