import React, { useMemo, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, DateRangeFilter, Select, AsyncState, DataTable,
  StatGrid, StatCard, Badge, BarChartCard,
} from '@/components';
import { useFilters } from '@/context/FiltersContext';
import { formatMinutes, formatNumber, formatPercent } from '@/utils/format';

const utilTone = (p) => (p >= 60 ? 'success' : p >= 40 ? 'warning' : 'danger');

const columns = [
  { key: 'technician', header: 'Technician', width: 150 },
  { key: 'utilizationPct', header: 'Utilization', align: 'right', width: 110, render: (r) => <Badge tone={utilTone(r.utilizationPct)}>{formatPercent(r.utilizationPct)}</Badge> },
  { key: 'stops', header: 'Stops', align: 'right', width: 80, render: (r) => formatNumber(r.stops) },
  { key: 'days', header: 'Days', align: 'right', width: 70, render: (r) => formatNumber(r.days) },
  { key: 'avgStopsPerDay', header: 'Stops/day', align: 'right', width: 90, render: (r) => formatNumber(r.avgStopsPerDay) },
  { key: 'serviceMinutes', header: 'Service', align: 'right', width: 90, render: (r) => formatMinutes(r.serviceMinutes) },
  { key: 'spanMinutes', header: 'Working span', align: 'right', width: 110, render: (r) => formatMinutes(r.spanMinutes) },
  { key: 'idleMinutes', header: 'Idle', align: 'right', width: 90, render: (r) => formatMinutes(r.idleMinutes) },
  { key: 'avgServicePerStop', header: 'Svc/stop', align: 'right', width: 90, render: (r) => formatMinutes(r.avgServicePerStop) },
];

export default function TechnicianUtilizationScreen() {
  const { range, setRange } = useFilters();
  const [routeCode, setRouteCode] = useState('all');
  const { from, to } = range;

  const opts = useApi(() => biService.driveTimeOptions(), []);
  const { data, loading, error, reload } = useApi(
    () => (from && to ? biService.technicianUtilization({ from, to, routeCode }) : Promise.resolve({ data: null })),
    [from, to, routeCode],
  );

  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];
  const chart = useMemo(() => rows.slice(0, 20).map((r) => ({ technician: r.technician, service: r.serviceMinutes, idle: r.idleMinutes })), [rows]);

  return (
    <Screen loading={loading || opts.loading} onRefresh={reload}>
      <PageHeader title="Technician Utilization" subtitle="On-site service time as a share of each technician's working-day span (first check-in → last check-out)." />
      <FilterBar>
        <DateRangeFilter value={range} onChange={setRange} min={opts.data && opts.data.earliestDate} max={opts.data && opts.data.latestDate} />
        <Select label="Route" value={routeCode} onChange={setRouteCode} options={[{ value: 'all', label: 'All routes' }, ...routeCodes.map((r) => ({ value: r, label: r }))]} />
      </FilterBar>

      <AsyncState loading={loading || opts.loading} error={error} empty={!loading && !error && !k} onRetry={reload}>
        {k ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="Avg utilization" value={formatPercent(k.avgUtilizationPct)} tone={k.avgUtilizationPct >= 60 ? 'success' : 'warning'} />
              <StatCard label="Technicians" value={formatNumber(k.technicians)} />
              <StatCard label="Stops" value={formatNumber(k.stops)} sublabel={`${formatNumber(k.avgStopsPerTech)}/tech`} />
              <StatCard label="Service time" value={formatMinutes(k.serviceMinutes)} tone="success" />
              <StatCard label="Idle (in span)" value={formatMinutes(k.idleMinutes)} tone="warning" />
            </StatGrid>
            <BarChartCard
              title="Service vs idle within the working day (min)"
              data={chart}
              xKey="technician"
              bars={[{ key: 'service', label: 'Service', color: '#10B981' }, { key: 'idle', label: 'Idle', color: '#F59E0B' }]}
            />
            <DataTable title="Utilization by technician" columns={columns} rows={rows} />
          </>
        ) : null}
      </AsyncState>
    </Screen>
  );
}
