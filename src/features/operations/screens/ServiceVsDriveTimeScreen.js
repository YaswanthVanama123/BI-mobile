import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, DateRangeFilter, RouteTabs, Select, AsyncState, DataTable,
  StatGrid, StatCard, Badge, Card, SectionTitle, Muted,
} from '@/components';
import { BarChartCard, PieChartCard } from '@/components';
import { useFilters } from '@/context/FiltersContext';
import { formatMinutes, formatNumber, formatPercent, formatDateShort } from '@/utils/format';

const GRANULARITIES = ['day', 'week', 'month'];

const splitBars = [
  { key: 'service', label: 'Service (on-site)', color: '#10B981' },
  { key: 'drive', label: 'Drive', color: '#2563EB' },
  { key: 'idle', label: 'Idle / paperwork', color: '#F59E0B' },
];

const mkColumns = (keyName, keyHeader) => [
  { key: keyName, header: keyHeader, width: 150 },
  { key: 'service', header: 'Service', align: 'right', width: 80, render: (r) => formatMinutes(r.service) },
  { key: 'drive', header: 'Drive', align: 'right', width: 80, render: (r) => formatMinutes(r.drive) },
  { key: 'idle', header: 'Idle', align: 'right', width: 80, render: (r) => formatMinutes(r.idle) },
  { key: 'stops', header: 'Stops', align: 'right', width: 70, render: (r) => formatNumber(r.stops) },
  { key: 'legs', header: 'Legs', align: 'right', width: 70, render: (r) => formatNumber(r.legs) },
];

const dayColumns = [
  { key: 'date', header: 'Date', width: 110, render: (r) => formatDateShort(r.date) },
  { key: 'routeCode', header: 'Route', width: 80 },
  { key: 'stops', header: 'Stops', align: 'right', width: 70, render: (r) => formatNumber(r.stops) },
  { key: 'legs', header: 'Legs', align: 'right', width: 70, render: (r) => formatNumber(r.legs) },
  { key: 'service', header: 'Service', align: 'right', width: 80, render: (r) => formatMinutes(r.service) },
  { key: 'drive', header: 'Drive', align: 'right', width: 80, render: (r) => formatMinutes(r.drive) },
  { key: 'idle', header: 'Idle / paperwork', align: 'right', width: 110, render: (r) => formatMinutes(r.idle) },
  { key: 'servicePct', header: 'Service % of active', align: 'right', width: 130, render: (r) => (r.servicePct != null ? <Badge tone={r.servicePct >= 60 ? 'success' : 'warning'}>{formatPercent(r.servicePct)}</Badge> : '-') },
];

export default function ServiceVsDriveTimeScreen() {
  const { range, setRange } = useFilters();
  const [routeCode, setRouteCode] = useState('all');
  const [granularity, setGranularity] = useState('month');
  const { from, to } = range;

  const opts = useApi(() => biService.driveTimeOptions(), []);
  const { data, meta, loading, error, reload } = useApi(
    () => (from && to ? biService.serviceVsDriveTime({ from, to, routeCode, granularity }) : Promise.resolve({ data: null })),
    [from, to, routeCode, granularity],
  );

  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;
  const byRouteDay = (data && data.byRouteDay) || [];

  const dayGroups = useMemo(() => {
    const m = new Map();
    for (const r of byRouteDay) { if (!m.has(r.routeCode)) m.set(r.routeCode, []); m.get(r.routeCode).push(r); }
    return [...m.entries()].map(([rc, rows]) => ({ routeCode: rc, rows })).sort((a, b) => a.routeCode.localeCompare(b.routeCode));
  }, [byRouteDay]);

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

            <PieChartCard title="Where the day goes" subtitle="service vs drive vs idle" data={splitData} nameKey="name" valueKey="value" />
            <BarChartCard title={`Service vs drive vs idle by ${granularity}`} data={data.series} xKey="bucket" bars={splitBars} />
            <BarChartCard title="By route (minutes)" data={data.byRoute} xKey="routeCode" bars={splitBars} />

            <DataTable title="By route" columns={mkColumns('routeCode', 'Route')} rows={data.byRoute} maxRows={500} />
            <DataTable title="By technician" columns={mkColumns('technician', 'Technician')} rows={data.byTechnician} maxRows={500} />

            <SectionTitle>Day by day (per route)</SectionTitle>
            {dayGroups.map((g) => {
              const svc = g.rows.reduce((t, r) => t + r.service, 0);
              const drv = g.rows.reduce((t, r) => t + r.drive, 0);
              const idl = g.rows.reduce((t, r) => t + r.idle, 0);
              return (
                <Card key={g.routeCode} padded={false} style={styles.groupCard}>
                  <View style={styles.groupHead}>
                    <Text style={styles.groupTitle}>Route {g.routeCode}</Text>
                    <View style={styles.groupMeta}>
                      <Text style={styles.metaText}>{formatNumber(g.rows.length)} day(s)</Text>
                      <Text style={styles.metaText}>service {formatMinutes(svc)}</Text>
                      <Text style={styles.metaText}>drive {formatMinutes(drv)}</Text>
                      <Text style={styles.metaText}>idle {formatMinutes(idl)}</Text>
                    </View>
                  </View>
                  <DataTable columns={dayColumns} rows={g.rows} maxRows={500} />
                </Card>
              );
            })}
          </>
        ) : null}
      </AsyncState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  warn: { color: '#B45309', marginBottom: 8 },
  groupCard: { marginBottom: 12, overflow: 'hidden' },
  groupHead: { padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  groupTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  groupMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaText: { fontSize: 11.5, color: '#6B7280' },
});
