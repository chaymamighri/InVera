import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from 'recharts';

/* ================= MOCK DATA ================= */

const statistiques = {
  responsables: [
    {
      id: 1,
      name: 'Ahmed',
      type: 'vente',
      daily: [
        { day: 'Mon', amount: 1200 },
        { day: 'Tue', amount: 900 },
        { day: 'Wed', amount: 1500 },
        { day: 'Thu', amount: 800 },
        { day: 'Fri', amount: 1700 },
      ],
      weekly: [
        { week: 'W1', amount: 5200 },
        { week: 'W2', amount: 6100 },
      ],
    },
    {
      id: 2,
      name: 'Sami',
      type: 'vente',
      daily: [
        { day: 'Mon', amount: 1000 },
        { day: 'Tue', amount: 1100 },
        { day: 'Wed', amount: 900 },
        { day: 'Thu', amount: 1400 },
        { day: 'Fri', amount: 1300 },
      ],
      weekly: [
        { week: 'W1', amount: 4800 },
        { week: 'W2', amount: 5900 },
      ],
    },
    {
      id: 3,
      name: 'Yassine',
      type: 'achat',
      daily: [
        { day: 'Mon', amount: 700 },
        { day: 'Tue', amount: 600 },
        { day: 'Wed', amount: 850 },
        { day: 'Thu', amount: 900 },
        { day: 'Fri', amount: 750 },
      ],
      weekly: [
        { week: 'W1', amount: 3100 },
        { week: 'W2', amount: 3400 },
      ],
    },
    {
      id: 4,
      name: 'Khaled',
      type: 'achat',
      daily: [
        { day: 'Mon', amount: 900 },
        { day: 'Tue', amount: 750 },
        { day: 'Wed', amount: 1000 },
        { day: 'Thu', amount: 1100 },
        { day: 'Fri', amount: 950 },
      ],
      weekly: [
        { week: 'W1', amount: 4200 },
        { week: 'W2', amount: 4600 },
      ],
    },
  ],
};

/* ================= COMPONENT ================= */

const Statistiques = () => {
  const [view, setView] = useState('daily');

  /* ===== Line chart data (vente + achat) ===== */
  const buildLineData = (type) => {
    const responsables = statistiques.responsables.filter(
      (r) => r.type === type
    );

    const key = view === 'daily' ? 'day' : 'week';
    const map = {};

    responsables.forEach((r) => {
      r[view].forEach((d) => {
        if (!map[d[key]]) map[d[key]] = { name: d[key] };
        map[d[key]][r.name] = d.amount;
      });
    });

    return Object.values(map);
  };

  /* ===== Comparison bar chart ===== */
  const getComparisonData = (type) => {
    return statistiques.responsables
      .filter((r) => r.type === type)
      .map((r) => {
        const data = view === 'daily' ? r.daily : r.weekly;
        const total = data.reduce((sum, d) => sum + d.amount, 0);
        return { name: r.name, total };
      })
      .sort((a, b) => b.total - a.total);
  };

  return (
    <div className="space-y-8">
      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Statistiques & Rapports</h1>

        <div className="flex gap-2">
          <button
            onClick={() => setView('daily')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              view === 'daily'
                ? 'bg-teal-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setView('weekly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              view === 'weekly'
                ? 'bg-teal-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* ===== VENTE LINE CHART ===== */}
      <Card title={`Rapport Vente (${view})`}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={buildLineData('vente')}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Ahmed" stroke="#10b981" />
            <Line type="monotone" dataKey="Sami" stroke="#3b82f6" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* ===== ACHAT LINE CHART ===== */}
      <Card title={`Rapport Achat (${view})`}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={buildLineData('achat')}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Yassine" stroke="#f97316" />
            <Line type="monotone" dataKey="Khaled" stroke="#ef4444" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* ===== COMPARAISON VENTE ===== */}
      <Card title={`Comparaison Responsables Vente (${view})`}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={getComparisonData('vente')}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ===== COMPARAISON ACHAT ===== */}
      <Card title={`Comparaison Responsables Achat (${view})`}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={getComparisonData('achat')}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#f97316" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

/* ================= UI CARD ================= */

const Card = ({ title, children }) => (
  <div className="bg-white p-6 rounded-xl border">
    <h2 className="text-lg font-semibold mb-4">{title}</h2>
    {children}
  </div>
);

export default Statistiques;
