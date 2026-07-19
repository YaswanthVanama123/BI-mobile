import React, { useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, DateRangeFilter, RouteTabs, AsyncState, DataTable,
  StatGrid, StatCard, Badge, BarChartCard,
} from '@/components';
import { useFilters } from '@/context/FiltersContext';
import { formatCurrency, formatNumber, formatPercent, toNumber } from '@/utils/format';

const marginTone = (p) => (toNumber(p) >= 60 ? 'success' : 'warning');

const columns = [
  { key: 'routeCode', header: 'Route', width: 90 },
  { key: 'totalRevenue', header: 'Revenue', align: 'right', width: 120, render: (r) => formatCurrency(r.totalRevenue) },
  { key: 'laborCost', header: 'Labor', align: 'right', width: 110, render: (r) => formatCurrency(r.laborCost) },
  { key: 'supplyCost', header: 'Supply', align: 'right', width: 110, render: (r) => formatCurrency(r.supplyCost) },
  { key: 'vehicleCost', header: 'Vehicle*', align: 'right', width: 110, render: (r) => formatCurrency(r.vehicleCost) },
  { key: 'estContributionMargin', header: 'Contribution', align: 'right', width: 130, render: (r) => formatCurrency(r.estContributionMargin) },
  { key: 'contributionPerStop', header: 'Contribution / stop', align: 'right', width: 150, render: (r) => formatCurrency(r.contributionPerStop) },
  { key: 'marginPct', header: 'Margin', align: 'right', width: 100, render: (r) => (r.marginPct != null ? <Badge tone={marginTone(r.marginPct)}>{formatPercent(r.marginPct)}</Badge> : '—') },
];

export default function RouteProfitabilityScreen() {
  const { range, setRange } = useFilters();
  const [routeCode, setRouteCode] = useState('all');
  const { from, to } = range;
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const { data, loading, error, reload } = useApi(() => biService.routeProfitability(routeCode, { from, to }), [routeCode, from, to]);
  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const rows = data || [];
  const totalRevenue = rows.reduce((s, r) => s + (toNumber(r.totalRevenue) || 0), 0);
  const totalContribution = rows.reduce((s, r) => s + (toNumber(r.estContributionMargin) || 0), 0);
  const totalStops = rows.reduce((s, r) => s + (toNumber(r.stops) || 0), 0);
  const marginPct = totalRevenue > 0 ? (totalContribution / totalRevenue) * 100 : null;

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Route Profitability" subtitle="Revenue − allocated labor/supply/vehicle. *Vehicle allocation basis is business-confirmable." />
      <FilterBar>
        <DateRangeFilter value={range} onChange={setRange} min={opts.data && opts.data.earliestDate} max={opts.data && opts.data.latestDate} />
        <RouteTabs routes={routeCodes} value={routeCode} onChange={setRouteCode} allLabel="All routes" />
      </FilterBar>

      <AsyncState loading={loading} error={error} empty={!loading && !error && rows.length === 0} onRetry={reload}>
        {rows.length ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="Revenue" value={formatCurrency(totalRevenue)} tone="info" />
              <StatCard label="Contribution" value={formatCurrency(totalContribution)} tone={totalContribution >= 0 ? 'success' : 'danger'} />
              <StatCard label="Stops" value={formatNumber(totalStops)} />
              <StatCard label="Margin" value={marginPct == null ? '—' : formatPercent(marginPct)} tone={marginPct != null ? marginTone(marginPct) : 'neutral'} />
            </StatGrid>
            <BarChartCard title="Revenue vs cost stack by route" data={rows} xKey="routeCode" bars={[
              { key: 'laborCost', label: 'Labor', color: '#F59E0B' },
              { key: 'supplyCost', label: 'Supply', color: '#8B5CF6' },
              { key: 'vehicleCost', label: 'Vehicle', color: '#EF4444' },
              { key: 'estContributionMargin', label: 'Contribution', color: '#10B981' },
            ]} />
            <DataTable title="By route" columns={columns} rows={rows} />
          </>
        ) : null}
      </AsyncState>
    </Screen>
  );
}
