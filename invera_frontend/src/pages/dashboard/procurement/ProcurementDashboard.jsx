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
          responsable_achat Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Gestion de stock et produits !!!
        </p>
      </div>

      {/* Alert */}
      <div className="mb-8 p-4 rounded-lg bg-yellow-50 border border-yellow-300 text-yellow-800">
         Tableau de bord provisoire — fonctionnalités en cours de développement.
      </div>

      {/* User Management Section */}
      <div className="mt-10 bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Gestion de stock et produit
        </h2>

       
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
