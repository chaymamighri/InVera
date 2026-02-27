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

const COLORS = [
  '#111827',
  '#2563EB',
  '#16A34A',
  '#F59E0B',
  '#DB2777',
  '#7C3AED',
  '#DC2626',
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
  <div className="min-h-screen bg-gray-50">
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">{children}</div>
  </div>
);

const Card = ({ title, subtitle, right, children }) => (
  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
    {(title || right) && (
      <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          {title ? <h2 className="text-base font-semibold text-gray-900">{title}</h2> : null}
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
      'rounded-xl px-4 py-2 text-sm font-semibold transition',
      active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    ].join(' ')}
    {...props}
  >
    {children}
  </button>
);

const PrimaryButton = ({ className = '', ...props }) => (
  <button
    type="button"
    className={`rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

const SoftButton = ({ className = '', ...props }) => (
  <button
    type="button"
    className={`rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

const Kpi = ({ label, value, hint }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="text-xs font-medium text-gray-500">{label}</div>
    <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
    {hint ? <div className="mt-1 text-xs text-gray-500">{hint}</div> : null}
  </div>
);

const EmptyBox = ({ title, description }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
    <div className="text-base font-semibold text-gray-900">{title}</div>
    <div className="mt-1 text-sm text-gray-500">{description}</div>
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
    <div className="min-w-[260px] rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
      <div className="text-xs font-semibold text-gray-900">{label}</div>
      <div className="mt-1 text-xs text-gray-500">
        Total:{' '}
        <span className="font-semibold text-gray-900">
          {formatMoney(total)} {suffix}
        </span>
      </div>

      {top.length > 0 && (
        <div className="mt-2 space-y-1">
          {top.map((r) => (
            <div key={r.name} className="flex items-center justify-between gap-6 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                <span className="text-gray-700">{r.name}</span>
              </div>
              <span className="font-semibold text-gray-900">
                {formatMoney(r.value)} {suffix}
              </span>
            </div>
          ))}
          {rows.filter((r) => r.name !== 'Total').length > 5 && (
            <div className="pt-1 text-[11px] text-gray-500">+ autres responsables…</div>
          )}
        </div>
      )}
    </div>
  );
};

/* ================= PAGE ================= */

const Statistiques = () => {
  const [tab, setTab] = useState('sales'); // sales | purchases | clients

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
      // If you still get "11 commandes" always, it's backend pagination.
      // Uncomment ONE that matches your API:
      // limit: 1000,
      // page: 0,
      // size: 1000,
    };

    sales.setFilters(common);
    clients.setFilters(common);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        { label: 'Taux transformation', value: `${formatMoney(summary.tauxTransformation ?? 0)}%`, hint: 'Si fourni' },
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
      { label: 'Achats', value: '—', hint: 'À venir (prochain sprint)' },
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
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filters.startDate || filters.endDate ? (
              <>
                Dates: <span className="font-semibold text-gray-800">{filters.startDate ?? '—'}</span> →{' '}
                <span className="font-semibold text-gray-800">{filters.endDate ?? '—'}</span>
              </>
            ) : (
              <>Choisissez une plage de dates pour filtrer.</>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SoftButton onClick={handleRefresh} disabled={loading}>
            Rafraîchir
          </SoftButton>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
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

      {/* Filters (calendar only) */}
      <Card title="Filtrer par dates" subtitle="Sélectionnez une date début et une date fin, puis cliquez sur Appliquer.">
        <div className="grid gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-4">
            <label className="text-xs font-medium text-gray-600">Date début</label>
            <input
              type="date"
              value={dateFromDraft}
              onChange={(e) => setDateFromDraft(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div className="md:col-span-4">
            <label className="text-xs font-medium text-gray-600">Date fin</label>
            <input
              type="date"
              value={dateToDraft}
              onChange={(e) => setDateToDraft(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div className="md:col-span-4 md:flex md:justify-end">
            <PrimaryButton onClick={applyFilters} disabled={loading}>
              Appliquer
            </PrimaryButton>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {loading ? (
            <span className="text-sm text-gray-500">Chargement…</span>
          ) : error ? (
            <span className="text-sm text-red-600">{error}</span>
          ) : (
            <span className="text-sm text-emerald-700">OK</span>
          )}
          {filterHint ? <span className="text-sm text-amber-700">• {filterHint}</span> : null}
        </div>
      </Card>

      {/* KPIs */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Kpi key={k.label} label={k.label} value={k.value} hint={k.hint} />
        ))}
      </div>

      {/* ====== REQUESTED LAYOUT: EVOLUTION CA then below comparison ====== */}
      <div className="mt-5 space-y-4">
        {/* Evolution CA */}
        <Card
          title={tab === 'sales' ? 'Graphe évolution CA' : tab === 'clients' ? 'Top clients' : 'Achats'}
          subtitle={
            tab === 'sales'
              ? 'Area + Line, avec moyenne et zoom (Brush).'
              : tab === 'clients'
              ? 'Liste des meilleurs clients (si disponible).'
              : 'À venir (prochain sprint).'
          }
        >
          {!hasData && tab !== 'purchases' ? (
            <EmptyBox title="Aucune donnée" description="Essayez une autre plage de dates." />
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
                <tbody className="divide-y divide-gray-100">
                  {(topClients || []).map((c, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-2 font-medium text-gray-900">{c.nom ?? c.name ?? '—'}</td>
                      <td className="py-2 text-gray-700">{c.type ?? '—'}</td>
                      <td className="py-2 text-gray-700">{c.commandes ?? c.orders ?? 0}</td>
                      <td className="py-2 font-semibold text-gray-900">
                        {formatMoney(c.ca ?? c.totalCA ?? 0)} DT
                      </td>
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
          ) : tab === 'purchases' ? (
            <EmptyBox title="Achats" description="À venir (prochain sprint)." />
          ) : (
            <div className="h-[560px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries} margin={{ top: 16, right: 18, left: 8, bottom: 24 }}>
                  <defs>
                    <linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS[1]} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={COLORS[1]} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickMargin={10} />
                  <YAxis tickFormatter={(v) => formatMoney(v)} width={80} />
                  <Tooltip content={<ProTooltip suffix="DT" />} />
                  <Legend verticalAlign="top" height={34} />

                  {Number.isFinite(avgTotal) && avgTotal > 0 && (
                    <ReferenceLine
                      y={avgTotal}
                      stroke="#9CA3AF"
                      strokeDasharray="6 6"
                      label={{
                        value: `Moyenne: ${formatMoney(avgTotal)} DT`,
                        position: 'insideTopRight',
                        fill: '#6B7280',
                        fontSize: 12,
                      }}
                    />
                  )}

                  <Area
                    type="monotone"
                    dataKey="Total"
                    name="Total"
                    stroke={COLORS[1]}
                    strokeWidth={3}
                    fill="url(#totalFill)"
                    activeDot={{ r: 6 }}
                    dot={{ r: 2 }}
                  />
                  <Line type="monotone" dataKey="Total" name="Total" stroke={COLORS[1]} strokeWidth={2} dot={false} />

                  {/* Optional: show up to 3 responsables to avoid clutter */}
                  {(() => {
                    const extra = seriesKeys.filter((k) => k !== 'Total').slice(0, 3);
                    return extra.map((k, idx) => (
                      <Line
                        key={k}
                        type="monotone"
                        dataKey={k}
                        name={k}
                        stroke={COLORS[(idx + 2) % COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        opacity={0.9}
                      />
                    ));
                  })()}

                  <Brush dataKey="name" height={26} travellerWidth={10} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Comparison BELOW */}
        <Card
          title={tab === 'sales' ? 'Graphe de comparaison entre les responsables' : tab === 'clients' ? 'Résumé clients' : 'Achats'}
          subtitle={
            tab === 'sales'
              ? 'Barres verticales (triées), avec valeurs visibles.'
              : tab === 'clients'
              ? 'Indicateurs clés.'
              : 'À venir (prochain sprint).'
          }
        >
          {tab === 'clients' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs text-gray-500">Total clients</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">
                  {formatMoney(clients.data?.summary?.totalClients ?? 0)}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs text-gray-500">Clients actifs</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">
                  {formatMoney(clients.data?.summary?.clientsActifs ?? 0)}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:col-span-2">
                <div className="text-xs text-gray-500">CA total</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">
                  {formatMoney(clients.data?.summary?.caTotal ?? 0)} DT
                </div>
              </div>
            </div>
          ) : tab === 'purchases' ? (
            <EmptyBox title="Achats" description="À venir (prochain sprint)." />
          ) : comparison.length === 0 ? (
            <EmptyBox title="Indisponible" description="Le backend ne renvoie peut-être pas le champ responsable." />
          ) : (
            <div className="h-[520px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparison} margin={{ top: 16, right: 18, left: 8, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={80}
                    tickMargin={10}
                  />
                  <YAxis tickFormatter={(v) => formatMoney(v)} width={80} />
                  <Tooltip content={<ProTooltip suffix="DT" />} />
                  <Bar dataKey="total" name="Total" fill={COLORS[1]} radius={[10, 10, 0, 0]}>
                    <LabelList
                      dataKey="total"
                      position="top"
                      formatter={(v) => `${formatMoney(v)} DT`}
                      style={{ fill: '#111827', fontWeight: 600, fontSize: 12 }}
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