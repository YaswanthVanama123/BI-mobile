import React, { useMemo, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, DateRangeFilter, Select, SearchInput, AsyncState, DataTable,
  StatGrid, StatCard, BarChartCard, LineChartCard, PieChartCard,
} from '@/components';
import { useFilters } from '@/context/FiltersContext';
import { formatCurrency, formatNumber } from '@/utils/format';
import CustomerRevenueModal from '@/features/revenue/components/CustomerRevenueModal';

const columns = [
  { key: 'customer', header: 'Customer', width: 180 },
  { key: 'routeCode', header: 'Route', width: 80 },
  { key: 'invoices', header: 'Invoices', align: 'right', width: 80, render: (r) => formatNumber(r.invoices) },
  { key: 'invoiced', header: 'Invoiced', align: 'right', width: 100, render: (r) => formatCurrency(r.invoiced) },
  { key: 'avgInvoice', header: 'Avg / inv', align: 'right', width: 90, render: (r) => formatCurrency(r.avgInvoice) },
];

export default function CustomerOverviewScreen() {
  const { range, setRange } = useFilters();
  const { from, to } = range;
  const [routeCode, setRouteCode] = useState('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);

  const opts = useApi(() => biService.driveTimeOptions(), []);
  const { data, loading, error, reload } = useApi(
    () => biService.customersOverview({ from, to, routeCode: routeCode === 'all' ? undefined : routeCode }),
    [from, to, routeCode],
  );
  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];
  const topByInvoices = (data && data.topByInvoices) || [];
  const topByRevenue = (data && data.topByRevenue) || [];
  const byRoute = (data && data.byRoute) || [];
  const months = (data && data.months) || [];
  const term = q.trim().toLowerCase();
  const filtered = useMemo(() => (term ? rows.filter((r) => `${r.customer} ${r.routeCode}`.toLowerCase().includes(term)) : rows), [rows, term]);

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Customer Overview" subtitle="How many invoices each customer created in the selected period, with revenue, routes and trend." />
      <FilterBar>
        <DateRangeFilter value={range} onChange={setRange} min={opts.data && opts.data.earliestDate} max={opts.data && opts.data.latestDate} />
        <Select label="Route" value={routeCode} onChange={setRouteCode} options={[{ value: 'all', label: 'All routes' }, ...routeCodes.map((r) => ({ value: r, label: r }))]} />
        <SearchInput label="Search customer" value={q} onChangeText={setQ} placeholder="name / route…" />
      </FilterBar>

      <AsyncState loading={loading} error={error} empty={!loading && !error && !k} onRetry={reload}>
        {k ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="Customers" value={formatNumber(k.customers)} tone="info" />
              <StatCard label="Invoices created" value={formatNumber(k.invoices)} tone="success" />
              <StatCard label="Invoiced" value={formatCurrency(k.invoiced)} tone="success" />
              <StatCard label="Avg inv / customer" value={formatNumber(k.avgInvoicesPerCustomer)} />
              <StatCard label="Avg rev / customer" value={formatCurrency(k.avgRevenuePerCustomer)} />
            </StatGrid>
            <LineChartCard title="Invoices created per month" data={months} xKey="month" lines={[{ key: 'invoices', label: 'Invoices', color: '#4F46E5' }]} />
            <BarChartCard title="Top customers by invoices" data={topByInvoices} xKey="customer" bars={[{ key: 'invoices', label: 'Invoices', color: '#4F46E5' }]} />
            <BarChartCard title="Top customers by revenue" data={topByRevenue} xKey="customer" bars={[{ key: 'invoiced', label: 'Invoiced', color: '#10B981' }]} />
            <PieChartCard title="Customers by route" data={byRoute} nameKey="routeCode" valueKey="customers" />
            <DataTable title="Customers" columns={columns} rows={filtered} onRowClick={(r) => setSelected(r)} />
          </>
        ) : null}
      </AsyncState>

      {selected ? <CustomerRevenueModal customerId={selected.customerId} customerName={selected.customer} routes={selected.routeCode ? [selected.routeCode] : undefined} range={range} onClose={() => setSelected(null)} /> : null}
    </Screen>
  );
}
