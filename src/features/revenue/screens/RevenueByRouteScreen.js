import React, { useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, DateRangeFilter, AsyncState, DataTable,
  StatGrid, StatCard, Badge, BarChartCard,
} from '@/components';
import { useFilters } from '@/context/FiltersContext';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';
import RouteRevenueModal from '@/features/revenue/components/RouteRevenueModal';

const pctTone = (p) => (p == null ? 'neutral' : p >= 90 ? 'success' : p >= 50 ? 'warning' : 'danger');

const columns = [
  { key: 'routeCode', header: 'Route', width: 90 },
  { key: 'expected', header: 'Expected', align: 'right', width: 100, render: (r) => formatCurrency(r.expected) },
  { key: 'invoiced', header: 'Invoiced', align: 'right', width: 100, render: (r) => formatCurrency(r.invoiced) },
  { key: 'remaining', header: 'Remaining', align: 'right', width: 100, render: (r) => formatCurrency(r.remaining) },
  { key: 'pct', header: 'Collected', align: 'right', width: 90, render: (r) => (r.pct != null ? <Badge tone={pctTone(r.pct)}>{formatPercent(r.pct)}</Badge> : '—') },
  { key: 'stops', header: 'Stops', align: 'right', width: 60, render: (r) => formatNumber(r.stops) },
  { key: 'customers', header: 'Customers', align: 'right', width: 80, render: (r) => formatNumber(r.customers) },
];

export default function RevenueByRouteScreen() {
  const { range, setRange } = useFilters();
  const { from, to } = range;
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const { data, loading, error, reload } = useApi(() => biService.revenueByRoute({ from, to }), [from, to]);
  const [route, setRoute] = useState(null);
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Revenue by Route" subtitle="Expected vs invoiced vs remaining per route (= technician). Tap a route to drill into its customers." />
      <FilterBar>
        <DateRangeFilter value={range} onChange={setRange} min={opts.data && opts.data.earliestDate} max={opts.data && opts.data.latestDate} />
      </FilterBar>

      <AsyncState loading={loading} error={error} empty={!loading && !error && !k} onRetry={reload}>
        {k ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="Expected (yr)" value={formatCurrency(k.expected)} tone="info" />
              <StatCard label="Invoiced" value={formatCurrency(k.invoiced)} tone="success" />
              <StatCard label="Remaining" value={formatCurrency(k.remaining)} tone={k.remaining > 0 ? 'warning' : 'success'} />
              <StatCard label="Routes" value={formatNumber(k.routes)} />
            </StatGrid>
            <BarChartCard title="Invoiced vs remaining by route" data={rows} xKey="routeCode"
              bars={[{ key: 'invoiced', label: 'Invoiced', color: '#10B981' }, { key: 'remaining', label: 'Remaining', color: '#F59E0B' }]} />
            <DataTable title="Routes" columns={columns} rows={rows} onRowClick={(r) => setRoute(r.routeCode)} />
          </>
        ) : null}
      </AsyncState>

      {route ? <RouteRevenueModal routeCode={route} range={range} onClose={() => setRoute(null)} /> : null}
    </Screen>
  );
}
