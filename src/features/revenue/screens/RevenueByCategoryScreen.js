import React, { useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, DateRangeFilter, Select, AsyncState, DataTable,
  StatGrid, StatCard, Badge, DetailModal, PieChartCard, BarChartCard,
} from '@/components';
import { useFilters } from '@/context/FiltersContext';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';
import CustomerRevenueModal from '@/features/revenue/components/CustomerRevenueModal';
import InvoiceLinesModal from '@/features/revenue/components/InvoiceLinesModal';

const pctTone = (p) => (p == null ? 'neutral' : p >= 90 ? 'success' : p >= 50 ? 'warning' : 'danger');

const columns = [
  { key: 'category', header: 'Category', width: 180 },
  { key: 'expected', header: 'Expected', align: 'right', width: 100, render: (r) => formatCurrency(r.expected) },
  { key: 'invoiced', header: 'Invoiced', align: 'right', width: 100, render: (r) => formatCurrency(r.invoiced) },
  { key: 'remaining', header: 'Remaining', align: 'right', width: 100, render: (r) => formatCurrency(r.remaining) },
  { key: 'pct', header: 'Collected', align: 'right', width: 90, render: (r) => (r.pct != null ? <Badge tone={pctTone(r.pct)}>{formatPercent(r.pct)}</Badge> : '—') },
];
const custColumns = [
  { key: 'customer', header: 'Customer', width: 170 },
  { key: 'routeCode', header: 'Route', width: 80 },
  { key: 'expected', header: 'Expected', align: 'right', width: 100, render: (r) => formatCurrency(r.expected) },
  { key: 'invoiced', header: 'Invoiced', align: 'right', width: 100, render: (r) => formatCurrency(r.invoiced) },
  { key: 'remaining', header: 'Remaining', align: 'right', width: 100, render: (r) => formatCurrency(r.remaining) },
];
const invColumns = [
  { key: 'invoiceNumber', header: 'Invoice #', width: 110 },
  { key: 'customer', header: 'Customer', width: 160 },
  { key: 'date', header: 'Date', width: 100 },
  { key: 'amount', header: 'Amount', align: 'right', width: 110, render: (r) => formatCurrency(r.amount) },
];

function CategoryModal({ category, range, routeCode, onClose }) {
  const { from, to } = range;
  const { data, loading, error, reload } = useApi(() => biService.revenueCategoryDetail({ name: category, from, to, routeCode }), [category, from, to, routeCode]);
  const [invoice, setInvoice] = useState(null);
  const [customer, setCustomer] = useState(null);
  return (
    <DetailModal visible={!!category} onClose={onClose} title={`Category: ${category}`}>
      <AsyncState loading={loading} error={error} empty={!loading && !error && !data} onRetry={reload}>
        {data ? (
          <>
            <DataTable title={`Customers (${(data.customers || []).length}) — tap to drill`} columns={custColumns} rows={data.customers || []} onRowClick={(r) => setCustomer(r.customerId)} />
            <DataTable title={`Invoices with ${category} lines (${(data.invoices || []).length})`} columns={invColumns} rows={data.invoices || []} onRowClick={(r) => setInvoice(r.invoiceNumber)} />
          </>
        ) : null}
      </AsyncState>
      {invoice ? <InvoiceLinesModal invoiceNumber={invoice} onClose={() => setInvoice(null)} /> : null}
      {customer ? <CustomerRevenueModal customerId={customer} range={range} onClose={() => setCustomer(null)} /> : null}
    </DetailModal>
  );
}

export default function RevenueByCategoryScreen() {
  const { range, setRange } = useFilters();
  const [routeCode, setRouteCode] = useState('all');
  const [selected, setSelected] = useState(null);
  const { from, to } = range;

  const opts = useApi(() => biService.driveTimeOptions(), []);
  const { data, loading, error, reload } = useApi(() => biService.revenueByCategory({ from, to, routeCode }), [from, to, routeCode]);
  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];
  const pie = rows.slice(0, 8).map((r) => ({ name: r.category, value: r.invoiced }));

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Revenue by Category" subtitle="Expected annual vs invoiced vs remaining per item. Tap a row for customers & invoices." />
      <FilterBar>
        <DateRangeFilter value={range} onChange={setRange} min={opts.data && opts.data.earliestDate} max={opts.data && opts.data.latestDate} />
        <Select label="Route" value={routeCode} onChange={setRouteCode} options={[{ value: 'all', label: 'All routes' }, ...routeCodes.map((r) => ({ value: r, label: r }))]} />
      </FilterBar>

      <AsyncState loading={loading} error={error} empty={!loading && !error && !k} onRetry={reload}>
        {k ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="Expected (yr)" value={formatCurrency(k.expected)} tone="info" />
              <StatCard label="Invoiced" value={formatCurrency(k.invoiced)} tone="success" />
              <StatCard label="Remaining" value={formatCurrency(k.remaining)} tone={k.remaining > 0 ? 'warning' : 'success'} />
              <StatCard label="Categories" value={formatNumber(k.categories)} />
            </StatGrid>
            <PieChartCard title="Invoiced share" subtitle="top 8" data={pie} nameKey="name" valueKey="value" />
            <BarChartCard title="Invoiced vs remaining" data={rows.slice(0, 12)} xKey="category"
              bars={[{ key: 'invoiced', label: 'Invoiced', color: '#10B981' }, { key: 'remaining', label: 'Remaining', color: '#F59E0B' }]} />
            <DataTable title="All items" columns={columns} rows={rows} onRowClick={(r) => setSelected(r.category)} />
          </>
        ) : null}
      </AsyncState>

      {selected ? <CategoryModal category={selected} range={range} routeCode={routeCode} onClose={() => setSelected(null)} /> : null}
    </Screen>
  );
}
