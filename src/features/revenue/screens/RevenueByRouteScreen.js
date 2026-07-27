import React, { useMemo, useState } from 'react';
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

export default function RevenueByRouteScreen() {
  const { range, setRange } = useFilters();
  const { from, to } = range;
  const isAllTime = range.preset === 'all_time';
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const { data, loading, error, reload } = useApi(() => biService.revenueByRoute({ from, to }), [from, to]);
  const [route, setRoute] = useState(null);
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];
  const columns = useMemo(() => [
    { key: 'routeCode', header: 'Route', width: 90 },
    { key: 'invoiced', header: 'Invoiced', align: 'right', width: 100, render: (r) => formatCurrency(r.invoiced) },
    ...(isAllTime ? [{ key: 'remaining', header: 'Remaining', align: 'right', width: 100, render: (r) => formatCurrency(r.remaining) }] : []),
    { key: 'pct', header: 'Collected', align: 'right', width: 90, render: (r) => (r.pct != null ? <Badge tone={pctTone(r.pct)}>{formatPercent(r.pct)}</Badge> : '—') },
    { key: 'stops', header: 'Stops', align: 'right', width: 60, render: (r) => formatNumber(r.stops) },
    { key: 'customers', header: 'Customers', align: 'right', width: 80, render: (r) => formatNumber(r.customers) },
  ], [isAllTime]);

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Revenue by Route" subtitle="Invoiced revenue per route (= technician) for the selected period (Remaining shows on All time). Tap a route to drill into its customers." />
      <FilterBar>
        <DateRangeFilter value={range} onChange={setRange} min={opts.data && opts.data.earliestDate} max={opts.data && opts.data.latestDate} />
      </FilterBar>

      <AsyncState loading={loading} error={error} empty={!loading && !error && !k} onRetry={reload}>
        {k ? (
          <>
            <StatGrid columns={2}>
              {isAllTime ? <StatCard label="Expected (yr)" value={formatCurrency(k.expected)} tone="info" /> : null}
              <StatCard label="Invoiced" value={formatCurrency(k.invoiced)} tone="success" />
              {isAllTime ? <StatCard label="Remaining" value={formatCurrency(k.remaining)} tone={k.remaining > 0 ? 'warning' : 'success'} /> : null}
              <StatCard label="Routes" value={formatNumber(k.routes)} />
            </StatGrid>
            <BarChartCard title={isAllTime ? 'Invoiced vs remaining by route' : 'Invoiced by route'} data={rows} xKey="routeCode"
              bars={isAllTime
                ? [{ key: 'invoiced', label: 'Invoiced', color: '#10B981' }, { key: 'remaining', label: 'Remaining', color: '#F59E0B' }]
                : [{ key: 'invoiced', label: 'Invoiced', color: '#10B981' }]} />
            <DataTable title="Routes" columns={columns} rows={rows} onRowClick={(r) => setRoute(r.routeCode)} />
          </>
        ) : null}
      </AsyncState>

      {route ? <RouteRevenueModal routeCode={route} range={range} onClose={() => setRoute(null)} /> : null}
    </Screen>
  );
}
