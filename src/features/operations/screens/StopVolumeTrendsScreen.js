import React, { useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, DateRangeFilter, Select, AsyncState, DataTable,
  StatGrid, StatCard, LineChartCard, BarChartCard,
} from '@/components';
import { useFilters } from '@/context/FiltersContext';
import { formatNumber } from '@/utils/format';

const GRANULARITIES = ['day', 'week', 'month'];

const seriesColumns = [
  { key: 'bucket', header: 'Period', width: 150 },
  { key: 'stops', header: 'Stops', align: 'right', width: 90, render: (r) => formatNumber(r.stops) },
];
const routeColumns = [
  { key: 'routeCode', header: 'Route', width: 150 },
  { key: 'stops', header: 'Stops', align: 'right', width: 90, render: (r) => formatNumber(r.stops) },
];

export default function StopVolumeTrendsScreen() {
  const { range, setRange } = useFilters();
  const [routeCode, setRouteCode] = useState('all');
  const [granularity, setGranularity] = useState('month');
  const { from, to } = range;

  const opts = useApi(() => biService.driveTimeOptions(), []);
  const { data, loading, error, reload } = useApi(
    () => (from && to ? biService.stopVolumeTrends({ from, to, routeCode, granularity }) : Promise.resolve({ data: null })),
    [from, to, routeCode, granularity],
  );

  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;

  return (
    <Screen loading={loading || opts.loading} onRefresh={reload}>
      <PageHeader title="Stop Volume Trends" subtitle="Completed stop volume over time, by route and by weekday." />
      <FilterBar>
        <DateRangeFilter value={range} onChange={setRange} min={opts.data && opts.data.earliestDate} max={opts.data && opts.data.latestDate} />
        <Select label="Route" value={routeCode} onChange={setRouteCode} options={[{ value: 'all', label: 'All routes' }, ...routeCodes.map((r) => ({ value: r, label: r }))]} />
        <Select label="Granularity" value={granularity} onChange={setGranularity} options={GRANULARITIES.map((g) => ({ value: g, label: g }))} />
      </FilterBar>

      <AsyncState loading={loading || opts.loading} error={error} empty={!loading && !error && !k} onRetry={reload}>
        {k ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="Total stops" value={formatNumber(k.stops)} tone="info" />
              <StatCard label={`Avg / ${granularity}`} value={formatNumber(k.avgPerBucket)} />
              <StatCard label="Busiest period" value={k.busiestBucket || '—'} sublabel={`${formatNumber(k.busiestBucketStops)} stops`} tone="success" />
              <StatCard label="Routes" value={formatNumber(k.routes)} />
              <StatCard label="Periods" value={formatNumber(k.buckets)} />
            </StatGrid>

            <LineChartCard title={`Stops by ${granularity}`} data={data.series} xKey="bucket" lines={[{ key: 'stops', label: 'Stops', color: '#2563EB' }]} />
            <BarChartCard title="Stops by route" data={data.byRoute} xKey="routeCode" bars={[{ key: 'stops', label: 'Stops', color: '#10B981' }]} />
            <BarChartCard title="Stops by weekday" data={data.byWeekday} xKey="day" bars={[{ key: 'stops', label: 'Stops', color: '#8B5CF6' }]} />

            <DataTable title="By period" columns={seriesColumns} rows={data.series} maxRows={500} />
            <DataTable title="By route" columns={routeColumns} rows={data.byRoute} maxRows={500} />
          </>
        ) : null}
      </AsyncState>
    </Screen>
  );
}
