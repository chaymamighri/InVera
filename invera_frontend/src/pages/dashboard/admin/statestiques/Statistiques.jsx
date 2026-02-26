// src/pages/Statistiques.jsx
import React, { useEffect, useMemo, useState } from 'react';
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

import { useReports } from '../../../../hooks/useReports';
import reportService from '../../../../services/ReportService'; // ✅ adjust if your file is ReportService.js

/* ================= HELPERS ================= */

const VIEW_TO_PERIOD = {
  daily: 'today',
  weekly: 'week',
  monthly: 'month',
};

const pickFirst = (obj, keys, fallback = null) => {
  if (!obj) return fallback;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return fallback;
};

const formatMoney = (v) => {
  const n = Number(v || 0);
  if (Number.isNaN(n)) return '0';
  return n.toLocaleString('fr-FR');
};

const isoOrEmpty = (v) => (v ? String(v).slice(0, 10) : '');

/**
 * Builds line data:
 * - X axis bucket is "date/day" for daily, "week" for weekly, "month" for monthly (tries keys; falls back to derived).
 * - Lines are by responsable if available, otherwise a single "Total".
 */
const buildLineDataFromItems = (items = [], view) => {
  const dateKeys = ['date', 'createdAt', 'created_at'];
  const amountKeys = ['montant', 'amount', 'total', 'totalAmount'];
  const responsableKeys = [
    'responsable',
    'responsableName',
    'responsable_name',
    'vendeur',
    'seller',
    'agent',
  ];

  const getBucket = (row) => {
    // if backend already sends labels
    const dayLabel = pickFirst(row, ['day', 'jour', 'dayLabel'], null);
    const weekLabel = pickFirst(row, ['week', 'semaine', 'weekLabel'], null);
    const monthLabel = pickFirst(row, ['month', 'mois', 'monthLabel'], null);

    if (view === 'weekly' && weekLabel) return String(weekLabel);
    if (view === 'monthly' && monthLabel) return String(monthLabel);
    if (view === 'daily' && dayLabel) return String(dayLabel);

    const d = pickFirst(row, dateKeys, null);
    if (!d) return 'N/A';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);

    if (view === 'monthly') {
      return dt.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    }

    if (view === 'weekly') {
      // ISO week number (good enough for charts)
      const tmp = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
      const dayNum = tmp.getUTCDay() || 7;
      tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
      return `W${weekNo}`;
    }

    // daily
    return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const map = new Map();

  items.forEach((row) => {
    const bucket = getBucket(row);
    const amountRaw = pickFirst(row, amountKeys, 0);
    const amount = Number(amountRaw) || 0;
    const responsable = pickFirst(row, responsableKeys, null);

    if (!map.has(bucket)) map.set(bucket, { name: bucket });
    const entry = map.get(bucket);

    if (responsable) entry[responsable] = (Number(entry[responsable]) || 0) + amount;
    else entry.Total = (Number(entry.Total) || 0) + amount;
  });

  const data = Array.from(map.values());

  // Sort
  if (view === 'weekly') {
    data.sort((a, b) => {
      const wa = parseInt(String(a.name).replace(/\D/g, ''), 10);
      const wb = parseInt(String(b.name).replace(/\D/g, ''), 10);
      if (Number.isNaN(wa) || Number.isNaN(wb)) return String(a.name).localeCompare(String(b.name));
      return wa - wb;
    });
  } else {
    data.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }

  return data;
};

