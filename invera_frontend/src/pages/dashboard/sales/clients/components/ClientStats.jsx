import React from 'react';

const ClientStats = ({ clients }) => {
  const stats = {
    total: clients?.length || 0,
    particulier: clients?.filter((c) => c.typeClient === 'PARTICULIER').length || 0,
    entreprise: clients?.filter((c) => c.typeClient === 'ENTREPRISE').length || 0,
    vip: clients?.filter((c) => c.typeClient === 'VIP').length || 0,
    fidele: clients?.filter((c) => c.typeClient === 'FIDELE').length || 0,
  };

  const StatCard = ({ title, value, icon, bgColor }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${bgColor}`}>
          <span className="text-sm font-semibold text-gray-700">{icon}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <StatCard
        title="Total"
        value={stats.total}
        icon="ALL"
        bgColor="bg-blue-50"
      />
      <StatCard
        title="Particuliers"
        value={stats.particulier}
        icon="PAR"
        bgColor="bg-indigo-50"
      />
      <StatCard
        title="Entreprises"
        value={stats.entreprise}
        icon="ENT"
        bgColor="bg-purple-50"
      />
      <StatCard
        title="VIP"
        value={stats.vip}
        icon="VIP"
        bgColor="bg-rose-50"
      />
      <StatCard
        title="Fideles"
        value={stats.fidele}
        icon="FID"
        bgColor="bg-emerald-50"
      />
    </div>
  );
};

export default ClientStats;
