import React from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, DateRangeFilter, AsyncState, DataTable,
  StatGrid, StatCard, BarChartCard,
} from '@/components';
import { useFilters } from '@/context/FiltersContext';
import { formatCurrency, formatNumber, toNumber } from '@/utils/format';

const columns = [
  { key: 'routeCode', header: 'Route', width: 90 },
  { key: 'stops', header: 'Stops', align: 'right', width: 90, render: (r) => formatNumber(r.stops) },
  { key: 'laborCost', header: 'Labor cost', align: 'right', width: 120, render: (r) => formatCurrency(r.laborCost) },
  { key: 'laborCostPerStop', header: 'Labor / stop', align: 'right', width: 120, render: (r) => formatCurrency(r.laborCostPerStop) },
  { key: 'revenuePerStop', header: 'Revenue / stop', align: 'right', width: 130, render: (r) => formatCurrency(r.revenuePerStop) },
  { key: 'contributionPerStop', header: 'Contribution / stop', align: 'right', width: 150, render: (r) => formatCurrency(r.contributionPerStop) },
];

export default function LaborPerStopScreen() {
  const { range, setRange } = useFilters();
  const { from, to } = range;
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const { data, loading, error, reload } = useApi(() => biService.laborCostPerStop({ from, to }), [from, to]);
  const rows = data || [];
  const totalStops = rows.reduce((s, r) => s + (toNumber(r.stops) || 0), 0);
  const totalLabor = rows.reduce((s, r) => s + (toNumber(r.laborCost) || 0), 0);
  const laborPerStop = totalStops > 0 ? totalLabor / totalStops : 0;

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Labor Cost per Stop" subtitle="Allocated labor cost ÷ completed stops, and contribution per stop by route." />
      <FilterBar>
        <DateRangeFilter value={range} onChange={setRange} min={opts.data && opts.data.earliestDate} max={opts.data && opts.data.latestDate} />
      </FilterBar>

      <AsyncState loading={loading} error={error} empty={!loading && !error && rows.length === 0} onRetry={reload}>
        {rows.length ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="Routes" value={formatNumber(rows.length)} tone="info" />
              <StatCard label="Stops" value={formatNumber(totalStops)} />
              <StatCard label="Labor cost" value={formatCurrency(totalLabor)} tone="warning" />
              <StatCard label="Labor / stop" value={formatCurrency(laborPerStop)} />
            </StatGrid>
            <BarChartCard title="Revenue vs labor vs contribution per stop" data={rows} xKey="routeCode" bars={[
              { key: 'revenuePerStop', label: 'Revenue / stop', color: '#2563EB' },
              { key: 'laborCostPerStop', label: 'Labor / stop', color: '#F59E0B' },
              { key: 'contributionPerStop', label: 'Contribution / stop', color: '#10B981' },
            ]} />
            <DataTable title="By route" columns={columns} rows={rows} />
          </>
        ) : null}
      </AsyncState>
    </Screen>
  );
}