const buildComparisonDataFromItems = (items = []) => {
  const amountKeys = ['montant', 'amount', 'total', 'totalAmount'];
  const responsableKeys = [
    'responsable',
    'responsableName',
    'responsable_name',
    'vendeur',
    'seller',
    'agent',
  ];

  const totals = new Map();
  let grandTotal = 0;

  items.forEach((row) => {
    const amountRaw = pickFirst(row, amountKeys, 0);
    const amount = Number(amountRaw) || 0;
    const responsable = pickFirst(row, responsableKeys, null);

    if (responsable) totals.set(responsable, (totals.get(responsable) || 0) + amount);
    else grandTotal += amount;
  });

  if (totals.size === 0) return [{ name: 'Total', total: grandTotal }];

  return Array.from(totals.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
};

const getLineKeys = (lineData = []) => {
  const keys = new Set();
  lineData.forEach((row) => Object.keys(row).forEach((k) => k !== 'name' && keys.add(k)));
  return Array.from(keys);
};

/* ================= UI COMPONENTS ================= */

const Shell = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">{children}</div>
  </div>
);

const Panel = ({ title, subtitle, right, children }) => (
  <div className="rounded-2xl border bg-white shadow-sm">
    {(title || right) && (
      <div className="flex flex-col gap-2 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
      </div>
    )}
    <div className="px-5 py-5">{children}</div>
  </div>
);

