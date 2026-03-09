// src/pages/Statistiques.jsx
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Brush,
  LabelList,
  ReferenceLine,
} from 'recharts';

import { useReports } from '../../../../hooks/useReports';

/* ================= HELPERS ================= */

/**
 * Palette aux couleurs du thème Invera (vert-bleu)
 */
const COLORS = [
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#059669', // emerald-600
  '#2563eb', // blue-600
  '#34d399', // emerald-400
  '#60a5fa', // blue-400
  '#8b5cf6', // violet-500 (accent)
];

const pickFirst = (obj, keys, fallback = null) => {
  if (!obj) return fallback;
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null && obj?.[k] !== '') return obj[k];
  }
  return fallback;
};

const formatMoney = (v) => {
  const n = Number(v || 0);
  if (Number.isNaN(n)) return '0';
  return n.toLocaleString('fr-FR');
};

const isValidISODate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));

const sanitizeRange = (from, to) => {
  const f = String(from || '').slice(0, 10);
  const t = String(to || '').slice(0, 10);

  const fOk = isValidISODate(f);
  const tOk = isValidISODate(t);

  if (!fOk && !tOk) return { startDate: undefined, endDate: undefined, swapped: false };
  if (fOk && !tOk) return { startDate: f, endDate: undefined, swapped: false };
  if (!fOk && tOk) return { startDate: undefined, endDate: t, swapped: false };

  if (f > t) return { startDate: t, endDate: f, swapped: true };
  return { startDate: f, endDate: t, swapped: false };
};

