import React, { useMemo, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, DateRangeFilter, Select, SearchInput, AsyncState, DataTable,
  StatGrid, StatCard, Badge, BarChartCard,
} from '@/components';
import { useFilters } from '@/context/FiltersContext';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';
import CustomerRevenueModal from '@/features/revenue/components/CustomerRevenueModal';

const pctTone = (p) => (p == null ? 'neutral' : p >= 90 ? 'success' : p >= 50 ? 'warning' : 'danger');

const columns = [
  { key: 'customer', header: 'Customer', width: 180 },
  { key: 'routeCode', header: 'Route', width: 80 },
  { key: 'expected', header: 'Expected', align: 'right', width: 100, render: (r) => formatCurrency(r.expected) },
  { key: 'invoiced', header: 'Invoiced', align: 'right', width: 100, render: (r) => formatCurrency(r.invoiced) },
  { key: 'remaining', header: 'Remaining', align: 'right', width: 100, render: (r) => formatCurrency(r.remaining) },
  { key: 'pct', header: 'Collected', align: 'right', width: 90, render: (r) => (r.pct != null ? <Badge tone={pctTone(r.pct)}>{formatPercent(r.pct)}</Badge> : '—') },
  { key: 'invoices', header: 'Invoices', align: 'right', width: 70, render: (r) => formatNumber(r.invoices) },
];

export default function RevenueByCustomerScreen() {
  const { range, setRange } = useFilters();
  const [routeCode, setRouteCode] = useState('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const { from, to } = range;

  const opts = useApi(() => biService.driveTimeOptions(), []);
  const { data, loading, error, reload } = useApi(() => biService.revenueByCustomer({ from, to, routeCode }), [from, to, routeCode]);
  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];
  const term = q.trim().toLowerCase();
  const filtered = useMemo(() => (term ? rows.filter((r) => `${r.customer} ${r.routeCode}`.toLowerCase().includes(term)) : rows), [rows, term]);
  const topChart = rows.slice(0, 12);

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Revenue by Customer" subtitle="Expected annual vs actually invoiced vs remaining. Tap a customer for the per-item breakdown and their invoices." />
      <FilterBar>
        <DateRangeFilter value={range} onChange={setRange} min={opts.data && opts.data.earliestDate} max={opts.data && opts.data.latestDate} />
        <Select label="Route" value={routeCode} onChange={setRouteCode} options={[{ value: 'all', label: 'All routes' }, ...routeCodes.map((r) => ({ value: r, label: r }))]} />
        <SearchInput label="Search customer" value={q} onChangeText={setQ} placeholder="name / route…" />
      </FilterBar>

      <AsyncState loading={loading} error={error} empty={!loading && !error && !k} onRetry={reload}>
        {k ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="Expected (yr)" value={formatCurrency(k.expected)} tone="info" />
              <StatCard label="Invoiced" value={formatCurrency(k.invoiced)} tone="success" />
              <StatCard label="Remaining" value={formatCurrency(k.remaining)} tone={k.remaining > 0 ? 'warning' : 'success'} />
              <StatCard label="Collected" value={k.collectedPct != null ? formatPercent(k.collectedPct) : '—'} sublabel={`${formatNumber(k.customers)} customers`} tone={pctTone(k.collectedPct)} />
            </StatGrid>
            <BarChartCard title="Top 12 by invoiced" data={topChart} xKey="customer"
              bars={[{ key: 'invoiced', label: 'Invoiced', color: '#10B981' }, { key: 'remaining', label: 'Remaining', color: '#F59E0B' }]} />
            <DataTable title="Customers" columns={columns} rows={filtered} onRowClick={(r) => setSelected(r.customerId)} />
          </>
        ) : null}
      </AsyncState>

      {selected ? <CustomerRevenueModal customerId={selected} range={range} onClose={() => setSelected(null)} /> : null}
    </Screen>
  );
}
