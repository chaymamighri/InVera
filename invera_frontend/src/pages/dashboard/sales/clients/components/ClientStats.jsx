import React from 'react';

const ClientStats = ({ clients }) => {
  const stats = {
    total: clients?.length || 0,
    particulier: clients?.filter(c => c.typeClient === 'PARTICULIER').length || 0,
    professionnel: clients?.filter(c => c.typeClient === 'PROFESSIONNEL').length || 0,
    entreprise: clients?.filter(c => c.typeClient === 'ENTREPRISE').length || 0,
    vip: clients?.filter(c => c.typeClient === 'VIP').length || 0,
    fidele: clients?.filter(c => c.typeClient === 'FIDELE').length || 0
  };

  const StatCard = ({ title, value, icon, bgColor, textColor }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${bgColor}`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <StatCard
        title="Total"
        value={stats.total}
        icon="👥"
        bgColor="bg-blue-50"
        textColor="text-blue-600"
      />
      <StatCard
        title="Particuliers"
        value={stats.particulier}
        icon="👤"
        bgColor="bg-indigo-50"
        textColor="text-indigo-600"
      />
      <StatCard
        title="Professionnels"
        value={stats.professionnel}
        icon="💼"
        bgColor="bg-amber-50"
        textColor="text-amber-600"
      />
      <StatCard
        title="Entreprises"
        value={stats.entreprise}
        icon="🏢"
        bgColor="bg-purple-50"
        textColor="text-purple-600"
      />
      <StatCard
        title="VIP"
        value={stats.vip}
        icon="⭐"
        bgColor="bg-rose-50"
        textColor="text-rose-600"
      />
      <StatCard
        title="Fidèles"
        value={stats.fidele}
        icon="🔁"
        bgColor="bg-emerald-50"
        textColor="text-emerald-600"
      />
    </div>
  );
};

export default ClientStats;