import React, { useMemo, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, DateRangeFilter, Select, AsyncState, DataTable,
  StatGrid, StatCard, BarChartCard,
} from '@/components';
import { useFilters } from '@/context/FiltersContext';
import { formatMinutes, formatNumber } from '@/utils/format';

const columns = [
  { key: 'technician', header: 'Technician', width: 150 },
  { key: 'stops', header: 'Total stops', align: 'right', width: 100, render: (r) => formatNumber(r.stops) },
  { key: 'activeDays', header: 'Active days', align: 'right', width: 100, render: (r) => formatNumber(r.activeDays) },
  { key: 'avgStopsPerDay', header: 'Avg / day', align: 'right', width: 90, render: (r) => formatNumber(r.avgStopsPerDay) },
  { key: 'serviceMinutes', header: 'Service time', align: 'right', width: 100, render: (r) => formatMinutes(r.serviceMinutes) },
  { key: 'avgServicePerStop', header: 'Svc / stop', align: 'right', width: 100, render: (r) => formatMinutes(r.avgServicePerStop) },
];

export default function StopsPerTechnicianScreen() {
  const { range, setRange } = useFilters();
  const [routeCode, setRouteCode] = useState('all');
  const { from, to } = range;

  const opts = useApi(() => biService.driveTimeOptions(), []);
  const { data, loading, error, reload } = useApi(
    () => (from && to ? biService.stopsPerTechnician({ from, to, routeCode }) : Promise.resolve({ data: null })),
    [from, to, routeCode],
  );

  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];
  const chart = useMemo(() => rows.slice(0, 25), [rows]);

  return (
    <Screen loading={loading || opts.loading} onRefresh={reload}>
      <PageHeader title="Stops per Technician" subtitle="Completed stops per technician over the period, with average stops per active day." />
      <FilterBar>
        <DateRangeFilter value={range} onChange={setRange} min={opts.data && opts.data.earliestDate} max={opts.data && opts.data.latestDate} />
        <Select label="Route" value={routeCode} onChange={setRouteCode} options={[{ value: 'all', label: 'All routes' }, ...routeCodes.map((r) => ({ value: r, label: r }))]} />
      </FilterBar>

      <AsyncState loading={loading || opts.loading} error={error} empty={!loading && !error && !k} onRetry={reload}>
        {k ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="Total stops" value={formatNumber(k.stops)} tone="info" />
              <StatCard label="Technicians" value={formatNumber(k.technicians)} />
              <StatCard label="Avg stops / tech" value={formatNumber(k.avgStopsPerTech)} />
              <StatCard label="Busiest tech" value={k.busiest || '—'} tone="success" />
            </StatGrid>
            <BarChartCard title="Total stops by technician" data={chart} xKey="technician" bars={[{ key: 'stops', label: 'Stops', color: '#2563EB' }]} />
            <BarChartCard title="Avg stops per active day" data={chart} xKey="technician" bars={[{ key: 'avgStopsPerDay', label: 'Stops/day', color: '#10B981' }]} />
            <DataTable title="Stops by technician" columns={columns} rows={rows} />
          </>
        ) : null}
      </AsyncState>
    </Screen>
  );
}
