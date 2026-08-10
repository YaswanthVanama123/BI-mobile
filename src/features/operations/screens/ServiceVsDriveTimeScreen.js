import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, DateRangeFilter, RouteTabs, Select, AsyncState, DataTable, Pager,
  StatGrid, StatCard, Badge, SectionTitle, Muted,
} from '@/components';
import { BarChartCard, PieChartCard } from '@/components';
import { useFilters } from '@/context/FiltersContext';
import { formatMinutes, formatNumber, formatPercent, formatDateShort } from '@/utils/format';
import DrillModal from '@/features/revenue/components/DrillModal';

const GRANULARITIES = ['day', 'week', 'month'];

const splitBars = [
  { key: 'service', label: 'Service (on-site)', color: '#10B981' },
  { key: 'drive', label: 'Drive', color: '#2563EB' },
  { key: 'idle', label: 'Idle / paperwork', color: '#F59E0B' },
];

const mkColumns = (keyName, keyHeader) => [
  { key: keyName, header: keyHeader, width: 150 },
  { key: 'service', header: 'Service', align: 'right', width: 80, render: (r) => formatMinutes(r.service), csv: (r) => formatMinutes(r.service) },
  { key: 'drive', header: 'Drive', align: 'right', width: 80, render: (r) => formatMinutes(r.drive), csv: (r) => formatMinutes(r.drive) },
  { key: 'idle', header: 'Idle', align: 'right', width: 80, render: (r) => formatMinutes(r.idle), csv: (r) => formatMinutes(r.idle) },
  { key: 'gap', header: 'Between stops', align: 'right', width: 120, render: (r) => formatMinutes(r.gap != null ? r.gap : (r.drive || 0) + (r.idle || 0)), csv: (r) => formatMinutes(r.gap != null ? r.gap : (r.drive || 0) + (r.idle || 0)) },
  { key: 'stops', header: 'Stops', align: 'right', width: 70, render: (r) => formatNumber(r.stops) },
  { key: 'legs', header: 'Legs', align: 'right', width: 70, render: (r) => formatNumber(r.legs) },
];

const dayColumns = [
  { key: 'date', header: 'Completed', width: 110, render: (r) => formatDateShort(r.date) },
  { key: 'routeCode', header: 'Route', width: 80 },
  { key: 'stops', header: 'Stops', align: 'right', width: 70, render: (r) => formatNumber(r.stops) },
  { key: 'legs', header: 'Legs', align: 'right', width: 70, render: (r) => formatNumber(r.legs) },
  { key: 'service', header: 'Service', align: 'right', width: 80, render: (r) => formatMinutes(r.service), csv: (r) => formatMinutes(r.service) },
  { key: 'drive', header: 'Drive', align: 'right', width: 80, render: (r) => formatMinutes(r.drive), csv: (r) => formatMinutes(r.drive) },
  { key: 'idle', header: 'Idle / paperwork', align: 'right', width: 110, render: (r) => formatMinutes(r.idle), csv: (r) => formatMinutes(r.idle) },
  { key: 'gap', header: 'Between stops', align: 'right', width: 120, render: (r) => formatMinutes(r.gap != null ? r.gap : (r.drive || 0) + (r.idle || 0)), csv: (r) => formatMinutes(r.gap != null ? r.gap : (r.drive || 0) + (r.idle || 0)) },
  { key: 'servicePct', header: 'Service % of active', align: 'right', width: 130, render: (r) => (r.servicePct != null ? <Badge tone={r.servicePct >= 60 ? 'success' : 'warning'}>{formatPercent(r.servicePct)}</Badge> : '-') },
];

