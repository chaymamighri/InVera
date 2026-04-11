import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  LineChart,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Brush,
  LabelList,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { useReports } from '../../../../hooks/useReports';
import commandeFournisseurService from '../../../../services/commandeFournisseurService';

const COLORS = ['#10b981', '#3b82f6', '#059669', '#2563eb', '#f59e0b', '#ef4444'];
const PIE_COLORS = ['#0f766e', '#0ea5e9', '#f59e0b', '#dc2626', '#8b5cf6', '#14b8a6'];

const formatMoney = (value) => {
  const number = Number(value || 0);
  if (Number.isNaN(number)) return '0';
  return number.toLocaleString('fr-FR');
};

const formatPercent = (value) => `${Number(value || 0).toLocaleString('fr-FR')}%`;

const isValidISODate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));

const sanitizeRange = (from, to) => {
  const start = String(from || '').slice(0, 10);
  const end = String(to || '').slice(0, 10);
  const hasStart = isValidISODate(start);
  const hasEnd = isValidISODate(end);

  if (!hasStart && !hasEnd) return { startDate: undefined, endDate: undefined, swapped: false };
  if (hasStart && !hasEnd) return { startDate: start, endDate: undefined, swapped: false };
  if (!hasStart && hasEnd) return { startDate: undefined, endDate: end, swapped: false };
  if (start > end) return { startDate: end, endDate: start, swapped: true };
  return { startDate: start, endDate: end, swapped: false };
};

const formatDayLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || '').slice(0, 10);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

// ========== STYLED COMPONENTS ==========
const Shell = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">{children}</div>
  </div>
);

const Card = ({ title, subtitle, right, children, compact = false }) => (
  <div className="rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
    {(title || right) && (
      <div className="flex flex-col gap-1 border-b border-gray-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          {title && <h3 className="text-base font-semibold text-gray-800">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
      </div>
    )}
    <div className={compact ? 'px-5 py-4' : 'px-5 py-5'}>{children}</div>
  </div>
);

const SectionTitle = ({ icon, title, description }) => (
  <div className="mb-4 flex items-center gap-2">
    <span className="text-2xl">{icon}</span>
    <div>
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>
  </div>
);

const KpiCard = ({ label, value, hint }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
    <p className="text-sm font-medium text-emerald-600">{label}</p>
    <p className="mt-2 text-2xl font-bold text-gray-800">{value}</p>
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
  </div>
);