const Segmented = ({ value, onChange, options }) => (
  <div className="inline-flex rounded-xl bg-gray-100 p-1">
    {options.map((o) => {
      const active = value === o.value;
      return (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

const PrimaryBtn = ({ children, ...props }) => (
  <button
    {...props}
    className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
  >
    {children}
  </button>
);

const SoftBtn = ({ children, ...props }) => (
  <button
    {...props}
    className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200 disabled:opacity-50"
  >
    {children}
  </button>
);

const KpiCard = ({ label, value, hint }) => (
  <div className="rounded-2xl border bg-white p-4 shadow-sm">
    <div className="text-xs font-medium text-gray-500">{label}</div>
    <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
    {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
  </div>
);

const EmptyState = ({ title, description }) => (
  <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
    <div className="mx-auto max-w-md">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  </div>
);

/* ================= MAIN PAGE ================= */

const Statistiques = () => {
  // Top-level UI state
  const [tab, setTab] = useState('sales'); // sales | invoices | clients
  const [view, setView] = useState('daily'); // daily | weekly | monthly

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const period = VIEW_TO_PERIOD[view] || 'today';

  // Reports
  const sales = useReports('sales', { period });
  const invoices = useReports('invoices', { period });
  const clients = useReports('clients', { period });

  // Keep hook filters synced with UI filters
  useEffect(() => {
    const common = {
      period,
      startDate: dateFrom || undefined,
      endDate: dateTo || undefined,
    };
    sales.setFilters(common);
    invoices.setFilters(common);
    clients.setFilters(common);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, dateFrom, dateTo]);

  const current = tab === 'sales' ? sales : tab === 'invoices' ? invoices : clients;

  const salesItems = sales.data?.ventes || [];
  const invoicesItems = invoices.data?.factures || [];
  const topClients = clients.data?.topClients || [];

  // Build charts per tab
  const lineData = useMemo(() => {
    if (tab === 'sales') return buildLineDataFromItems(salesItems, view);
    if (tab === 'invoices') return buildLineDataFromItems(invoicesItems, view);
    return [];
  }, [tab, salesItems, invoicesItems, view]);

  const lineKeys = useMemo(() => getLineKeys(lineData), [lineData]);

  const comparisonData = useMemo(() => {
    if (tab === 'sales') return buildComparisonDataFromItems(salesItems);
    if (tab === 'invoices') return buildComparisonDataFromItems(invoicesItems);
    return [];
  }, [tab, salesItems, invoicesItems]);

  // KPIs
  const kpis = useMemo(() => {
    if (tab === 'sales') {
      const s = sales.data?.summary || {};
      return [
        { label: 'CA Total', value: `${formatMoney(s.totalCA)} DT` },
        { label: 'Commandes', value: formatMoney(s.totalCommandes) },
        { label: 'Panier moyen', value: `${formatMoney(s.panierMoyen)} DT` },
        { label: 'Taux transformation', value: `${formatMoney(s.tauxTransformation)}%` },
      ];
    }
    if (tab === 'invoices') {
      const s = invoices.data?.summary || {};
      return [
        { label: 'Total factures', value: formatMoney(s.totalFactures) },
        { label: 'Montant total', value: `${formatMoney(s.montantTotal)} DT` },
        { label: 'Payées', value: formatMoney(s.payees) },
        { label: 'Impayées', value: formatMoney(s.impayees) },
      ];
    }
    const s = clients.data?.summary || {};
    return [
      { label: 'Total clients', value: formatMoney(s.totalClients) },
      { label: 'Nouveaux clients', value: formatMoney(s.nouveauxClients) },
      { label: 'Clients actifs', value: formatMoney(s.clientsActifs) },
      { label: 'CA total', value: `${formatMoney(s.caTotal)} DT` },
    ];
  }, [tab, sales.data, invoices.data, clients.data]);

  const handleRefresh = () => current.refresh();

  const handleExportExcel = async () => {
    try {
      if (!current.data) return;
      await reportService.exportToExcel(tab, current.data);
    } catch (e) {
      console.error(e);
      alert(e.message || "Erreur lors de l'export Excel");
    }
  };

  const handleExportPDF = async () => {
    try {
      if (!current.data) return;
      await reportService.exportToPDF(tab, current.data);
    } catch (e) {
      console.error(e);
      alert(e.message || "Erreur lors de l'export PDF");
    }
  };

  const hasData =
    (tab === 'sales' && salesItems.length > 0) ||
    (tab === 'invoices' && invoicesItems.length > 0) ||
    (tab === 'clients' && (topClients.length > 0 || !!clients.data?.summary));

  return (
    <Shell>
      {/* ===== Top header ===== */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Statistiques</h1>
          <p className="mt-1 text-sm text-gray-500">
            Rapports dynamiques (API) • Période: <span className="font-medium">{period}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'sales', label: 'Ventes' },
              { value: 'invoices', label: 'Factures' },
              { value: 'clients', label: 'Clients' },
            ]}
          />

          <div className="h-6 w-px bg-gray-200" />

          <SoftBtn onClick={handleRefresh} disabled={current.loading}>
            Rafraîchir
          </SoftBtn>
          <SoftBtn onClick={handleExportExcel} disabled={!current.data}>
            Export Excel
          </SoftBtn>
          <PrimaryBtn onClick={handleExportPDF} disabled={!current.data}>
            Export PDF
          </PrimaryBtn>
        </div>
      </div>

      {/* ===== Filters Panel ===== */}
      <Panel
        title="Filtres"
        subtitle="Choisissez une période et/ou une plage de dates."
        right={
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: 'daily', label: 'Jour' },
              { value: 'weekly', label: 'Semaine' },
              { value: 'monthly', label: 'Mois' },
            ]}
          />
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border bg-gray-50 p-3">
            <label className="text-xs font-medium text-gray-600">Date début</label>
            <input
              type="date"
              value={isoOrEmpty(dateFrom)}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
            />
            <p className="mt-1 text-xs text-gray-500">Optionnel</p>
          </div>

          <div className="rounded-xl border bg-gray-50 p-3">
            <label className="text-xs font-medium text-gray-600">Date fin</label>
            <input
              type="date"
              value={isoOrEmpty(dateTo)}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
            />
            <p className="mt-1 text-xs text-gray-500">Optionnel</p>
          </div>

          <div className="rounded-xl border bg-gray-50 p-3">
            <label className="text-xs font-medium text-gray-600">État</label>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  current.loading
                    ? 'bg-yellow-100 text-yellow-800'
                    : current.error
                    ? 'bg-red-100 text-red-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {current.loading ? 'Chargement…' : current.error ? 'Erreur' : 'OK'}
              </span>
              {current.error && <span className="text-xs text-red-600">{current.error}</span>}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Les filtres appliquent automatiquement un rechargement.
            </p>
          </div>
        </div>
      </Panel>

      {/* ===== KPIs ===== */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} hint={k.hint} />
        ))}
      </div>

      {/* ===== Content ===== */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left: Main chart */}
        <div className="lg:col-span-2">
          <Panel
            title={
              tab === 'sales'
                ? `Évolution des ventes (${view})`
                : tab === 'invoices'
                ? `Évolution des factures (${view})`
                : `Top clients`
            }
            subtitle={
              tab === 'clients'
                ? 'Liste des meilleurs clients (si disponible).'
                : 'Courbe par responsable si le backend renvoie le champ responsable.'
            }
          >
            {!hasData ? (
              <EmptyState
                title="Aucune donnée"
                description="Aucune donnée trouvée avec ces filtres. Essayez une autre période ou une plage de dates."
              />
            ) : tab === 'clients' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-gray-500">
                    <tr>
                      <th className="py-2">Client</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Commandes</th>
                      <th className="py-2">CA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(topClients || []).map((c, idx) => (
                      <tr key={idx}>
                        <td className="py-2 font-medium text-gray-900">{c.nom ?? c.name ?? '—'}</td>
                        <td className="py-2 text-gray-700">{c.type ?? '—'}</td>
                        <td className="py-2 text-gray-700">{c.commandes ?? c.orders ?? 0}</td>
                        <td className="py-2 text-gray-900">{formatMoney(c.ca ?? c.totalCA ?? 0)} DT</td>
                      </tr>
                    ))}
                    {(!topClients || topClients.length === 0) && (
                      <tr>
                        <td className="py-3 text-gray-500" colSpan={4}>
                          Aucun top client à afficher.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {lineKeys.length === 0 ? (
                      <Line type="monotone" dataKey="Total" />
                    ) : (
                      lineKeys.map((k) => <Line key={k} type="monotone" dataKey={k} />)
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>
        </div>

        {/* Right: Comparison chart + quick list */}
        <div className="space-y-6">
          <Panel
            title={
              tab === 'sales'
                ? `Comparaison responsables (ventes)`
                : tab === 'invoices'
                ? `Comparaison (factures)`
                : `Résumé clients`
            }
            subtitle={tab === 'clients' ? 'Quelques indicateurs clés.' : 'Total par responsable si disponible.'}
          >
            {tab === 'clients' ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">Total clients</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatMoney(clients.data?.summary?.totalClients ?? 0)}
                  </div>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">Clients actifs</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatMoney(clients.data?.summary?.clientsActifs ?? 0)}
                  </div>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">CA total</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatMoney(clients.data?.summary?.caTotal ?? 0)} DT
                  </div>
                </div>
              </div>
            ) : comparisonData.length === 0 ? (
              <EmptyState
                title="Comparaison indisponible"
                description="Le backend ne renvoie peut-être pas le champ responsable sur chaque ligne."
              />
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          {(tab === 'sales' || tab === 'invoices') && (
            <Panel
              title="Aperçu des dernières lignes"
              subtitle={tab === 'sales' ? 'Dernières ventes (si disponibles).' : 'Dernières factures (si disponibles).'}
            >
              <div className="space-y-2">
                {(tab === 'sales' ? salesItems : invoicesItems).slice(0, 6).map((row, idx) => {
                  const date = pickFirst(row, ['date', 'createdAt', 'created_at'], '—');
                  const client = pickFirst(row, ['client', 'customer', 'clientName'], '—');
                  const montant = pickFirst(row, ['montant', 'amount', 'total'], 0);
                  const statut = pickFirst(row, ['statut', 'status'], '—');

                  return (
                    <div key={idx} className="rounded-xl border bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{client}</div>
                          <div className="mt-0.5 text-xs text-gray-500">{String(date)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatMoney(montant)} DT
                          </div>
                          <div className="mt-0.5 text-xs text-gray-500">{statut}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(tab === 'sales' ? salesItems : invoicesItems).length === 0 && (
                  <div className="text-sm text-gray-500">Aucune ligne à afficher.</div>
                )}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </Shell>
  );
};

export default Statistiques;