export default function ServiceVsDriveTimeScreen() {
  const { range, setRange } = useFilters();
  const [routeCode, setRouteCode] = useState('all');
  const [granularity, setGranularity] = useState('month');
  const [drill, setDrill] = useState(null);
  const { from, to } = range;

  const opts = useApi(() => biService.driveTimeOptions(), []);
  const { data, meta, loading, error, reload } = useApi(
    () => (from && to ? biService.serviceVsDriveTime({ from, to, routeCode, granularity }) : Promise.resolve({ data: null })),
    [from, to, routeCode, granularity],
  );

  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;

  const [dayPage, setDayPage] = useState(1);
  const [dayQ, setDayQ] = useState('');
  useEffect(() => { setDayPage(1); }, [from, to, routeCode, granularity, dayQ]);
  const dayApi = useApi(
    () => (from && to ? biService.serviceVsDriveTime({ from, to, routeCode, granularity, q: dayQ || undefined, page: dayPage, pageSize: 25 }) : Promise.resolve({ data: null })),
    [from, to, routeCode, granularity, dayQ, dayPage],
  );
  const byRouteDay = (dayApi.data && dayApi.data.byRouteDay) || [];
  const dayTotal = (dayApi.page && dayApi.page.total) || 0;
  const dayTotalPages = (dayApi.page && dayApi.page.totalPages) || 1;
  const exportDays = async () => {
    const res = await biService.serviceVsDriveTime({ from, to, routeCode, granularity, q: dayQ || undefined, pageSize: 'all' });
    return (res && res.data && res.data.byRouteDay) || [];
  };

  const splitData = useMemo(() => (k ? [
    { name: 'Service', value: k.serviceMinutes },
    { name: 'Drive', value: k.driveMinutes },
    { name: 'Idle / paperwork', value: k.idleMinutes },
  ] : []), [k]);

  return (
    <Screen loading={loading || opts.loading} onRefresh={reload}>
      <PageHeader
        title="Service vs Drive Time"
        subtitle="On-site service time vs Mapbox drive time between consecutive stops, and the non-driving idle gap (paperwork/travel slack). Per route (NRV1…) per day below."
      />
      <FilterBar>
        <DateRangeFilter value={range} onChange={setRange} min={opts.data && opts.data.earliestDate} max={opts.data && opts.data.latestDate} />
        <Select label="Granularity" value={granularity} onChange={setGranularity} options={GRANULARITIES.map((g) => ({ value: g, label: g }))} />
      </FilterBar>
      {meta && meta.unsyncedLegs > 0 ? (
        <Muted style={styles.warn}>{formatNumber(meta.unsyncedLegs)} legs lack a synced drive time — run the Distances Sync to fill them.</Muted>
      ) : null}
      <RouteTabs routes={routeCodes} value={routeCode} onChange={setRouteCode} />

      <AsyncState loading={loading || opts.loading} error={error} empty={!loading && !error && !k} onRetry={reload}>
        {k ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="Service (on-site)" value={formatMinutes(k.serviceMinutes)} sublabel={`${formatPercent(k.servicePct)} of active`} tone="success" />
              <StatCard label="Drive time" value={formatMinutes(k.driveMinutes)} sublabel={`${formatPercent(k.drivePct)} of active`} tone="info" />
              <StatCard label="Idle / paperwork" value={formatMinutes(k.idleMinutes)} sublabel={`${formatPercent(k.idlePct)} of active`} tone={k.idlePct > 30 ? 'warning' : 'neutral'} />
              <StatCard label="Stops" value={formatNumber(k.stops)} sublabel={`${formatNumber(k.technicians)} techs · ${formatNumber(k.days)} days`} />
              <StatCard label="Avg service / stop" value={formatMinutes(k.avgServicePerStop)} />
              <StatCard label="Avg drive / leg" value={formatMinutes(k.avgDrivePerLeg)} sublabel={`${formatNumber(k.distanceMiles)} mi`} />
            </StatGrid>

            <PieChartCard title="Where the day goes" subtitle="service vs drive vs idle" data={splitData} nameKey="name" valueKey="value" valueFormatter={formatMinutes} />
            <BarChartCard title={`Service vs drive vs idle by ${granularity}`} data={data.series} xKey="bucket" bars={splitBars} valueFormatter={formatMinutes} />
            <BarChartCard title="By route (minutes)" data={data.byRoute} xKey="routeCode" bars={splitBars} valueFormatter={formatMinutes} />

            <DataTable title="By route" columns={mkColumns('routeCode', 'Route')} rows={data.byRoute} maxRows={500} />
            <DataTable title="By technician" columns={mkColumns('technician', 'Technician')} rows={data.byTechnician} maxRows={500} />

            <SectionTitle>Day by day (all routes)</SectionTitle>
            <DataTable title="Day by day" columns={dayColumns} rows={byRouteDay} paginated={false} onServerSearch={setDayQ} searchPlaceholder="Search route / date…" onRowClick={(r) => setDrill(r)} onExportAll={exportDays} exportName="service-vs-drive-day" />
            {dayTotalPages > 1 ? (
              <Pager page={dayPage} totalPages={dayTotalPages} total={dayTotal} loading={dayApi.loading} onPrev={() => setDayPage((p) => Math.max(1, p - 1))} onNext={() => setDayPage((p) => Math.min(dayTotalPages, p + 1))} />
            ) : null}
          </>
        ) : null}
      </AsyncState>
      {drill ? (
        <DrillModal
          title={`${drill.routeCode} · ${formatDateShort(drill.date)}`}
          subtitle="Invoices completed by this route on the selected day"
          filter={{ routeCode: drill.routeCode }}
          range={{ from: drill.date, to: drill.date }}
          defaultTab="invoices"
          onClose={() => setDrill(null)}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  warn: { color: '#B45309', marginBottom: 8 },
});