const formatDayLabel = (dateLike) => {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return String(dateLike).slice(0, 10);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const avg = (arr) => (arr.length ? sum(arr) / arr.length : 0);

const buildTimeSeries = (items = []) => {
  const dateKeys = ['date', 'createdAt', 'created_at'];
  const amountKeys = ['montant', 'amount', 'total', 'totalAmount'];
  const responsableKeys = ['responsable', 'responsableName', 'responsable_name', 'vendeur', 'seller', 'agent'];

  const byDay = new Map();

  for (const row of items) {
    const rawDate = pickFirst(row, dateKeys, null);
    const day = rawDate ? formatDayLabel(rawDate) : 'N/A';

    const amount = Number(pickFirst(row, amountKeys, 0)) || 0;
    const resp = pickFirst(row, responsableKeys, null);

    if (!byDay.has(day)) byDay.set(day, { name: day, Total: 0 });
    const entry = byDay.get(day);

    entry.Total += amount;
    if (resp) entry[resp] = (Number(entry[resp]) || 0) + amount;
  }

  const data = Array.from(byDay.values());
  data.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return data;
};

const getLineKeys = (data = []) => {
  const keys = new Set();
  data.forEach((row) => Object.keys(row).forEach((k) => k !== 'name' && keys.add(k)));
  const arr = Array.from(keys);
  arr.sort((a, b) => {
    if (a === 'Total') return -1;
    if (b === 'Total') return 1;
    return a.localeCompare(b);
  });
  return arr;
};

const buildComparison = (items = []) => {
  const amountKeys = ['montant', 'amount', 'total', 'totalAmount'];
  const responsableKeys = ['responsable', 'responsableName', 'responsable_name', 'vendeur', 'seller', 'agent'];

  const totals = new Map();
  let grandTotal = 0;

  for (const row of items) {
    const amount = Number(pickFirst(row, amountKeys, 0)) || 0;
    const resp = pickFirst(row, responsableKeys, null);

    if (resp) totals.set(resp, (totals.get(resp) || 0) + amount);
    else grandTotal += amount;
  }

  if (totals.size === 0) return [{ name: 'Total', total: grandTotal }];

  return Array.from(totals.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
};

/* ================= UI ================= */

const Shell = ({ children }) => (
  <div className="min-h-screen bg-white">
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">{children}</div>
  </div>
);

const Card = ({ title, subtitle, right, children }) => (
  <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
    {(title || right) && (
      <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          {title ? <h2 className="text-base font-semibold text-gray-800">{title}</h2> : null}
          {subtitle ? <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p> : null}
        </div>
        {right ? <div className="flex flex-wrap items-center gap-2">{right}</div> : null}
      </div>
    )}
    <div className="px-5 py-5">{children}</div>
  </div>
);

const Tab = ({ active, children, ...props }) => (
  <button
    type="button"
    className={[
      'rounded-lg px-4 py-2 text-sm font-medium transition-all',
      active
        ? 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700'
        : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-600',
    ].join(' ')}
    {...props}
  >
    {children}
  </button>
);

const PrimaryButton = ({ className = '', ...props }) => (
  <button
    type="button"
    className={`rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${className}`}
    {...props}
  />
);

const Kpi = ({ label, value, hint }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
    <p className="text-sm font-medium text-emerald-600">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-gray-800">{value}</p>
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
  </div>
);

const EmptyBox = ({ title, description }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center">
    <svg className="mx-auto h-12 w-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
    <p className="mt-4 text-base font-medium text-gray-700">{title}</p>
    <p className="mt-1 text-sm text-gray-500">{description}</p>
  </div>
);

const ProTooltip = ({ active, payload, label, suffix = 'DT' }) => {
  if (!active || !payload?.length) return null;

  const rows = payload
    .map((p) => ({ name: p.name, value: Number(p.value) || 0, color: p.color }))
    .sort((a, b) => b.value - a.value);

  const totalRow = rows.find((r) => r.name === 'Total');
  const total = totalRow ? totalRow.value : rows.reduce((acc, r) => acc + r.value, 0);

  const top = rows.filter((r) => r.name !== 'Total').slice(0, 5);

  return (
    <div className="min-w-[260px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <p className="text-xs font-semibold text-gray-800">{label}</p>
      <div className="mt-1 text-xs text-gray-600">
        Total:{' '}
        <span className="font-semibold text-emerald-600">
          {formatMoney(total)} {suffix}
        </span>
      </div>

      {top.length > 0 && (
        <div className="mt-2 space-y-1">
          {top.map((r) => (
            <div key={r.name} className="flex items-center justify-between gap-6 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                <span className="text-gray-600">{r.name}</span>
              </div>
              <span className="font-semibold text-gray-800">
                {formatMoney(r.value)} {suffix}
              </span>
            </div>
          ))}
          {rows.filter((r) => r.name !== 'Total').length > 5 && (
            <p className="pt-1 text-[11px] text-gray-400">+ autres responsables…</p>
          )}
        </div>
      )}
    </div>
  );
};

/* ================= PAGE ================= */

const Statistiques = () => {
  const [tab, setTab] = useState('sales');
  const [dateFromDraft, setDateFromDraft] = useState('');
  const [dateToDraft, setDateToDraft] = useState('');
  const [filters, setFilters] = useState({ startDate: undefined, endDate: undefined });

  const sales = useReports('sales', {});
  const clients = useReports('clients', {});

  const current = tab === 'sales' ? sales : tab === 'clients' ? clients : null;

  useEffect(() => {
    const common = {
      startDate: filters.startDate,
      endDate: filters.endDate,
    };

    sales.setFilters(common);
    clients.setFilters(common);
  }, [filters.startDate, filters.endDate]);

  const salesItems = sales.data?.ventes || [];
  const topClients = clients.data?.topClients || [];

  const loading = current?.loading ?? false;
  const error = current?.error ?? null;

  const [filterHint, setFilterHint] = useState('');

  const applyFilters = useCallback(() => {
    const { startDate, endDate, swapped } = sanitizeRange(dateFromDraft, dateToDraft);
    setFilterHint(swapped ? 'Dates inversées : correction automatique.' : '');

    setDateFromDraft(startDate || '');
    setDateToDraft(endDate || '');
    setFilters({ startDate, endDate });
  }, [dateFromDraft, dateToDraft]);

  const handleRefresh = useCallback(() => {
    if (current?.refresh) current.refresh();
  }, [current]);

  const timeSeries = useMemo(() => (tab === 'sales' ? buildTimeSeries(salesItems) : []), [tab, salesItems]);
  const seriesKeys = useMemo(() => getLineKeys(timeSeries), [timeSeries]);

  const comparison = useMemo(() => (tab === 'sales' ? buildComparison(salesItems) : []), [tab, salesItems]);

  const totalsForAvg = useMemo(() => timeSeries.map((d) => Number(d.Total) || 0), [timeSeries]);
  const avgTotal = useMemo(() => avg(totalsForAvg), [totalsForAvg]);

  const kpis = useMemo(() => {
    if (tab === 'sales') {
      const summary = sales.data?.summary || {};
      const ca = Number(summary.totalCA ?? sum(totalsForAvg)) || 0;
      const count = Number(summary.totalCommandes ?? salesItems.length) || 0;
      const panier = Number(summary.panierMoyen ?? (count ? ca / count : 0)) || 0;

      return [
        { label: 'CA total', value: `${formatMoney(ca)} DT` },
        { label: 'Nombre de ventes', value: formatMoney(count) },
        { label: 'Panier moyen', value: `${formatMoney(panier)} DT` },
        { label: 'Taux transformation', value: `${formatMoney(summary.tauxTransformation ?? 0)}%` },
      ];
    }

    if (tab === 'clients') {
      const s = clients.data?.summary || {};
      return [
        { label: 'Total clients', value: formatMoney(s.totalClients ?? 0) },
        { label: 'Nouveaux clients', value: formatMoney(s.nouveauxClients ?? 0) },
        { label: 'Clients actifs', value: formatMoney(s.clientsActifs ?? 0) },
        { label: 'CA total', value: `${formatMoney(s.caTotal ?? 0)} DT` },
      ];
    }

    return [
      { label: 'Achats', value: '—' },
      { label: 'Montant', value: '—' },
      { label: 'Fournisseurs', value: '—' },
      { label: 'Statut', value: '—' },
    ];
  }, [tab, sales.data, clients.data, salesItems.length, totalsForAvg]);

  const hasData =
    (tab === 'sales' && salesItems.length > 0) ||
    (tab === 'clients' && (topClients.length > 0 || !!clients.data?.summary));

  return (
    <Shell>
      {/* Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Tab active={tab === 'sales'} onClick={() => setTab('sales')}>
          Ventes
        </Tab>
        <Tab active={tab === 'purchases'} onClick={() => setTab('purchases')}>
          Achats
        </Tab>
        <Tab active={tab === 'clients'} onClick={() => setTab('clients')}>
          Clients
        </Tab>
      </div>

      {/* Filters */}
      <Card title="Filtrer par période" subtitle="Sélectionnez une date de début et de fin">
        <div className="grid gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-emerald-600 mb-1">Date début</label>
            <input
              type="date"
              value={dateFromDraft}
              onChange={(e) => setDateFromDraft(e.target.value)}
              className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-emerald-600 mb-1">Date fin</label>
            <input
              type="date"
              value={dateToDraft}
              onChange={(e) => setDateToDraft(e.target.value)}
              className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all"
            />
          </div>

          <div className="md:col-span-4 md:flex md:justify-end">
            <PrimaryButton onClick={applyFilters} disabled={loading}>
              Appliquer
            </PrimaryButton>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm">
          {loading ? (
            <span className="flex items-center text-gray-500">
              <svg className="animate-spin h-4 w-4 mr-1 text-emerald-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Chargement…
            </span>
          ) : error ? (
            <span className="text-red-500">{error}</span>
          ) : (
            <span className="flex items-center text-emerald-600">
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Données à jour
            </span>
          )}
          {filterHint && <span className="text-amber-600">• {filterHint}</span>}
        </div>
      </Card>

      {/* KPIs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, idx) => (
          <Kpi key={idx} label={k.label} value={k.value} hint={k.hint} />
        ))}
      </div>

      {/* Main Content */}
      <div className="mt-6 space-y-6">
        {/* Evolution Chart */}
        <Card
          title={tab === 'sales' ? 'Évolution du chiffre d\'affaires' : tab === 'clients' ? 'Top clients' : 'Achats'}
          subtitle={
            tab === 'sales'
              ? 'Évolution journalière avec moyenne et zoom'
              : tab === 'clients'
              ? 'Classement des meilleurs clients'
              : 'Module en développement'
          }
        >
          {!hasData && tab !== 'purchases' ? (
            <EmptyBox title="Aucune donnée" description="Essayez de modifier votre période de filtrage" />
          ) : tab === 'clients' ? (
          // src/pages/Statistiques.jsx
// Ligne 485 environ - Tableau des clients
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    <thead className="bg-gray-100">
      <tr>
        <th className="text-left px-4 py-3 text-xs font-medium text-gray-700 uppercase">Client</th>
        <th className="text-left px-4 py-3 text-xs font-medium text-gray-700 uppercase">Type</th>
        <th className="text-left px-4 py-3 text-xs font-medium text-gray-700 uppercase">Commandes</th>
        <th className="text-left px-4 py-3 text-xs font-medium text-gray-700 uppercase">CA</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
      {(topClients || []).map((c, idx) => (
        <tr key={idx} className="hover:bg-gray-50 transition-colors">
          <td className="px-4 py-3 font-medium text-gray-900">{c.nom ?? c.name ?? '—'}</td>
          <td className="px-4 py-3 text-gray-600">{c.type ?? '—'}</td>
          <td className="px-4 py-3 text-gray-600">{c.commandes ?? c.orders ?? 0}</td>
          <td className="px-4 py-3 font-medium text-emerald-600">
            {formatMoney(c.ca ?? c.totalCA ?? 0)} DT
          </td>
        </tr>
      ))}
      {(!topClients || topClients.length === 0) && (
        <tr>
          <td className="px-4 py-8 text-center text-gray-500" colSpan={4}>
            Aucun client à afficher
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
          ) : tab === 'purchases' ? (
            <EmptyBox title="Module Achats" description="Cette section sera bientôt disponible" />
          ) : (
            <div className="h-[560px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries} margin={{ top: 16, right: 18, left: 8, bottom: 24 }}>
                  <defs>
                    <linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tickFormatter={(v) => formatMoney(v)}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip content={<ProTooltip suffix="DT" />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

                  {Number.isFinite(avgTotal) && avgTotal > 0 && (
                    <ReferenceLine
                      y={avgTotal}
                      stroke="#94a3b8"
                      strokeDasharray="5 5"
                      label={{
                        value: `Moyenne: ${formatMoney(avgTotal)} DT`,
                        position: 'insideTopRight',
                        fill: '#475569',
                        fontSize: 11,
                      }}
                    />
                  )}

                  <Area
                    type="monotone"
                    dataKey="Total"
                    name="CA Total"
                    stroke="#059669"
                    strokeWidth={3}
                    fill="url(#totalFill)"
                    activeDot={{ r: 6, fill: '#059669' }}
                    dot={{ r: 2, fill: '#059669' }}
                  />
                  
                  <Line 
                    type="monotone" 
                    dataKey="Total" 
                    name="Tendance" 
                    stroke="#059669" 
                    strokeWidth={2} 
                    dot={false} 
                  />

                  {seriesKeys.filter((k) => k !== 'Total').slice(0, 3).map((k, idx) => (
                    <Line
                      key={k}
                      type="monotone"
                      dataKey={k}
                      name={k}
                      stroke={COLORS[(idx + 2) % COLORS.length]}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  ))}

                  <Brush
                    dataKey="name"
                    height={26}
                    travellerWidth={10}
                    stroke="#059669"
                    fill="#f0fdf4"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Comparison Chart */}
       {/* Comparison Chart */}
<Card
  title={tab === 'sales' ? 'Performance par responsable' : tab === 'clients' ? 'Résumé clients' : 'Achats'}
  subtitle={
    tab === 'sales'
      ? 'Répartition du chiffre d\'affaires'
      : tab === 'clients'
      ? 'Indicateurs clés clients'
      : 'Module en développement'
  }
>
  {tab === 'clients' ? (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm text-emerald-600">Total clients</p>
        <p className="mt-2 text-2xl font-semibold text-gray-800">
          {formatMoney(clients.data?.summary?.totalClients ?? 0)}
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm text-emerald-600">Clients actifs</p>
        <p className="mt-2 text-2xl font-semibold text-gray-800">
          {formatMoney(clients.data?.summary?.clientsActifs ?? 0)}
        </p>
      </div>
      <div className="sm:col-span-2 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl p-5">
        <p className="text-sm text-white/80">CA total clients</p>
        <p className="mt-2 text-2xl font-semibold text-white">
          {formatMoney(clients.data?.summary?.caTotal ?? 0)} DT
        </p>
      </div>
    </div>
  ) : tab === 'purchases' ? (
    <EmptyBox title="Module Achats" description="Cette section sera bientôt disponible" />
  ) : comparison.length === 0 ? (
    <EmptyBox title="Données non disponibles" description="Aucune donnée de responsable trouvée" />
  ) : (
    <div className="h-[520px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={comparison} margin={{ top: 16, right: 18, left: 8, bottom: 70 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            angle={-25}
            textAnchor="end"
            height={80}
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis
            tickFormatter={(v) => formatMoney(v)}
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <Tooltip content={<ProTooltip suffix="DT" />} />
          <Bar dataKey="total" name="CA" fill="#059669" radius={[8, 8, 0, 0]}>
            <LabelList
              dataKey="total"
              position="top"
              formatter={(v) => `${formatMoney(v)} DT`}
              style={{ fill: '#059669', fontWeight: 600, fontSize: 11 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )}
</Card>
      </div>
    </Shell>
  );
};

export default Statistiques;