const ChartTypeSelector = ({ value, onChange, options = ['line', 'bar', 'area'] }) => (
  <div className="flex gap-1 rounded-md bg-gray-100 p-0.5">
    {options.map(opt => (
      <button
        key={opt}
        onClick={() => onChange(opt)}
        className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
          value === opt
            ? 'bg-white text-emerald-700 shadow-sm'
            : 'text-gray-600 hover:bg-gray-200'
        }`}
      >
        {opt === 'line' ? 'Courbe' : opt === 'bar' ? 'Histogramme' : opt === 'area' ? 'Aire' : opt === 'pie' ? 'Circulaire' : opt === 'composed' ? 'Pareto' : opt}
      </button>
    ))}
  </div>
);

const PrimaryButton = ({ className = '', children, ...props }) => (
  <button
    className={`rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const SecondaryButton = ({ className = '', children, ...props }) => (
  <button
    className={`rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const EmptyBox = ({ title, description }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
    <p className="text-base font-medium text-gray-700">{title}</p>
    <p className="mt-1 text-sm text-gray-500">{description}</p>
  </div>
);

const LoadingBox = ({ label = 'Chargement...' }) => (
  <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
    <div className="text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
      <p className="mt-2 text-sm text-gray-500">{label}</p>
    </div>
  </div>
);

const ErrorBox = ({ message, onRetry }) => (
  <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
    <p className="text-sm font-medium text-red-700">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
        Réessayer
      </button>
    )}
  </div>
);

const InlineNotice = ({ tone = 'neutral', children }) => {
  const styles = {
    neutral: 'border-gray-200 bg-gray-50 text-gray-600',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
  };
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${styles[tone] || styles.neutral}`}>
      {children}
    </div>
  );
};

const ProTooltip = ({ active, payload, label, suffix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[200px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <p className="text-xs font-semibold text-gray-800">{label}</p>
      <div className="mt-2 space-y-1">
        {payload.map((item) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-gray-600">{item.name}</span>
            </div>
            <span className="font-semibold text-gray-800">
              {item.name === 'Cumul %' 
                ? `${Math.round(item.value)}%` 
                : `${formatMoney(item.value)} DT`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ========== DATA HELPERS ==========
const buildClientTypeData = (repartition = {}) =>
  Object.entries(repartition).map(([name, value]) => ({
    name: name === 'PARTICULIER' ? 'Particulier' : name === 'PROFESSIONNEL' ? 'Professionnel' : name === 'ENTREPRISE' ? 'Entreprise' : name === 'FIDELE' ? 'Fidèle' : name,
    clients: Number(value?.nombre || 0),
    ca: Number(value?.ca || 0),
  }));

const pickFirst = (obj, keys, fallback = null) => {
  if (!obj) return fallback;
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== '') return obj[key];
  }
  return fallback;
};

const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const avg = (arr) => (arr.length ? sum(arr) / arr.length : 0);

const buildTimeSeries = (items = []) => {
  const dateKeys = ['date', 'createdAt', 'created_at'];
  const amountKeys = ['montant', 'amount', 'total', 'totalAmount'];
  // Expanded list of possible responsable field names
  const responsableKeys = [
    'responsable', 'responsableName', 'responsable_name',
    'vendeur', 'seller', 'agent',
    'created_by', 'createdBy', 'createur', 'user',
    'createdByUser', 'createdByUserName', 'creator',
    'client' // fallback: use client name if nothing else (will be visible but not ideal)
  ];
  const byDay = new Map();
  for (const row of items) {
    const rawDate = pickFirst(row, dateKeys, null);
    const day = rawDate ? formatDayLabel(rawDate) : 'N/A';
    const amount = Number(pickFirst(row, amountKeys, 0)) || 0;
    let responsable = pickFirst(row, responsableKeys, null);
    // If responsable is an object (like client object), try to extract name
    if (responsable && typeof responsable === 'object') {
      responsable = responsable.nom || responsable.name || responsable.email || 'Client';
    }
    if (!byDay.has(day)) byDay.set(day, { name: day, Total: 0 });
    const entry = byDay.get(day);
    entry.Total += amount;
    if (responsable) entry[responsable] = (Number(entry[responsable]) || 0) + amount;
  }
  return Array.from(byDay.values()).sort((a, b) => String(a.name).localeCompare(String(b.name)));
};

const getLineKeys = (data = []) => {
  const keys = new Set();
  data.forEach((row) => Object.keys(row).forEach((key) => key !== 'name' && keys.add(key)));
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
  const responsableKeys = [
    'responsable', 'responsableName', 'responsable_name',
    'vendeur', 'seller', 'agent',
    'created_by', 'createdBy', 'createur', 'user',
    'createdByUser', 'createdByUserName', 'creator',
    'client'
  ];
  const totals = new Map();
  let grandTotal = 0;
  for (const row of items) {
    const amount = Number(pickFirst(row, amountKeys, 0)) || 0;
    let responsable = pickFirst(row, responsableKeys, null);
    if (responsable && typeof responsable === 'object') {
      responsable = responsable.nom || responsable.name || responsable.email || 'Client';
    }
    if (responsable) {
      totals.set(responsable, (totals.get(responsable) || 0) + amount);
    } else {
      grandTotal += amount;
    }
  }
  if (totals.size > 0) {
    return Array.from(totals.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }
  // If there are items but no responsable, return a special marker
  if (items.length > 0) {
    return [{ name: '⚠️ Aucun responsable renseigné', total: grandTotal, missingData: true }];
  }
  return [];
};

const getSupplierName = (commande) =>
  commande?.fournisseur?.nomFournisseur || commande?.fournisseur?.nom || 'Fournisseur inconnu';

const getPurchaseStatusLabel = (status) => {
  const labels = {
    BROUILLON: 'Brouillon',
    VALIDEE: 'Validee',
    ENVOYEE: 'Envoyee',
    RECUE: 'Recue',
    ANNULEE: 'Annulee',
    REJETEE: 'Rejetee',
    FACTUREE: 'Facturee',
  };
  return labels[status] || status || 'Inconnu';
};

const buildPurchaseSeries = (commandes = []) => {
  if (!commandes.length) return [];
  const timestamps = commandes
    .map((c) => new Date(c.dateCommande).getTime())
    .filter((v) => Number.isFinite(v));
  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);
  const diffDays = Number.isFinite(min) && Number.isFinite(max) ? Math.ceil((max - min) / 86400000) : 0;
  const byMonth = diffDays > 45;
  const grouped = new Map();
  commandes.forEach((c) => {
    const date = new Date(c.dateCommande);
    const key = byMonth
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      : String(c.dateCommande || '').slice(0, 10);
    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        name: byMonth
          ? date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
          : formatDayLabel(c.dateCommande),
        totalTTC: 0,
        totalHT: 0,
        commandes: 0,
      });
    }
    const entry = grouped.get(key);
    entry.totalTTC += Number(c.totalTTC || 0);
    entry.totalHT += Number(c.totalHT || 0);
    entry.commandes += 1;
  });
  return Array.from(grouped.values()).sort((a, b) => a.key.localeCompare(b.key));
};

const buildPurchaseSupplierData = (commandes = []) =>
  Array.from(
    commandes.reduce((map, c) => {
      const name = getSupplierName(c);
      if (!map.has(name)) map.set(name, { name, montant: 0, commandes: 0, totalHT: 0 });
      const entry = map.get(name);
      entry.montant += Number(c.totalTTC || 0);
      entry.totalHT += Number(c.totalHT || 0);
      entry.commandes += 1;
      return map;
    }, new Map()).values()
  ).sort((a, b) => b.montant - a.montant);

const buildPurchaseStatusData = (commandes = []) =>
  Array.from(
    commandes.reduce((map, c) => {
      const status = c.statut || 'INCONNU';
      if (!map.has(status)) map.set(status, { name: status, label: getPurchaseStatusLabel(status), montant: 0, commandes: 0 });
      const entry = map.get(status);
      entry.montant += Number(c.totalTTC || 0);
      entry.commandes += 1;
      return map;
    }, new Map()).values()
  ).sort((a, b) => b.montant - a.montant);

const buildPurchaseBudgetComparison = (series = []) =>
  series.map((item, idx, arr) => {
    const prev = arr[idx - 1]?.totalTTC || item.totalTTC;
    const budget = Math.round(prev * 1.05);
    return { name: item.name, reel: Number(item.totalTTC || 0), budget };
  });

const buildSupplierPareto = (suppliers = []) => {
  const sorted = [...suppliers].sort((a, b) => b.montant - a.montant);
  const total = sorted.reduce((s, item) => s + Number(item.montant || 0), 0);
  let cumulative = 0;
  return sorted.map((item) => {
    cumulative += Number(item.montant || 0);
    return { ...item, cumulativePercent: total ? (cumulative / total) * 100 : 0 };
  });
};

const buildClientValueCurve = (topClients = []) => {
  const sorted = [...topClients].sort((a, b) => Number(b.ca ?? b.totalCA ?? 0) - Number(a.ca ?? a.totalCA ?? 0));
  const total = sorted.reduce((acc, client) => acc + Number(client.ca ?? client.totalCA ?? 0), 0);
  let cumulative = 0;
  return sorted.map((client, idx) => {
    const ca = Number(client.ca ?? client.totalCA ?? 0);
    cumulative += ca;
    return {
      name: client.nom ?? client.name ?? `Client ${idx + 1}`,
      ca,
      cumulativePercent: total ? (cumulative / total) * 100 : 0,
    };
  });
};

// ========== MAIN COMPONENT ==========
const Statistiques = () => {
  const [dateFromDraft, setDateFromDraft] = useState('');
  const [dateToDraft, setDateToDraft] = useState('');
  const [filterHint, setFilterHint] = useState('');
  const [activeFilters, setActiveFilters] = useState({ startDate: undefined, endDate: undefined });
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);

  // Chart type states
  const [salesChartType, setSalesChartType] = useState('area');
  const [responsableChartType, setResponsableChartType] = useState('bar');
  const [purchaseEvolutionType, setPurchaseEvolutionType] = useState('area');
  const [purchaseSupplierType, setPurchaseSupplierType] = useState('bar');
  const [budgetChartType, setBudgetChartType] = useState('bar');
  const [paretoChartType, setParetoChartType] = useState('composed');

  const sales = useReports('sales', {});
  const clients = useReports('clients', {});

  const loadPurchaseOrders = useCallback(async () => {
    try {
      setPurchaseLoading(true);
      setPurchaseError(null);
      const data = await commandeFournisseurService.getAllCommandes();
      setPurchaseOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement commandes fournisseurs:', error);
      setPurchaseError(error.response?.data?.message || error.message || 'Impossible de charger les commandes fournisseurs.');
      setPurchaseOrders([]);
    } finally {
      setPurchaseLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPurchaseOrders();
  }, [loadPurchaseOrders]);

  const salesItems = sales.data?.ventes || [];
  const salesSeries = useMemo(() => buildTimeSeries(salesItems), [salesItems]);
  const seriesKeys = useMemo(() => getLineKeys(salesSeries), [salesSeries]);
  const comparison = useMemo(() => buildComparison(salesItems), [salesItems]);
  const totalsForAvg = useMemo(() => salesSeries.map((item) => Number(item.Total) || 0), [salesSeries]);
  const salesAverage = useMemo(() => avg(totalsForAvg), [totalsForAvg]);

  const topClients = clients.data?.topClients || [];
  const clientTypeData = useMemo(() => buildClientTypeData(clients.data?.repartitionParType || {}), [clients.data]);
  const clientSummary = clients.data?.summary || {};
  const clientActivationRate = Number(clientSummary.totalClients) > 0
    ? (Number(clientSummary.clientsActifs) / Number(clientSummary.totalClients)) * 100
    : 0;

  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter((c) => {
      const date = String(c.dateCommande || '').slice(0, 10);
      if (activeFilters.startDate && date < activeFilters.startDate) return false;
      if (activeFilters.endDate && date > activeFilters.endDate) return false;
      return true;
    });
  }, [purchaseOrders, activeFilters]);

  const purchaseSeries = useMemo(() => buildPurchaseSeries(filteredPurchaseOrders), [filteredPurchaseOrders]);
  const purchaseSupplierData = useMemo(() => buildPurchaseSupplierData(filteredPurchaseOrders), [filteredPurchaseOrders]);
  const purchaseStatusData = useMemo(() => buildPurchaseStatusData(filteredPurchaseOrders), [filteredPurchaseOrders]);
  const purchaseHasData = filteredPurchaseOrders.length > 0;
  const purchaseAverage = useMemo(() => {
    if (!filteredPurchaseOrders.length) return 0;
    return filteredPurchaseOrders.reduce((s, c) => s + Number(c.totalTTC || 0), 0) / filteredPurchaseOrders.length;
  }, [filteredPurchaseOrders]);
  const purchaseTotals = useMemo(() => ({
    totalTTC: filteredPurchaseOrders.reduce((s, c) => s + Number(c.totalTTC || 0), 0),
    totalHT: filteredPurchaseOrders.reduce((s, c) => s + Number(c.totalHT || 0), 0),
    totalTVA: filteredPurchaseOrders.reduce((s, c) => s + Number(c.totalTVA || 0), 0),
    commandes: filteredPurchaseOrders.length,
    fournisseurs: new Set(filteredPurchaseOrders.map((c) => getSupplierName(c))).size,
  }), [filteredPurchaseOrders]);

  const purchaseBudgetData = useMemo(() => buildPurchaseBudgetComparison(purchaseSeries), [purchaseSeries]);
  const purchaseParetoData = useMemo(() => buildSupplierPareto(purchaseSupplierData).slice(0, 8), [purchaseSupplierData]);
  const clientValueCurve = useMemo(() => buildClientValueCurve(topClients), [topClients]);

  const setQuickDate = (preset) => {
    const today = new Date();
    let from = null, to = null;
    switch (preset) {
      case 'today':
        from = today.toISOString().slice(0, 10);
        to = from;
        break;
      case 'thisWeek': {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        const end = new Date(today);
        end.setDate(start.getDate() + 6);
        from = start.toISOString().slice(0, 10);
        to = end.toISOString().slice(0, 10);
        break;
      }
      case 'thisMonth': {
        from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
        to = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
        break;
      }
      case 'lastMonth': {
        const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const last = new Date(today.getFullYear(), today.getMonth(), 0);
        from = first.toISOString().slice(0, 10);
        to = last.toISOString().slice(0, 10);
        break;
      }
      default: return;
    }
    setDateFromDraft(from);
    setDateToDraft(to);
  };

  const clearFilters = () => {
    setDateFromDraft('');
    setDateToDraft('');
    setActiveFilters({ startDate: undefined, endDate: undefined });
    setFilterHint('');
    sales.setFilters({});
    clients.setFilters({});
  };

  const applyFilters = useCallback(() => {
    const { startDate, endDate, swapped } = sanitizeRange(dateFromDraft, dateToDraft);
    const nextFilters = { startDate, endDate };
    setFilterHint(swapped ? 'Dates inversées : correction automatique.' : '');
    setDateFromDraft(startDate || '');
    setDateToDraft(endDate || '');
    setActiveFilters(nextFilters);
    sales.setFilters(nextFilters);
    clients.setFilters(nextFilters);
  }, [dateFromDraft, dateToDraft, sales, clients]);

  const handleRefresh = useCallback(() => {
    sales.refresh();
    clients.refresh();
    loadPurchaseOrders();
  }, [sales, clients, loadPurchaseOrders]);

  const salesKpis = useMemo(() => {
    const s = sales.data?.summary || {};
    return [
      { label: 'CA total', value: `${formatMoney(s.totalCA)} DT` },
      { label: 'Nombre de ventes', value: formatMoney(s.totalCommandes) },
      { label: 'Panier moyen', value: `${formatMoney(s.panierMoyen)} DT` },
      { label: 'Taux transformation', value: formatPercent(s.tauxTransformation) },
    ];
  }, [sales.data]);

  const clientsKpis = useMemo(() => [
    { label: 'Total clients', value: formatMoney(clientSummary.totalClients) },
    { label: 'Clients actifs', value: formatMoney(clientSummary.clientsActifs) },
    { label: 'Clients inactifs', value: formatMoney(clientSummary.clientsInactifs) },
    { label: "Taux d'activation", value: formatPercent(clientActivationRate), hint: 'Calculé à partir du rapport clients' },
  ], [clientSummary, clientActivationRate]);

  const purchasesKpis = useMemo(() => [
    { label: 'Montant TTC', value: `${formatMoney(purchaseTotals.totalTTC)} DT`, hint: purchaseTotals.commandes ? `${formatMoney(purchaseTotals.commandes)} commandes` : 'Aucune commande' },
    { label: 'Montant HT', value: `${formatMoney(purchaseTotals.totalHT)} DT`, hint: `${formatMoney(purchaseTotals.totalTVA)} DT de TVA` },
    { label: 'Panier moyen', value: `${formatMoney(purchaseAverage)} DT`, hint: 'Moyenne par commande fournisseur' },
    { label: 'Fournisseurs actifs', value: formatMoney(purchaseTotals.fournisseurs), hint: 'Selon les commandes retournées' },
  ], [purchaseTotals, purchaseAverage]);

  // ---------- RENDER CHARTS ----------
  const renderSalesCharts = () => {
    if (sales.loading && !sales.data) return <LoadingBox label="Chargement des ventes..." />;
    if (sales.error) return <ErrorBox message={sales.error} onRetry={handleRefresh} />;
    if (!salesItems.length) return <EmptyBox title="Aucune vente" description="Élargissez la période pour voir les données." />;

    // DEBUG: Log the first sale to see available fields
    console.log('🔍 First sale object:', salesItems[0]);
    console.log('🔍 Available keys in sales API:', Object.keys(salesItems[0]));

    const hasMissingResponsableData = comparison.length === 1 && comparison[0]?.missingData === true;

    return (
      <>
        <Card
          title="Évolution du chiffre d'affaires"
          subtitle="Tendance journalière"
          right={<ChartTypeSelector value={salesChartType} onChange={setSalesChartType} options={['area','line','bar']} />}
        >
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              {salesChartType === 'area' && (
                <AreaChart data={salesSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs><linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => formatMoney(v)} tick={{ fontSize: 12 }} />
                  <Tooltip content={<ProTooltip suffix="DT" />} />
                  <Legend />
                  {salesAverage > 0 && <ReferenceLine y={salesAverage} stroke="#94a3b8" strokeDasharray="5 5" label={{ value: `Moyenne: ${formatMoney(salesAverage)} DT`, position: 'insideTopRight', fontSize: 11 }} />}
                  <Area type="monotone" dataKey="Total" name="CA Total" stroke="#059669" strokeWidth={2} fill="url(#totalFill)" />
                  <Line type="monotone" dataKey="Total" name="Tendance" stroke="#059669" strokeWidth={1.5} dot={false} />
                  {seriesKeys.filter(k => k !== 'Total').slice(0,3).map((k, idx) => (
                    <Line key={k} type="monotone" dataKey={k} name={k} stroke={COLORS[(idx+2)%COLORS.length]} strokeWidth={1.2} dot={false} />
                  ))}
                  <Brush dataKey="name" height={24} />
                </AreaChart>
              )}
              {salesChartType === 'line' && (
                <LineChart data={salesSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => formatMoney(v)} tick={{ fontSize: 12 }} />
                  <Tooltip content={<ProTooltip suffix="DT" />} />
                  <Legend />
                  <Line type="monotone" dataKey="Total" name="CA Total" stroke="#059669" strokeWidth={2.5} dot={{ r: 2 }} />
                  <Brush dataKey="name" height={24} />
                </LineChart>
              )}
              {salesChartType === 'bar' && (
                <BarChart data={salesSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => formatMoney(v)} tick={{ fontSize: 12 }} />
                  <Tooltip content={<ProTooltip suffix="DT" />} />
                  <Legend />
                  <Bar dataKey="Total" name="CA Total" fill="#059669" radius={[6,6,0,0]} />
                  <Brush dataKey="name" height={24} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title="Performance par responsable"
          subtitle="Chiffre d'affaires par vendeur"
          right={<ChartTypeSelector value={responsableChartType} onChange={setResponsableChartType} options={['bar','line','pie']} />}
        >
          {hasMissingResponsableData ? (
            <div className="py-8 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-800">Données responsables manquantes</h4>
              <p className="mt-2 max-w-md mx-auto text-sm text-gray-600">
                L'API `/api/reports/sales` ne retourne aucun champ correspondant au responsable (vendeur, created_by, etc.).
              </p>
              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-left text-xs font-mono">
                <p className="font-semibold">Champs actuellement disponibles dans votre API :</p>
                <pre className="mt-1 overflow-x-auto text-gray-700">
                  {salesItems[0] ? JSON.stringify(Object.keys(salesItems[0]), null, 2) : 'Aucune donnée'}
                </pre>
                <p className="mt-2 text-amber-600">
                  Aucun de ces champs ne correspond à 'created_by', 'responsable', 'vendeur' ou 'agent'.
                </p>
              </div>
              <div className="mt-4 rounded-lg bg-blue-50 p-3 text-left text-xs">
                <p className="font-semibold">Solution :</p>
                <ol className="mt-1 list-decimal list-inside space-y-1 text-gray-700">
                  <li>Dans <code className="bg-gray-200 px-1 rounded">ReportService.java</code>, modifiez <code className="bg-gray-200 px-1 rounded">mapCommandeToDTO</code> pour ajouter :<br />
                    <code className="bg-gray-200 px-1 rounded">map.put("created_by", commande.getCreatedBy());</code>
                  </li>
                  <li>Redémarrez le backend Spring Boot.</li>
                  <li>Rafraîchissez cette page.</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                {responsableChartType === 'bar' && (
                  <BarChart data={comparison} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-25} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => formatMoney(v)} tick={{ fontSize: 12 }} />
                    <Tooltip content={<ProTooltip suffix="DT" />} />
                    <Bar dataKey="total" name="CA" fill="#059669" radius={[6,6,0,0]}>
                      <LabelList dataKey="total" position="top" formatter={(v) => `${formatMoney(v)} DT`} style={{ fontSize: 11, fill: '#059669' }} />
                    </Bar>
                  </BarChart>
                )}
                {responsableChartType === 'line' && (
                  <LineChart data={comparison} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-25} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => formatMoney(v)} tick={{ fontSize: 12 }} />
                    <Tooltip content={<ProTooltip suffix="DT" />} />
                    <Line type="monotone" dataKey="total" name="CA" stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                )}
                {responsableChartType === 'pie' && (
                  <PieChart>
                    <Pie data={comparison} dataKey="total" nameKey="name" innerRadius={60} outerRadius={100} label={(entry) => entry.name}>
                      {comparison.map((e, idx) => <Cell key={e.name} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${formatMoney(v)} DT`} />
                    <Legend />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </>
    );
  };

  const renderClientsCharts = () => {
    if (clients.loading && !clients.data) return <LoadingBox label="Chargement des clients..." />;
    if (clients.error) return <ErrorBox message={clients.error} onRetry={handleRefresh} />;
    const hasData = topClients.length > 0 || clientTypeData.length > 0 || clientSummary.totalClients;
    if (!hasData) return <EmptyBox title="Aucune donnée client" description="Le rapport clients n'a pas retourné de données." />;

    return (
      <>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Top clients" subtitle="Classement par chiffre d'affaires">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr><th className="px-4 py-2 text-left">Client</th><th className="px-4 py-2 text-left">Type</th><th className="px-4 py-2 text-left">Commandes</th><th className="px-4 py-2 text-left">CA</th></tr>
                </thead>
                <tbody>
                  {topClients.map((c, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{c.nom ?? c.name ?? 'Client'}</td>
                      <td className="px-4 py-2">{c.type ?? 'N/A'}</td>
                      <td className="px-4 py-2">{formatMoney(c.commandes ?? c.orders ?? 0)}</td>
                      <td className="px-4 py-2 font-semibold text-emerald-600">{formatMoney(c.ca ?? c.totalCA ?? 0)} DT</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="Répartition par type" subtitle="Nombre de clients par catégorie">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientTypeData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="clients" name="Clients" fill="#10b981" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-2 mt-6">
          <Card title="Segmentation clients" subtitle="Répartition par type de client (base de données)">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={clientTypeData} dataKey="clients" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                    {clientTypeData.map((entry, idx) => (
                      <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${formatMoney(value)} clients`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card 
            title="Courbe de valeur cumulée" 
            subtitle="Concentration du CA client (Pareto) – Barres = CA individuel, Ligne = % cumulé"
          >
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={clientValueCurve.slice(0,10)} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70} 
                    tick={{ fontSize: 10 }}
                    interval={0}
                  />
                  <YAxis 
                    yAxisId="left" 
                    tickFormatter={(v) => formatMoney(v)} 
                    tick={{ fontSize: 11 }}
                    label={{ value: 'CA (DT)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11, fill: '#4b5563' } }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    domain={[0, 100]} 
                    tickFormatter={(v) => `${Math.round(v)}%`}
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Cumul %', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: 11, fill: '#4b5563' } }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const barData = payload.find(p => p.dataKey === 'ca');
                      const lineData = payload.find(p => p.dataKey === 'cumulativePercent');
                      return (
                        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                          <p className="text-sm font-semibold text-gray-800">{label}</p>
                          <div className="mt-2 space-y-1 text-xs">
                            <div className="flex justify-between gap-4">
                              <span className="text-gray-600">CA individuel :</span>
                              <span className="font-semibold">{formatMoney(barData?.value)} DT</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-gray-600">Cumul :</span>
                              <span className="font-semibold">{Math.round(lineData?.value || 0)}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar yAxisId="left" dataKey="ca" name="CA client" fill="#0ea5e9" radius={[4,4,0,0]} />
                  <Line yAxisId="right" type="monotone" dataKey="cumulativePercent" name="Cumul %" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                  <ReferenceLine yAxisId="right" y={80} stroke="#dc2626" strokeDasharray="4 4" label={{ value: '80%', position: 'right', fill: '#dc2626', fontSize: 10 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <Card title="Synthèse clientèle" subtitle="Récapitulatif par type" compact>
          <div className="grid gap-4 md:grid-cols-3">
            {clientTypeData.map((item, idx) => (
              <div key={item.name} className="rounded-lg border bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-700">{item.name}</p>
                <p className="mt-2 text-2xl font-bold text-gray-800">{formatMoney(item.clients)}</p>
                <p className="text-xs text-gray-500">{formatMoney(item.ca)} DT de CA</p>
              </div>
            ))}
          </div>
        </Card>
      </>
    );
  };

  const renderPurchasesCharts = () => {
    if (purchaseLoading && !purchaseOrders.length) return <LoadingBox label="Chargement des achats..." />;
    if (purchaseError) return <ErrorBox message={purchaseError} onRetry={handleRefresh} />;
    if (!purchaseHasData) return <EmptyBox title="Aucune commande fournisseur" description="Aucune donnée pour la période sélectionnée." />;

    return (
      <>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card
            title="Évolution des achats"
            subtitle="Montants TTC"
            right={<ChartTypeSelector value={purchaseEvolutionType} onChange={setPurchaseEvolutionType} options={['area','line','bar']} />}
          >
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                {purchaseEvolutionType === 'area' && (
                  <AreaChart data={purchaseSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs><linearGradient id="purchaseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => formatMoney(v)} />
                    <Tooltip content={<ProTooltip suffix="DT" />} />
                    <Legend />
                    <Area type="monotone" dataKey="totalTTC" name="Montant TTC" stroke="#2563eb" strokeWidth={2} fill="url(#purchaseFill)" />
                  </AreaChart>
                )}
                {purchaseEvolutionType === 'line' && (
                  <LineChart data={purchaseSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => formatMoney(v)} />
                    <Tooltip content={<ProTooltip suffix="DT" />} />
                    <Legend />
                    <Line type="monotone" dataKey="totalTTC" name="Montant TTC" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 2 }} />
                  </LineChart>
                )}
                {purchaseEvolutionType === 'bar' && (
                  <BarChart data={purchaseSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => formatMoney(v)} />
                    <Tooltip content={<ProTooltip suffix="DT" />} />
                    <Legend />
                    <Bar dataKey="totalTTC" name="Montant TTC" fill="#2563eb" radius={[6,6,0,0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </Card>
          <Card
            title="Top fournisseurs"
            subtitle="Montant TTC"
            right={<ChartTypeSelector value={purchaseSupplierType} onChange={setPurchaseSupplierType} options={['bar','line','pie']} />}
          >
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                {purchaseSupplierType === 'bar' && (
                  <BarChart data={purchaseSupplierData.slice(0,6)} layout="vertical" margin={{ top: 5, right: 10, left: 30, bottom: 5 }}>
                    <XAxis type="number" tickFormatter={(v) => formatMoney(v)} />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip content={<ProTooltip suffix="DT" />} />
                    <Bar dataKey="montant" name="Montant TTC" fill="#10b981" radius={[0,6,6,0]} />
                  </BarChart>
                )}
                {purchaseSupplierType === 'line' && (
                  <LineChart data={purchaseSupplierData.slice(0,6)} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
                    <XAxis dataKey="name" angle={-25} textAnchor="end" height={70} />
                    <YAxis tickFormatter={(v) => formatMoney(v)} />
                    <Tooltip content={<ProTooltip suffix="DT" />} />
                    <Line type="monotone" dataKey="montant" name="Montant TTC" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                )}
                {purchaseSupplierType === 'pie' && (
                  <PieChart>
                    <Pie data={purchaseSupplierData.slice(0,6)} dataKey="montant" nameKey="name" innerRadius={50} outerRadius={90} label={(e) => e.name}>
                      {purchaseSupplierData.slice(0,6).map((e, idx) => <Cell key={e.name} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${formatMoney(v)} DT`} />
                    <Legend />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-2 mt-6">
          <Card title="Montants par statut" subtitle="Répartition par statut de commande">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={purchaseStatusData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(v) => formatMoney(v)} />
                  <Tooltip content={<ProTooltip suffix="DT" />} />
                  <Legend />
                  <Bar dataKey="montant" name="Montant TTC" fill="#f59e0b" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card title="Détail fournisseurs" subtitle="Classement complet" compact>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Fournisseur</th>
                    <th className="px-3 py-2 text-left">Commandes</th>
                    <th className="px-3 py-2 text-left">HT</th>
                    <th className="px-3 py-2 text-left">TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseSupplierData.slice(0,8).map((s) => (
                    <tr key={s.name} className="border-b">
                      <td className="px-3 py-2 font-medium">{s.name}</td>
                      <td className="px-3 py-2">{formatMoney(s.commandes)}</td>
                      <td className="px-3 py-2">{formatMoney(s.totalHT)} DT</td>
                      <td className="px-3 py-2 font-semibold text-emerald-600">{formatMoney(s.montant)} DT</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-2 mt-6">
          <Card
            title="Budget vs Réel"
            subtitle="Comparaison mensuelle"
            right={<ChartTypeSelector value={budgetChartType} onChange={setBudgetChartType} options={['bar','line']} />}
          >
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                {budgetChartType === 'bar' && (
                  <BarChart data={purchaseBudgetData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => formatMoney(v)} />
                    <Tooltip content={<ProTooltip suffix="DT" />} />
                    <Legend />
                    <Bar dataKey="budget" name="Budget" fill="#cbd5e1" radius={[4,4,0,0]} />
                    <Bar dataKey="reel" name="Réel" fill="#0f766e" radius={[4,4,0,0]} />
                  </BarChart>
                )}
                {budgetChartType === 'line' && (
                  <LineChart data={purchaseBudgetData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => formatMoney(v)} />
                    <Tooltip content={<ProTooltip suffix="DT" />} />
                    <Legend />
                    <Line type="monotone" dataKey="budget" name="Budget" stroke="#cbd5e1" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="reel" name="Réel" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </Card>
          <Card
            title="Pareto fournisseurs"
            subtitle="Concentration des dépenses"
            right={<ChartTypeSelector value={paretoChartType} onChange={setParetoChartType} options={['composed','bar','line']} />}
          >
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                {paretoChartType === 'composed' && (
                  <ComposedChart data={purchaseParetoData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" hide />
                    <YAxis yAxisId="left" tickFormatter={(v) => formatMoney(v)} />
                    <YAxis yAxisId="right" orientation="right" domain={[0,100]} tickFormatter={(v) => `${Math.round(v)}%`} />
                    <Tooltip content={<ProTooltip suffix="DT" />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="montant" name="Montant TTC" fill="#14b8a6" radius={[4,4,0,0]} />
                    <Line yAxisId="right" type="monotone" dataKey="cumulativePercent" name="Cumul %" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                    <ReferenceLine yAxisId="right" y={80} stroke="#dc2626" strokeDasharray="4 4" />
                  </ComposedChart>
                )}
                {paretoChartType === 'bar' && (
                  <BarChart data={purchaseParetoData} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-25} textAnchor="end" height={70} />
                    <YAxis tickFormatter={(v) => formatMoney(v)} />
                    <Tooltip content={<ProTooltip suffix="DT" />} />
                    <Legend />
                    <Bar dataKey="montant" name="Montant TTC" fill="#14b8a6" radius={[6,6,0,0]} />
                  </BarChart>
                )}
                {paretoChartType === 'line' && (
                  <LineChart data={purchaseParetoData} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-25} textAnchor="end" height={70} />
                    <YAxis tickFormatter={(v) => formatMoney(v)} />
                    <Tooltip content={<ProTooltip suffix="DT" />} />
                    <Legend />
                    <Line type="monotone" dataKey="montant" name="Montant TTC" stroke="#14b8a6" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </>
    );
  };

  // ---------- MAIN LAYOUT ----------
  const filterNotice = (activeFilters.startDate || activeFilters.endDate)
    ? 'Les filtres sont appliqués aux sections Ventes, Achats et Clients.'
    : '';

  return (
    <Shell>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
        <p className="text-gray-500">Synthèse des ventes, achats et clients</p>
      </div>

      {/* Filter Card */}
      <Card title="Filtrer par période" subtitle="Sélectionnez une plage de dates">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-44">
            <label className="mb-1 block text-xs font-medium text-emerald-600">Date début</label>
            <input type="date" value={dateFromDraft} onChange={(e) => setDateFromDraft(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="w-44">
            <label className="mb-1 block text-xs font-medium text-emerald-600">Date fin</label>
            <input type="date" value={dateToDraft} onChange={(e) => setDateToDraft(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setQuickDate('today')}>Aujourd'hui</SecondaryButton>
            <SecondaryButton onClick={() => setQuickDate('thisWeek')}>Cette semaine</SecondaryButton>
            <SecondaryButton onClick={() => setQuickDate('thisMonth')}>Ce mois</SecondaryButton>
            <SecondaryButton onClick={() => setQuickDate('lastMonth')}>Mois dernier</SecondaryButton>
            <SecondaryButton onClick={clearFilters}>Effacer</SecondaryButton>
          </div>
          <PrimaryButton onClick={applyFilters} disabled={sales.loading || clients.loading || purchaseLoading}>
            Appliquer
          </PrimaryButton>
          <PrimaryButton onClick={handleRefresh} className="bg-gray-600 hover:bg-gray-700">
            Actualiser
          </PrimaryButton>
        </div>
        {filterHint && <div className="mt-2 text-sm text-amber-600">{filterHint}</div>}
        {filterNotice && <div className="mt-3"><InlineNotice tone="warning">{filterNotice}</InlineNotice></div>}
      </Card>

      {/* Ventes Section */}
      <div className="mt-10">
        <SectionTitle icon="📊" title="Ventes" description="Chiffre d'affaires et performance commerciale" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {salesKpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
        </div>
        {renderSalesCharts()}
      </div>

      {/* Achats Section */}
      <div className="mt-12">
        <SectionTitle icon="🛒" title="Achats" description="Commandes fournisseurs et analyse des dépenses" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {purchasesKpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
        </div>
        {renderPurchasesCharts()}
      </div>

      {/* Clients Section */}
      <div className="mt-12">
        <SectionTitle icon="👥" title="Clients" description="Analyse du portefeuille et segmentation" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {clientsKpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
        </div>
        {renderClientsCharts()}
      </div>
    </Shell>
  );
};

export default Statistiques;