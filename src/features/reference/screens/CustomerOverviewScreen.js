import React, { useMemo, useState } from 'react';
import useApi from '@/hooks/useApi';
import useDebounce from '@/hooks/useDebounce';
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
const newCustomerColumns = [
  { key: 'customer', header: 'Customer', width: 180 },
  { key: 'routeCode', header: 'Route', width: 80 },
  { key: 'accountNumber', header: 'Account #', width: 120, render: (r) => r.accountNumber || '—' },
  { key: 'createdDate', header: 'Created', width: 100 },
];

export default function CustomerOverviewScreen() {
  const { range, setRange } = useFilters();
  const { from, to } = range;
  const [routeCode, setRouteCode] = useState('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const dq = useDebounce(q, 400);

  const opts = useApi(() => biService.driveTimeOptions(), []);
  const { data, loading, error, reload } = useApi(
    () => biService.customersOverview({ from, to, routeCode: routeCode === 'all' ? undefined : routeCode, q: dq || undefined }),
    [from, to, routeCode, dq],
  );
  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];
  const topByInvoices = (data && data.topByInvoices) || [];
  const topByRevenue = (data && data.topByRevenue) || [];
  const byRoute = (data && data.byRoute) || [];
  const months = (data && data.months) || [];
  const newByMonth = (data && data.newByMonth) || [];
  const newCustomers = (data && data.newCustomerRows) || [];
  const filtered = rows;

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Customer Overview" subtitle="New customers created and how many invoices each customer created in the selected period, with revenue, routes and trend." />
      <FilterBar>
        <DateRangeFilter value={range} onChange={setRange} min={opts.data && opts.data.earliestDate} max={opts.data && opts.data.latestDate} />
        <Select label="Route" value={routeCode} onChange={setRouteCode} options={[{ value: 'all', label: 'All routes' }, ...routeCodes.map((r) => ({ value: r, label: r }))]} />
        <SearchInput label="Search customer" value={q} onChangeText={setQ} placeholder="name / route…" />
      </FilterBar>

      <AsyncState loading={loading} error={error} empty={!loading && !error && !k} onRetry={reload}>
        {k ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="New customers" value={formatNumber(k.newCustomers)} tone="info" />
              <StatCard label="Active customers" value={formatNumber(k.customers)} />
              <StatCard label="Invoices created" value={formatNumber(k.invoices)} tone="success" />
              <StatCard label="Invoiced" value={formatCurrency(k.invoiced)} tone="success" />
              <StatCard label="Avg inv / customer" value={formatNumber(k.avgInvoicesPerCustomer)} />
              <StatCard label="Avg rev / customer" value={formatCurrency(k.avgRevenuePerCustomer)} />
            </StatGrid>
            <LineChartCard title="Invoices created per month" data={months} xKey="month" lines={[{ key: 'invoices', label: 'Invoices', color: '#4F46E5' }]} />
            <LineChartCard title="New customers created per month" data={newByMonth} xKey="month" lines={[{ key: 'newCustomers', label: 'New customers', color: '#10B981' }]} />
            <BarChartCard title="Top customers by invoices" data={topByInvoices} xKey="customer" bars={[{ key: 'invoices', label: 'Invoices', color: '#4F46E5' }]} />
            <BarChartCard title="Top customers by revenue" data={topByRevenue} xKey="customer" bars={[{ key: 'invoiced', label: 'Invoiced', color: '#10B981' }]} />
            <PieChartCard title="Customers by route" data={byRoute} nameKey="routeCode" valueKey="customers" />
            <DataTable title={`New customers created (${newCustomers.length})`} columns={newCustomerColumns} rows={newCustomers} searchable={false} onRowClick={(r) => setSelected(r)} />
            <DataTable title="All active customers" columns={columns} rows={filtered} searchable={false} onRowClick={(r) => setSelected(r)} />
          </>
        ) : null}
      </AsyncState>

      {selected ? <CustomerRevenueModal customerId={selected.customerId} customerName={selected.customer} routes={selected.routeCode ? [selected.routeCode] : undefined} range={range} onClose={() => setSelected(null)} /> : null}
    </Screen>
  );
}
