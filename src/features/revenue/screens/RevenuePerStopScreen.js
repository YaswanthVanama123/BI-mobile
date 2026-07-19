import React, { useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, DateRangeFilter, Select, AsyncState, DataTable,
  StatGrid, StatCard, SectionTitle, BarChartCard,
} from '@/components';
import { useFilters } from '@/context/FiltersContext';
import { formatCurrency, formatNumber } from '@/utils/format';
import RouteRevenueModal from '@/features/revenue/components/RouteRevenueModal';
import CustomerRevenueModal from '@/features/revenue/components/CustomerRevenueModal';

const routeColumns = [
  { key: 'routeCode', header: 'Route', width: 90 },
  { key: 'invoiced', header: 'Invoiced', align: 'right', width: 110, render: (r) => formatCurrency(r.invoiced) },
  { key: 'stops', header: 'Stops', align: 'right', width: 70, render: (r) => formatNumber(r.stops) },
  { key: 'revenuePerStop', header: 'Rev / stop', align: 'right', width: 100, render: (r) => formatCurrency(r.revenuePerStop) },
];
const customerColumns = [
  { key: 'customer', header: 'Customer', width: 170 },
  { key: 'routeCode', header: 'Route', width: 80 },
  { key: 'invoiced', header: 'Invoiced', align: 'right', width: 110, render: (r) => formatCurrency(r.invoiced) },
  { key: 'stops', header: 'Stops', align: 'right', width: 70, render: (r) => formatNumber(r.stops) },
  { key: 'revenuePerStop', header: 'Rev / stop', align: 'right', width: 100, render: (r) => formatCurrency(r.revenuePerStop) },
];

export default function RevenuePerStopScreen() {
  const { range, setRange } = useFilters();
  const [routeCode, setRouteCode] = useState('all');
  const { from, to } = range;
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const { data, loading, error, reload } = useApi(() => biService.revenuePerStop({ from, to, routeCode }), [from, to, routeCode]);
  const [route, setRoute] = useState(null);
  const [customer, setCustomer] = useState(null);
  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;
  const byRoute = (data && data.byRoute) || [];
  const byCustomer = (data && data.byCustomer) || [];

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Revenue per Stop" subtitle="Actual invoiced revenue ÷ stops (closed invoices), overall and by route." />
      <FilterBar>
        <DateRangeFilter value={range} onChange={setRange} min={opts.data && opts.data.earliestDate} max={opts.data && opts.data.latestDate} />
        <Select label="Route" value={routeCode} onChange={setRouteCode} options={[{ value: 'all', label: 'All routes' }, ...routeCodes.map((r) => ({ value: r, label: r }))]} />
      </FilterBar>

      <AsyncState loading={loading} error={error} empty={!loading && !error && !k} onRetry={reload}>
        {k ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="Revenue / stop" value={formatCurrency(k.revenuePerStop)} tone="success" />
              <StatCard label="Invoiced" value={formatCurrency(k.invoiced)} />
              <StatCard label="Stops" value={formatNumber(k.stops)} />
              <StatCard label="Routes" value={formatNumber(k.routes)} />
            </StatGrid>
            <BarChartCard title="Revenue per stop by route" data={byRoute} xKey="routeCode" bars={[{ key: 'revenuePerStop', label: 'Rev / stop', color: '#2563EB' }]} />
            <SectionTitle style={{ marginTop: 4 }}>By route — tap to drill</SectionTitle>
            <DataTable columns={routeColumns} rows={byRoute} onRowClick={(r) => setRoute(r.routeCode)} />
            <SectionTitle style={{ marginTop: 16 }}>Top customers — tap to drill</SectionTitle>
            <DataTable columns={customerColumns} rows={byCustomer} onRowClick={(r) => setCustomer(r.customerId)} />
          </>
        ) : null}
      </AsyncState>

      {route ? <RouteRevenueModal routeCode={route} range={range} onClose={() => setRoute(null)} /> : null}
      {customer ? <CustomerRevenueModal customerId={customer} range={range} onClose={() => setCustomer(null)} /> : null}
    </Screen>
  );
}
