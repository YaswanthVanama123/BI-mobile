import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, DateRangeFilter, RouteTabs, AsyncState, DataTable,
  StatGrid, StatCard, Badge, Card, SectionTitle, Muted,
} from '@/components';
import { BarChartCard, PieChartCard } from '@/components';
import { useFilters } from '@/context/FiltersContext';
import { formatMinutes, formatNumber, formatPercent, formatDateShort, statusTone } from '@/utils/format';

const stopColumns = [
  { key: 'seq', header: '#', align: 'right', width: 50, accessor: (r) => r.__seq },
  { key: 'invoiceNumber', header: 'Invoice #', width: 110 },
  { key: 'customer', header: 'Customer', width: 170 },
  { key: 'checkIn', header: 'Check-in', width: 90, render: (r) => r.checkIn || '-' },
  { key: 'checkOut', header: 'Check-out', width: 90, render: (r) => r.checkOut || '-' },
  { key: 'serviceMinutes', header: 'Service', align: 'right', width: 80, render: (r) => (r.serviceMinutes != null ? formatMinutes(r.serviceMinutes) : '-') },
  { key: 'gapToNextMinutes', header: 'Idle to next', align: 'right', width: 90, render: (r) => (r.gapToNextMinutes != null ? formatMinutes(r.gapToNextMinutes) : '-') },
  { key: 'elapsedStatus', header: 'Check', width: 110, render: (r) => <Badge tone={statusTone(r.elapsedStatus)}>{r.elapsedStatus}</Badge> },
];

const routeSummaryColumns = [
  { key: 'date', header: 'Date', width: 110, render: (r) => formatDateShort(r.date) },
  { key: 'route', header: 'Route', width: 80 },
  { key: 'stopCount', header: 'Stops', align: 'right', width: 70, render: (r) => formatNumber(r.stopCount) },
  { key: 'invoiceNumbers', header: 'Invoice #', width: 150, render: (r) => ((r.invoiceNumbers && r.invoiceNumbers.length) ? r.invoiceNumbers.join(', ') : '-') },
  { key: 'firstCheckIn', header: 'First in', width: 90, render: (r) => r.firstCheckIn || '-' },
  { key: 'lastCheckOut', header: 'Last out', width: 90, render: (r) => r.lastCheckOut || '-' },
  { key: 'spanMinutes', header: 'Day span', align: 'right', width: 90, render: (r) => (r.spanMinutes != null ? formatMinutes(r.spanMinutes) : '-') },
  { key: 'totalServiceMinutes', header: 'Service', align: 'right', width: 80, render: (r) => formatMinutes(r.totalServiceMinutes) },
  { key: 'totalGapMinutes', header: 'Idle', align: 'right', width: 80, render: (r) => formatMinutes(r.totalGapMinutes || 0) },
  {
    key: 'servicePct', header: 'Service % of day', align: 'right', width: 120,
    render: (r) => (r.servicePct != null ? <Badge tone={r.servicePct >= 60 ? 'success' : 'warning'}>{formatPercent(r.servicePct)}</Badge> : '-'),
  },
  { key: 'flaggedStops', header: 'Flagged', align: 'right', width: 80, render: (r) => (r.flaggedStops ? <Badge tone="warning">{String(r.flaggedStops)}</Badge> : '0') },
];

export default function CheckinsScreen() {
  const { range, setRange } = useFilters();
  const [route, setRoute] = useState('all');
  const { from, to } = range;

  const opts = useApi(() => biService.checkinOptions(), []);
  const { data, loading, error, reload } = useApi(
    () => (from && to ? biService.checkins({ from, to, route }) : Promise.resolve({ data: [] })),
    [from, to, route],
  );

  const routes = (opts.data && opts.data.routes) || [];
  const earliest = opts.data && opts.data.earliestDate;
  const latest = opts.data && opts.data.latestDate;
  const groups = data || [];

  const kpi = useMemo(() => {
    const totalStops = groups.reduce((t, g) => t + g.stopCount, 0);
    const totalService = groups.reduce((t, g) => t + (g.totalServiceMinutes || 0), 0);
    const totalGap = groups.reduce((t, g) => t + (g.totalGapMinutes || 0), 0);
    const totalSpan = groups.reduce((t, g) => t + (g.spanMinutes || 0), 0);
    const flagged = groups.reduce((t, g) => t + (g.flaggedStops || 0), 0);
    const routesSet = new Set(groups.map((g) => g.route));
    const daysSet = new Set(groups.map((g) => g.date));
    return {
      routes: routesSet.size,
      days: daysSet.size,
      totalStops,
      totalService,
      avgServicePerStop: totalStops ? totalService / totalStops : 0,
      totalGap,
      flagged,
      servicePct: totalSpan ? (totalService / totalSpan) * 100 : 0,
    };
  }, [groups]);

  const perRoute = useMemo(() => {
    const m = new Map();
    for (const g of groups) {
      const a = m.get(g.route) || { route: g.route, stops: 0, service: 0, gap: 0 };
      a.stops += g.stopCount; a.service += g.totalServiceMinutes || 0; a.gap += g.totalGapMinutes || 0;
      m.set(g.route, a);
    }
    return [...m.values()].sort((a, b) => b.stops - a.stops);
  }, [groups]);

  const statusData = useMemo(() => {
    const counts = {};
    groups.forEach((g) => g.stops.forEach((s) => { counts[s.elapsedStatus] = (counts[s.elapsedStatus] || 0) + 1; }));
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [groups]);

  const DETAIL_CAP = 40;
  const detailGroups = useMemo(() => (route === 'all' ? [] : groups).slice(0, DETAIL_CAP), [groups, route]);

  return (
    <Screen loading={loading || opts.loading} onRefresh={reload}>
      <PageHeader title="Check-in / Check-out" subtitle="Per route (NRV1…) per day: day span = first arrival → last departure; idle = gaps between consecutive stops; service% = on-site ÷ day span." />
      <FilterBar>
        <DateRangeFilter value={range} onChange={setRange} min={earliest} max={latest} />
      </FilterBar>
      <RouteTabs routes={routes} value={route} onChange={setRoute} />

      <AsyncState loading={loading || opts.loading} error={error} empty={!loading && !error && groups.length === 0} onRetry={reload}>
        {groups.length ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="Routes" value={formatNumber(kpi.routes)} sublabel={`${formatNumber(kpi.days)} day(s)`} tone="info" />
              <StatCard label="Stops" value={formatNumber(kpi.totalStops)} tone="success" />
              <StatCard label="Service time" value={formatMinutes(kpi.totalService)} sublabel="on-site" />
              <StatCard label="Avg / stop" value={formatMinutes(kpi.avgServicePerStop)} />
              <StatCard label="Idle between stops" value={formatMinutes(kpi.totalGap)} tone="warning" />
              <StatCard label="Service % of day" value={formatPercent(kpi.servicePct)} tone={kpi.servicePct >= 60 ? 'success' : 'warning'} />
            </StatGrid>

            <BarChartCard title="Stops per route" subtitle="total over range" data={perRoute} xKey="route" bars={[{ key: 'stops', label: 'Stops', color: '#2563EB' }]} />
            <BarChartCard title="Time on-site vs idle between stops (min)" subtitle="over range" data={perRoute} xKey="route"
              bars={[{ key: 'service', label: 'Service (min)', color: '#10B981' }, { key: 'gap', label: 'Idle (min)', color: '#F59E0B' }]} />

            <PieChartCard title="Elapsed-time check" subtitle="source vs computed" data={statusData} nameKey="name" valueKey="value" />

            <DataTable title="Route / day summary" columns={routeSummaryColumns} rows={groups} />

            <SectionTitle>Stop detail (by route / day)</SectionTitle>
            {route === 'all' ? (
              <Card><Muted>Select a technician tab above to see the day-by-day stop detail.</Muted></Card>
            ) : (
              <>
                {detailGroups.map((g) => (
                  <Card key={`${g.route}|${g.date}`} padded={false} style={styles.groupCard}>
                    <View style={styles.groupHead}>
                      <Text style={styles.groupTitle}>Route {g.route}</Text>
                      <View style={styles.groupMeta}>
                        <Text style={styles.metaText}>{formatDateShort(g.date)}</Text>
                        <Text style={styles.metaText}>{formatNumber(g.stopCount)} stops</Text>
                        <Text style={styles.metaText}>span {g.spanMinutes != null ? formatMinutes(g.spanMinutes) : '-'}</Text>
                        <Text style={styles.metaText}>service {formatMinutes(g.totalServiceMinutes)}</Text>
                        <Text style={styles.metaText}>idle {formatMinutes(g.totalGapMinutes || 0)}</Text>
                        <Text style={styles.metaText}>{g.firstCheckIn || '-'} → {g.lastCheckOut || '-'}</Text>
                      </View>
                    </View>
                    <DataTable columns={stopColumns} rows={g.stops.map((s, i) => ({ ...s, __seq: i + 1 }))} maxRows={200} />
                  </Card>
                ))}
                {groups.length > detailGroups.length ? (
                  <Card><Muted>Showing the first {detailGroups.length} of {groups.length} days for this route — narrow the date range to see the rest.</Muted></Card>
                ) : null}
              </>
            )}
          </>
        ) : null}
      </AsyncState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  groupCard: { marginBottom: 12, overflow: 'hidden' },
  groupHead: { padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  groupTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  groupMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaText: { fontSize: 11.5, color: '#6B7280' },
});
